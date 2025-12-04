/**
 * PostgreSQL connection + schema bootstrap
 */

const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'ai-agents',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
});

const ensureTables = async (client) => {
  // Create role enum type if not exists
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('admin', 'customer', 'user');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'customer',
      api_key VARCHAR(255) UNIQUE,
      last_login TIMESTAMPTZ,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Add is_active column if not exists (for existing databases)
  await client.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_credentials (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token TEXT NOT NULL,
      access_token TEXT NOT NULL,
      telegram_chat_id TEXT,
      ctelegram_chat_id TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Chat history table for persistent conversation memory
  await client.query(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_id VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  
  // Migrate session_id from UUID to VARCHAR if needed
  await client.query(`
    ALTER TABLE chat_history 
    ALTER COLUMN session_id TYPE VARCHAR(100) USING session_id::VARCHAR(100)
  `).catch(() => {/* ignore if already varchar */});

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_history_user_id
    ON chat_history (user_id)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_history_session_id
    ON chat_history (session_id)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_history_created_at
    ON chat_history (created_at DESC)
  `);

  // n8n workflows table - stores workflows synced from n8n
  await client.query(`
    CREATE TABLE IF NOT EXISTS workflows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      n8n_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT false,
      version_id VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_workflows_n8n_id
    ON workflows (n8n_id)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_workflows_is_active
    ON workflows (is_active)
  `);

  // Global tags table - independent tag definitions
  await client.query(`
    CREATE TABLE IF NOT EXISTS tags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      n8n_tag_id VARCHAR(255) UNIQUE
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_tags_name
    ON tags (LOWER(name))
  `);

  // Junction table between workflows and tags
  // (many-to-many: a workflow can have many tags, a tag can belong to many workflows)
  await client.query(`
    CREATE TABLE IF NOT EXISTS workflow_tags (
      workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (workflow_id, tag_id)
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_workflow_tags_workflow_id
    ON workflow_tags (workflow_id)
  `);

  // Workflow prompts table - user specific prompts for workflows
  await client.query(`
    CREATE TABLE IF NOT EXISTS workflow_prompts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, workflow_id)
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_workflow_prompts_user_workflow
    ON workflow_prompts (user_id, workflow_id)
  `);

  // Backfill newly introduced / updated optional columns on already existing tables
  await client.query(`
    ALTER TABLE user_credentials
    ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT
  `);

  await client.query(`
    ALTER TABLE user_credentials
    ADD COLUMN IF NOT EXISTS ctelegram_chat_id TEXT
  `);

  await client.query(`
    ALTER TABLE user_credentials
    ALTER COLUMN telegram_chat_id
    TYPE TEXT USING telegram_chat_id::TEXT
  `);

  await client.query(`
    ALTER TABLE user_credentials
    ALTER COLUMN ctelegram_chat_id
    TYPE TEXT USING ctelegram_chat_id::TEXT
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id
    ON user_credentials (user_id)
  `);

  // Error logs table for tracking workflow errors
  await client.query(`
    CREATE TABLE IF NOT EXISTS error_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      error_message TEXT NOT NULL,
      workflow_name VARCHAR(255),
      workflow_id VARCHAR(255),
      execution_id VARCHAR(255),
      status VARCHAR(50) DEFAULT 'error',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_error_logs_user_id
    ON error_logs (user_id)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_error_logs_created_at
    ON error_logs (created_at DESC)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_error_logs_workflow_id
    ON error_logs (workflow_id)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_error_logs_execution_id
    ON error_logs (execution_id)
  `);
};

const initPostgres = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureTables(client);
    await client.query('COMMIT');
    logger.info('PostgreSQL connected and schema ensured');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`PostgreSQL initialization error: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initPostgres
};


