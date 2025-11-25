/**
 * Auth Routes
 */

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  generateAPIKey,
  getCredentialStatus,
  revokeCredentials
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/api-key', protect, generateAPIKey);
router.get('/credentials', protect, getCredentialStatus);
router.delete('/credentials', protect, revokeCredentials);

module.exports = router;

