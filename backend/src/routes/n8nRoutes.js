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
  getWorkflowExecutions,
  getWorkflowPrompt,
  upsertWorkflowPrompt
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

// Workflow prompt routes (user specific prompts stored in PostgreSQL)
router.get('/workflows/:id/prompt', getWorkflowPrompt);
router.post('/workflows/:id/prompt', express.json(), upsertWorkflowPrompt);

// Webhook trigger route
router.post('/webhook/:path', triggerWebhook);

module.exports = router;

