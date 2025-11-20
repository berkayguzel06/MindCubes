"""
API Caller Tool - Make HTTP requests to external APIs
"""

from typing import Any
import aiohttp
from core.base_tool import BaseTool, ToolParameter
from typing import Dict, Any, Optional

class APICallerTool(BaseTool):
    """
    Tool for making HTTP requests to external APIs.
    """
    
    def __init__(self, default_headers: Optional[Dict[str, str]] = None):
        super().__init__(
            name="api_caller",
            description="Make HTTP requests to external APIs",
            parameters=[
                ToolParameter(
                    name="url",
                    type="string",
                    description="API endpoint URL",
                    required=True
                ),
                ToolParameter(
                    name="method",
                    type="string",
                    description="HTTP method (GET, POST, PUT, DELETE, etc.)",
                    required=False,
                    default="GET"
                ),
                ToolParameter(
                    name="headers",
                    type="dict",
                    description="Request headers",
                    required=False
                ),
                ToolParameter(
                    name="data",
                    type="dict",
                    description="Request body data",
                    required=False
                ),
                ToolParameter(
                    name="params",
                    type="dict",
                    description="URL query parameters",
                    required=False
                )
            ]
        )
        self.default_headers = default_headers or {}
    
    async def execute(
        self,
        url: str,
        method: str = "GET",
        headers: Optional[Dict[str, str]] = None,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Make an HTTP request.
        
        Args:
            url: API endpoint URL
            method: HTTP method
            headers: Request headers
            data: Request body
            params: Query parameters
            
        Returns:
            API response
        """
        # Merge default headers with provided headers
        request_headers = {**self.default_headers}
        if headers:
            request_headers.update(headers)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.request(
                    method=method.upper(),
                    url=url,
                    headers=request_headers,
                    json=data,
                    params=params
                ) as response:
                    # Try to parse as JSON
                    try:
                        response_data = await response.json()
                    except:
                        response_data = await response.text()
                    
                    return {
                        "status_code": response.status,
                        "data": response_data,
                        "headers": dict(response.headers),
                        "success": 200 <= response.status < 300
                    }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

