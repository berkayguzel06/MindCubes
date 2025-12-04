/**
 * Error Handler Middleware
 */

const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  logger.error(err);

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    const message = 'Referenced resource not found';
    error = { message, statusCode: 400 };
  }

  // PostgreSQL invalid input syntax (e.g., invalid UUID)
  if (err.code === '22P02') {
    const message = 'Invalid input format';
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Custom error with statusCode
  if (err.statusCode) {
    error.statusCode = err.statusCode;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;

