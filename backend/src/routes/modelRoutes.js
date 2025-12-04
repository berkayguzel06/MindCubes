/**
 * Model Routes
 * 
 * Security:
 * - All routes require authentication
 * - Delete model requires admin role
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

const { protect, adminOnly } = require('../middleware/auth');

// All model routes require authentication
router.route('/')
  .get(protect, getModels)
  .post(protect, registerModel);

router.route('/ollama')
  .get(protect, getOllamaModels);

router.route('/:id')
  .get(protect, getModel)
  .put(protect, updateModel)
  .delete(protect, adminOnly, deleteModel);

router.route('/:id/stats')
  .get(protect, getModelStats);

module.exports = router;

