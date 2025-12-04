/**
 * Auth Routes
 * 
 * Security:
 * - Public: register, login
 * - Authenticated: me, api-key, credentials, refresh-token
 * - Admin only: user management (list, update role, activate/deactivate)
 */

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  refreshToken,
  generateAPIKey,
  getCredentialStatus,
  updateCredentialMetadata,
  revokeCredentials,
  // Admin functions
  getAllUsers,
  updateUserRole,
  deactivateUser,
  activateUser
} = require('../controllers/authController');

const { protect, protectWithDbCheck, adminOnly } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Authenticated routes
router.get('/me', protect, getMe);
router.post('/refresh-token', protect, refreshToken);
router.post('/api-key', protect, generateAPIKey);
router.get('/credentials', protect, getCredentialStatus);
router.patch('/credentials', protect, updateCredentialMetadata);
router.delete('/credentials', protect, revokeCredentials);

// Admin routes - user management
router.get('/users', protect, adminOnly, getAllUsers);
router.patch('/users/:userId/role', protect, adminOnly, updateUserRole);
router.post('/users/:userId/deactivate', protect, adminOnly, deactivateUser);
router.post('/users/:userId/activate', protect, adminOnly, activateUser);

module.exports = router;

