/**
 * Authentication Controller
 * 
 * Security Notes:
 * - JWT tokens contain user info (id, name, lastName, email, role)
 * - User info should be parsed from JWT on frontend, NOT stored in localStorage
 * - Role-based access control is enforced at middleware level
 */

const logger = require('../config/logger');
const crypto = require('crypto');
const userService = require('../services/userService');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, lastName, email, password } = req.body;

    if (!name || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, last name, email and password are required'
      });
    }

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const createdUser = await userService.createUser({ name, lastName, email, password });
    const token = userService.generateToken(createdUser);

    logger.info(`User registered: ${createdUser.email}`);

    res.status(201).json({
      success: true,
      token,
      data: createdUser
    });
  } catch (error) {
    logger.error(`Error registering user: ${error.message}`);
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Check for user
    const userRow = await userService.getUserByEmail(email);

    if (!userRow) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    const isMatch = await userService.comparePassword(password, userRow.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last login
    await userService.updateLastLogin(userRow.id);
    const user = userService.serializeUser(userRow);
    
    // Generate token
    const token = userService.generateToken(user);
    
    logger.info(`User logged in: ${user.email}`);
    
    res.json({
      success: true,
      token,
      data: user
    });
  } catch (error) {
    logger.error(`Error logging in: ${error.message}`);
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Error getting user: ${error.message}`);
    next(error);
  }
};

// @desc    Generate API key
// @route   POST /api/v1/auth/api-key
// @access  Private
exports.generateAPIKey = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const apiKey = `mk_${crypto.randomBytes(32).toString('hex')}`;
    await userService.saveApiKey(user.id, apiKey);
    
    logger.info(`API key generated for user: ${user.email}`);
    
    res.json({
      success: true,
      apiKey
    });
  } catch (error) {
    logger.error(`Error generating API key: ${error.message}`);
    next(error);
  }
};

// @desc    Check if user has stored credentials
// @route   GET /api/v1/auth/credentials
// @access  Private
exports.getCredentialStatus = async (req, res, next) => {
  try {
    const credentials = await userService.getDisplayableCredentials(req.user.id);
    const hasCredentials = Boolean(credentials);
    res.json({
      success: true,
      data: {
        hasCredentials,
        credentials
      }
    });
  } catch (error) {
    logger.error(`Error checking credentials: ${error.message}`);
    next(error);
  }
};

const parseChatIdValue = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const stringValue = String(value).trim();
  if (!/^[\d-]+$/.test(stringValue) || !/\d/.test(stringValue)) {
    const err = new Error(`${fieldName} must contain only digits or '-'`);
    err.statusCode = 400;
    throw err;
  }
  return stringValue;
};

// @desc    Update displayable credential metadata
// @route   PATCH /api/v1/auth/credentials
// @access  Private
exports.updateCredentialMetadata = async (req, res, next) => {
  try {
    const telegramChatId = parseChatIdValue(req.body?.telegramChatId, 'telegramChatId');
    const ctelegramChatId = parseChatIdValue(req.body?.ctelegramChatId, 'ctelegramChatId');

    const updated = await userService.updateCredentialMetadata(req.user.id, {
      telegramChatId,
      ctelegramChatId
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'No credentials found to update'
      });
    }

    res.json({
      success: true,
      data: {
        credentials: updated
      }
    });
  } catch (error) {
    logger.error(`Error updating credentials: ${error.message}`);
    next(error);
  }
};

// @desc    Delete stored credentials
// @route   DELETE /api/v1/auth/credentials
// @access  Private
exports.revokeCredentials = async (req, res, next) => {
  try {
    await userService.deleteCredentialsByUserId(req.user.id);
    res.json({
      success: true,
      message: 'Credentials revoked'
    });
  } catch (error) {
    logger.error(`Error revoking credentials: ${error.message}`);
    next(error);
  }
};

// @desc    Refresh JWT token (get new token with fresh user data)
// @route   POST /api/v1/auth/refresh-token
// @access  Private
exports.refreshToken = async (req, res, next) => {
  try {
    // Get fresh user data from database
    const user = await userService.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Generate new token with fresh data
    const token = userService.generateToken(user);
    
    logger.info(`Token refreshed for user: ${user.email}`);
    
    res.json({
      success: true,
      token,
      data: user
    });
  } catch (error) {
    logger.error(`Error refreshing token: ${error.message}`);
    next(error);
  }
};

// ==================== ADMIN FUNCTIONS ====================

// @desc    Get all users (admin only)
// @route   GET /api/v1/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    logger.error(`Error getting users: ${error.message}`);
    next(error);
  }
};

// @desc    Update user role (admin only)
// @route   PATCH /api/v1/auth/users/:userId/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    const validRoles = ['admin', 'customer', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Prevent admin from changing their own role
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const user = await userService.updateUserRole(userId, role);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info(`User ${userId} role updated to ${role} by admin ${req.user.id}`);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Error updating user role: ${error.message}`);
    next(error);
  }
};

// @desc    Deactivate user (admin only)
// @route   POST /api/v1/auth/users/:userId/deactivate
// @access  Private/Admin
exports.deactivateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deactivating themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const user = await userService.deactivateUser(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info(`User ${userId} deactivated by admin ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'User deactivated',
      data: user
    });
  } catch (error) {
    logger.error(`Error deactivating user: ${error.message}`);
    next(error);
  }
};

// @desc    Activate user (admin only)
// @route   POST /api/v1/auth/users/:userId/activate
// @access  Private/Admin
exports.activateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await userService.activateUser(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info(`User ${userId} activated by admin ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'User activated',
      data: user
    });
  } catch (error) {
    logger.error(`Error activating user: ${error.message}`);
    next(error);
  }
};

