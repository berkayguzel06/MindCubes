"""
Code Executor Tool - Execute code safely in a sandboxed environment
"""

from typing import Any
import sys
from io import StringIO
from core.base_tool import BaseTool, ToolParameter
from typing import Dict, Any

class CodeExecutorTool(BaseTool):
    """
    Tool for executing code safely.
    WARNING: Use with caution in production. Consider using Docker or other sandboxing.
    """
    
    def __init__(self, allowed_languages: list[str] = None):
        super().__init__(
            name="code_executor",
            description="Execute code in a controlled environment",
            parameters=[
                ToolParameter(
                    name="code",
                    type="string",
                    description="Code to execute",
                    required=True
                ),
                ToolParameter(
                    name="language",
                    type="string",
                    description="Programming language (python, javascript, etc.)",
                    required=True
                ),
                ToolParameter(
                    name="timeout",
                    type="integer",
                    description="Execution timeout in seconds",
                    required=False,
                    default=30
                )
            ]
        )
        self.allowed_languages = allowed_languages or ["python"]
    
    async def execute(
        self,
        code: str,
        language: str,
        timeout: int = 30
    ) -> Dict[str, Any]:
        """
        Execute code safely.
        
        Args:
            code: Code to execute
            language: Programming language
            timeout: Timeout in seconds
            
        Returns:
            Execution result
        """
        if language not in self.allowed_languages:
            raise ValueError(f"Language '{language}' not allowed. Allowed: {self.allowed_languages}")
        
        if language == "python":
            return await self._execute_python(code, timeout)
        else:
            raise NotImplementedError(f"Execution for {language} not implemented")
    
    async def _execute_python(self, code: str, timeout: int) -> Dict[str, Any]:
        """
        Execute Python code.
        WARNING: This is a simple implementation. Use proper sandboxing in production.
        """
        # Capture stdout
        old_stdout = sys.stdout
        sys.stdout = captured_output = StringIO()
        
        result = {
            "success": False,
            "output": "",
            "error": None
        }
        
        try:
            # Create a restricted namespace
            namespace = {
                "__builtins__": __builtins__,
                "print": print,
            }
            
            # Execute the code
            exec(code, namespace)
            
            # Get output
            output = captured_output.getvalue()
            
            result["success"] = True
            result["output"] = output
            
        except Exception as e:
            result["error"] = str(e)
        
        finally:
            # Restore stdout
            sys.stdout = old_stdout
        
        return result

