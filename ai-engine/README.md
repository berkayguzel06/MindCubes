# AI Engine

Core Python framework for AI agents, training, and model management.

## Features

- **Specialized AI Agents** - CodeAgent, DataAnalysisAgent, ResearchAgent, TaskPlannerAgent
- **Flexible LLM Support** - OpenAI, Anthropic, Local models
- **Tool System** - Extensible tools for agents (web search, code execution, etc.)
- **Memory Management** - Conversation history and semantic memory
- **Task Orchestration** - Multi-agent task management with priorities
- **Model Training** - Full training, fine-tuning, and LoRA adaptation
- **Model Management** - Registry and lifecycle management

## Quick Start

### Installation

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration

```bash
cp .env.example .env
# Edit .env with your API keys
```

### Basic Usage

```python
import asyncio
from core import OpenAIProvider, ConversationMemory, AgentOrchestrator
from agents import CodeAgent
from tools import WebSearchTool, CodeExecutorTool

async def main():
    # Setup LLM provider
    llm = OpenAIProvider(model_name="gpt-4")
    
    # Create agent with tools
    agent = CodeAgent(
        llm_provider=llm,
        tools=[WebSearchTool(), CodeExecutorTool()],
        memory=ConversationMemory()
    )
    
    # Direct interaction
    response = await agent.process("Write a Python function to reverse a string")
    print(response)
    
    # Or use orchestrator for task management
    orchestrator = AgentOrchestrator()
    orchestrator.register_agent(agent)
    
    from core import Task, TaskPriority
    
    task = Task(
        title="Generate function",
        description="Create a fibonacci function",
        agent_name="CodeAgent",
        priority=TaskPriority.HIGH
    )
    
    result = await orchestrator.execute_task_sync(task)
    print(result)

asyncio.run(main())
```

## Architecture

### Core Components

```
core/
├── base_agent.py       # Base agent class
├── base_tool.py        # Base tool class
├── llm_provider.py     # LLM provider abstractions
├── memory.py           # Memory systems
├── task.py             # Task management
└── orchestrator.py     # Agent orchestration
```

### Agents

```python
from agents import CodeAgent, DataAnalysisAgent, ResearchAgent, TaskPlannerAgent

# Each agent is specialized for specific tasks
code_agent = CodeAgent(llm_provider, tools, memory)
data_agent = DataAnalysisAgent(llm_provider, tools, memory)
```

### Tools

```python
from tools import (
    WebSearchTool,
    CodeExecutorTool,
    FileManagerTool,
    APICallerTool,
    DataProcessorTool
)

# Tools extend agent capabilities
tools = [
    WebSearchTool(),
    CodeExecutorTool(allowed_languages=["python"]),
    FileManagerTool(base_directory="./workspace")
]
```

### Training

```python
from models import FineTuner, LoRAAdapter

# Fine-tuning
fine_tuner = FineTuner(
    base_model="gpt2",
    task_type="text-generation"
)
fine_tuner.load_model()
fine_tuner.fine_tune(dataset_path="./data/training.json")

# LoRA training (more efficient)
lora = LoRAAdapter(
    base_model="meta-llama/Llama-2-7b-hf",
    lora_config={"r": 16, "lora_alpha": 32}
)
lora.load_base_model()
lora.train_lora(train_dataset, num_epochs=3)
```

## Creating Custom Agents

```python
from core.base_agent import BaseAgent
from typing import Dict, Any

class MyCustomAgent(BaseAgent):
    def _default_system_prompt(self) -> str:
        return """You are a specialized agent for..."""
    
    async def execute_task(self, task) -> Dict[str, Any]:
        # Your implementation
        result = await self.process(task.description)
        return {"result": result}

# Use your custom agent
agent = MyCustomAgent(
    name="MyAgent",
    description="Does X",
    llm_provider=llm_provider
)
```

## Creating Custom Tools

```python
from core.base_tool import BaseTool, ToolParameter

class MyTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="my_tool",
            description="Does something useful",
            parameters=[
                ToolParameter(
                    name="input",
                    type="string",
                    description="Input parameter",
                    required=True
                )
            ]
        )
    
    async def execute(self, input: str) -> Any:
        # Your implementation
        return {"output": f"Processed: {input}"}
```

## Configuration

### config/config.yaml

```yaml
agents:
  default_model: "gpt-4"
  max_retries: 3
  timeout: 300

models:
  local:
    cache_dir: "./models/cache"
    device: "auto"

training:
  output_dir: "./models/checkpoints"
  batch_size: 4
  learning_rate: 2e-4
  num_epochs: 3

lora:
  r: 16
  lora_alpha: 32
  lora_dropout: 0.1
```

## Examples

See `examples/` directory for detailed examples:
- `training_example.py` - Training and fine-tuning models
- `main.py` - Agent usage examples

## API Reference

### BaseAgent

```python
class BaseAgent(ABC):
    def __init__(name, description, llm_provider, tools, memory, system_prompt)
    async def execute_task(task: Task) -> Dict[str, Any]
    async def process(user_input: str, context: Dict) -> str
    async def use_tool(tool_name: str, **kwargs) -> Any
    def add_tool(tool: BaseTool) -> None
    def get_stats() -> Dict[str, Any]
```

### BaseTool

```python
class BaseTool(ABC):
    def __init__(name, description, parameters)
    async def execute(**kwargs) -> Any
    async def run(**kwargs) -> Dict[str, Any]
    def get_schema() -> Dict[str, Any]
    def get_stats() -> Dict[str, Any]
```

### LLMProvider

```python
class LLMProvider(ABC):
    async def generate(prompt: str, system_prompt: str, **kwargs) -> str
    async def generate_stream(prompt: str, system_prompt: str, **kwargs)
    def get_stats() -> Dict[str, Any]
```

## Best Practices

1. **Use appropriate models** - GPT-4 for complex tasks, GPT-3.5 for simple ones
2. **Implement error handling** - All agent and tool code should handle errors
3. **Monitor token usage** - Track costs with LLM provider stats
4. **Cache when possible** - Use memory systems to reduce redundant calls
5. **Test thoroughly** - Unit test custom agents and tools
6. **Version control models** - Keep track of trained model versions

## Performance Tips

1. **Batch requests** - Process multiple tasks concurrently
2. **Use local models** - For high-volume, latency-sensitive tasks
3. **Optimize prompts** - Shorter, clearer prompts = faster responses
4. **Enable caching** - Reduce redundant LLM calls
5. **Monitor resources** - Track memory and CPU usage

## Troubleshooting

### Out of Memory
- Reduce batch size
- Use gradient accumulation
- Use LoRA instead of full fine-tuning
- Reduce sequence length

### Slow Training
- Use GPU (CUDA)
- Increase batch size (if memory allows)
- Use mixed precision (fp16)
- Reduce model size

### API Rate Limits
- Implement exponential backoff
- Use local models for high volume
- Batch requests
- Implement caching

## Contributing

1. Follow OOP principles
2. Add type hints
3. Write docstrings
4. Add unit tests
5. Update documentation

## License

MIT

