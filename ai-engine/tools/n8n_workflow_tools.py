"""
N8n Workflow Tools - Tools for triggering n8n workflows via webhooks
These tools allow the AI agent to execute various n8n workflows
"""

import os
import json
import asyncio
import aiohttp
from typing import Any, Dict, Optional, List
from core.base_tool import BaseTool, ToolParameter


class N8nWorkflowTool(BaseTool):
    """
    Base class for n8n workflow tools.
    Provides common functionality for triggering n8n workflows via webhooks.
    """
    
    def __init__(
        self,
        name: str,
        description: str,
        webhook_id: str,
        parameters: Optional[List[ToolParameter]] = None,
        n8n_base_url: Optional[str] = None
    ):
        default_params = [
            ToolParameter(
                name="chat_input",
                type="string",
                description="User's message or instruction",
                required=True
            ),
            ToolParameter(
                name="user_id",
                type="string",
                description="User ID for tracking",
                required=False,
                default="anonymous"
            ),
            ToolParameter(
                name="file_data",
                type="dict",
                description="File data with 'filename', 'mimetype', and 'content' (base64)",
                required=False
            )
        ]
        
        all_params = default_params + (parameters or [])
        
        super().__init__(
            name=name,
            description=description,
            parameters=all_params
        )
        
        self.webhook_id = webhook_id
        self.n8n_base_url = n8n_base_url or os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678")
    
    @property
    def webhook_url(self) -> str:
        """Get the full webhook URL."""
        return f"{self.n8n_base_url}/webhook/{self.webhook_id}"
    
    async def execute(
        self,
        chat_input: str,
        user_id: str = "anonymous",
        file_data: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute the n8n workflow via webhook.
        
        Args:
            chat_input: User's message or instruction
            user_id: User ID for tracking
            file_data: Optional file data (filename, mimetype, content as base64)
            **kwargs: Additional parameters
            
        Returns:
            Workflow execution result
        """
        payload = {
            "chatInput": chat_input,
            "userId": user_id,
            "timestamp": __import__("datetime").datetime.now().isoformat()
        }
        
        # Add file data if provided
        if file_data:
            payload["file"] = {
                "filename": file_data.get("filename", "unknown"),
                "mimetype": file_data.get("mimetype", "application/octet-stream"),
                "data": file_data.get("content", "")  # base64 encoded
            }
            # Also add text content if available (for PDF extraction etc.)
            if "text" in file_data:
                payload["text"] = file_data["text"]
                payload["filename"] = file_data.get("filename", "unknown")
        
        # Add any extra kwargs to payload
        payload.update(kwargs)
        
        # Debug logging
        print(f"🔗 Webhook URL: {self.webhook_url}")
        print(f"📤 Payload keys: {list(payload.keys())}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=120)  # 2 minutes timeout
                ) as response:
                    response_text = await response.text()
                    print(f"📥 Response status: {response.status}")
                    print(f"📥 Response preview: {response_text[:200] if response_text else 'empty'}")
                    
                    # Check for HTTP errors
                    if response.status >= 400:
                        return {
                            "success": False,
                            "error": f"HTTP {response.status}: {response_text[:200]}",
                            "status_code": response.status,
                            "workflow": self.name
                        }
                    
                    # Try to parse JSON response
                    try:
                        result = json.loads(response_text) if response_text else None
                    except json.JSONDecodeError:
                        result = response_text if response_text else None
                    
                    # Check if result indicates an error
                    if isinstance(result, dict):
                        if result.get("error") or result.get("success") == False:
                            return {
                                "success": False,
                                "error": result.get("error", result.get("message", "Workflow returned error")),
                                "workflow": self.name
                            }
                    
                    # Empty response might indicate webhook not configured properly
                    if not result and not response_text:
                        return {
                            "success": False,
                            "error": "Webhook returned empty response - check if workflow is active",
                            "workflow": self.name
                        }
                    
                    return {
                        "success": True,
                        "result": result,
                        "workflow": self.name,
                        "webhook_id": self.webhook_id
                    }
                    
        except aiohttp.ClientConnectorError as e:
            return {
                "success": False,
                "error": f"n8n bağlantı hatası: Sunucu çalışıyor mu? ({str(e)})",
                "workflow": self.name
            }
        except aiohttp.ClientError as e:
            return {
                "success": False,
                "error": f"İstek hatası: {str(e)}",
                "workflow": self.name
            }
        except asyncio.TimeoutError:
            return {
                "success": False,
                "error": "İşlem zaman aşımına uğradı (120 saniye)",
                "workflow": self.name
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Beklenmeyen hata: {str(e)}",
                "workflow": self.name
            }


class TodoWorkflowTool(N8nWorkflowTool):
    """
    Tool for extracting and creating tasks from messages or documents.
    Triggers the ToDo Single Executable n8n workflow.
    """
    
    def __init__(self, webhook_id: Optional[str] = None, n8n_base_url: Optional[str] = None):
        super().__init__(
            name="todo_workflow",
            description=(
                "Extracts actionable tasks from user messages or uploaded documents (PDF, text files). "
                "Creates tasks in Microsoft To-Do. Use this when user wants to: "
                "- Extract tasks from a document "
                "- Create to-do items "
                "- Add tasks to their task list "
                "- Parse action items from text"
            ),
            webhook_id=webhook_id or os.getenv("N8N_TODO_WEBHOOK_ID", "453c17e9-4868-4e9b-a5c4-ac847b3039ef"),
            n8n_base_url=n8n_base_url
        )


class CalendarWorkflowTool(N8nWorkflowTool):
    """
    Tool for creating calendar events from messages or documents.
    Triggers the Calendar n8n workflow.
    """
    
    def __init__(self, webhook_id: Optional[str] = None, n8n_base_url: Optional[str] = None):
        super().__init__(
            name="calendar_workflow",
            description=(
                "Creates calendar events from user messages or documents. "
                "Extracts date, time, and event details. Use this when user wants to: "
                "- Schedule a meeting or event "
                "- Add something to their calendar "
                "- Create reminders for specific dates "
                "- Extract dates from documents for calendar"
            ),
            webhook_id=webhook_id or os.getenv("N8N_CALENDAR_WEBHOOK_ID", "calendar-webhook-id"),
            n8n_base_url=n8n_base_url
        )


class DriveWorkflowTool(N8nWorkflowTool):
    """
    Tool for saving files to cloud storage (OneDrive/Google Drive).
    Triggers the Drive n8n workflow.
    """
    
    def __init__(self, webhook_id: Optional[str] = None, n8n_base_url: Optional[str] = None):
        super().__init__(
            name="drive_workflow",
            description=(
                "Saves files to cloud storage (OneDrive or Google Drive). "
                "Use this when user wants to: "
                "- Save a file to their cloud storage "
                "- Upload documents to OneDrive or Google Drive "
                "- Store files in the cloud "
                "- Backup attachments"
            ),
            webhook_id=webhook_id or os.getenv("N8N_DRIVE_WEBHOOK_ID", "drive-webhook-id"),
            n8n_base_url=n8n_base_url
        )


class MailCategorizationTool(N8nWorkflowTool):
    """
    Tool for categorizing and organizing emails.
    Triggers the Mail Categorization n8n workflow.
    """
    
    def __init__(self, webhook_id: Optional[str] = None, n8n_base_url: Optional[str] = None):
        super().__init__(
            name="mail_categorization_workflow",
            description=(
                "Categorizes and organizes emails automatically. "
                "Use this when user wants to: "
                "- Organize their inbox "
                "- Categorize emails "
                "- Label messages automatically"
            ),
            webhook_id=webhook_id or os.getenv("N8N_CATEGORIZATION_WEBHOOK_ID", "categorization-webhook-id"),
            n8n_base_url=n8n_base_url
        )


class MailPrioritizingTool(N8nWorkflowTool):
    """
    Tool for prioritizing emails based on importance.
    Triggers the Mail Prioritizing n8n workflow.
    """
    
    def __init__(self, webhook_id: Optional[str] = None, n8n_base_url: Optional[str] = None):
        super().__init__(
            name="mail_prioritizing_workflow",
            description=(
                "Analyzes and prioritizes emails based on importance and urgency. "
                "Use this when user wants to: "
                "- Prioritize their emails "
                "- Find important messages "
                "- Sort emails by urgency"
            ),
            webhook_id=webhook_id or os.getenv("N8N_PRIORITIZING_WEBHOOK_ID", "prioritizing-webhook-id"),
            n8n_base_url=n8n_base_url
        )


# Registry of all available workflow tools
WORKFLOW_TOOLS = {
    "todo": TodoWorkflowTool,
    "calendar": CalendarWorkflowTool,
    "drive": DriveWorkflowTool,
    "mail_categorization": MailCategorizationTool,
    "mail_prioritizing": MailPrioritizingTool,
}


def create_workflow_tools(
    enabled_tools: Optional[List[str]] = None,
    webhook_configs: Optional[Dict[str, str]] = None,
    n8n_base_url: Optional[str] = None
) -> List[N8nWorkflowTool]:
    """
    Factory function to create workflow tools.
    
    Args:
        enabled_tools: List of tool names to enable. If None, enables all.
        webhook_configs: Dict mapping tool names to webhook IDs
        n8n_base_url: Base URL for n8n webhooks
        
    Returns:
        List of initialized workflow tools
    """
    webhook_configs = webhook_configs or {}
    tools = []
    
    for tool_name, tool_class in WORKFLOW_TOOLS.items():
        if enabled_tools is None or tool_name in enabled_tools:
            webhook_id = webhook_configs.get(tool_name)
            tool = tool_class(
                webhook_id=webhook_id,
                n8n_base_url=n8n_base_url
            )
            tools.append(tool)
    
    return tools

