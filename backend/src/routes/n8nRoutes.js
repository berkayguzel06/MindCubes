/**
 * n8n Routes
 */

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  getWorkflows,
  getWorkflow,
  backupWorkflows,
  activateWorkflow,
  deactivateWorkflow,
  executeWorkflow,
  triggerWebhook,
  getWorkflowExecutions
} = require('../controllers/n8nController');

// Workflow management routes
router.get('/workflows', getWorkflows);
router.get('/workflows/:id', getWorkflow);
router.post('/workflows/backup', backupWorkflows);
router.post('/workflows/:id/activate', activateWorkflow);
router.post('/workflows/:id/deactivate', deactivateWorkflow);
// Execute workflow with optional file upload
router.post('/workflows/:id/execute', upload.single('file'), executeWorkflow);
router.get('/workflows/:id/executions', getWorkflowExecutions);

// Webhook trigger route
router.post('/webhook/:path', triggerWebhook);

module.exports = router;

