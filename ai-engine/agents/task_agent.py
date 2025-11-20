"""
Task Planner Agent - Specialized in breaking down complex tasks
"""

from typing import Any
from core.base_agent import BaseAgent
from core.base_tool import BaseTool
from core.llm_provider import LLMProvider
from core.memory import Memory
from typing import Optional, List, Dict
from core.task import Task


class TaskPlannerAgent(BaseAgent):
    """
    Highly specialized agent for task planning and decomposition.
    Capabilities: break down complex tasks, create workflows, prioritize
    """
    
    def __init__(
        self,
        llm_provider: LLMProvider,
        tools: Optional[List[BaseTool]] = None,
        memory: Optional[Memory] = None
    ):
        super().__init__(
            name="TaskPlannerAgent",
            description="Expert in breaking down complex tasks into actionable steps and creating efficient workflows",
            llm_provider=llm_provider,
            tools=tools,
            memory=memory
        )
    
    def _default_system_prompt(self) -> str:
        return """You are an expert task planning agent with strong project management skills.

Your capabilities:
- Break down complex tasks into smaller, actionable steps
- Create efficient workflows
- Identify dependencies between tasks
- Prioritize tasks based on importance and urgency
- Estimate effort and time requirements
- Suggest optimal task ordering
- Identify potential bottlenecks

Always:
- Create clear, specific, and actionable tasks
- Consider dependencies and prerequisites
- Prioritize effectively
- Provide realistic estimates
- Suggest appropriate agents for each task
- Include success criteria
"""
    
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute task planning tasks."""
        task_type = task.input_data.get("type", "plan")
        
        if task_type == "plan":
            return await self._create_plan(task)
        elif task_type == "decompose":
            return await self._decompose_task(task)
        elif task_type == "prioritize":
            return await self._prioritize_tasks(task)
        elif task_type == "workflow":
            return await self._create_workflow(task)
        else:
            return await self._general_planning_task(task)
    
    async def _create_plan(self, task: Task) -> Dict[str, Any]:
        """Create a comprehensive plan for a project."""
        project_description = task.input_data.get("project", "")
        constraints = task.input_data.get("constraints", {})
        
        prompt = f"""Create a comprehensive plan for the following project:

Project: {project_description}

Constraints: {constraints}

Provide:
1. Project overview and goals
2. Major phases
3. Detailed tasks for each phase
4. Dependencies between tasks
5. Estimated timelines
6. Required resources
7. Success criteria
8. Risk factors
"""
        
        plan = await self.process(prompt)
        
        return {
            "plan": plan,
            "type": "project_plan"
        }
    
    async def _decompose_task(self, task: Task) -> Dict[str, Any]:
        """Decompose a complex task into smaller subtasks."""
        complex_task = task.input_data.get("task", "")
        
        prompt = f"""Break down the following complex task into smaller, actionable subtasks:

Task: {complex_task}

For each subtask, provide:
1. Clear description
2. Success criteria
3. Estimated effort (small/medium/large)
4. Prerequisites
5. Suggested agent or tool to handle it
6. Priority level

Organize subtasks in logical execution order.
"""
        
        subtasks = await self.process(prompt)
        
        return {
            "subtasks": subtasks,
            "original_task": complex_task,
            "type": "task_decomposition"
        }
    
    async def _prioritize_tasks(self, task: Task) -> Dict[str, Any]:
        """Prioritize a list of tasks."""
        tasks_list = task.input_data.get("tasks", [])
        criteria = task.input_data.get("criteria", "importance and urgency")
        
        tasks_str = "\n".join([f"- {t}" for t in tasks_list])
        
        prompt = f"""Prioritize the following tasks based on {criteria}:

{tasks_str}

Provide:
1. Prioritized task list (with reasoning)
2. Categorization (urgent/important matrix)
3. Suggested execution order
4. Quick wins vs. long-term tasks
5. Dependencies to consider
"""
        
        prioritized = await self.process(prompt)
        
        return {
            "prioritized_tasks": prioritized,
            "criteria": criteria,
            "type": "prioritization"
        }
    
    async def _create_workflow(self, task: Task) -> Dict[str, Any]:
        """Create an efficient workflow."""
        goal = task.input_data.get("goal", "")
        available_agents = task.input_data.get("agents", [])
        
        agents_str = ", ".join(available_agents) if available_agents else "any"
        
        prompt = f"""Design an efficient workflow to achieve:

Goal: {goal}

Available agents/resources: {agents_str}

Provide:
1. Step-by-step workflow
2. Agent assignments for each step
3. Data flow between steps
4. Parallelizable tasks
5. Decision points
6. Error handling
7. Success metrics
"""
        
        workflow = await self.process(prompt)
        
        return {
            "workflow": workflow,
            "goal": goal,
            "type": "workflow_design"
        }
    
    async def _general_planning_task(self, task: Task) -> Dict[str, Any]:
        """Handle general planning queries."""
        query = task.input_data.get("query", task.description)
        
        result = await self.process(query)
        
        return {
            "result": result,
            "type": "general"
        }

