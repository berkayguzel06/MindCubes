"""
AI Engine API Server
FastAPI server for handling chat requests from the backend
"""

import asyncio
import os
from fastapi import FastAPI, HTTPException
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
from agents import CodeAgent, DataAnalysisAgent, ResearchAgent, TaskPlannerAgent
from tools import WebSearchTool, CodeExecutorTool, FileManagerTool, APICallerTool, DataProcessorTool

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
    metadata: Optional[Dict[str, Any]] = None
    provider: Optional[str] = None
    model: Optional[str] = None


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


@app.on_event("startup")
async def startup_event():
    """Initialize agents on startup"""
    global orchestrator, general_agent
    
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
    
    # Initialize tools
    tools = _create_tools()
    
    # Initialize memory (shared across all agents)
    memory = ConversationMemory(max_size=100)
    
    # Create a general-purpose agent for chat
    general_agent = CodeAgent(
        llm_provider=llm_provider,
        tools=tools,
        memory=memory
    )
    
    # Create orchestrator
    orchestrator = AgentOrchestrator(max_concurrent_tasks=5)
    
    # Register specialized agents (default provider)
    orchestrator.register_agent(general_agent)
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
    """
    if not general_agent:
        raise HTTPException(status_code=503, detail="AI Engine not initialized")
    
    try:
        # Get or create user-specific memory
        user_id = request.userId or "default"
        if user_id not in memory_store:
            memory_store[user_id] = ConversationMemory(max_size=50)
        
        user_memory = memory_store[user_id]
        
        # Add message to memory
        user_memory.add_message("user", request.message)
        
        # Build context from history
        context = {
            "history": request.history[-5:] if request.history else [],
            "metadata": request.metadata or {}
        }
        
        # Select provider/agent
        requested_provider = (
            (request.provider or "").strip()
            or (request.metadata or {}).get("provider", "")
            or "local"
        )
        requested_model = (
            (request.model or "").strip()
            or (request.metadata or {}).get("model")
        )
        direct_model = bool((request.metadata or {}).get("directModel"))
        
        try:
            if direct_model:
                provider = get_llm_provider(requested_provider, requested_model)
                history_lines = []
                for item in context["history"]:
                    role = item.get("role", "user")
                    content = item.get("content", "")
                    history_lines.append(f"{role}: {content}")
                prompt_parts = []
                if history_lines:
                    prompt_parts.append("\n".join(history_lines))
                prompt_parts.append(f"user: {request.message}")
                prompt = "\n".join(prompt_parts)
                system_prompt = (
                    (request.metadata or {}).get("systemPrompt")
                    or "You are a friendly conversational assistant. Respond naturally and avoid writing code unless explicitly requested by the user."
                )
                response = await provider.generate(prompt, system_prompt=system_prompt)
                agent_key = f"direct::{requested_provider}"
            else:
                if requested_provider:
                    agent, agent_key = get_or_create_agent(requested_provider, requested_model)
                else:
                    agent = general_agent
                    agent_key = "default"
                
                response = await agent.process(
                    request.message,
                    context=context
                )
        except ValueError as provider_error:
            raise HTTPException(status_code=400, detail=str(provider_error))
        
        # Add response to memory
        user_memory.add_message("assistant", response)
        
        return ChatResponse(
            response=response,
            success=True,
            metadata={
                "agent": agent_key,
                "user_id": user_id,
                "provider": requested_provider or "default",
                "model": requested_model or ""
            }
        )
        
    except Exception as e:
        print(f"❌ Error processing chat: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing message: {str(e)}"
        )


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

