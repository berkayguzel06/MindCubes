/**
 * User service backed by PostgreSQL.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/postgres');

const serializeUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
    apiKey: row.api_key,
    lastLogin: row.last_login,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const createUser = async ({ name, lastName, email, password }) => {
  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await query(
    `
      INSERT INTO users (id, name, last_name, email, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [id, name.trim(), lastName.trim(), email.toLowerCase().trim(), passwordHash]
  );

  return serializeUser(result.rows[0]);
};

const getUserByEmail = async (email) => {
  const result = await query(
    `SELECT * FROM users WHERE email = $1 LIMIT 1`,
    [email.toLowerCase().trim()]
  );
  return result.rows[0] || null;
};

const getUserById = async (id) => {
  const result = await query(
    `SELECT id, name, last_name, email, role, api_key, last_login, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );

  return serializeUser(result.rows[0]);
};

const getUserByApiKey = async (apiKey) => {
  const result = await query(
    `SELECT id, name, last_name, email, role, api_key, last_login, created_at, updated_at
     FROM users WHERE api_key = $1`,
    [apiKey]
  );

  return serializeUser(result.rows[0]);
};

const updateLastLogin = async (id) => {
  await query(
    `UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1`,
    [id]
  );
};

const saveApiKey = async (id, apiKey) => {
  await query(
    `UPDATE users SET api_key = $1, updated_at = NOW() WHERE id = $2`,
    [apiKey, id]
  );
};

const storeCredentials = async ({ userId, refreshToken, accessToken, expiresAt }) => {
  const id = uuidv4();
  await query(
    `
      INSERT INTO user_credentials (id, user_id, refresh_token, access_token, expires_at)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [id, userId, refreshToken, accessToken, expiresAt]
  );
};

const hasCredentials = async (userId) => {
  const result = await query(
    `SELECT 1 FROM user_credentials WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return result.rowCount > 0;
};

const deleteCredentialsByUserId = async (userId) => {
  await query(`DELETE FROM user_credentials WHERE user_id = $1`, [userId]);
};

const comparePassword = (candidate, hash) => bcrypt.compare(candidate, hash);

const generateToken = (payload) =>
  jwt.sign(
    { id: payload.id, role: payload.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByApiKey,
  updateLastLogin,
  saveApiKey,
  storeCredentials,
  hasCredentials,
  deleteCredentialsByUserId,
  comparePassword,
  generateToken,
  serializeUser
};


