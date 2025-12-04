/**
 * n8n Routes
 * 
 * Security:
 * - All workflow management routes require authentication
 * - Admin-only routes: backup, import, activate, deactivate
 * - Customer/User routes: execute, get workflows, prompts
 * - Webhook routes are secured via path-based tokens
 */

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize, adminOnly } = require('../middleware/auth');
const {
  getWorkflows,
  getWorkflow,
  backupWorkflows,
  importWorkflows,
  activateWorkflow,
  deactivateWorkflow,
  executeWorkflow,
  triggerWebhook,
  getWorkflowExecutions,
  getWorkflowPrompt,
  upsertWorkflowPrompt
} = require('../controllers/n8nController');

// Workflow management routes - all require authentication
router.get('/workflows', protect, getWorkflows);
router.get('/workflows/:id', protect, getWorkflow);

// Admin-only workflow management
router.post('/workflows/backup', protect, adminOnly, backupWorkflows);
router.post('/workflows/import', protect, adminOnly, importWorkflows);
router.post('/workflows/:id/activate', protect, adminOnly, activateWorkflow);
router.post('/workflows/:id/deactivate', protect, adminOnly, deactivateWorkflow);

// Execute workflow with optional file upload - requires authentication
router.post('/workflows/:id/execute', protect, upload.single('file'), executeWorkflow);
router.get('/workflows/:id/executions', protect, getWorkflowExecutions);

// Workflow prompt routes (user specific prompts stored in PostgreSQL)
router.get('/workflows/:id/prompt', protect, getWorkflowPrompt);
router.post('/workflows/:id/prompt', protect, express.json(), upsertWorkflowPrompt);

// Webhook trigger route - public but secured via path-based tokens
// Webhooks use unique paths as tokens for security
router.post('/webhook/:path', triggerWebhook);

module.exports = router;

