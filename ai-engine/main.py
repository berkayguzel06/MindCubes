"""
Main entry point for MindCubes AI Engine
Example usage and demonstrations
"""

import asyncio
from core import (
    OpenAIProvider,
    AnthropicProvider,
    LocalModelProvider,
    ConversationMemory,
    AgentOrchestrator,
    Task,
    TaskPriority
)
from agents import CodeAgent, DataAnalysisAgent, ResearchAgent, TaskPlannerAgent
from tools import WebSearchTool, CodeExecutorTool, FileManagerTool, APICallerTool, DataProcessorTool


async def main():
    """Main function demonstrating the AI Agent system."""
    
    print("=" * 60)
    print("MindCubes AI Agent System")
    print("=" * 60)
    print()
    
    # Initialize LLM provider (choose one)
    
    # Option 1: OpenAI API
    # llm_provider = OpenAIProvider(model_name="gpt-4")
    
    # Option 2: Anthropic API
    # llm_provider = AnthropicProvider(model_name="claude-3-opus-20240229")
    
    # Option 3: HuggingFace Local Model (Recommended for no API costs)
    llm_provider = LocalModelProvider(
        model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0",  # Small & fast
        load_in_4bit=True,  # Memory optimization
        cache_dir="./models/cache"
    )
    
    # Option 4: CodeLlama for Code Tasks
    # llm_provider = LocalModelProvider(
    #     model_name="codellama/CodeLlama-7b-Instruct-hf",
    #     load_in_4bit=True
    # )
    
    # Initialize tools
    tools = [
        WebSearchTool(),
        CodeExecutorTool(),
        FileManagerTool(base_directory="./workspace"),
        APICallerTool(),
        DataProcessorTool()
    ]
    
    # Initialize memory
    memory = ConversationMemory(max_size=50)
    
    # Create specialized agents
    code_agent = CodeAgent(
        llm_provider=llm_provider,
        tools=tools,
        memory=memory
    )
    
    data_agent = DataAnalysisAgent(
        llm_provider=llm_provider,
        tools=tools,
        memory=memory
    )
    
    research_agent = ResearchAgent(
        llm_provider=llm_provider,
        tools=tools,
        memory=memory
    )
    
    task_planner_agent = TaskPlannerAgent(
        llm_provider=llm_provider,
        tools=tools,
        memory=memory
    )
    
    # Create orchestrator
    orchestrator = AgentOrchestrator(max_concurrent_tasks=3)
    
    # Register agents
    orchestrator.register_agent(code_agent)
    orchestrator.register_agent(data_agent)
    orchestrator.register_agent(research_agent)
    orchestrator.register_agent(task_planner_agent)
    
    print("\nRegistered Agents:")
    for agent_info in orchestrator.list_agents():
        print(f"  - {agent_info['name']}: {agent_info['description']}")
    
    print("\n" + "=" * 60)
    print("Example 1: Code Generation Task")
    print("=" * 60)
    
    # Example 1: Code generation task
    code_task = Task(
        title="Generate Python function",
        description="Generate a function to calculate fibonacci numbers",
        agent_name="CodeAgent",
        priority=TaskPriority.HIGH,
        input_data={
            "type": "generate",
            "requirements": "Create a Python function that calculates the nth Fibonacci number using dynamic programming",
            "language": "Python"
        }
    )
    
    result1 = await orchestrator.execute_task_sync(code_task)
    print(f"\nTask Status: {result1['status']}")
    if result1.get('output_data'):
        print(f"Generated Code:\n{result1['output_data'].get('code', 'N/A')[:500]}...")
    
    print("\n" + "=" * 60)
    print("Example 2: Task Planning")
    print("=" * 60)
    
    # Example 2: Task planning
    planning_task = Task(
        title="Plan web application project",
        description="Create a plan for building a todo app",
        agent_name="TaskPlannerAgent",
        input_data={
            "type": "decompose",
            "task": "Build a full-stack todo application with React frontend and Node.js backend"
        }
    )
    
    result2 = await orchestrator.execute_task_sync(planning_task)
    print(f"\nTask Status: {result2['status']}")
    if result2.get('output_data'):
        print(f"Plan:\n{result2['output_data'].get('subtasks', 'N/A')[:500]}...")
    
    print("\n" + "=" * 60)
    print("Example 3: Direct Agent Interaction")
    print("=" * 60)
    
    # Example 3: Direct agent interaction
    response = await code_agent.process(
        "Explain the difference between list and tuple in Python",
        context={"difficulty": "beginner"}
    )
    print(f"\nAgent Response:\n{response[:500]}...")
    
    # Get statistics
    print("\n" + "=" * 60)
    print("System Statistics")
    print("=" * 60)
    
    stats = orchestrator.get_stats()
    print(f"\nOrchestrator Stats:")
    print(f"  Total Tasks: {stats['total_tasks']}")
    print(f"  Pending Tasks: {stats['pending_tasks']}")
    print(f"  Active Tasks: {stats['active_tasks']}")
    
    print(f"\nCode Agent Stats:")
    agent_stats = code_agent.get_stats()
    print(f"  Total Tasks: {agent_stats['total_tasks']}")
    print(f"  Success Rate: {agent_stats['success_rate']:.2%}")
    
    print("\n" + "=" * 60)
    print("Demo completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())

