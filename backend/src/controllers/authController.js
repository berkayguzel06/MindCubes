/**
 * Authentication Controller
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
    const hasCredentials = await userService.hasCredentials(req.user.id);
    res.json({
      success: true,
      data: {
        hasCredentials
      }
    });
  } catch (error) {
    logger.error(`Error checking credentials: ${error.message}`);
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

