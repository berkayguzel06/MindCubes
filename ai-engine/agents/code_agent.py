"""
Code Agent - Specialized in code generation, analysis, and debugging
"""

from typing import Any
from core.base_agent import BaseAgent
from core.base_tool import BaseTool
from core.llm_provider import LLMProvider
from core.memory import Memory
from typing import Optional, List, Dict
from core.task import Task


class CodeAgent(BaseAgent):
    """
    Highly specialized agent for code-related tasks.
    Capabilities: code generation, debugging, refactoring, analysis
    """
    
    def __init__(
        self,
        llm_provider: LLMProvider,
        tools: Optional[List[BaseTool]] = None,
        memory: Optional[Memory] = None
    ):
        super().__init__(
            name="CodeAgent",
            description="Expert in code generation, debugging, and analysis across multiple programming languages",
            llm_provider=llm_provider,
            tools=tools,
            memory=memory
        )
        self.supported_languages = [
            "Python", "JavaScript", "TypeScript", "Java", "C++", 
            "Go", "Rust", "Ruby", "PHP", "Swift"
        ]
    
    def _default_system_prompt(self) -> str:
        return """You are an expert code agent with deep knowledge of software engineering.
        
Your capabilities:
- Generate clean, efficient, and well-documented code
- Debug and fix code issues
- Refactor code for better maintainability
- Analyze code for performance and security issues
- Suggest best practices and design patterns
- Write comprehensive unit tests

Always:
- Write production-quality code
- Follow language-specific best practices
- Include error handling
- Add clear comments and documentation
- Consider edge cases and potential issues

Supported languages: Python, JavaScript, TypeScript, Java, C++, Go, Rust, Ruby, PHP, Swift
"""
    
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute code-related tasks."""
        task_type = task.input_data.get("type", "general")
        
        if task_type == "generate":
            return await self._generate_code(task)
        elif task_type == "debug":
            return await self._debug_code(task)
        elif task_type == "refactor":
            return await self._refactor_code(task)
        elif task_type == "analyze":
            return await self._analyze_code(task)
        elif task_type == "test":
            return await self._generate_tests(task)
        else:
            return await self._general_code_task(task)
    
    async def _generate_code(self, task: Task) -> Dict[str, Any]:
        """Generate code based on requirements."""
        requirements = task.input_data.get("requirements", "")
        language = task.input_data.get("language", "Python")
        
        prompt = f"""Generate {language} code for the following requirements:
        
{requirements}

Provide clean, well-structured, and documented code.
"""
        
        code = await self.process(prompt)
        
        return {
            "code": code,
            "language": language,
            "type": "generation"
        }
    
    async def _debug_code(self, task: Task) -> Dict[str, Any]:
        """Debug and fix code issues."""
        code = task.input_data.get("code", "")
        error = task.input_data.get("error", "")
        language = task.input_data.get("language", "Python")
        
        prompt = f"""Debug the following {language} code that's producing an error:

Code:
```{language}
{code}
```

Error:
{error}

Identify the issue and provide the corrected code with explanation.
"""
        
        result = await self.process(prompt)
        
        return {
            "fixed_code": result,
            "language": language,
            "type": "debugging"
        }
    
    async def _refactor_code(self, task: Task) -> Dict[str, Any]:
        """Refactor code for better quality."""
        code = task.input_data.get("code", "")
        language = task.input_data.get("language", "Python")
        goals = task.input_data.get("goals", "improve readability and maintainability")
        
        prompt = f"""Refactor the following {language} code to {goals}:

```{language}
{code}
```

Provide the refactored code with explanations of improvements.
"""
        
        result = await self.process(prompt)
        
        return {
            "refactored_code": result,
            "language": language,
            "type": "refactoring"
        }
    
    async def _analyze_code(self, task: Task) -> Dict[str, Any]:
        """Analyze code for issues and improvements."""
        code = task.input_data.get("code", "")
        language = task.input_data.get("language", "Python")
        
        prompt = f"""Analyze the following {language} code for:
- Potential bugs
- Performance issues
- Security vulnerabilities
- Code quality
- Best practice violations

Code:
```{language}
{code}
```

Provide a detailed analysis with recommendations.
"""
        
        analysis = await self.process(prompt)
        
        return {
            "analysis": analysis,
            "language": language,
            "type": "analysis"
        }
    
    async def _generate_tests(self, task: Task) -> Dict[str, Any]:
        """Generate unit tests for code."""
        code = task.input_data.get("code", "")
        language = task.input_data.get("language", "Python")
        framework = task.input_data.get("framework", "pytest")
        
        prompt = f"""Generate comprehensive unit tests for the following {language} code using {framework}:

```{language}
{code}
```

Include:
- Happy path tests
- Edge cases
- Error handling tests
- Mock external dependencies if needed
"""
        
        tests = await self.process(prompt)
        
        return {
            "tests": tests,
            "language": language,
            "framework": framework,
            "type": "testing"
        }
    
    async def _general_code_task(self, task: Task) -> Dict[str, Any]:
        """Handle general code-related queries."""
        query = task.input_data.get("query", task.description)
        
        result = await self.process(query)
        
        return {
            "result": result,
            "type": "general"
        }

