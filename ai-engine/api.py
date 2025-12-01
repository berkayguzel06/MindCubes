"""
AI Engine API Server
FastAPI server for handling chat requests from the backend
"""

import asyncio
import os
import base64
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Optional, List, Dict, Tuple
import uvicorn

from core import (
    OpenAIProvider,
    AnthropicProvider,
    LocalModelProvider,
    OllamaProvider,
    ConversationMemory,
    AgentOrchestrator,
)
from agents import CodeAgent, DataAnalysisAgent, ResearchAgent, TaskPlannerAgent, MasterAgent
from tools import (
    WebSearchTool, CodeExecutorTool, FileManagerTool, APICallerTool, DataProcessorTool,
    TodoWorkflowTool, CalendarWorkflowTool, DriveWorkflowTool,
    MailCategorizationTool, MailPrioritizingTool, create_workflow_tools
)

# Initialize FastAPI app
app = FastAPI(
    title="MindCubes AI Engine",
    description="AI Agent System API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for agents (initialized on startup)
orchestrator = None
general_agent = None
master_agent = None  # Master agent for workflow orchestration
memory_store = {}  # Store user-specific memories
provider_cache: Dict[str, Any] = {}
agent_cache: Dict[str, CodeAgent] = {}

# Defaults configurable via env
DEFAULT_LOCAL_MODEL = os.getenv("LOCAL_MODEL_NAME", "TinyLlama/TinyLlama-1.1B-Chat-v1.0")
DEFAULT_LOCAL_CACHE = os.getenv("LOCAL_MODEL_CACHE", "./models/cache")
DEFAULT_LOCAL_4BIT = os.getenv("LOCAL_MODEL_4BIT", "true").lower() != "false"
DEFAULT_OPENAI_MODEL = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")
DEFAULT_ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL_NAME", "claude-3-5-sonnet-20240620")
DEFAULT_OLLAMA_MODEL = os.getenv("OLLAMA_DEFAULT_MODEL", "gpt-oss:20b")


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = []
    userId: Optional[str] = None
    sessionId: Optional[str] = None  # Session ID for conversation continuity
    metadata: Optional[Dict[str, Any]] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    # File data for workflow tools
    file_data: Optional[Dict[str, Any]] = None  # {filename, mimetype, content (base64), text}
    # Whether to use master agent for workflow orchestration
    use_master_agent: Optional[bool] = True


class ChatResponse(BaseModel):
    response: str
    success: bool = True
    metadata: Optional[Dict[str, Any]] = None


def _create_tools():
    return [
        WebSearchTool(),
        CodeExecutorTool(),
        FileManagerTool(base_directory="./workspace"),
        APICallerTool(),
        DataProcessorTool()
    ]


def _provider_cache_key(provider: str, model: Optional[str]) -> str:
    return f"{provider.lower()}::{model or ''}"


def get_llm_provider(provider_name: str, model_name: Optional[str] = None):
    provider_key = (provider_name or "local").lower()
    cache_key = _provider_cache_key(provider_key, model_name)
    
    if cache_key in provider_cache:
        return provider_cache[cache_key]
    
    if provider_key == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY is not set")
        provider = OpenAIProvider(
            model_name=model_name or DEFAULT_OPENAI_MODEL,
            api_key=api_key,
        )
    elif provider_key == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY is not set")
        provider = AnthropicProvider(
            model_name=model_name or DEFAULT_ANTHROPIC_MODEL,
            api_key=api_key,
        )
    elif provider_key == "ollama":
        provider = OllamaProvider(
            model_name=model_name or DEFAULT_OLLAMA_MODEL,
            temperature=float(os.getenv("OLLAMA_TEMPERATURE", "0.7")),
            max_tokens=int(os.getenv("OLLAMA_MAX_TOKENS", "512"))
        )
    elif provider_key in ("local", "hf", "huggingface"):
        provider = LocalModelProvider(
            model_name=model_name or DEFAULT_LOCAL_MODEL,
            cache_dir=DEFAULT_LOCAL_CACHE,
            load_in_4bit=DEFAULT_LOCAL_4BIT,
        )
    else:
        raise ValueError(f"Unknown provider '{provider_name}'")
    
    provider_cache[cache_key] = provider
    return provider


def get_or_create_agent(provider_name: str, model_name: Optional[str] = None) -> Tuple[CodeAgent, str]:
    provider_key = (provider_name or "local").lower()
    cache_key = _provider_cache_key(provider_key, model_name)
    
    if cache_key in agent_cache:
        return agent_cache[cache_key], cache_key
    
    provider = get_llm_provider(provider_key, model_name)
    agent_memory = ConversationMemory(max_size=100)
    agent = CodeAgent(
        llm_provider=provider,
        tools=_create_tools(),
        memory=agent_memory
    )
    
    agent_cache[cache_key] = agent
    
    # Auto-register with orchestrator for observability
    if orchestrator:
        orchestrator.register_agent(agent)
    
    return agent, cache_key


def _create_workflow_tools():
    """Create n8n workflow tools."""
    return [
        TodoWorkflowTool(),
        CalendarWorkflowTool(),
        DriveWorkflowTool(),
        MailCategorizationTool(),
        MailPrioritizingTool(),
    ]


@app.on_event("startup")
async def startup_event():
    """Initialize agents on startup"""
    global orchestrator, general_agent, master_agent
    
    print("🚀 Initializing AI Engine...")
    
    default_provider = os.getenv("DEFAULT_PROVIDER", "ollama").lower()
    default_model = None

    if default_provider == "openai":
        if not os.getenv("OPENAI_API_KEY"):
            print("⚠️ OPENAI_API_KEY missing, falling back to local provider")
            default_provider = "local"
            default_model = DEFAULT_LOCAL_MODEL
        else:
            default_model = DEFAULT_OPENAI_MODEL
            print(f"✅ Using OpenAI model '{default_model}'")
    elif default_provider == "anthropic":
        if not os.getenv("ANTHROPIC_API_KEY"):
            print("⚠️ ANTHROPIC_API_KEY missing, falling back to local provider")
            default_provider = "local"
            default_model = DEFAULT_LOCAL_MODEL
        else:
            default_model = DEFAULT_ANTHROPIC_MODEL
            print(f"✅ Using Anthropic model '{default_model}'")
    elif default_provider == "ollama":
        default_model = DEFAULT_OLLAMA_MODEL
        print(f"✅ Using Ollama model '{default_model}'")
    else:
        default_provider = "local"
        default_model = DEFAULT_LOCAL_MODEL
        print(f"⚙️ Defaulting to local model '{default_model}'")
    
    llm_provider = get_llm_provider(default_provider, default_model)
    
    # Initialize standard tools
    tools = _create_tools()
    
    # Initialize n8n workflow tools
    workflow_tools = _create_workflow_tools()
    print(f"🔧 Loaded {len(workflow_tools)} n8n workflow tools")
    
    # Initialize memory (shared across all agents)
    memory = ConversationMemory(max_size=100)
    
    # Create a general-purpose agent for chat
    general_agent = CodeAgent(
        llm_provider=llm_provider,
        tools=tools,
        memory=memory
    )
    
    # Create Master Agent with workflow tools
    master_agent = MasterAgent(
        llm_provider=llm_provider,
        tools=workflow_tools,
        memory=ConversationMemory(max_size=100),
        use_llm_for_intent=True
    )
    print(f"🤖 Master Agent initialized with {len(workflow_tools)} workflow tools")
    
    # Create orchestrator
    orchestrator = AgentOrchestrator(max_concurrent_tasks=5)
    
    # Register specialized agents (default provider)
    orchestrator.register_agent(general_agent)
    orchestrator.register_agent(master_agent)
    orchestrator.register_agent(DataAnalysisAgent(llm_provider, tools, memory))
    orchestrator.register_agent(ResearchAgent(llm_provider, tools, memory))
    orchestrator.register_agent(TaskPlannerAgent(llm_provider, tools, memory))
    
    print("✅ AI Engine initialized successfully!")
    print(f"📊 Registered {len(orchestrator.list_agents())} agents")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "name": "MindCubes AI Engine",
        "status": "running",
        "version": "1.0.0",
        "agents": orchestrator.list_agents() if orchestrator else []
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "agents_count": len(orchestrator.list_agents()) if orchestrator else 0,
        "stats": orchestrator.get_stats() if orchestrator else {}
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint
    Processes user messages and returns AI responses
    Uses conversation history for context-aware responses
    """
    if not master_agent:
        raise HTTPException(status_code=503, detail="AI Engine not initialized")
    
    try:
        user_id = request.userId or "default"
        session_id = request.sessionId or "default"
        
        # Get or create user-specific memory
        memory_key = f"{user_id}:{session_id}"
        if memory_key not in memory_store:
            memory_store[memory_key] = ConversationMemory(max_size=50)
        
        user_memory = memory_store[memory_key]
        
        # Add user message to memory
        user_memory.add_message("user", request.message)
        
        # Build conversation history from memory and request
        memory_history = []
        if hasattr(user_memory, 'get_messages'):
            memory_history = user_memory.get_messages()
        
        # Combine with provided history (prioritize memory)
        combined_history = memory_history if memory_history else (request.history or [])
        
        # Build context with full history
        context = {
            "history": combined_history[-10:],  # Last 10 messages for context
            "metadata": request.metadata or {},
            "user_id": user_id,
            "session_id": session_id,
            "file_data": request.file_data
        }
        
        print(f"🔄 Processing message for user {user_id}: {request.message[:50]}...")
        print(f"📚 Context history: {len(context['history'])} messages")
        
        try:
            # Process with Master Agent - handles both workflows and conversations
            response = await master_agent.process(
                request.message,
                context=context
            )
            
            # Determine if workflow was triggered
            workflow_triggered = False
            if "✅" in response and ("görev" in response.lower() or "task" in response.lower() or 
                                      "takvim" in response.lower() or "dosya" in response.lower()):
                workflow_triggered = True
            
            # Add response to memory
            user_memory.add_message("assistant", response)
            
            return ChatResponse(
                response=response,
                success=True,
                metadata={
                    "agent": "master_agent",
                    "user_id": user_id,
                    "session_id": session_id,
                    "workflow_triggered": workflow_triggered,
                    "history_length": len(context['history'])
                }
            )
            
        except ValueError as provider_error:
            raise HTTPException(status_code=400, detail=str(provider_error))
        
    except Exception as e:
        print(f"❌ Error processing chat: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing message: {str(e)}"
        )


@app.post("/api/chat/workflow")
async def chat_with_file(
    message: str = Form(...),
    userId: str = Form(default="anonymous"),
    provider: str = Form(default="ollama"),
    model: str = Form(default=None),
    file: Optional[UploadFile] = File(default=None)
):
    """
    Chat endpoint with file upload support for workflow triggers.
    Automatically routes to appropriate n8n workflow based on intent.
    """
    if not master_agent:
        raise HTTPException(status_code=503, detail="AI Engine not initialized")
    
    try:
        file_data = None
        
        # Process uploaded file
        if file:
            content = await file.read()
            file_data = {
                "filename": file.filename,
                "mimetype": file.content_type,
                "content": base64.b64encode(content).decode("utf-8"),
                "size": len(content)
            }
            
            # Try to extract text from common file types
            if file.content_type in ["text/plain", "text/csv", "text/markdown"]:
                try:
                    file_data["text"] = content.decode("utf-8")
                except:
                    pass
            # PDF text extraction would require additional library (PyPDF2 or pdfplumber)
            
            print(f"📎 File uploaded: {file.filename} ({file.content_type}, {len(content)} bytes)")
        
        # Build context
        context = {
            "user_id": userId,
            "file_data": file_data,
            "history": []
        }
        
        # Process with Master Agent
        response = await master_agent.process(message, context=context)
        
        return {
            "success": True,
            "response": response,
            "metadata": {
                "agent": "master_agent",
                "user_id": userId,
                "file_uploaded": file is not None,
                "filename": file.filename if file else None
            }
        }
        
    except Exception as e:
        print(f"❌ Error in workflow chat: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )


@app.get("/api/workflows/tools")
async def list_workflow_tools():
    """List available workflow tools"""
    if not master_agent:
        raise HTTPException(status_code=503, detail="AI Engine not initialized")
    
    return {
        "success": True,
        "tools": master_agent.get_available_tools()
    }


@app.get("/api/agents")
async def list_agents():
    """List all available agents"""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="AI Engine not initialized")
    
    return {
        "agents": orchestrator.list_agents(),
        "count": len(orchestrator.list_agents())
    }


@app.get("/api/stats")
async def get_stats():
    """Get system statistics"""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="AI Engine not initialized")
    
    return {
        "orchestrator": orchestrator.get_stats(),
        "active_users": len(memory_store),
        "agents": [
            {
                "name": agent['name'],
                "stats": agent.get('stats', {})
            }
            for agent in orchestrator.list_agents()
        ]
    }


if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

