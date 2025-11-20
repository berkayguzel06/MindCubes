"""
Agent Orchestrator - Manages multiple agents and task distribution
"""

from typing import Any
from datetime import datetime
from typing import Dict, List, Optional
import asyncio

from .base_agent import BaseAgent
from .task import Task, TaskStatus, TaskQueue


class AgentOrchestrator:
    """
    Orchestrates multiple agents and manages task distribution.
    """
    
    def __init__(self, max_concurrent_tasks: int = 5):
        """
        Initialize the orchestrator.
        
        Args:
            max_concurrent_tasks: Maximum number of tasks to run concurrently
        """
        self.agents: Dict[str, BaseAgent] = {}
        self.task_queue = TaskQueue()
        self.max_concurrent_tasks = max_concurrent_tasks
        self._running = False
        self._active_tasks: Dict[str, asyncio.Task] = {}
    
    def register_agent(self, agent: BaseAgent) -> None:
        """
        Register an agent with the orchestrator.
        
        Args:
            agent: Agent instance to register
        """
        self.agents[agent.name] = agent
        print(f"Agent '{agent.name}' registered successfully")
    
    def unregister_agent(self, agent_name: str) -> None:
        """
        Unregister an agent.
        
        Args:
            agent_name: Name of the agent to unregister
        """
        if agent_name in self.agents:
            del self.agents[agent_name]
            print(f"Agent '{agent_name}' unregistered")
    
    def get_agent(self, agent_name: str) -> Optional[BaseAgent]:
        """Get an agent by name."""
        return self.agents.get(agent_name)
    
    def list_agents(self) -> List[Dict[str, Any]]:
        """List all registered agents with their info."""
        return [
            {
                "name": agent.name,
                "description": agent.description,
                "tools_count": len(agent.tools),
                "stats": agent.get_stats()
            }
            for agent in self.agents.values()
        ]
    
    async def submit_task(self, task: Task) -> str:
        """
        Submit a task for execution.
        
        Args:
            task: Task to execute
            
        Returns:
            Task ID
        """
        self.task_queue.add_task(task)
        print(f"Task '{task.title}' submitted (ID: {task.task_id[:8]}...)")
        return task.task_id
    
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """
        Execute a single task.
        
        Args:
            task: Task to execute
            
        Returns:
            Execution result
        """
        # Find the appropriate agent
        if task.agent_name:
            agent = self.get_agent(task.agent_name)
            if not agent:
                task.fail(f"Agent '{task.agent_name}' not found")
                return task.to_dict()
        else:
            # Auto-assign to first available agent (simple strategy)
            if not self.agents:
                task.fail("No agents available")
                return task.to_dict()
            agent = list(self.agents.values())[0]
            task.agent_name = agent.name
        
        # Start the task
        task.start()
        
        try:
            # Execute with the agent
            result = await agent.execute_task(task)
            task.complete(result)
            
            # Add to agent's history
            agent.task_history.append(task)
            
            print(f"Task '{task.title}' completed successfully")
            
        except Exception as e:
            error_msg = f"Task execution failed: {str(e)}"
            task.fail(error_msg)
            print(f"Task '{task.title}' failed: {error_msg}")
            
            # Retry if allowed
            if task.retry():
                print(f"Retrying task '{task.title}' (attempt {task.retry_count}/{task.max_retries})")
                await self.submit_task(task)
        
        return task.to_dict()
    
    async def start(self) -> None:
        """Start the orchestrator to process tasks."""
        if self._running:
            print("Orchestrator is already running")
            return
        
        self._running = True
        print("Orchestrator started")
        
        while self._running:
            # Check if we can process more tasks
            if len(self._active_tasks) < self.max_concurrent_tasks:
                # Get next task from queue
                next_task = self.task_queue.get_next_task()
                
                if next_task:
                    # Create async task for execution
                    async_task = asyncio.create_task(
                        self.execute_task(next_task)
                    )
                    self._active_tasks[next_task.task_id] = async_task
            
            # Clean up completed async tasks
            completed_task_ids = []
            for task_id, async_task in self._active_tasks.items():
                if async_task.done():
                    completed_task_ids.append(task_id)
            
            for task_id in completed_task_ids:
                del self._active_tasks[task_id]
            
            # Small delay to prevent busy waiting
            await asyncio.sleep(0.1)
    
    async def stop(self) -> None:
        """Stop the orchestrator."""
        self._running = False
        
        # Wait for active tasks to complete
        if self._active_tasks:
            print(f"Waiting for {len(self._active_tasks)} active tasks to complete...")
            await asyncio.gather(*self._active_tasks.values(), return_exceptions=True)
        
        print("Orchestrator stopped")
    
    async def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of a task.
        
        Args:
            task_id: Task ID
            
        Returns:
            Task status dictionary or None if not found
        """
        task = self.task_queue.get_task(task_id)
        if task:
            return task.to_dict()
        return None
    
    def get_stats(self) -> Dict[str, Any]:
        """Get orchestrator statistics."""
        queue_stats = self.task_queue.get_stats()
        
        return {
            "registered_agents": len(self.agents),
            "total_tasks": queue_stats["total_tasks"],
            "pending_tasks": queue_stats["pending_tasks"],
            "active_tasks": len(self._active_tasks),
            "max_concurrent_tasks": self.max_concurrent_tasks,
            "is_running": self._running,
            "queue_stats": queue_stats,
            "agents": self.list_agents()
        }
    
    async def assign_task_to_agent(
        self,
        task_description: str,
        agent_name: str,
        input_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Convenience method to create and assign a task to a specific agent.
        
        Args:
            task_description: Description of the task
            agent_name: Name of the agent to assign to
            input_data: Input data for the task
            
        Returns:
            Task ID
        """
        task = Task(
            title=task_description,
            description=task_description,
            agent_name=agent_name,
            input_data=input_data or {}
        )
        
        return await self.submit_task(task)
    
    async def execute_task_sync(self, task: Task) -> Dict[str, Any]:
        """
        Execute a task synchronously (wait for completion).
        
        Args:
            task: Task to execute
            
        Returns:
            Task result
        """
        await self.submit_task(task)
        result = await self.execute_task(task)
        return result

