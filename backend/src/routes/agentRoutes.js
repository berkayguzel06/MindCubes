/**
 * Agent Routes
 * 
 * Security:
 * - All routes require authentication
 * - Delete agent requires admin role
 */

const express = require('express');
const router = express.Router();
const {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  getAgentStats
} = require('../controllers/agentController');

const { protect, adminOnly } = require('../middleware/auth');

// All agent routes require authentication
router.route('/')
  .get(protect, getAgents)
  .post(protect, createAgent);

router.route('/:id')
  .get(protect, getAgent)
  .put(protect, updateAgent)
  .delete(protect, adminOnly, deleteAgent);

router.route('/:id/stats')
  .get(protect, getAgentStats);

module.exports = router;

