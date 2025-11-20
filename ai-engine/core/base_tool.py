"""
Base Tool class - Foundation for all agent tools
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ToolParameter(BaseModel):
    """Model for tool parameter definition."""
    name: str
    type: str
    description: str
    required: bool = True
    default: Optional[Any] = None


class BaseTool(ABC):
    """
    Abstract base class for all tools that agents can use.
    Tools provide specific capabilities to agents.
    """
    
    def __init__(
        self,
        name: str,
        description: str,
        parameters: Optional[list[ToolParameter]] = None
    ):
        """
        Initialize the base tool.
        
        Args:
            name: Unique tool identifier
            description: What this tool does
            parameters: List of parameters this tool accepts
        """
        self.name = name
        self.description = description
        self.parameters = parameters or []
        self.usage_count = 0
        self.success_count = 0
        self.failure_count = 0
    
    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        """
        Execute the tool's functionality.
        
        Args:
            **kwargs: Tool-specific parameters
            
        Returns:
            Tool execution result
        """
        pass
    
    async def run(self, **kwargs) -> Dict[str, Any]:
        """
        Run the tool with error handling and statistics tracking.
        
        Args:
            **kwargs: Tool parameters
            
        Returns:
            Dictionary with success status and result/error
        """
        self.usage_count += 1
        
        try:
            # Validate parameters
            self._validate_parameters(kwargs)
            
            # Execute the tool
            result = await self.execute(**kwargs)
            
            self.success_count += 1
            return {
                "success": True,
                "result": result,
                "tool": self.name
            }
            
        except Exception as e:
            self.failure_count += 1
            return {
                "success": False,
                "error": str(e),
                "tool": self.name
            }
    
    def _validate_parameters(self, kwargs: Dict[str, Any]) -> None:
        """Validate that all required parameters are provided."""
        required_params = {p.name for p in self.parameters if p.required}
        provided_params = set(kwargs.keys())
        
        missing_params = required_params - provided_params
        if missing_params:
            raise ValueError(f"Missing required parameters: {missing_params}")
    
    def get_schema(self) -> Dict[str, Any]:
        """Get the tool's schema definition."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": [
                {
                    "name": p.name,
                    "type": p.type,
                    "description": p.description,
                    "required": p.required,
                    "default": p.default
                }
                for p in self.parameters
            ]
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get tool usage statistics."""
        return {
            "name": self.name,
            "usage_count": self.usage_count,
            "success_count": self.success_count,
            "failure_count": self.failure_count,
            "success_rate": self.success_count / self.usage_count if self.usage_count > 0 else 0
        }
    
    def reset_stats(self) -> None:
        """Reset usage statistics."""
        self.usage_count = 0
        self.success_count = 0
        self.failure_count = 0
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(name='{self.name}')>"

