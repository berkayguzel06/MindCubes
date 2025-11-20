"""
Base Agent class - Foundation for all specialized agents
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime
import uuid

from .base_tool import BaseTool
from .llm_provider import LLMProvider
from .memory import Memory
from .task import Task, TaskStatus


class BaseAgent(ABC):
    """
    Abstract base class for all AI agents in the system.
    Each agent is specialized for a specific task domain.
    """
    
    def __init__(
        self,
        name: str,
        description: str,
        llm_provider: LLMProvider,
        tools: Optional[List[BaseTool]] = None,
        memory: Optional[Memory] = None,
        system_prompt: Optional[str] = None
    ):
        """
        Initialize the base agent.
        
        Args:
            name: Agent's unique identifier
            description: What this agent does
            llm_provider: LLM provider instance
            tools: List of tools available to this agent
            memory: Memory system for the agent
            system_prompt: Custom system prompt for the agent
        """
        self.agent_id = str(uuid.uuid4())
        self.name = name
        self.description = description
        self.llm_provider = llm_provider
        self.tools = tools or []
        self.memory = memory
        self.system_prompt = system_prompt or self._default_system_prompt()
        self.created_at = datetime.utcnow()
        self.task_history: List[Task] = []
        
    @abstractmethod
    def _default_system_prompt(self) -> str:
        """
        Define the default system prompt for this agent type.
        Should be implemented by each specialized agent.
        """
        pass
    
    @abstractmethod
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """
        Execute a task using the agent's capabilities.
        
        Args:
            task: Task object containing instructions and context
            
        Returns:
            Dictionary containing task results
        """
        pass
    
    async def process(self, user_input: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Process user input and generate a response.
        
        Args:
            user_input: User's input or query
            context: Additional context for processing
            
        Returns:
            Agent's response as string
        """
        try:
            # Retrieve relevant memory if available
            memory_context = ""
            if self.memory:
                relevant_memories = await self.memory.retrieve(user_input)
                memory_context = self._format_memory_context(relevant_memories)
            
            # Build the full prompt
            full_prompt = self._build_prompt(user_input, memory_context, context)
            
            # Get response from LLM
            response = await self.llm_provider.generate(
                prompt=full_prompt,
                system_prompt=self.system_prompt
            )
            
            # Store in memory if available
            if self.memory:
                await self.memory.store(user_input, response)
            
            return response
            
        except Exception as e:
            return f"Error processing request: {str(e)}"
    
    def _build_prompt(
        self,
        user_input: str,
        memory_context: str,
        context: Optional[Dict[str, Any]]
    ) -> str:
        """Build the complete prompt with all context."""
        prompt_parts = []
        
        if memory_context:
            prompt_parts.append(f"Previous context:\n{memory_context}\n")
        
        if context:
            prompt_parts.append(f"Additional context:\n{self._format_context(context)}\n")
        
        if self.tools:
            prompt_parts.append(f"Available tools:\n{self._format_tools()}\n")
        
        prompt_parts.append(f"User query: {user_input}")
        
        return "\n".join(prompt_parts)
    
    def _format_memory_context(self, memories: List[Dict[str, Any]]) -> str:
        """Format retrieved memories into a readable context."""
        if not memories:
            return ""
        
        formatted = []
        for mem in memories:
            formatted.append(f"- {mem.get('content', '')}")
        
        return "\n".join(formatted)
    
    def _format_context(self, context: Dict[str, Any]) -> str:
        """Format additional context dictionary."""
        return "\n".join([f"- {k}: {v}" for k, v in context.items()])
    
    def _format_tools(self) -> str:
        """Format available tools description."""
        return "\n".join([f"- {tool.name}: {tool.description}" for tool in self.tools])
    
    async def use_tool(self, tool_name: str, **kwargs) -> Any:
        """
        Execute a specific tool by name.
        
        Args:
            tool_name: Name of the tool to use
            **kwargs: Arguments to pass to the tool
            
        Returns:
            Tool execution result
        """
        tool = self._get_tool(tool_name)
        if not tool:
            raise ValueError(f"Tool '{tool_name}' not found")
        
        return await tool.execute(**kwargs)
    
    def _get_tool(self, tool_name: str) -> Optional[BaseTool]:
        """Find a tool by name."""
        for tool in self.tools:
            if tool.name == tool_name:
                return tool
        return None
    
    def add_tool(self, tool: BaseTool) -> None:
        """Add a new tool to the agent."""
        if tool not in self.tools:
            self.tools.append(tool)
    
    def remove_tool(self, tool_name: str) -> None:
        """Remove a tool from the agent."""
        self.tools = [t for t in self.tools if t.name != tool_name]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get agent statistics."""
        completed_tasks = sum(1 for t in self.task_history if t.status == TaskStatus.COMPLETED)
        failed_tasks = sum(1 for t in self.task_history if t.status == TaskStatus.FAILED)
        
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "total_tasks": len(self.task_history),
            "completed_tasks": completed_tasks,
            "failed_tasks": failed_tasks,
            "success_rate": completed_tasks / len(self.task_history) if self.task_history else 0,
            "tools_count": len(self.tools),
            "created_at": self.created_at.isoformat()
        }
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(name='{self.name}', tools={len(self.tools)})>"

