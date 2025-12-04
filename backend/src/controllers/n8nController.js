/**
 * n8n Controller
 * Handles n8n workflow management and execution
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const logger = require('../config/logger');
const { query } = require('../config/postgres');

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

// Directory where workflow backups are stored (project root / n8n-workflows)
// __dirname = backend/src/controllers
// -> .. = backend/src
// -> .. = backend
// -> .. = project root (MindCubes)
const WORKFLOW_BACKUP_DIR = path.join(__dirname, '..', '..', '..', 'n8n-workflows');
// Directory for old versions: n8n-workflows/versions/<workflow_name>/...
const WORKFLOW_VERSIONS_ROOT = path.join(WORKFLOW_BACKUP_DIR, 'versions');

// Ensure backup directories exist
function ensureBackupDir() {
  if (!fs.existsSync(WORKFLOW_BACKUP_DIR)) {
    fs.mkdirSync(WORKFLOW_BACKUP_DIR, { recursive: true });
  }
  if (!fs.existsSync(WORKFLOW_VERSIONS_ROOT)) {
    fs.mkdirSync(WORKFLOW_VERSIONS_ROOT, { recursive: true });
  }
}

/**
 * Zip all workflow version JSON files into a single archive:
 * n8n-workflows/versions/all-workflows.zip
 */
function zipAllWorkflowVersions() {
  if (!fs.existsSync(WORKFLOW_VERSIONS_ROOT)) {
    return Promise.resolve();
  }

  const zipPath = path.join(WORKFLOW_VERSIONS_ROOT, 'all-workflows.zip');

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err) => {
      logger.warn(`Failed to create all-workflows zip: ${err.message}`);
      reject(err);
    });

    archive.pipe(output);
    // Sadece JSON dosyalarını ekle, mevcut zip dosyalarını hariç tut
    archive.glob('**/*.json', {
      cwd: WORKFLOW_VERSIONS_ROOT
    });
    archive.finalize();
  });
}

/**
 * Rotate existing workflow backup files so we always keep up to 3 previous versions.
 * Current file: n8n-workflows/<name>.json
 * Old versions go under: n8n-workflows/versions/<name>/<name>.v1.json ... v3.json
 */
function rotateWorkflowBackups(baseName) {
  const mainFile = path.join(WORKFLOW_BACKUP_DIR, `${baseName}.json`);

  if (!fs.existsSync(mainFile)) {
    return;
  }

  const workflowVersionsDir = path.join(WORKFLOW_VERSIONS_ROOT, baseName);
  if (!fs.existsSync(workflowVersionsDir)) {
    fs.mkdirSync(workflowVersionsDir, { recursive: true });
  }

  // Find existing version files in this workflow's version directory
  const versionFiles = fs
    .readdirSync(workflowVersionsDir)
    .filter((file) => file.startsWith(`${baseName}.v`) && file.endsWith('.json'))
    .map((file) => {
      const match = file.match(/\.v(\d+)\.json$/);
      const version = match ? parseInt(match[1], 10) : 0;
      return { file, version };
    })
    .filter(({ version }) => version > 0)
    .sort((a, b) => b.version - a.version); // newest first

  // If there are already 3 or more versions, remove the oldest ones beyond v3
  const toDelete = versionFiles.filter(({ version }) => version >= 3);
  for (const { file } of toDelete) {
    const filePath = path.join(workflowVersionsDir, file);
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      logger.warn(`Failed to remove old workflow version "${file}": ${err.message}`);
    }
  }

  // Refresh version list after deletions
  const existing = fs
    .readdirSync(workflowVersionsDir)
    .filter((file) => file.startsWith(`${baseName}.v`) && file.endsWith('.json'))
    .map((file) => {
      const match = file.match(/\.v(\d+)\.json$/);
      const version = match ? parseInt(match[1], 10) : 0;
      return { file, version };
    })
    .filter(({ version }) => version > 0)
    .sort((a, b) => b.version - a.version); // newest first

  // Shift existing backups up by 1 version (v2 -> v3, v1 -> v2, etc.)
  for (const { file, version } of existing) {
    const oldPath = path.join(workflowVersionsDir, file);
    const newPath = path.join(workflowVersionsDir, `${baseName}.v${version + 1}.json`);
    try {
      fs.renameSync(oldPath, newPath);
    } catch (err) {
      logger.warn(`Failed to rotate workflow backup "${file}" -> "${path.basename(newPath)}": ${err.message}`);
    }
  }

  // Finally, move current main file to v1 inside the versions directory
  const v1Path = path.join(workflowVersionsDir, `${baseName}.v1.json`);
  try {
    fs.renameSync(mainFile, v1Path);
  } catch (err) {
    logger.warn(`Failed to create v1 backup for "${baseName}.json": ${err.message}`);
  }
}

