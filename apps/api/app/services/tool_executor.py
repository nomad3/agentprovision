"""Tool execution framework for agents."""
from __future__ import annotations

from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
import json


class ToolResult:
    """Standardized result from tool execution."""

    def __init__(
        self,
        success: bool,
        data: Any = None,
        error: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.success = success
        self.data = data
        self.error = error
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "success": self.success,
            "data": self.data,
            "error": self.error,
            "metadata": self.metadata
        }

    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict(), default=str)


class Tool(ABC):
    """Base class for all executable tools."""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    @abstractmethod
    def get_schema(self) -> Dict[str, Any]:
        """
        Return the tool's parameter schema for LLM tool use.

        Returns:
            Dictionary with tool definition including input_schema
        """
        pass

    @abstractmethod
    def execute(self, **kwargs) -> ToolResult:
        """
        Execute the tool with given parameters.

        Args:
            **kwargs: Tool-specific parameters

        Returns:
            ToolResult with success status, data, and optional error
        """
        pass

    def validate_params(self, params: Dict[str, Any]) -> bool:
        """
        Validate parameters against schema.

        Args:
            params: Parameters to validate

        Returns:
            True if valid, False otherwise
        """
        schema = self.get_schema()
        required = schema.get("input_schema", {}).get("required", [])

        for field in required:
            if field not in params:
                return False
        return True


class SQLQueryTool(Tool):
    """Tool for executing SQL queries on datasets."""

    def __init__(self, dataset_service, dataset):
        super().__init__(
            name="sql_query",
            description="Execute SQL queries on the current dataset to retrieve and analyze data"
        )
        self.dataset_service = dataset_service
        self.dataset = dataset

    def get_schema(self) -> Dict[str, Any]:
        """Get schema for SQL query tool."""
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": {
                "type": "object",
                "properties": {
                    "sql": {
                        "type": "string",
                        "description": "SQL query to execute. Table name is 'dataset'. Only SELECT queries allowed."
                    },
                    "explanation": {
                        "type": "string",
                        "description": "Brief explanation of what this query will find"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of rows to return (default: 100, max: 1000)",
                        "default": 100
                    }
                },
                "required": ["sql", "explanation"]
            }
        }

    def execute(self, **kwargs) -> ToolResult:
        """Execute SQL query on dataset."""
        try:
            sql = kwargs.get("sql")
            limit = kwargs.get("limit", 100)
            explanation = kwargs.get("explanation", "")

            if not sql:
                return ToolResult(
                    success=False,
                    error="SQL query is required"
                )

            result = self.dataset_service.execute_query(
                self.dataset,
                sql,
                limit=limit
            )

            return ToolResult(
                success=True,
                data=result,
                metadata={
                    "explanation": explanation,
                    "query": sql,
                    "row_count": result.get("row_count", 0)
                }
            )

        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Query execution failed: {str(e)}"
            )


class CalculatorTool(Tool):
    """Tool for performing calculations."""

    def __init__(self):
        super().__init__(
            name="calculator",
            description="Perform mathematical calculations and return results"
        )

    def get_schema(self) -> Dict[str, Any]:
        """Get schema for calculator tool."""
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Mathematical expression to evaluate (e.g., '(100 + 50) * 2')"
                    },
                    "explanation": {
                        "type": "string",
                        "description": "Explanation of what is being calculated"
                    }
                },
                "required": ["expression", "explanation"]
            }
        }

    def execute(self, **kwargs) -> ToolResult:
        """Execute calculation."""
        try:
            expression = kwargs.get("expression", "")
            explanation = kwargs.get("explanation", "")

            if not expression:
                return ToolResult(
                    success=False,
                    error="Expression is required"
                )

            # Safe evaluation - only allow basic math operations
            allowed_chars = set("0123456789+-*/() .")
            if not all(c in allowed_chars for c in expression):
                return ToolResult(
                    success=False,
                    error="Expression contains invalid characters. Only numbers and +, -, *, /, (, ) are allowed."
                )

            result = eval(expression, {"__builtins__": {}}, {})

            return ToolResult(
                success=True,
                data={"result": result, "expression": expression},
                metadata={"explanation": explanation}
            )

        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Calculation failed: {str(e)}"
            )


class DataSummaryTool(Tool):
    """Tool for getting statistical summaries of datasets."""

    def __init__(self, dataset_service, dataset):
        super().__init__(
            name="data_summary",
            description="Get statistical summary of the dataset including averages, min, max for numeric columns"
        )
        self.dataset_service = dataset_service
        self.dataset = dataset

    def get_schema(self) -> Dict[str, Any]:
        """Get schema for data summary tool."""
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": {
                "type": "object",
                "properties": {
                    "column": {
                        "type": "string",
                        "description": "Optional: Specific column to summarize. If not provided, summarizes all numeric columns."
                    }
                },
                "required": []
            }
        }

    def execute(self, **kwargs) -> ToolResult:
        """Get data summary."""
        try:
            summary = self.dataset_service.run_summary_query(self.dataset)
            column = kwargs.get("column")

            if column:
                # Filter to specific column
                for col_stats in summary.get("numeric_columns", []):
                    if col_stats["column"] == column:
                        return ToolResult(
                            success=True,
                            data=col_stats,
                            metadata={"column": column}
                        )

                return ToolResult(
                    success=False,
                    error=f"Column '{column}' not found or is not numeric"
                )

            return ToolResult(
                success=True,
                data=summary,
                metadata={"summary_type": "all_numeric_columns"}
            )

        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Failed to get summary: {str(e)}"
            )


class ToolRegistry:
    """Registry for managing available tools."""

    def __init__(self):
        self._tools: Dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        """Register a tool."""
        self._tools[tool.name] = tool

    def unregister(self, tool_name: str) -> None:
        """Unregister a tool."""
        if tool_name in self._tools:
            del self._tools[tool_name]

    def get_tool(self, tool_name: str) -> Optional[Tool]:
        """Get a tool by name."""
        return self._tools.get(tool_name)

    def list_tools(self) -> List[str]:
        """Get list of registered tool names."""
        return list(self._tools.keys())

    def get_all_schemas(self) -> List[Dict[str, Any]]:
        """Get schemas for all registered tools (for LLM tool use)."""
        return [tool.get_schema() for tool in self._tools.values()]

    def execute_tool(self, tool_name: str, **kwargs) -> ToolResult:
        """Execute a tool by name."""
        tool = self.get_tool(tool_name)

        if not tool:
            return ToolResult(
                success=False,
                error=f"Tool '{tool_name}' not found"
            )

        if not tool.validate_params(kwargs):
            return ToolResult(
                success=False,
                error=f"Invalid parameters for tool '{tool_name}'"
            )

        return tool.execute(**kwargs)


# Singleton registry
_tool_registry: Optional[ToolRegistry] = None


def get_tool_registry() -> ToolRegistry:
    """Get or create the global tool registry."""
    global _tool_registry
    if _tool_registry is None:
        _tool_registry = ToolRegistry()
    return _tool_registry
