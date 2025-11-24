/**
 * n8n Controller
 * Handles n8n workflow management and execution
 */

const axios = require('axios');
const logger = require('../config/logger');

// n8n API configuration
const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

// Debug logging
logger.info(`n8n Configuration: URL=${N8N_API_URL}, API_KEY=${N8N_API_KEY ? 'SET (length: ' + N8N_API_KEY.length + ')' : 'NOT SET'}`);

// Configure axios instance for n8n
const n8nApi = axios.create({
  baseURL: N8N_API_URL,
  headers: {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json'
  }
});

// @desc    Get all workflows from n8n
// @route   GET /api/v1/n8n/workflows
// @access  Public
exports.getWorkflows = async (req, res, next) => {
  try {
    const response = await n8nApi.get('/workflows');
    
    // Filter workflows: only include those with 'executable' tag and exclude 'archive' tag
    const allWorkflows = response.data.data || [];
    const filteredWorkflows = allWorkflows.filter(workflow => {
      const tags = workflow.tags || [];
      const tagNames = tags.map(tag => tag.name.toLowerCase());
      
      // Must have 'executable' tag
      const hasExecutable = tagNames.includes('executable');
      // Must NOT have 'archive' tag
      const hasArchive = tagNames.includes('archive');
      
      return hasExecutable && !hasArchive;
    });
    
    res.json({
      success: true,
      count: filteredWorkflows.length,
      data: filteredWorkflows
    });
  } catch (error) {
    logger.error(`Error fetching n8n workflows: ${error.message}`);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to fetch workflows from n8n'
    });
  }
};

// @desc    Get single workflow from n8n
// @route   GET /api/v1/n8n/workflows/:id
// @access  Public
exports.getWorkflow = async (req, res, next) => {
  try {
    const response = await n8nApi.get(`/workflows/${req.params.id}`);
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    logger.error(`Error fetching n8n workflow: ${error.message}`);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to fetch workflow from n8n'
    });
  }
};

// @desc    Activate workflow
// @route   POST /api/v1/n8n/workflows/:id/activate
// @access  Private
exports.activateWorkflow = async (req, res, next) => {
  try {
    // First get the workflow
    const workflowResponse = await n8nApi.get(`/workflows/${req.params.id}`);
    const workflow = workflowResponse.data;
    
    // Update workflow to active
    const response = await n8nApi.patch(`/workflows/${req.params.id}`, {
      ...workflow,
      active: true
    });
    
    logger.info(`Workflow activated: ${req.params.id}`);
    
    res.json({
      success: true,
      message: 'Workflow activated successfully',
      data: response.data
    });
  } catch (error) {
    logger.error(`Error activating workflow: ${error.message}`);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to activate workflow'
    });
  }
};

// @desc    Deactivate workflow
// @route   POST /api/v1/n8n/workflows/:id/deactivate
// @access  Private
exports.deactivateWorkflow = async (req, res, next) => {
  try {
    // First get the workflow
    const workflowResponse = await n8nApi.get(`/workflows/${req.params.id}`);
    const workflow = workflowResponse.data;
    
    // Update workflow to inactive
    const response = await n8nApi.patch(`/workflows/${req.params.id}`, {
      ...workflow,
      active: false
    });
    
    logger.info(`Workflow deactivated: ${req.params.id}`);
    
    res.json({
      success: true,
      message: 'Workflow deactivated successfully',
      data: response.data
    });
  } catch (error) {
    logger.error(`Error deactivating workflow: ${error.message}`);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to deactivate workflow'
    });
  }
};

// @desc    Execute workflow manually with chat input, file, and user_id
// @route   POST /api/v1/n8n/workflows/:id/execute
// @access  Private
exports.executeWorkflow = async (req, res, next) => {
  try {
    const { chatInput, userId, webhookPath } = req.body;
    const file = req.file; // Multer will attach file here
    
    // Prepare data to send to n8n
    const executionData = {
      chatInput: chatInput || '',
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString()
    };
    
    // If file is uploaded, include file information
    if (file) {
      executionData.file = {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        // Convert buffer to base64 for n8n
        data: file.buffer.toString('base64')
      };
    }
    
    logger.info(`Executing workflow ${req.params.id} for user ${userId} with chat: "${chatInput?.substring(0, 50)}..."`);
    
    // If webhook path is provided, use webhook trigger
    if (webhookPath) {
      const webhookUrl = `${process.env.N8N_WEBHOOK_URL || 'http://localhost:5678'}/webhook/${webhookPath}`;
      const response = await axios.post(webhookUrl, executionData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      logger.info(`Workflow executed successfully via webhook: ${req.params.id}`);
      
      return res.json({
        success: true,
        message: 'Workflow executed successfully',
        data: response.data
      });
    }
    
    // Otherwise, try to get workflow details and find webhook path
    const workflowResponse = await n8nApi.get(`/workflows/${req.params.id}`);
    const workflow = workflowResponse.data;
    
    // Look for webhook node in the workflow
    let webhookNode = null;
    if (workflow.nodes) {
      webhookNode = workflow.nodes.find(node => node.type === 'n8n-nodes-base.webhook');
    }
    
    if (webhookNode && webhookNode.parameters && webhookNode.parameters.path) {
      const path = webhookNode.parameters.path;
      const webhookUrl = `${process.env.N8N_WEBHOOK_URL || 'http://localhost:5678'}/webhook/${path}`;
      
      const response = await axios.post(webhookUrl, executionData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      logger.info(`Workflow executed successfully via webhook: ${path}`);
      
      res.json({
        success: true,
        message: 'Workflow executed successfully',
        data: response.data
      });
    } else {
      // No webhook found, return error with helpful message
      logger.error(`No webhook node found in workflow ${req.params.id}`);
      res.status(400).json({
        success: false,
        message: 'Workflow does not have a webhook trigger. Please add a Webhook node to your n8n workflow or provide webhookPath in request body.'
      });
    }
    
  } catch (error) {
    logger.error(`Error executing workflow: ${error.message}`);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to execute workflow',
      details: error.response?.data || error.message
    });
  }
};

// @desc    Trigger workflow via webhook
// @route   POST /api/v1/n8n/webhook/:path
// @access  Public
exports.triggerWebhook = async (req, res, next) => {
  try {
    const webhookPath = req.params.path;
    const webhookUrl = `${process.env.N8N_WEBHOOK_URL || 'http://localhost:5678'}/webhook/${webhookPath}`;
    
    const response = await axios.post(webhookUrl, req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    logger.info(`Webhook triggered: ${webhookPath}`);
    
    res.json({
      success: true,
      message: 'Webhook triggered successfully',
      data: response.data
    });
  } catch (error) {
    logger.error(`Error triggering webhook: ${error.message}`);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to trigger webhook'
    });
  }
};

// @desc    Get workflow executions
// @route   GET /api/v1/n8n/workflows/:id/executions
// @access  Public
exports.getWorkflowExecutions = async (req, res, next) => {
  try {
    const response = await n8nApi.get(`/executions`, {
      params: {
        workflowId: req.params.id,
        limit: req.query.limit || 10
      }
    });
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    logger.error(`Error fetching workflow executions: ${error.message}`);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to fetch workflow executions'
    });
  }
};

