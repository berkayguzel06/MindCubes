/**
 * Authentication Middleware
 * 
 * Security layers:
 * 1. Token-based authentication (JWT)
 * 2. API key authentication (for service-to-service)
 * 3. Role-based authorization (admin, customer, user)
 * 4. User status validation (is_active check)
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const userService = require('../services/userService');

// Role hierarchy - higher index = more permissions
const ROLE_HIERARCHY = {
  'user': 0,
  'customer': 1,
  'admin': 2
};

/**
 * Extract token from request headers
 * @param {Request} req - Express request object
 * @returns {string|null} Token or null
 */
const extractToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

/**
 * Validate API key and get user
 * @param {string} apiKey - API key
 * @returns {Object|null} User or null
 */
const validateApiKey = async (apiKey) => {
  try {
    const user = await userService.getUserByApiKey(apiKey);
    if (user && user.isActive !== false) {
      return user;
    }
  } catch (error) {
    logger.error(`API key validation error: ${error.message}`);
  }
  return null;
};

/**
 * Protect routes - requires valid JWT token or API key
 * User info is extracted from JWT token (not fetched from DB for performance)
 * For sensitive operations, use protectWithDbCheck instead
 */
exports.protect = async (req, res, next) => {
  const token = extractToken(req);

  // Check for API key first
  if (!token && req.headers['x-api-key']) {
    const user = await validateApiKey(req.headers['x-api-key']);
    if (user) {
      req.user = user;
      return next();
    }
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      code: 'NO_TOKEN'
    });
  }

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // For most operations, use token data directly (no DB call needed)
    // Token contains: id, name, lastName, email, role
    req.user = {
      id: decoded.id,
      name: decoded.name,
      lastName: decoded.lastName,
      email: decoded.email,
      role: decoded.role || 'customer'
    };

    next();
  } catch (error) {
    logger.error(`Token verification error: ${error.message}`);
    
    // Differentiate between expired and invalid tokens
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired, please login again',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Protect routes with database validation
 * Use this for sensitive operations that require fresh user data
 */
exports.protectWithDbCheck = async (req, res, next) => {
  const token = extractToken(req);

  // Check for API key first
  if (!token && req.headers['x-api-key']) {
    const user = await validateApiKey(req.headers['x-api-key']);
    if (user) {
      req.user = user;
      return next();
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch fresh user data from database
    const user = await userService.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
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

    req.user = user;
    next();
  } catch (error) {
    logger.error(`Token verification error: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired, please login again',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Grant access to specific roles
 * @param {...string} roles - Allowed roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};

/**
 * Check if user has at least the specified role level
 * Uses role hierarchy: user < customer < admin
 * @param {string} minRole - Minimum required role
 */
exports.requireRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredRoleLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} - required role: ${minRole}, has: ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: `Minimum role '${minRole}' required to access this route`,
        code: 'INSUFFICIENT_ROLE_LEVEL'
      });
    }
    next();
  };
};

/**
 * Admin only access
 */
exports.adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'admin') {
    logger.warn(`Admin-only access attempt by user ${req.user.id} with role ${req.user.role}`);
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

/**
 * Optional authentication - proceeds even without token
 * Sets req.user if valid token exists, otherwise continues without user
 */
exports.optionalAuth = async (req, res, next) => {
  const token = extractToken(req);

  // Check for API key
  if (!token && req.headers['x-api-key']) {
    const user = await validateApiKey(req.headers['x-api-key']);
    if (user) {
      req.user = user;
      return next();
    }
  }

  // If no token, continue without user
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      name: decoded.name,
      lastName: decoded.lastName,
      email: decoded.email,
      role: decoded.role || 'customer'
    };
    next();
  } catch (error) {
    // Token invalid or expired, continue without user
    // This is optional auth, so we don't fail the request
    next();
  }
};

/**
 * Check if the requesting user owns the resource or is admin
 * Expects req.params to contain the owner ID field
 * @param {string} ownerIdField - Field name in req.params that contains owner ID
 */
exports.ownerOrAdmin = (ownerIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const ownerId = req.params[ownerIdField] || req.body[ownerIdField];
    
    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    if (req.user.id === ownerId) {
      return next();
    }

    logger.warn(`Unauthorized resource access attempt by user ${req.user.id}`);
    return res.status(403).json({
      success: false,
      message: 'You can only access your own resources',
      code: 'NOT_OWNER'
    });
  };
};

