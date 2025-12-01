/**
 * Chat Routes
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect, optionalAuth } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

// Chat routes - with optional auth for flexibility
router.post('/', optionalAuth, rateLimit.chatLimit, chatController.sendMessage);
router.get('/history', optionalAuth, chatController.getHistory);
router.delete('/history', optionalAuth, chatController.clearHistory);
router.get('/sessions', optionalAuth, chatController.getSessions);
router.post('/sessions', optionalAuth, chatController.createSession);

module.exports = router;

