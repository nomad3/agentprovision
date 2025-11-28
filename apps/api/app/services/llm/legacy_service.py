"""LLM service for generating intelligent responses using Claude."""
from __future__ import annotations

import json
from typing import List, Dict, Any
import anthropic

from app.core.config import settings


class LLMService:
    """Service for interacting with Claude API."""

    def __init__(self):
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY not configured")
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.LLM_MODEL
        self.max_tokens = settings.LLM_MAX_TOKENS
        self.temperature = settings.LLM_TEMPERATURE

    def generate_chat_response(
        self,
        *,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        system_prompt: str,
        max_tokens: int | None = None,
        temperature: float | None = None,
        tools: List[Dict[str, Any]] | None = None,
    ) -> Dict[str, Any]:
        """
        Generate a chat response using Claude.

        Args:
            user_message: The user's current message
            conversation_history: List of previous messages with {"role": "user"|"assistant", "content": "..."}
            system_prompt: System instructions for Claude
            max_tokens: Override default max tokens
            temperature: Override default temperature
            tools: Optional list of tools Claude can use

        Returns:
            Dictionary with:
            - text: The assistant's response text
            - tool_calls: List of tool calls if any (with name and input)
            - stop_reason: Why the model stopped (end_turn, tool_use, etc.)
        """
        # Build messages list with conversation history + current message
        messages = []

        # Add conversation history
        for msg in conversation_history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })

        try:
            kwargs = {
                "model": self.model,
                "max_tokens": max_tokens or self.max_tokens,
                "temperature": temperature or self.temperature,
                "system": system_prompt,
                "messages": messages
            }

            # Add tools if provided
            if tools:
                kwargs["tools"] = tools

            response = self.client.messages.create(**kwargs)

            # Extract text and tool calls from response
            text_parts = []
            tool_calls = []

            for block in response.content:
                if block.type == "text":
                    text_parts.append(block.text)
                elif block.type == "tool_use":
                    tool_calls.append({
                        "id": block.id,
                        "name": block.name,
                        "input": block.input
                    })

            result_text = " ".join(text_parts) if text_parts else ""

            # If no text and no tool calls, provide default message
            if not result_text and not tool_calls:
                result_text = "I apologize, but I couldn't generate a response. Please try again."

            return {
                "text": result_text,
                "tool_calls": tool_calls,
                "stop_reason": response.stop_reason
            }

        except anthropic.APIError as e:
            return {"text": f"API Error: {str(e)}", "tool_calls": [], "stop_reason": "error"}
        except Exception as e:
            return {"text": f"Error generating response: {str(e)}", "tool_calls": [], "stop_reason": "error"}

    def build_data_analysis_system_prompt(
        self,
        *,
        agent_kit_name: str,
        primary_objective: str,
        dataset_name: str,
        dataset_schema: Dict[str, Any] | None,
        dataset_summary: Dict[str, Any],
        sample_rows: List[Dict[str, Any]],
        tools: List[str] | None = None,
        metrics: List[str] | None = None,
        constraints: List[str] | None = None,
    ) -> str:
        """
        Build a comprehensive system prompt for data analysis conversations.

        Args:
            agent_kit_name: Name of the agent kit
            primary_objective: The agent's main goal
            dataset_name: Name of the dataset being analyzed
            dataset_schema: Schema information (column names and types)
            dataset_summary: Statistical summary of the data
            sample_rows: Sample rows from the dataset
            tools: Available tools for the agent
            metrics: Key metrics to monitor
            constraints: Operational constraints

        Returns:
            Formatted system prompt
        """
        prompt_parts = []

        # Core identity
        prompt_parts.append(f"You are {agent_kit_name}, an intelligent data analysis assistant.")
        prompt_parts.append(f"\nYour primary objective: {primary_objective}")

        # Dataset context
        prompt_parts.append(f"\n\nYou are currently analyzing the dataset: '{dataset_name}'")

        if dataset_schema:
            prompt_parts.append("\nDataset columns:")
            # Handle both dict of schemas (multiple datasets) and single schema
            if isinstance(dataset_schema, dict) and any(isinstance(v, (list, dict)) for v in dataset_schema.values()):
                # It's a dict of schemas: {dataset_name: schema}
                for ds_name, schema in dataset_schema.items():
                    if isinstance(schema, list):
                        schema_info = ", ".join([f"{col.get('name', col)}" for col in schema])
                    elif isinstance(schema, dict):
                         schema_info = ", ".join([f"{col}" for col in schema.keys()])
                    else:
                        schema_info = str(schema)
                    prompt_parts.append(f"\n- {ds_name}: {schema_info}")
            elif isinstance(dataset_schema, list):
                # Single dataset list schema
                schema_info = ", ".join([f"{col.get('name', col)}" for col in dataset_schema])
                prompt_parts.append(f" {schema_info}")
            else:
                # Single dataset dict schema
                schema_info = ", ".join([f"{col}" for col in dataset_schema.keys()])
                prompt_parts.append(f" {schema_info}")

        # Statistical summary
        if dataset_summary and dataset_summary.get("numeric_columns"):
            prompt_parts.append("\n\nDataset statistics:")
            for col_stats in dataset_summary["numeric_columns"][:5]:  # Top 5 columns
                if col_stats.get("avg") is not None:
                    prompt_parts.append(
                        f"- {col_stats['column']}: avg={col_stats['avg']:.2f}, "
                        f"min={col_stats['min']}, max={col_stats['max']}"
                    )

        # Sample data
        if sample_rows:
            prompt_parts.append("\n\nSample records (first 3):")
            for i, row in enumerate(sample_rows[:3], 1):
                row_str = json.dumps(row, indent=2)
                prompt_parts.append(f"\nRecord {i}: {row_str}")

        # Tools and capabilities
        if tools:
            prompt_parts.append(f"\n\nAvailable tools: {', '.join(tools)}")

        # Metrics to track
        if metrics:
            prompt_parts.append(f"\n\nKey metrics to monitor: {', '.join(metrics)}")

        # Constraints
        if constraints:
            prompt_parts.append(f"\n\nOperational constraints: {', '.join(constraints)}")

        # Behavioral guidelines
        prompt_parts.append("\n\n## Guidelines:")
        prompt_parts.append("- Provide clear, actionable insights based on the data")
        prompt_parts.append("- Reference specific data points and statistics when relevant")
        prompt_parts.append("- Ask clarifying questions if the user's intent is unclear")
        prompt_parts.append("- Suggest next steps or deeper analyses when appropriate")
        prompt_parts.append("- Be concise but comprehensive")
        prompt_parts.append("- If you don't have enough information, acknowledge limitations")

        return "".join(prompt_parts)


# Singleton instance
_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    """Get or create the LLM service singleton."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
