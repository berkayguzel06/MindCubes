/**
 * Model Controller
 */

const Model = require('../models/Model');
const logger = require('../config/logger');

// @desc    Get all models
// @route   GET /api/v1/models
// @access  Public
exports.getModels = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    const models = await Model.find(filter)
      .populate('createdBy', 'username email')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: models.length,
      data: models
    });
  } catch (error) {
    logger.error(`Error fetching models: ${error.message}`);
    next(error);
  }
};

// @desc    Get single model
// @route   GET /api/v1/models/:id
// @access  Public
exports.getModel = async (req, res, next) => {
  try {
    const model = await Model.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Model not found'
      });
    }
    
    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    logger.error(`Error fetching model: ${error.message}`);
    next(error);
  }
};

// @desc    Register new model
// @route   POST /api/v1/models
// @access  Private
exports.registerModel = async (req, res, next) => {
  try {
    req.body.createdBy = req.user?.id;
    
    const model = await Model.create(req.body);
    
    logger.info(`Model registered: ${model.modelId} by user ${req.user?.id}`);
    
    res.status(201).json({
      success: true,
      data: model
    });
  } catch (error) {
    logger.error(`Error registering model: ${error.message}`);
    next(error);
  }
};

// @desc    Update model
// @route   PUT /api/v1/models/:id
// @access  Private
exports.updateModel = async (req, res, next) => {
  try {
    let model = await Model.findById(req.params.id);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Model not found'
      });
    }
    
    model = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    logger.info(`Model updated: ${model.modelId}`);
    
    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    logger.error(`Error updating model: ${error.message}`);
    next(error);
  }
};

// @desc    Delete model
// @route   DELETE /api/v1/models/:id
// @access  Private
exports.deleteModel = async (req, res, next) => {
  try {
    const model = await Model.findById(req.params.id);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Model not found'
      });
    }
    
    await model.deleteOne();
    
    logger.info(`Model deleted: ${model.modelId}`);
    
    res.json({
      success: true,
      message: 'Model deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting model: ${error.message}`);
    next(error);
  }
};

// @desc    Get model usage statistics
// @route   GET /api/v1/models/:id/stats
// @access  Public
exports.getModelStats = async (req, res, next) => {
  try {
    const model = await Model.findById(req.params.id);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Model not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        modelId: model.modelId,
        name: model.name,
        type: model.type,
        usage: model.usage
      }
    });
  } catch (error) {
    logger.error(`Error fetching model stats: ${error.message}`);
    next(error);
  }
};

