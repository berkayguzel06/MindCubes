/**
 * Task Routes
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

router.route('/')
  .get(getTasks)
  .post(protect, createTask);

router.route('/stats')
  .get(getTaskStats);

router.route('/:id')
  .get(getTask)
  .put(protect, updateTask);

router.route('/:id/cancel')
  .post(protect, cancelTask);

router.route('/:id/retry')
  .post(protect, retryTask);

module.exports = router;

