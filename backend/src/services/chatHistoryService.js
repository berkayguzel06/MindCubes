/**
 * Chat History Service
 * Handles persistent storage of chat conversations
 */

const { pool } = require('../config/postgres');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

/**
 * Save a message to chat history
 */
const saveMessage = async (userId, sessionId, role, content, metadata = {}) => {
  try {
    const result = await pool.query(
      `INSERT INTO chat_history (id, user_id, session_id, role, content, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [uuidv4(), userId, sessionId, role, content, JSON.stringify(metadata)]
    );
    return result.rows[0];
  } catch (error) {
    logger.error(`Error saving chat message: ${error.message}`);
    throw error;
  }
};

/**
 * Get chat history for a user session
 */
const getSessionHistory = async (userId, sessionId, limit = 50) => {
  try {
    const result = await pool.query(
      `SELECT id, role, content, metadata, created_at
       FROM chat_history
       WHERE user_id = $1 AND session_id = $2
       ORDER BY created_at ASC
       LIMIT $3`,
      [userId, sessionId, limit]
    );
    return result.rows;
  } catch (error) {
    logger.error(`Error fetching session history: ${error.message}`);
    throw error;
  }
};

/**
 * Get recent chat history for a user (across all sessions)
 */
const getRecentHistory = async (userId, limit = 20) => {
  try {
    const result = await pool.query(
      `SELECT id, session_id, role, content, metadata, created_at
       FROM chat_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    // Reverse to get chronological order
    return result.rows.reverse();
  } catch (error) {
    logger.error(`Error fetching recent history: ${error.message}`);
    throw error;
  }
};

/**
 * Get all sessions for a user
 */
const getUserSessions = async (userId, limit = 20) => {
  try {
    // Get unique sessions with first user message as title
    const result = await pool.query(
      `WITH session_info AS (
        SELECT DISTINCT ON (session_id) 
          session_id,
          content as last_message,
          created_at
        FROM chat_history
        WHERE user_id = $1 AND role = 'user'
        ORDER BY session_id, created_at ASC
      )
      SELECT * FROM session_info
      ORDER BY created_at DESC
      LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  } catch (error) {
    logger.error(`Error fetching user sessions: ${error.message}`);
    throw error;
  }
};

/**
 * Get or create a session for a user
 */
const getOrCreateSession = async (userId, sessionId = null) => {
  if (sessionId) {
    // Check if session exists
    const result = await pool.query(
      `SELECT DISTINCT session_id FROM chat_history 
       WHERE user_id = $1 AND session_id = $2`,
      [userId, sessionId]
    );
    if (result.rows.length > 0) {
      return sessionId;
    }
  }
  // Create new session
  return uuidv4();
};

/**
 * Clear chat history for a session
 */
const clearSessionHistory = async (userId, sessionId) => {
  try {
    await pool.query(
      `DELETE FROM chat_history WHERE user_id = $1 AND session_id = $2`,
      [userId, sessionId]
    );
    return true;
  } catch (error) {
    logger.error(`Error clearing session history: ${error.message}`);
    throw error;
  }
};

/**
 * Clear all chat history for a user
 */
const clearUserHistory = async (userId) => {
  try {
    await pool.query(
      `DELETE FROM chat_history WHERE user_id = $1`,
      [userId]
    );
    return true;
  } catch (error) {
    logger.error(`Error clearing user history: ${error.message}`);
    throw error;
  }
};

/**
 * Format history for LLM context
 */
const formatHistoryForLLM = (history, maxMessages = 10) => {
  const recentHistory = history.slice(-maxMessages);
  return recentHistory.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

module.exports = {
  saveMessage,
  getSessionHistory,
  getRecentHistory,
  getUserSessions,
  getOrCreateSession,
  clearSessionHistory,
  clearUserHistory,
  formatHistoryForLLM
};

