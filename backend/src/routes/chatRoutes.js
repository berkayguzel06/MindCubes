/**
 * Chat Routes
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

// Apply authentication to all routes
router.use(protect);

// Chat routes
router.post('/', rateLimit.chatLimit, chatController.sendMessage);
router.get('/history', chatController.getHistory);
router.delete('/history', chatController.clearHistory);

module.exports = router;

