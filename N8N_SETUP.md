# n8n Integration Setup Guide

## Overview
MindCubes now integrates with n8n to manage and execute automation workflows directly from the Agents page.

## Prerequisites
- n8n instance running (locally or cloud)
- n8n API access enabled
- Backend and frontend running

## Setup Steps

### 1. Install and Start n8n

If you don't have n8n installed:

```bash
# Install n8n globally
npm install -g n8n

# Or use npx (no installation needed)
npx n8n
```

By default, n8n runs on `http://localhost:5678`

### 2. Enable n8n API Access

1. Open n8n in your browser: `http://localhost:5678`
2. Go to **Settings** → **API**
3. Enable API access
4. Generate an API key
5. Copy the API key

### 3. Configure Backend

1. Navigate to the `backend` directory
2. Create a `.env` file (or copy from `.env.example`):

```bash
cd backend
cp .env.example .env
```

3. Edit `.env` and add your n8n configuration:

```env
# n8n Configuration
N8N_API_URL=http://localhost:5678/api/v1
N8N_API_KEY=your-api-key-here
N8N_WEBHOOK_URL=http://localhost:5678
```

Replace `your-api-key-here` with the API key you generated in step 2.

### 4. Start Backend Server

```bash
cd backend
npm install
npm run dev
```

Backend should now be running on `http://localhost:5000`

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend should now be running on `http://localhost:3000`

## Usage

### Viewing Workflows

1. Navigate to the **Agents** page in MindCubes
2. You'll see all your n8n workflows displayed as cards
3. Each card shows:
   - Workflow name
   - Active/Inactive status
   - Tags (if any)
   - Execute and Activate/Deactivate buttons

### Executing Workflows

Click the **Execute** button on any workflow card to trigger it manually.

### Activating/Deactivating Workflows

Click the **Activate/Deactivate** button to toggle workflow status.

## API Endpoints

The following n8n API endpoints are available through the backend:

- `GET /api/v1/n8n/workflows` - List all workflows
- `GET /api/v1/n8n/workflows/:id` - Get single workflow
- `POST /api/v1/n8n/workflows/:id/execute` - Execute workflow
- `POST /api/v1/n8n/workflows/:id/activate` - Activate workflow
- `POST /api/v1/n8n/workflows/:id/deactivate` - Deactivate workflow
- `GET /api/v1/n8n/workflows/:id/executions` - Get workflow executions
- `POST /api/v1/n8n/webhook/:path` - Trigger webhook

## Troubleshooting

### "Failed to connect to n8n"

- Make sure n8n is running: `http://localhost:5678`
- Check if API is enabled in n8n settings
- Verify the API key in your `.env` file

### "No Workflows Found"

- Create at least one workflow in n8n
- Make sure the workflow is saved
- Click the Refresh button in MindCubes

### CORS Issues

If you encounter CORS errors:

1. In n8n, go to Settings → Security
2. Add `http://localhost:3000` to allowed origins
3. Or disable CORS checks for development

## Creating Workflows

1. Open n8n: `http://localhost:5678`
2. Click **Create New Workflow**
3. Add nodes and configure your automation
4. Save the workflow
5. The workflow will automatically appear in MindCubes

## Cloud n8n

If using n8n cloud:

1. Get your cloud instance URL (e.g., `https://your-instance.app.n8n.cloud`)
2. Update `.env`:

```env
N8N_API_URL=https://your-instance.app.n8n.cloud/api/v1
N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud
```

## Security Notes

- **Never commit** your `.env` file with real API keys
- Keep your n8n API key secure
- In production, use proper authentication and HTTPS
- Consider using environment-specific API keys

## Next Steps

- Create automated workflows in n8n
- Trigger workflows from MindCubes
- Monitor workflow executions
- Build complex automation pipelines

## Support

For n8n documentation: https://docs.n8n.io/
For MindCubes issues: Check the project repository

