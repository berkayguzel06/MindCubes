# MindCubes Setup Guide

Comprehensive setup guide for the MindCubes AI Agent Platform.

## Prerequisites

### Required Software
- **Python 3.9+** - For AI Engine
- **Node.js 18+** - For Backend API
- **MongoDB 6.0+** - Database
- **Redis 7.0+** - Caching and task queuing (optional but recommended)
- **CUDA** - For GPU support (optional, for training)

### API Keys
You'll need API keys for:
- OpenAI (for GPT models)
- Anthropic (for Claude models)
- HuggingFace (for model downloads)

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MindCubes
```

### 2. AI Engine Setup (Python)

#### Install Dependencies
```bash
cd ai-engine
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

#### Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys and settings
```

#### Verify Installation
```bash
python main.py
```

### 3. Backend Setup (Node.js)

#### Install Dependencies
```bash
cd backend
npm install
```

#### Configure Environment
```bash
cp .env.example .env
# Edit .env with your database connection and settings
```

#### Start MongoDB
```bash
# Using MongoDB Community Edition
mongod --dbpath /path/to/data

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Run Database Migrations (if any)
```bash
# Currently no migrations needed
```

#### Start the Server
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

### 4. Frontend Setup (React)

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Configure Environment
```bash
# Create .env file
echo "VITE_API_URL=http://localhost:5000/api/v1" > .env
```

#### Start Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Quick Start Guide

### 1. Start All Services

**Terminal 1 - MongoDB:**
```bash
mongod
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 4 - AI Engine (optional, for direct testing):**
```bash
cd ai-engine
python main.py
```

### 2. Create Your First User

Visit `http://localhost:3000/register` and create an account.

### 3. Create Your First Agent

1. Navigate to the Agents page
2. Click "Create Agent"
3. Fill in the details:
   - Name: "MyCodeAgent"
   - Type: "CodeAgent"
   - Description: "Helps with code generation"
   - LLM Provider: "openai"
   - Model: "gpt-4"
4. Click "Create"

### 4. Run Your First Task

1. Navigate to the Tasks page
2. Click "Create Task"
3. Fill in the details:
   - Title: "Generate Python function"
   - Description: "Create a function to calculate fibonacci"
   - Agent: Select your created agent
   - Priority: "medium"
4. Click "Create"
5. View the task execution and results

## Configuration

### AI Engine Configuration

Edit `ai-engine/config/config.yaml`:

```yaml
agents:
  default_model: "gpt-4"
  max_retries: 3
  timeout: 300

models:
  local:
    cache_dir: "./models/cache"
    device: "auto"  # auto, cuda, cpu

training:
  output_dir: "./models/checkpoints"
  batch_size: 4
  learning_rate: 2e-4
```

### Backend Configuration

Edit `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/mindcubes

# Authentication
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend Configuration

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

## Training Models

### Fine-tuning Example

```bash
cd ai-engine
python examples/training_example.py
```

For actual training:

1. Prepare your dataset in JSON format:
```json
[
  {
    "prompt": "Write a function to...",
    "completion": "Here's the function..."
  }
]
```

2. Run fine-tuning:
```python
from models import FineTuner

fine_tuner = FineTuner(
    base_model="gpt2",
    task_type="text-generation"
)

fine_tuner.load_model()
results = fine_tuner.fine_tune(
    dataset_path="./data/my_dataset.json"
)
```

### LoRA Training Example

```python
from models import LoRAAdapter

lora = LoRAAdapter(
    base_model="meta-llama/Llama-2-7b-hf",
    lora_config={
        "r": 16,
        "lora_alpha": 32
    }
)

lora.load_base_model()
dataset = lora.prepare_dataset("./data/training_data.json")
lora.train_lora(dataset["train"], num_epochs=3)
```

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:** Make sure MongoDB is running:
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
mongod
```

#### 2. API Key Not Found
```
Error: OPENAI_API_KEY not found
```

**Solution:** Add your API key to `.env`:
```bash
echo "OPENAI_API_KEY=sk-..." >> ai-engine/.env
```

#### 3. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:** Change the port in `backend/.env` or kill the process:
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### 4. CUDA Out of Memory
```
RuntimeError: CUDA out of memory
```

**Solution:** Reduce batch size in training config:
```yaml
training:
  batch_size: 2  # Reduce from 4 to 2
  gradient_accumulation_steps: 8  # Increase to compensate
```

## Development Workflow

### Adding a New Agent Type

1. Create agent file in `ai-engine/agents/`:
```python
from core.base_agent import BaseAgent

class MyCustomAgent(BaseAgent):
    def _default_system_prompt(self):
        return "Your custom prompt..."
    
    async def execute_task(self, task):
        # Implementation
        pass
```

2. Register in `ai-engine/agents/__init__.py`

3. Use in your application

### Adding a New Tool

1. Create tool file in `ai-engine/tools/`:
```python
from core.base_tool import BaseTool

class MyTool(BaseTool):
    async def execute(self, **kwargs):
        # Implementation
        pass
```

2. Register in `ai-engine/tools/__init__.py`

3. Attach to agents

## Production Deployment

### Environment Setup

1. Set production environment variables
2. Use process managers (PM2, systemd)
3. Set up reverse proxy (Nginx)
4. Enable SSL/TLS
5. Configure monitoring and logging

### Example PM2 Configuration

```javascript
module.exports = {
  apps: [
    {
      name: 'mindcubes-backend',
      script: 'src/server.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### Docker Deployment

See `docker-compose.yml` for containerized deployment (to be added).

## Next Steps

1. Explore the example agents in `ai-engine/agents/`
2. Check out training examples in `ai-engine/examples/`
3. Read the API documentation
4. Join our community for support

## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Documentation: [docs-url]
- Discord: [discord-url]

