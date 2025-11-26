/**
 * Model Routes
 */

const express = require('express');
const router = express.Router();
const {
  getModels,
  getModel,
  registerModel,
  updateModel,
  deleteModel,
  getModelStats,
  getOllamaModels
} = require('../controllers/modelController');

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getModels)
  .post(protect, registerModel);

router.route('/ollama')
  .get(getOllamaModels);

router.route('/:id')
  .get(getModel)
  .put(protect, updateModel)
  .delete(protect, authorize('admin'), deleteModel);

router.route('/:id/stats')
  .get(getModelStats);

module.exports = router;

