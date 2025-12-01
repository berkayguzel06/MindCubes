# AI Engine Environment Variables

Create a `.env` file in the `ai-engine` directory with the following variables:

```bash
# AI Engine Configuration

# Default LLM Provider (ollama, openai, anthropic, local)
DEFAULT_PROVIDER=ollama

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=gpt-oss:20b
OLLAMA_TEMPERATURE=0.7
OLLAMA_MAX_TOKENS=512
OLLAMA_TIMEOUT=120

# OpenAI Configuration (optional)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL_NAME=gpt-4o-mini

# Anthropic Configuration (optional)
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL_NAME=claude-3-5-sonnet-20240620

# Local Model Configuration (optional)
LOCAL_MODEL_NAME=TinyLlama/TinyLlama-1.1B-Chat-v1.0
LOCAL_MODEL_CACHE=./models/cache
LOCAL_MODEL_4BIT=true
HF_TOKEN=your-huggingface-token

# N8n Webhook Configuration
N8N_WEBHOOK_URL=http://localhost:5678

# Workflow Webhook IDs (from your n8n workflows)
N8N_TODO_WEBHOOK_ID=453c17e9-4868-4e9b-a5c4-ac847b3039ef
N8N_CALENDAR_WEBHOOK_ID=calendar-webhook-id
N8N_DRIVE_WEBHOOK_ID=drive-webhook-id
N8N_CATEGORIZATION_WEBHOOK_ID=categorization-webhook-id
N8N_PRIORITIZING_WEBHOOK_ID=prioritizing-webhook-id
```

## Getting Webhook IDs

To get the webhook IDs for your n8n workflows:

1. Open your n8n workflow
2. Find the "Webhook" node
3. Copy the webhook path/ID from the node configuration
4. Or check the workflow JSON file for `webhookId` field

## Example Webhook URLs

The full webhook URL format is:
```
http://localhost:5678/webhook/<WEBHOOK_ID>
```

For example:
- Todo: `http://localhost:5678/webhook/453c17e9-4868-4e9b-a5c4-ac847b3039ef`

