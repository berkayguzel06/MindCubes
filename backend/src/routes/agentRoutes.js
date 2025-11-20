/**
 * Agent Routes
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

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getAgents)
  .post(protect, createAgent);

router.route('/:id')
  .get(getAgent)
  .put(protect, updateAgent)
  .delete(protect, authorize('admin'), deleteAgent);

router.route('/:id/stats')
  .get(getAgentStats);

module.exports = router;

