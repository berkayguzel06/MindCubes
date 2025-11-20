/**
 * Authentication Controller
 */

const User = require('../models/User');
const logger = require('../config/logger');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Create user
    const user = await User.create({
      username,
      email,
      password
    });
    
    // Generate token
    const token = user.generateAuthToken();
    
    logger.info(`User registered: ${user.username}`);
    
    res.status(201).json({
      success: true,
      token,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error(`Error registering user: ${error.message}`);
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
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = user.generateAuthToken();
    
    logger.info(`User logged in: ${user.username}`);
    
    res.json({
      success: true,
      token,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
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
    const user = await User.findById(req.user.id);
    
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
    const user = await User.findById(req.user.id);
    
    const apiKey = user.generateAPIKey();
    await user.save();
    
    logger.info(`API key generated for user: ${user.username}`);
    
    res.json({
      success: true,
      apiKey
    });
  } catch (error) {
    logger.error(`Error generating API key: ${error.message}`);
    next(error);
  }
};

