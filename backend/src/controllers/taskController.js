/**
 * Task Controller
 */

const Task = require('../models/Task');
const Agent = require('../models/Agent');
const logger = require('../config/logger');

// @desc    Get all tasks
// @route   GET /api/v1/tasks
// @access  Public
exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, agent } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (agent) filter.agent = agent;
    
    const tasks = await Task.find(filter)
      .populate('agent', 'name type')
      .populate('createdBy', 'username')
      .sort('-createdAt')
      .limit(100);
    
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    logger.error(`Error fetching tasks: ${error.message}`);
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/v1/tasks/:id
// @access  Public
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('agent', 'name type description')
      .populate('createdBy', 'username email');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.json({
      success: true,
      data: task
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
    // Verify agent exists
    const agent = await Agent.findById(req.body.agent);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    // Add user to req.body
    req.body.createdBy = req.user?.id;
    
    const task = await Task.create(req.body);
    
    logger.info(`Task created: ${task.title} for agent ${agent.name}`);
    
    // TODO: Send task to AI Engine for execution
    
    res.status(201).json({
      success: true,
      data: task
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
    let task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    logger.info(`Task updated: ${task.title}`);
    
    res.json({
      success: true,
      data: task
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
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    if (task.status === 'completed' || task.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel task with status: ${task.status}`
      });
    }
    
    task.status = 'cancelled';
    task.completedAt = new Date();
    await task.save();
    
    logger.info(`Task cancelled: ${task.title}`);
    
    res.json({
      success: true,
      data: task
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
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    if (task.status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Can only retry failed tasks'
      });
    }
    
    await task.retry();
    
    logger.info(`Task retry initiated: ${task.title}`);
    
    // TODO: Resubmit to AI Engine
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    logger.error(`Error retrying task: ${error.message}`);
    next(error);
  }
};

// @desc    Get task statistics
// @route   GET /api/v1/tasks/stats
// @access  Public
exports.getTaskStats = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const priorityStats = await Task.aggregate([
      {
        $match: { status: 'pending' }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const avgDuration = await Task.aggregate([
      {
        $match: { status: 'completed', duration: { $exists: true } }
      },
      {
        $group: {
          _id: null,
          averageDuration: { $avg: '$duration' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        byStatus: stats,
        byPriority: priorityStats,
        averageDuration: avgDuration[0]?.averageDuration || 0
      }
    });
  } catch (error) {
    logger.error(`Error fetching task stats: ${error.message}`);
    next(error);
  }
};

