/**
 * Chat Routes
 * 
 * Security:
 * - All routes require authentication (changed from optionalAuth)
 * - Rate limiting applied to prevent abuse
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

// Chat routes - all require authentication
router.post('/', protect, rateLimit.chatLimit, chatController.sendMessage);
router.get('/history', protect, chatController.getHistory);
router.delete('/history', protect, chatController.clearHistory);
router.get('/sessions', protect, chatController.getSessions);
router.post('/sessions', protect, chatController.createSession);

module.exports = router;

