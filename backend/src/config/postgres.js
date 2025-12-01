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
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      api_key VARCHAR(255) UNIQUE,
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
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
      session_id UUID NOT NULL,
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

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


