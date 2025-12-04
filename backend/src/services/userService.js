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
    role: row.role || 'customer',
    isActive: row.is_active !== false,
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
    `SELECT id, name, last_name, email, role, is_active, api_key, last_login, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );

  return serializeUser(result.rows[0]);
};

const getUserByApiKey = async (apiKey) => {
  const result = await query(
    `SELECT id, name, last_name, email, role, is_active, api_key, last_login, created_at, updated_at
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

const mapDisplayableCredentials = (row) => {
  if (!row) return null;
  return {
    telegramChatId: row.telegram_chat_id ? String(row.telegram_chat_id) : null,
    ctelegramChatId: row.ctelegram_chat_id ? String(row.ctelegram_chat_id) : null,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
};

const getDisplayableCredentials = async (userId) => {
  const result = await query(
    `
      SELECT telegram_chat_id, ctelegram_chat_id, expires_at, created_at
      FROM user_credentials
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  );
  return mapDisplayableCredentials(result.rows[0]);
};

const hasCredentials = async (userId) => {
  const credentials = await getDisplayableCredentials(userId);
  return Boolean(credentials);
};

const updateCredentialMetadata = async (userId, { telegramChatId, ctelegramChatId }) => {
  const result = await query(
    `
      UPDATE user_credentials
      SET telegram_chat_id = $2,
          ctelegram_chat_id = $3
      WHERE user_id = $1
      RETURNING telegram_chat_id, ctelegram_chat_id, expires_at, created_at
    `,
    [userId, telegramChatId, ctelegramChatId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapDisplayableCredentials(result.rows[0]);
};

const deleteCredentialsByUserId = async (userId) => {
  await query(`DELETE FROM user_credentials WHERE user_id = $1`, [userId]);
};

const comparePassword = (candidate, hash) => bcrypt.compare(candidate, hash);

/**
 * Generate JWT token with full user payload
 * Token contains all necessary user info to avoid localStorage storage
 * @param {Object} user - User object with id, name, lastName, email, role
 * @returns {string} JWT token
 */
const generateToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      role: user.role || 'customer'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

/**
 * Decode and verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Extract user info from JWT token without verification (for frontend)
 * Note: This should only be used for display purposes, not for auth
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null if invalid
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * Update user role
 * @param {string} userId - User ID
 * @param {string} role - New role ('admin', 'customer', 'user')
 * @returns {Object} Updated user
 */
const updateUserRole = async (userId, role) => {
  const validRoles = ['admin', 'customer', 'user'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
  }

  const result = await query(
    `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [role, userId]
  );

  return serializeUser(result.rows[0]);
};

/**
 * Get all users (admin only)
 * @returns {Array} List of users
 */
const getAllUsers = async () => {
  const result = await query(
    `SELECT id, name, last_name, email, role, is_active, last_login, created_at, updated_at
     FROM users ORDER BY created_at DESC`
  );

  return result.rows.map(serializeUser);
};

/**
 * Deactivate a user (admin only)
 * @param {string} userId - User ID
 * @returns {Object} Updated user
 */
const deactivateUser = async (userId) => {
  const result = await query(
    `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [userId]
  );

  return serializeUser(result.rows[0]);
};

/**
 * Activate a user (admin only)
 * @param {string} userId - User ID
 * @returns {Object} Updated user
 */
const activateUser = async (userId) => {
  const result = await query(
    `UPDATE users SET is_active = true, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [userId]
  );

  return serializeUser(result.rows[0]);
};

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByApiKey,
  updateLastLogin,
  saveApiKey,
  storeCredentials,
  getDisplayableCredentials,
  hasCredentials,
  updateCredentialMetadata,
  deleteCredentialsByUserId,
  comparePassword,
  generateToken,
  verifyToken,
  decodeToken,
  updateUserRole,
  getAllUsers,
  deactivateUser,
  activateUser,
  serializeUser
};


