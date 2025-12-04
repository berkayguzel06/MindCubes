/**
 * Task Routes
 * 
 * Security:
 * - All routes require authentication
 */

const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  cancelTask,
  retryTask,
  getTaskStats
} = require('../controllers/taskController');

const { protect } = require('../middleware/auth');

// All task routes require authentication
router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

router.route('/stats')
  .get(protect, getTaskStats);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, updateTask);

router.route('/:id/cancel')
  .post(protect, cancelTask);

router.route('/:id/retry')
  .post(protect, retryTask);

module.exports = router;

