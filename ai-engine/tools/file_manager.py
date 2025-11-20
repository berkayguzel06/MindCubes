"""
File Manager Tool - Manage files and directories
"""

from typing import Any
import os
from pathlib import Path
from core.base_tool import BaseTool, ToolParameter
from typing import Dict, Any

class FileManagerTool(BaseTool):
    """
    Tool for file and directory operations.
    """
    
    def __init__(self, base_directory: str = "."):
        super().__init__(
            name="file_manager",
            description="Manage files and directories (read, write, list, etc.)",
            parameters=[
                ToolParameter(
                    name="operation",
                    type="string",
                    description="Operation: read, write, list, delete, create_dir",
                    required=True
                ),
                ToolParameter(
                    name="path",
                    type="string",
                    description="File or directory path",
                    required=True
                ),
                ToolParameter(
                    name="content",
                    type="string",
                    description="Content for write operations",
                    required=False
                )
            ]
        )
        self.base_directory = Path(base_directory).resolve()
    
    async def execute(
        self,
        operation: str,
        path: str,
        content: str = None
    ) -> Dict[str, Any]:
        """
        Execute file operation.
        
        Args:
            operation: Operation to perform
            path: File/directory path
            content: Content for write operations
            
        Returns:
            Operation result
        """
        # Resolve path relative to base directory
        full_path = (self.base_directory / path).resolve()
        
        # Security check: ensure path is within base directory
        if not str(full_path).startswith(str(self.base_directory)):
            raise ValueError("Access denied: Path outside base directory")
        
        if operation == "read":
            return await self._read_file(full_path)
        elif operation == "write":
            return await self._write_file(full_path, content)
        elif operation == "list":
            return await self._list_directory(full_path)
        elif operation == "delete":
            return await self._delete_file(full_path)
        elif operation == "create_dir":
            return await self._create_directory(full_path)
        else:
            raise ValueError(f"Unknown operation: {operation}")
    
    async def _read_file(self, path: Path) -> Dict[str, Any]:
        """Read file content."""
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        
        if not path.is_file():
            raise ValueError(f"Not a file: {path}")
        
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return {
            "path": str(path),
            "content": content,
            "size": path.stat().st_size
        }
    
    async def _write_file(self, path: Path, content: str) -> Dict[str, Any]:
        """Write content to file."""
        if content is None:
            raise ValueError("Content required for write operation")
        
        # Create parent directories if they don't exist
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return {
            "path": str(path),
            "size": path.stat().st_size,
            "message": "File written successfully"
        }
    
    async def _list_directory(self, path: Path) -> Dict[str, Any]:
        """List directory contents."""
        if not path.exists():
            raise FileNotFoundError(f"Directory not found: {path}")
        
        if not path.is_dir():
            raise ValueError(f"Not a directory: {path}")
        
        items = []
        for item in path.iterdir():
            items.append({
                "name": item.name,
                "type": "directory" if item.is_dir() else "file",
                "size": item.stat().st_size if item.is_file() else None
            })
        
        return {
            "path": str(path),
            "items": items,
            "count": len(items)
        }
    
    async def _delete_file(self, path: Path) -> Dict[str, Any]:
        """Delete a file."""
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        
        if path.is_file():
            path.unlink()
        else:
            raise ValueError(f"Not a file: {path}")
        
        return {
            "path": str(path),
            "message": "File deleted successfully"
        }
    
    async def _create_directory(self, path: Path) -> Dict[str, Any]:
        """Create a directory."""
        path.mkdir(parents=True, exist_ok=True)
        
        return {
            "path": str(path),
            "message": "Directory created successfully"
        }

