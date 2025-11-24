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
    
    res.json({
      success: true,
      count: response.data.data?.length || 0,
      data: response.data.data || []
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

// @desc    Execute workflow manually
// @route   POST /api/v1/n8n/workflows/:id/execute
// @access  Private
exports.executeWorkflow = async (req, res, next) => {
  try {
    const response = await n8nApi.post(`/workflows/${req.params.id}/execute`, {
      data: req.body.data || {}
    });
    
    logger.info(`Workflow executed: ${req.params.id}`);
    
    res.json({
      success: true,
      message: 'Workflow executed successfully',
      data: response.data
    });
  } catch (error) {
    logger.error(`Error executing workflow: ${error.message}`);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to execute workflow'
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

