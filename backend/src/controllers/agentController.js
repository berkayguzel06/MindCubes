/**
 * Agent Controller
 * 
 * Note: This controller is deprecated. Agent functionality has been moved to n8n workflows.
 * These endpoints return stub responses for backwards compatibility.
 */

const logger = require('../config/logger');

// @desc    Get all agents
// @route   GET /api/v1/agents
// @access  Private
exports.getAgents = async (req, res, next) => {
  try {
    // Agent functionality moved to n8n workflows
    res.json({
      success: true,
      count: 0,
      data: [],
      message: 'Agent management has been moved to n8n workflows. Use /api/v1/n8n/workflows instead.'
    });
  } catch (error) {
    logger.error(`Error fetching agents: ${error.message}`);
    next(error);
  }
};

// @desc    Get single agent
// @route   GET /api/v1/agents/:id
// @access  Private
exports.getAgent = async (req, res, next) => {
  try {
    res.status(404).json({
      success: false,
      message: 'Agent management has been moved to n8n workflows. Use /api/v1/n8n/workflows/:id instead.'
    });
  } catch (error) {
    logger.error(`Error fetching agent: ${error.message}`);
    next(error);
  }
};

// @desc    Create new agent
// @route   POST /api/v1/agents
// @access  Private
exports.createAgent = async (req, res, next) => {
  try {
    res.status(410).json({
      success: false,
      message: 'Agent creation has been moved to n8n. Create workflows in n8n instead.'
    });
  } catch (error) {
    logger.error(`Error creating agent: ${error.message}`);
    next(error);
  }
};

// @desc    Update agent
// @route   PUT /api/v1/agents/:id
// @access  Private
exports.updateAgent = async (req, res, next) => {
  try {
    res.status(410).json({
      success: false,
      message: 'Agent updates have been moved to n8n. Update workflows in n8n instead.'
    });
  } catch (error) {
    logger.error(`Error updating agent: ${error.message}`);
    next(error);
  }
};

// @desc    Delete agent
// @route   DELETE /api/v1/agents/:id
// @access  Private/Admin
exports.deleteAgent = async (req, res, next) => {
  try {
    res.status(410).json({
      success: false,
      message: 'Agent deletion has been moved to n8n. Delete workflows in n8n instead.'
    });
  } catch (error) {
    logger.error(`Error deleting agent: ${error.message}`);
    next(error);
  }
};

// @desc    Get agent statistics
// @route   GET /api/v1/agents/:id/stats
// @access  Private
exports.getAgentStats = async (req, res, next) => {
  try {
    res.status(410).json({
      success: false,
      message: 'Agent stats have been moved to n8n. Check workflow executions in n8n instead.'
    });
  } catch (error) {
    logger.error(`Error fetching agent stats: ${error.message}`);
    next(error);
  }
};
