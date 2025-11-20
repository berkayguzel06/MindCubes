/**
 * Agent Controller
 */

const Agent = require('../models/Agent');
const logger = require('../config/logger');

// @desc    Get all agents
// @route   GET /api/v1/agents
// @access  Public
exports.getAgents = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    const agents = await Agent.find(filter)
      .populate('createdBy', 'username email')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: agents.length,
      data: agents
    });
  } catch (error) {
    logger.error(`Error fetching agents: ${error.message}`);
    next(error);
  }
};

// @desc    Get single agent
// @route   GET /api/v1/agents/:id
// @access  Public
exports.getAgent = async (req, res, next) => {
  try {
    const agent = await Agent.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    res.json({
      success: true,
      data: agent
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
    // Add user to req.body
    req.body.createdBy = req.user?.id;
    
    const agent = await Agent.create(req.body);
    
    logger.info(`Agent created: ${agent.name} by user ${req.user?.id}`);
    
    res.status(201).json({
      success: true,
      data: agent
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
    let agent = await Agent.findById(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    agent = await Agent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    logger.info(`Agent updated: ${agent.name}`);
    
    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    logger.error(`Error updating agent: ${error.message}`);
    next(error);
  }
};

// @desc    Delete agent
// @route   DELETE /api/v1/agents/:id
// @access  Private
exports.deleteAgent = async (req, res, next) => {
  try {
    const agent = await Agent.findById(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    await agent.deleteOne();
    
    logger.info(`Agent deleted: ${agent.name}`);
    
    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting agent: ${error.message}`);
    next(error);
  }
};

// @desc    Get agent statistics
// @route   GET /api/v1/agents/:id/stats
// @access  Public
exports.getAgentStats = async (req, res, next) => {
  try {
    const agent = await Agent.findById(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    const stats = {
      name: agent.name,
      type: agent.type,
      status: agent.status,
      totalTasks: agent.stats.totalTasks,
      completedTasks: agent.stats.completedTasks,
      failedTasks: agent.stats.failedTasks,
      successRate: agent.successRate,
      averageResponseTime: agent.stats.averageResponseTime
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`Error fetching agent stats: ${error.message}`);
    next(error);
  }
};

