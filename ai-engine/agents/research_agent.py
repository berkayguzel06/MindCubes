"""
Research Agent - Specialized in information gathering and analysis
"""

from typing import Any
from core.base_agent import BaseAgent
from core.base_tool import BaseTool
from core.llm_provider import LLMProvider
from core.memory import Memory
from typing import Optional, List, Dict
from core.task import Task


class ResearchAgent(BaseAgent):
    """
    Highly specialized agent for research and information gathering.
    Capabilities: web research, document analysis, fact-checking, summarization
    """
    
    def __init__(
        self,
        llm_provider: LLMProvider,
        tools: Optional[List[BaseTool]] = None,
        memory: Optional[Memory] = None
    ):
        super().__init__(
            name="ResearchAgent",
            description="Expert in research, information gathering, and synthesis of complex topics",
            llm_provider=llm_provider,
            tools=tools,
            memory=memory
        )
    
    def _default_system_prompt(self) -> str:
        return """You are an expert research agent with strong analytical capabilities.

Your capabilities:
- Conduct thorough research on any topic
- Analyze and synthesize information from multiple sources
- Fact-check claims and verify information
- Summarize complex documents
- Identify key insights and connections
- Provide well-cited, accurate information

Always:
- Verify information from multiple sources
- Cite sources when possible
- Distinguish between facts and opinions
- Provide balanced perspectives
- Identify gaps in knowledge
- Suggest further research directions
"""
    
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute research tasks."""
        task_type = task.input_data.get("type", "general")
        
        if task_type == "research":
            return await self._conduct_research(task)
        elif task_type == "summarize":
            return await self._summarize_content(task)
        elif task_type == "fact_check":
            return await self._fact_check(task)
        elif task_type == "compare":
            return await self._compare_topics(task)
        else:
            return await self._general_research_task(task)
    
    async def _conduct_research(self, task: Task) -> Dict[str, Any]:
        """Conduct comprehensive research on a topic."""
        topic = task.input_data.get("topic", "")
        depth = task.input_data.get("depth", "medium")
        focus_areas = task.input_data.get("focus_areas", [])
        
        focus_str = ", ".join(focus_areas) if focus_areas else "all aspects"
        
        prompt = f"""Conduct {depth}-depth research on: {topic}

Focus on: {focus_str}

Provide:
1. Overview and background
2. Key concepts and definitions
3. Current state and trends
4. Important findings and data
5. Different perspectives
6. Gaps in knowledge
7. Recommendations for further research
"""
        
        research = await self.process(prompt)
        
        return {
            "research": research,
            "topic": topic,
            "depth": depth,
            "type": "research"
        }
    
    async def _summarize_content(self, task: Task) -> Dict[str, Any]:
        """Summarize documents or content."""
        content = task.input_data.get("content", "")
        summary_type = task.input_data.get("summary_type", "comprehensive")
        max_length = task.input_data.get("max_length", "medium")
        
        prompt = f"""Create a {summary_type} summary of the following content (length: {max_length}):

{content}

Include:
- Main points
- Key takeaways
- Important details
- Conclusions
"""
        
        summary = await self.process(prompt)
        
        return {
            "summary": summary,
            "summary_type": summary_type,
            "type": "summarization"
        }
    
    async def _fact_check(self, task: Task) -> Dict[str, Any]:
        """Fact-check claims."""
        claims = task.input_data.get("claims", "")
        
        prompt = f"""Fact-check the following claims:

{claims}

For each claim, provide:
1. Accuracy assessment (True/False/Partially True/Unverifiable)
2. Supporting evidence
3. Contradicting evidence
4. Context and nuances
5. Confidence level in the assessment
"""
        
        fact_check = await self.process(prompt)
        
        return {
            "fact_check": fact_check,
            "type": "fact_checking"
        }
    
    async def _compare_topics(self, task: Task) -> Dict[str, Any]:
        """Compare multiple topics or concepts."""
        topics = task.input_data.get("topics", [])
        criteria = task.input_data.get("criteria", [])
        
        topics_str = " vs ".join(topics)
        criteria_str = ", ".join(criteria) if criteria else "all relevant aspects"
        
        prompt = f"""Compare and contrast: {topics_str}

Comparison criteria: {criteria_str}

Provide:
1. Overview of each topic
2. Similarities
3. Differences
4. Strengths and weaknesses
5. Use cases or applications
6. Recommendations
"""
        
        comparison = await self.process(prompt)
        
        return {
            "comparison": comparison,
            "topics": topics,
            "type": "comparison"
        }
    
    async def _general_research_task(self, task: Task) -> Dict[str, Any]:
        """Handle general research queries."""
        query = task.input_data.get("query", task.description)
        
        result = await self.process(query)
        
        return {
            "result": result,
            "type": "general"
        }

