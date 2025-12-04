/**
 * Task Controller
 * 
 * Note: This controller is deprecated. Task functionality has been moved to n8n workflows.
 * These endpoints return stub responses for backwards compatibility.
 */

const logger = require('../config/logger');

// @desc    Get all tasks
// @route   GET /api/v1/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    // Task functionality moved to n8n workflows
    res.json({
      success: true,
      count: 0,
      data: [],
      message: 'Task management has been moved to n8n workflows.'
    });
  } catch (error) {
    logger.error(`Error fetching tasks: ${error.message}`);
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/v1/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    res.status(404).json({
      success: false,
      message: 'Task management has been moved to n8n workflows.'
    });
  } catch (error) {
    logger.error(`Error fetching task: ${error.message}`);
    next(error);
  }
};

// @desc    Create new task
// @route   POST /api/v1/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
    res.status(410).json({
      success: false,
      message: 'Task creation has been moved to n8n workflows. Execute workflows instead.'
    });
  } catch (error) {
    logger.error(`Error creating task: ${error.message}`);
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/v1/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    res.status(410).json({
      success: false,
      message: 'Task updates have been moved to n8n workflows.'
    });
  } catch (error) {
    logger.error(`Error updating task: ${error.message}`);
    next(error);
  }
};

// @desc    Cancel task
// @route   POST /api/v1/tasks/:id/cancel
// @access  Private
exports.cancelTask = async (req, res, next) => {
  try {
    res.status(410).json({
      success: false,
      message: 'Task cancellation has been moved to n8n workflows.'
    });
  } catch (error) {
    logger.error(`Error cancelling task: ${error.message}`);
    next(error);
  }
};

// @desc    Retry failed task
// @route   POST /api/v1/tasks/:id/retry
// @access  Private
exports.retryTask = async (req, res, next) => {
  try {
    res.status(410).json({
      success: false,
      message: 'Task retry has been moved to n8n workflows.'
    });
  } catch (error) {
    logger.error(`Error retrying task: ${error.message}`);
    next(error);
  }
};

// @desc    Get task statistics
// @route   GET /api/v1/tasks/stats
// @access  Private
exports.getTaskStats = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        byStatus: [],
        byPriority: [],
        averageDuration: 0
      },
      message: 'Task stats have been moved to n8n workflows.'
    });
  } catch (error) {
    logger.error(`Error fetching task stats: ${error.message}`);
    next(error);
  }
};