// @desc    Get all workflows from PostgreSQL (synced from n8n)
// @route   GET /api/v1/n8n/workflows
// @access  Private (uses authenticated user to enrich with user-specific settings)
exports.getWorkflows = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id ? req.user.id : null;

    const params = [];
    const sql = `
      SELECT 
        w.n8n_id AS id,
        w.name,
        w.is_active AS active,
        w.version_id,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', t.id,
              'name', t.name,
              'createdAt', t.created_at,
              'updatedAt', t.updated_at
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'::JSON
        ) AS tags,
        -- user-specific settings (nullable if no settings or no user)
        CASE
          WHEN $1::uuid IS NULL THEN NULL
          ELSE COALESCE(wus.is_enabled, TRUE)
        END AS is_enabled_for_user
      FROM workflows w
      LEFT JOIN workflow_tags wt ON wt.workflow_id = w.id
      LEFT JOIN tags t ON t.id = wt.tag_id
      LEFT JOIN workflow_user_settings wus 
        ON $1::uuid IS NOT NULL 
       AND wus.workflow_id = w.id 
       AND wus.user_id = $1::uuid
      GROUP BY w.id, wus.is_enabled
      ORDER BY w.created_at DESC
    `;

    params.push(userId);

    const result = await query(sql, params);

    const allWorkflows = result.rows || [];

    // Filter workflows: only include those with 'executable' / 'start' / 'editable' tags and exclude 'archive' tag
    const filteredWorkflows = allWorkflows.filter((workflow) => {
      const tags = workflow.tags || [];
      const tagNames = tags.map((tag) => (tag.name || '').toLowerCase());

      const hasExecutable = tagNames.includes('executable') || tagNames.includes('start-executable');
      const hasStart = tagNames.includes('start');
      const editable = tagNames.includes('editable');
      const hasArchive = tagNames.includes('archive');

      return (hasExecutable || hasStart || editable) && !hasArchive;
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

// @desc    Backup all workflows from n8n into local JSON files with versioning
//          and sync basic metadata into PostgreSQL (workflows + workflow_tags)
// @route   POST /api/v1/n8n/workflows/backup
// @access  Private (but currently no auth middleware attached)
exports.backupWorkflows = async (req, res, next) => {
  try {
    ensureBackupDir();

    // 1. Fetch all workflows (basic info)
    const listResponse = await n8nApi.get('/workflows');
    const workflows = listResponse.data.data || [];

    let successCount = 0;
    const savedFiles = [];

    // 2. For each workflow, fetch full details, save to file and sync to PostgreSQL
    for (const workflow of workflows) {
      try {
        const detailRes = await n8nApi.get(`/workflows/${workflow.id}`);
        const wfData = detailRes.data;

        const safeName = (wfData.name || `workflow_${workflow.id}`)
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase();

        // Rotate existing backups so we keep up to 3 previous versions (stored in /versions/<name>/)
        rotateWorkflowBackups(safeName);

        const filename = `${safeName}.json`;
        const fullPath = path.join(WORKFLOW_BACKUP_DIR, filename);

        fs.writeFileSync(fullPath, JSON.stringify(wfData, null, 2), 'utf8');

        // Sync workflow basic metadata into PostgreSQL
        const workflowResult = await query(
          `
          INSERT INTO workflows (n8n_id, name, is_active, version_id)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (n8n_id)
          DO UPDATE SET
            name = EXCLUDED.name,
            is_active = EXCLUDED.is_active,
            version_id = EXCLUDED.version_id,
            updated_at = NOW()
          RETURNING id
          `,
          [
            wfData.id,
            wfData.name || `workflow_${workflow.id}`,
            Boolean(wfData.active),
            wfData.versionId || null
          ]
        );

        const dbWorkflowId = workflowResult.rows[0].id;

        // Sync tags
        const tags = wfData.tags || [];

        // Remove old tag relations for this workflow
        await query('DELETE FROM workflow_tags WHERE workflow_id = $1', [dbWorkflowId]);

        for (const tag of tags) {
          const tagName = (tag.name || '').trim();
          if (!tagName) continue;

          // Ensure tag exists in global tags table
          const tagResult = await query(
            `
            INSERT INTO tags (name)
            VALUES ($1)
            ON CONFLICT (name)
            DO UPDATE SET
              updated_at = NOW()
            RETURNING id
            `,
            [tagName]
          );

          const tagId = tagResult.rows[0].id;

          // Create relation between workflow and tag
          await query(
            `
            INSERT INTO workflow_tags (workflow_id, tag_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            `,
            [dbWorkflowId, tagId]
          );
        }

        successCount += 1;
        savedFiles.push(filename);

        logger.info(`n8n workflow backed up and synced: ${filename}`);
      } catch (innerErr) {
        logger.error(`Failed to backup workflow ${workflow.id}: ${innerErr.message}`);
      }
    }

    // Backup tamamlandıktan sonra tüm versiyonları tek zip altında topla
    try {
      await zipAllWorkflowVersions();
    } catch (zipErr) {
      // Hata olursa logla ama ana backup işlemini bozma
      logger.warn(`Failed to build combined workflows zip: ${zipErr.message}`);
    }

    res.json({
      success: true,
      message: `Backup completed. ${successCount} workflows saved.`,
      count: successCount,
      directory: WORKFLOW_BACKUP_DIR,
      files: savedFiles
    });
  } catch (error) {
    logger.error(`Error during n8n workflows backup: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to backup n8n workflows',
      error: error.message
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

    // Also update PostgreSQL record if it exists
    await query(
      `
      UPDATE workflows
      SET is_active = TRUE,
          updated_at = NOW()
      WHERE n8n_id = $1
      `,
      [req.params.id]
    );
    
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

    // Also update PostgreSQL record if it exists
    await query(
      `
      UPDATE workflows
      SET is_active = FALSE,
          updated_at = NOW()
      WHERE n8n_id = $1
      `,
      [req.params.id]
    );
    
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

// @desc    Get user specific prompt for a workflow
// @route   GET /api/v1/n8n/workflows/:id/prompt?userId=...
// @access  Private
exports.getWorkflowPrompt = async (req, res, next) => {
  try {
    const { id } = req.params; // n8n workflow id
    const userId = req.user && req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Find workflow in PostgreSQL
    const workflowResult = await query(
      'SELECT id FROM workflows WHERE n8n_id = $1',
      [id]
    );

    if (workflowResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found in database'
      });
    }

    const dbWorkflowId = workflowResult.rows[0].id;

    const promptResult = await query(
      `
      SELECT prompt
      FROM workflow_prompts
      WHERE user_id = $1 AND workflow_id = $2
      `,
      [userId, dbWorkflowId]
    );

    if (promptResult.rowCount === 0) {
      return res.json({
        success: true,
        data: {
          prompt: ''
        }
      });
    }

    res.json({
      success: true,
      data: {
        prompt: promptResult.rows[0].prompt
      }
    });
  } catch (error) {
    logger.error(`Error fetching workflow prompt: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow prompt'
    });
  }
};

// @desc    Create / update user specific prompt for a workflow
// @route   POST /api/v1/n8n/workflows/:id/prompt
// @access  Private
exports.upsertWorkflowPrompt = async (req, res, next) => {
  try {
    const { id } = req.params; // n8n workflow id
    const userId = req.user && req.user.id;
    const { prompt } = req.body;

    if (!userId || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'prompt is required'
      });
    }

    const workflowResult = await query(
      'SELECT id FROM workflows WHERE n8n_id = $1',
      [id]
    );

    if (workflowResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found in database'
      });
    }

    const dbWorkflowId = workflowResult.rows[0].id;

    await query(
      `
      INSERT INTO workflow_prompts (user_id, workflow_id, prompt)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, workflow_id)
      DO UPDATE SET
        prompt = EXCLUDED.prompt,
        updated_at = NOW()
      `,
      [userId, dbWorkflowId, prompt]
    );

    res.json({
      success: true,
      message: 'Prompt saved successfully'
    });
  } catch (error) {
    logger.error(`Error saving workflow prompt: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to save workflow prompt'
    });
  }
};

// @desc    Get user-specific workflow settings (enable/disable)
// @route   GET /api/v1/n8n/workflows/:id/settings
// @access  Private
exports.getWorkflowUserSettings = async (req, res, next) => {
  try {
    const { id } = req.params; // n8n workflow id
    const userId = req.user && req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const workflowResult = await query(
      'SELECT id FROM workflows WHERE n8n_id = $1',
      [id]
    );

    if (workflowResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found in database'
      });
    }

    const dbWorkflowId = workflowResult.rows[0].id;

    const settingsResult = await query(
      `
      SELECT is_enabled
      FROM workflow_user_settings
      WHERE user_id = $1 AND workflow_id = $2
      `,
      [userId, dbWorkflowId]
    );

    const isEnabled = settingsResult.rowCount === 0
      ? true // default: enabled
      : !!settingsResult.rows[0].is_enabled;

    res.json({
      success: true,
      data: {
        isEnabled
      }
    });
  } catch (error) {
    logger.error(`Error fetching workflow user settings: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow user settings'
    });
  }
};

