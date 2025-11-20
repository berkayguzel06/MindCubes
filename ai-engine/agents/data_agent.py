"""
Data Analysis Agent - Specialized in data processing and analysis
"""

from typing import Any
from core.base_agent import BaseAgent
from core.base_tool import BaseTool
from core.llm_provider import LLMProvider
from core.memory import Memory
from typing import Optional, List, Dict
from core.task import Task


class DataAnalysisAgent(BaseAgent):
    """
    Highly specialized agent for data analysis tasks.
    Capabilities: data processing, statistical analysis, visualization, insights
    """
    
    def __init__(
        self,
        llm_provider: LLMProvider,
        tools: Optional[List[BaseTool]] = None,
        memory: Optional[Memory] = None
    ):
        super().__init__(
            name="DataAnalysisAgent",
            description="Expert in data analysis, statistical methods, and deriving insights from data",
            llm_provider=llm_provider,
            tools=tools,
            memory=memory
        )
    
    def _default_system_prompt(self) -> str:
        return """You are an expert data analyst with deep knowledge of statistics and data science.

Your capabilities:
- Analyze datasets and identify patterns
- Perform statistical analysis
- Create data visualizations
- Derive actionable insights
- Clean and preprocess data
- Build data pipelines
- Use libraries like pandas, numpy, matplotlib, seaborn

Always:
- Validate data quality
- Handle missing values appropriately
- Consider statistical significance
- Provide clear visualizations
- Explain findings in business terms
- Suggest data-driven recommendations
"""
    
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute data analysis tasks."""
        task_type = task.input_data.get("type", "general")
        
        if task_type == "analyze":
            return await self._analyze_data(task)
        elif task_type == "visualize":
            return await self._create_visualization(task)
        elif task_type == "clean":
            return await self._clean_data(task)
        elif task_type == "insights":
            return await self._generate_insights(task)
        else:
            return await self._general_data_task(task)
    
    async def _analyze_data(self, task: Task) -> Dict[str, Any]:
        """Perform statistical analysis on data."""
        data_description = task.input_data.get("data_description", "")
        analysis_goals = task.input_data.get("goals", "")
        
        prompt = f"""Analyze the following data:

Data Description: {data_description}

Analysis Goals: {analysis_goals}

Provide:
1. Statistical summary
2. Key patterns and trends
3. Anomalies or outliers
4. Recommendations for further analysis
5. Python code for the analysis using pandas/numpy
"""
        
        result = await self.process(prompt)
        
        return {
            "analysis": result,
            "type": "statistical_analysis"
        }
    
    async def _create_visualization(self, task: Task) -> Dict[str, Any]:
        """Generate data visualization code."""
        data_description = task.input_data.get("data_description", "")
        viz_type = task.input_data.get("viz_type", "auto")
        
        prompt = f"""Create a data visualization for:

Data: {data_description}
Visualization Type: {viz_type}

Generate Python code using matplotlib/seaborn/plotly to create an effective visualization.
Include:
- Proper labels and titles
- Color scheme
- Legend if needed
- Best practices for the chosen chart type
"""
        
        viz_code = await self.process(prompt)
        
        return {
            "visualization_code": viz_code,
            "type": "visualization"
        }
    
    async def _clean_data(self, task: Task) -> Dict[str, Any]:
        """Generate data cleaning pipeline."""
        data_issues = task.input_data.get("issues", "")
        data_description = task.input_data.get("data_description", "")
        
        prompt = f"""Create a data cleaning pipeline for:

Data: {data_description}
Issues: {data_issues}

Provide Python code to:
1. Handle missing values
2. Remove duplicates
3. Fix data types
4. Handle outliers
5. Validate data quality
"""
        
        cleaning_code = await self.process(prompt)
        
        return {
            "cleaning_code": cleaning_code,
            "type": "data_cleaning"
        }
    
    async def _generate_insights(self, task: Task) -> Dict[str, Any]:
        """Generate insights from data."""
        data_summary = task.input_data.get("data_summary", "")
        context = task.input_data.get("context", "")
        
        prompt = f"""Generate actionable insights from this data:

Data Summary: {data_summary}
Business Context: {context}

Provide:
1. Key findings
2. Trends and patterns
3. Anomalies or concerns
4. Actionable recommendations
5. Potential next steps for analysis
"""
        
        insights = await self.process(prompt)
        
        return {
            "insights": insights,
            "type": "insights"
        }
    
    async def _general_data_task(self, task: Task) -> Dict[str, Any]:
        """Handle general data-related queries."""
        query = task.input_data.get("query", task.description)
        
        result = await self.process(query)
        
        return {
            "result": result,
            "type": "general"
        }

