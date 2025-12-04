/**
 * Model Controller
 * 
 * Note: Model registration via MongoDB is deprecated.
 * This controller now focuses on Ollama model discovery.
 */

const logger = require('../config/logger');
const axios = require('axios');

// @desc    Get all models (deprecated - use getOllamaModels)
// @route   GET /api/v1/models
// @access  Private
exports.getModels = async (req, res, next) => {
  try {
    // Redirect to Ollama models
    return exports.getOllamaModels(req, res, next);
  } catch (error) {
    logger.error(`Error fetching models: ${error.message}`);
    next(error);
  }
};

// @desc    Get single model (deprecated)
// @route   GET /api/v1/models/:id
// @access  Private
exports.getModel = async (req, res, next) => {
  try {
    res.status(410).json({
      success: false,
      message: 'Individual model lookup is deprecated. Use /api/v1/models/ollama to list available models.'
    });
  } catch (error) {
    logger.error(`Error fetching model: ${error.message}`);
    next(error);
  }
};

// @desc    Register new model (deprecated)
// @route   POST /api/v1/models
// @access  Private
exports.registerModel = async (req, res, next) => {
  try {
    res.status(410).json({
      success: false,
      message: 'Model registration is deprecated. Use "ollama pull <model>" to install models.'
    });
  } catch (error) {
    logger.error(`Error registering model: ${error.message}`);
    next(error);
  }
};

// @desc    Update model (deprecated)
// @route   PUT /api/v1/models/:id
// @access  Private
exports.updateModel = async (req, res, next) => {
  try {
    res.status(410).json({
      success: false,
      message: 'Model updates are deprecated. Manage models through Ollama CLI.'
    });
  } catch (error) {
    logger.error(`Error updating model: ${error.message}`);
    next(error);
  }
};

// @desc    Delete model (deprecated)
// @route   DELETE /api/v1/models/:id
// @access  Private/Admin
exports.deleteModel = async (req, res, next) => {
  try {
    res.status(410).json({
      success: false,
      message: 'Model deletion is deprecated. Use "ollama rm <model>" to remove models.'
    });
  } catch (error) {
    logger.error(`Error deleting model: ${error.message}`);
    next(error);
  }
};

// @desc    Get model usage statistics (deprecated)
// @route   GET /api/v1/models/:id/stats
// @access  Private
exports.getModelStats = async (req, res, next) => {
  try {
    res.status(410).json({
      success: false,
      message: 'Model stats are deprecated.'
    });
  } catch (error) {
    logger.error(`Error fetching model stats: ${error.message}`);
    next(error);
  }
};

// @desc    Get Ollama models
// @route   GET /api/v1/models/ollama
// @access  Private
exports.getOllamaModels = async (req, res, next) => {
  try {
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    
    const response = await axios.get(`${ollamaBaseUrl}/api/tags`, {
      timeout: 5000
    });
    
    const models = response.data.models || [];
    
    // Format models for frontend
    const formattedModels = models.map((model) => {
      const details = model.details || {};
      return {
        id: model.name,
        name: model.name,
        modifiedAt: model.modified_at,
        size: model.size,
        digest: model.digest,
        parameterSize: details.parameter_size || 'Unknown',
        quantizationLevel: details.quantization_level || 'Unknown',
        family: details.family || 'Unknown',
        format: details.format || 'Unknown',
        status: 'Connected'
      };
    });
    
    res.json({
      success: true,
      count: formattedModels.length,
      data: formattedModels
    });
  } catch (error) {
    logger.error(`Error fetching Ollama models: ${error.message}`);
    
    // Return empty array if Ollama is not available
    res.json({
      success: false,
      message: 'Ollama service is not available',
      count: 0,
      data: []
    });
  }
};
