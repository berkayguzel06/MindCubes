"""
Task management for agent workflows
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
import uuid


class TaskStatus(str, Enum):
    """Task execution status."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Task priority levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Task(BaseModel):
    """
    Represents a task that can be executed by an agent.
    """
    
    task_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    agent_name: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    
    # Task data
    input_data: Dict[str, Any] = Field(default_factory=dict)
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Execution tracking
    retry_count: int = 0
    max_retries: int = 3
    
    # Parent-child relationships for task chains
    parent_task_id: Optional[str] = None
    child_task_ids: List[str] = Field(default_factory=list)
    
    class Config:
        use_enum_values = True
    
    def start(self) -> None:
        """Mark task as started."""
        self.status = TaskStatus.IN_PROGRESS
        self.started_at = datetime.utcnow()
    
    def complete(self, output_data: Dict[str, Any]) -> None:
        """Mark task as completed."""
        self.status = TaskStatus.COMPLETED
        self.output_data = output_data
        self.completed_at = datetime.utcnow()
    
    def fail(self, error_message: str) -> None:
        """Mark task as failed."""
        self.status = TaskStatus.FAILED
        self.error_message = error_message
        self.completed_at = datetime.utcnow()
    
    def cancel(self) -> None:
        """Cancel the task."""
        self.status = TaskStatus.CANCELLED
        self.completed_at = datetime.utcnow()
    
    def retry(self) -> bool:
        """
        Attempt to retry the task.
        
        Returns:
            True if retry is allowed, False otherwise
        """
        if self.retry_count < self.max_retries:
            self.retry_count += 1
            self.status = TaskStatus.PENDING
            self.error_message = None
            return True
        return False
    
    def get_duration(self) -> Optional[float]:
        """
        Get task duration in seconds.
        
        Returns:
            Duration in seconds or None if not completed
        """
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None
    
    def add_child_task(self, child_task_id: str) -> None:
        """Add a child task."""
        if child_task_id not in self.child_task_ids:
            self.child_task_ids.append(child_task_id)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert task to dictionary."""
        return {
            "task_id": self.task_id,
            "title": self.title,
            "description": self.description,
            "agent_name": self.agent_name,
            "status": self.status,
            "priority": self.priority,
            "input_data": self.input_data,
            "output_data": self.output_data,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "duration": self.get_duration(),
            "parent_task_id": self.parent_task_id,
            "child_task_ids": self.child_task_ids
        }
    
    def __repr__(self) -> str:
        return f"<Task(id='{self.task_id[:8]}...', title='{self.title}', status='{self.status}')>"


class TaskQueue:
    """
    Manages a queue of tasks with priority ordering.
    """
    
    def __init__(self):
        self.tasks: Dict[str, Task] = {}
        self._priority_order = {
            TaskPriority.CRITICAL: 0,
            TaskPriority.HIGH: 1,
            TaskPriority.MEDIUM: 2,
            TaskPriority.LOW: 3
        }
    
    def add_task(self, task: Task) -> None:
        """Add a task to the queue."""
        self.tasks[task.task_id] = task
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Get a task by ID."""
        return self.tasks.get(task_id)
    
    def remove_task(self, task_id: str) -> None:
        """Remove a task from the queue."""
        if task_id in self.tasks:
            del self.tasks[task_id]
    
    def get_next_task(self) -> Optional[Task]:
        """
        Get the next task to execute based on priority and creation time.
        
        Returns:
            Next task or None if queue is empty
        """
        pending_tasks = [
            task for task in self.tasks.values()
            if task.status == TaskStatus.PENDING
        ]
        
        if not pending_tasks:
            return None
        
        # Sort by priority first, then by creation time
        pending_tasks.sort(
            key=lambda t: (self._priority_order[t.priority], t.created_at)
        )
        
        return pending_tasks[0]
    
    def get_tasks_by_status(self, status: TaskStatus) -> List[Task]:
        """Get all tasks with a specific status."""
        return [
            task for task in self.tasks.values()
            if task.status == status
        ]
    
    def get_tasks_by_agent(self, agent_name: str) -> List[Task]:
        """Get all tasks assigned to a specific agent."""
        return [
            task for task in self.tasks.values()
            if task.agent_name == agent_name
        ]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get queue statistics."""
        status_counts = {}
        for status in TaskStatus:
            status_counts[status.value] = len(self.get_tasks_by_status(status))
        
        return {
            "total_tasks": len(self.tasks),
            "status_breakdown": status_counts,
            "pending_tasks": status_counts[TaskStatus.PENDING.value]
        }
    
    def clear_completed(self, older_than_hours: Optional[int] = None) -> int:
        """
        Clear completed tasks.
        
        Args:
            older_than_hours: Only clear tasks older than this many hours
            
        Returns:
            Number of tasks cleared
        """
        to_remove = []
        now = datetime.utcnow()
        
        for task_id, task in self.tasks.items():
            if task.status in [TaskStatus.COMPLETED, TaskStatus.CANCELLED]:
                if older_than_hours:
                    if task.completed_at:
                        age_hours = (now - task.completed_at).total_seconds() / 3600
                        if age_hours > older_than_hours:
                            to_remove.append(task_id)
                else:
                    to_remove.append(task_id)
        
        for task_id in to_remove:
            del self.tasks[task_id]
        
        return len(to_remove)

