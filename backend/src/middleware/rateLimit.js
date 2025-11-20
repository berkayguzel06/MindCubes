/**
 * Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');

// General rate limiter
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes default
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Chat specific rate limiter (more restrictive)
const chatLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: 'Çok fazla mesaj gönderdiniz, lütfen bir dakika bekleyin.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = limiter;
module.exports.chatLimit = chatLimit;

