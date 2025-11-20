"""
Data Processor Tool - Process and transform data
"""

from typing import Any
import json
from core.base_tool import BaseTool, ToolParameter
from typing import Dict, Any, Optional, List

class DataProcessorTool(BaseTool):
    """
    Tool for processing and transforming data.
    """
    
    def __init__(self):
        super().__init__(
            name="data_processor",
            description="Process and transform data (filter, sort, aggregate, etc.)",
            parameters=[
                ToolParameter(
                    name="operation",
                    type="string",
                    description="Operation: filter, sort, aggregate, transform, validate",
                    required=True
                ),
                ToolParameter(
                    name="data",
                    type="list",
                    description="Data to process",
                    required=True
                ),
                ToolParameter(
                    name="config",
                    type="dict",
                    description="Operation configuration",
                    required=False
                )
            ]
        )
    
    async def execute(
        self,
        operation: str,
        data: List[Any],
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process data.
        
        Args:
            operation: Operation to perform
            data: Data to process
            config: Operation configuration
            
        Returns:
            Processed data
        """
        config = config or {}
        
        if operation == "filter":
            return await self._filter_data(data, config)
        elif operation == "sort":
            return await self._sort_data(data, config)
        elif operation == "aggregate":
            return await self._aggregate_data(data, config)
        elif operation == "transform":
            return await self._transform_data(data, config)
        elif operation == "validate":
            return await self._validate_data(data, config)
        else:
            raise ValueError(f"Unknown operation: {operation}")
    
    async def _filter_data(self, data: List[Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Filter data based on conditions."""
        field = config.get("field")
        value = config.get("value")
        operator = config.get("operator", "equals")
        
        if not field:
            return {"filtered_data": data, "count": len(data)}
        
        filtered = []
        for item in data:
            if isinstance(item, dict):
                item_value = item.get(field)
                
                if operator == "equals" and item_value == value:
                    filtered.append(item)
                elif operator == "contains" and value in str(item_value):
                    filtered.append(item)
                elif operator == "greater_than" and item_value > value:
                    filtered.append(item)
                elif operator == "less_than" and item_value < value:
                    filtered.append(item)
        
        return {
            "filtered_data": filtered,
            "count": len(filtered),
            "original_count": len(data)
        }
    
    async def _sort_data(self, data: List[Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Sort data."""
        field = config.get("field")
        reverse = config.get("reverse", False)
        
        if not field:
            sorted_data = sorted(data, reverse=reverse)
        else:
            sorted_data = sorted(
                data,
                key=lambda x: x.get(field) if isinstance(x, dict) else x,
                reverse=reverse
            )
        
        return {
            "sorted_data": sorted_data,
            "count": len(sorted_data)
        }
    
    async def _aggregate_data(self, data: List[Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Aggregate data."""
        field = config.get("field")
        operation = config.get("aggregation", "count")
        
        if operation == "count":
            result = len(data)
        elif operation == "sum" and field:
            result = sum(item.get(field, 0) for item in data if isinstance(item, dict))
        elif operation == "avg" and field:
            values = [item.get(field, 0) for item in data if isinstance(item, dict)]
            result = sum(values) / len(values) if values else 0
        elif operation == "min" and field:
            values = [item.get(field) for item in data if isinstance(item, dict) and field in item]
            result = min(values) if values else None
        elif operation == "max" and field:
            values = [item.get(field) for item in data if isinstance(item, dict) and field in item]
            result = max(values) if values else None
        else:
            result = None
        
        return {
            "aggregation": operation,
            "field": field,
            "result": result
        }
    
    async def _transform_data(self, data: List[Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Transform data structure."""
        # Simple transformation: select specific fields
        fields = config.get("fields", [])
        
        if not fields:
            return {"transformed_data": data, "count": len(data)}
        
        transformed = []
        for item in data:
            if isinstance(item, dict):
                transformed_item = {field: item.get(field) for field in fields if field in item}
                transformed.append(transformed_item)
        
        return {
            "transformed_data": transformed,
            "count": len(transformed)
        }
    
    async def _validate_data(self, data: List[Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate data against schema."""
        required_fields = config.get("required_fields", [])
        
        validation_results = []
        valid_count = 0
        
        for idx, item in enumerate(data):
            if not isinstance(item, dict):
                validation_results.append({
                    "index": idx,
                    "valid": False,
                    "errors": ["Item is not a dictionary"]
                })
                continue
            
            errors = []
            for field in required_fields:
                if field not in item:
                    errors.append(f"Missing required field: {field}")
            
            is_valid = len(errors) == 0
            if is_valid:
                valid_count += 1
            
            validation_results.append({
                "index": idx,
                "valid": is_valid,
                "errors": errors
            })
        
        return {
            "validation_results": validation_results,
            "valid_count": valid_count,
            "invalid_count": len(data) - valid_count,
            "total_count": len(data)
        }

