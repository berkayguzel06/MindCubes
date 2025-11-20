# MindCubes - AI Agent Platform

A comprehensive AI Agent platform with highly specialized agents, each perfectly executing specific tasks.

## Project Structure

```
MindCubes/
├── ai-engine/          # Python AI Agent Framework
│   ├── agents/         # Agent implementations
│   ├── tools/          # Tools for agents
│   ├── models/         # Model management (training, fine-tuning, LoRA)
│   ├── core/           # Core framework classes
│   └── config/         # Configuration files
├── backend/            # Node.js Backend API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── config/
└── frontend/           # React Frontend
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── store/
    └── public/
```

## Modules

### 1. AI Engine (Python)
- **Purpose**: Run AI models, train, fine-tune, and manage LoRA adaptations
- **Features**:
  - Support for LLM APIs (OpenAI, Anthropic, etc.)
  - **HuggingFace Integration** - Otomatik model indirme ve cache
  - Local model execution with quantization (4-bit/8-bit)
  - Modular tool system
  - Agent orchestration
  - Model training pipeline

### 2. Backend (Node.js)
- **Purpose**: API server connecting database and frontend
- **Features**:
  - RESTful API
  - Database management
  - Agent lifecycle management
  - Task queue management

### 3. Frontend (React)
- **Purpose**: Web interface for managing AI agents
- **Features**:
  - Agent dashboard
  - Task monitoring
  - Configuration management
  - Real-time updates

## Getting Started

### AI Engine Setup
```bash
cd ai-engine
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# HuggingFace token ayarla (opsiyonel, gated modeller için)
export HF_TOKEN="your_huggingface_token"
```

### Quick Start - HuggingFace Model
```python
from core import LocalModelProvider

# Model otomatik indirilir ve cache'lenir
provider = LocalModelProvider(
    model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    load_in_4bit=True  # Bellek optimizasyonu
)

response = await provider.generate("Python nedir?")
print(response)
```

📚 **Detaylı HuggingFace Rehberi:** [ai-engine/HUGGINGFACE_GUIDE.md](ai-engine/HUGGINGFACE_GUIDE.md)

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## License

MIT

