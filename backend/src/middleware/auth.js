/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const userService = require('../services/userService');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check for API key
  if (!token && req.headers['x-api-key']) {
    try {
      const user = await userService.getUserByApiKey(req.headers['x-api-key']);
      if (user) {
        req.user = user;
        return next();
      }
    } catch (error) {
      logger.error(`API key validation error: ${error.message}`);
    }
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = await userService.getUserById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    logger.error(`Token verification error: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