// @desc    Update user-specific workflow settings (enable/disable)
// @route   POST /api/v1/n8n/workflows/:id/settings
// @access  Private
exports.upsertWorkflowUserSettings = async (req, res, next) => {
  try {
    const { id } = req.params; // n8n workflow id
    const userId = req.user && req.user.id;
    const { isEnabled } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isEnabled (boolean) is required'
      });
    }

    const workflowResult = await query(
      'SELECT id FROM workflows WHERE n8n_id = $1',
      [id]
    );

    if (workflowResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found in database'
      });
    }

    const dbWorkflowId = workflowResult.rows[0].id;

    await query(
      `
      INSERT INTO workflow_user_settings (user_id, workflow_id, is_enabled)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, workflow_id)
      DO UPDATE SET
        is_enabled = EXCLUDED.is_enabled,
        updated_at = NOW()
      `,
      [userId, dbWorkflowId, isEnabled]
    );

    res.json({
      success: true,
      message: 'Workflow user settings updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating workflow user settings: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update workflow user settings'
    });
  }
};

// @desc    Execute workflow manually with chat input, file, and user_id
// @route   POST /api/v1/n8n/workflows/:id/execute
// @access  Private
exports.executeWorkflow = async (req, res, next) => {
  try {
    const { chatInput, webhookPath } = req.body;
    const authenticatedUserId = req.user && req.user.id;
    const userId = authenticatedUserId || req.body.userId || 'anonymous';

    const file = req.file; // Multer will attach file here
    
    // Prepare data to send to n8n
    const executionData = {
      chatInput: chatInput || '',
      userId,
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

/**
 * Import workflows from local JSON backup files into n8n.
 * Only JSON files directly under n8n-workflows/ are imported (versions/* are ignored).
 *
 * This mirrors the behaviour of the root-level import-workflows.sh script.
 *
 * @route   POST /api/v1/n8n/workflows/import
 * @access  Private (but currently no auth middleware attached)
 */
exports.importWorkflows = async (req, res, next) => {
  try {
    ensureBackupDir();

    if (!fs.existsSync(WORKFLOW_BACKUP_DIR)) {
      return res.status(400).json({
        success: false,
        message: 'Workflow backup directory not found. Please run a backup first.'
      });
    }

    const allFiles = fs.readdirSync(WORKFLOW_BACKUP_DIR);
    const jsonFiles = allFiles.filter(
      (file) =>
        file.toLowerCase().endsWith('.json') &&
        file !== 'package.json'
    );

    if (jsonFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No workflow JSON files found to import. Please run a backup first.'
      });
    }

    let importedCount = 0;
    const imported = [];
    const errors = [];

    for (const file of jsonFiles) {
      const fullPath = path.join(WORKFLOW_BACKUP_DIR, file);

      try {
        const raw = fs.readFileSync(fullPath, 'utf8');
        const parsed = JSON.parse(raw);

        // Only send the fields that n8n API expects
        const payload = {
          name: parsed.name,
          nodes: parsed.nodes,
          connections: parsed.connections,
          settings: parsed.settings ?? {}
        };

        const response = await n8nApi.post('/workflows', payload);
        const created = response.data;

        importedCount += 1;
        imported.push({
          file,
          id: created.id,
          name: created.name
        });

        logger.info(`Imported n8n workflow from backup: ${file} -> ${created.name} (${created.id})`);
      } catch (err) {
        logger.error(`Failed to import workflow from file "${file}": ${err.message}`);
        errors.push({
          file,
          message: err.response?.data?.message || err.message
        });
      }
    }

    const hasErrors = errors.length > 0;

    res.status(hasErrors ? 207 : 200).json({
      success: !hasErrors,
      message: hasErrors
        ? `Import completed with errors. ${importedCount} workflows imported, ${errors.length} failed.`
        : `Import completed. ${importedCount} workflows imported from backups.`,
      importedCount,
      imported,
      errorCount: errors.length,
      errors
    });
  } catch (error) {
    logger.error(`Error during n8n workflows import: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to import n8n workflows from backups',
      error: error.message
    });
  }
};

/**
 * Internal endpoint for n8n workflows to fetch user + credential + workflow context
 * via HTTP instead of querying the database directly.
 *
 * This is designed to be stable and modular so workflows don't need frequent updates.
 *
 * @route POST /api/v1/n8n/workflows/:id/users
 * @access n8nServiceAuth (server-to-server, X-N8N-SERVICE-KEY)
 */
exports.getWorkflowUsersForN8n = async (req, res, next) => {
  try {
    const n8nWorkflowId = req.params.id;
    const { onlyEnabled = true } = req.body || {};

    if (!n8nWorkflowId) {
      return res.status(400).json({
        success: false,
        message: 'workflow id (n8n id) is required'
      });
    }

    // Fetch workflow, its tags and eligible users in a single query
    const result = await query(
      `
      WITH target_workflow AS (
        SELECT w.id, w.n8n_id, w.name
        FROM workflows w
        WHERE w.n8n_id = $1
        LIMIT 1
      ),
      workflow_tags_agg AS (
        SELECT
          tw.id AS workflow_id,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', t.id,
                'name', t.name
              )
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::JSON
          ) AS tags
        FROM target_workflow tw
        LEFT JOIN workflow_tags wt ON wt.workflow_id = tw.id
        LEFT JOIN tags t ON t.id = wt.tag_id
        GROUP BY tw.id
      )
      SELECT 
        u.id AS user_id,
        u.name,
        u.last_name,
        u.email,
        u.role,
        u.is_active,
        uc.telegram_chat_id,
        uc.ctelegram_chat_id,
        uc.expires_at,
        uc.access_token,
        uc.refresh_token,
        COALESCE(wus.is_enabled, TRUE) AS is_enabled_for_workflow,
        tw.id AS workflow_db_id,
        tw.n8n_id,
        tw.name AS workflow_name,
        wta.tags AS workflow_tags
      FROM target_workflow tw
      JOIN users u ON u.is_active = TRUE
      LEFT JOIN LATERAL (
        SELECT telegram_chat_id, ctelegram_chat_id, expires_at, access_token, refresh_token
        FROM user_credentials uc
        WHERE uc.user_id = u.id
        ORDER BY created_at DESC
        LIMIT 1
      ) uc ON TRUE
      LEFT JOIN workflow_user_settings wus 
        ON wus.workflow_id = tw.id
       AND wus.user_id = u.id
      LEFT JOIN workflow_tags_agg wta ON wta.workflow_id = tw.id
      WHERE ($2::boolean = FALSE OR COALESCE(wus.is_enabled, TRUE) = TRUE)
      ORDER BY u.created_at DESC
      `,
      [n8nWorkflowId, Boolean(onlyEnabled)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found or no eligible users'
      });
    }

    const rows = result.rows;

    const workflowMeta = {
      id: rows[0].workflow_db_id,
      n8nId: rows[0].n8n_id,
      name: rows[0].workflow_name,
      tags: rows[0].workflow_tags || []
    };

    const users = rows.map((row) => ({
      id: row.user_id,
      name: row.name,
      lastName: row.last_name,
      email: row.email,
      role: row.role,
      isActive: row.is_active !== false,
      isEnabledForWorkflow: row.is_enabled_for_workflow,
      credentials: {
        telegramChatId: row.telegram_chat_id ? String(row.telegram_chat_id) : null,
        ctelegramChatId: row.ctelegram_chat_id ? String(row.ctelegram_chat_id) : null,
        expiresAt: row.expires_at,
        accessToken: row.access_token || null,
        refreshToken: row.refresh_token || null
      }
    }));

    res.json({
      success: true,
      workflow: workflowMeta,
      users
    });
  } catch (error) {
    logger.error(`Error fetching workflow users for n8n: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow users for n8n'
    });
  }
};

