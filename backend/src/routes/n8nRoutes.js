/**
 * n8n Routes
 */

const express = require('express');
const router = express.Router();
const {
  getWorkflows,
  getWorkflow,
  activateWorkflow,
  deactivateWorkflow,
  executeWorkflow,
  triggerWebhook,
  getWorkflowExecutions
} = require('../controllers/n8nController');

// Workflow management routes
router.get('/workflows', getWorkflows);
router.get('/workflows/:id', getWorkflow);
router.post('/workflows/:id/activate', activateWorkflow);
router.post('/workflows/:id/deactivate', deactivateWorkflow);
router.post('/workflows/:id/execute', executeWorkflow);
router.get('/workflows/:id/executions', getWorkflowExecutions);

// Webhook trigger route
router.post('/webhook/:path', triggerWebhook);

module.exports = router;

