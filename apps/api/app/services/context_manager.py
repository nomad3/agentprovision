"""Context and memory management for conversations."""
from __future__ import annotations

from typing import List, Dict, Any, Optional
import anthropic
from app.core.config import settings


class ContextManager:
    """
    Manages conversation context and memory.

    Handles:
    - Token counting and limits
    - Message window management
    - Conversation summarization
    - Smart message retention
    """

    # Claude Sonnet 4.5 has ~200K context window
    # Reserve space for: system prompt (~2K), output (~4K), tools (~2K)
    MAX_CONTEXT_TOKENS = 180_000  # Conservative limit
    SUMMARY_TRIGGER_TOKENS = 150_000  # When to start summarizing

    # Token estimation (rough heuristic: ~4 chars per token)
    CHARS_PER_TOKEN = 4

    def __init__(self, anthropic_client: Optional[anthropic.Anthropic] = None):
        """Initialize context manager with optional Anthropic client for summarization."""
        self.client = anthropic_client
        if not self.client and settings.ANTHROPIC_API_KEY:
            self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def estimate_tokens(self, text: str) -> int:
        """
        Estimate token count for text.

        Uses rough heuristic of ~4 chars per token.
        For production, consider using tiktoken or similar.

        Args:
            text: Text to estimate tokens for

        Returns:
            Estimated token count
        """
        return max(1, len(text) // self.CHARS_PER_TOKEN)

    def count_message_tokens(self, message: Dict[str, str]) -> int:
        """
        Count tokens in a single message.

        Args:
            message: Message dict with 'role' and 'content'

        Returns:
            Estimated token count
        """
        # Count role and content
        tokens = self.estimate_tokens(message.get("role", ""))
        tokens += self.estimate_tokens(message.get("content", ""))
        return tokens

    def count_messages_tokens(self, messages: List[Dict[str, str]]) -> int:
        """
        Count total tokens in message list.

        Args:
            messages: List of message dicts

        Returns:
            Total estimated token count
        """
        return sum(self.count_message_tokens(msg) for msg in messages)

    def should_summarize(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str = "",
    ) -> bool:
        """
        Check if conversation should be summarized.

        Args:
            messages: Current conversation messages
            system_prompt: System prompt text

        Returns:
            True if summarization is recommended
        """
        total_tokens = self.count_messages_tokens(messages)
        total_tokens += self.estimate_tokens(system_prompt)

        return total_tokens >= self.SUMMARY_TRIGGER_TOKENS

    def summarize_conversation(
        self,
        messages: List[Dict[str, str]],
        keep_recent_count: int = 6,
    ) -> Dict[str, Any]:
        """
        Summarize older messages while keeping recent ones.

        Strategy:
        - Keep the most recent N messages (default: 6 = 3 turns)
        - Summarize everything before that
        - Return both summary and recent messages

        Args:
            messages: Full conversation history
            keep_recent_count: Number of recent messages to keep unsummarized

        Returns:
            Dict with:
            - summary: Text summary of old messages
            - recent_messages: Recent messages to keep
            - summarized_count: Number of messages summarized
            - retained_count: Number of messages retained
        """
        if len(messages) <= keep_recent_count:
            # Too short to summarize
            return {
                "summary": None,
                "recent_messages": messages,
                "summarized_count": 0,
                "retained_count": len(messages),
            }

        # Split into old (to summarize) and recent (to keep)
        old_messages = messages[:-keep_recent_count]
        recent_messages = messages[-keep_recent_count:]

        # Generate summary using Claude
        summary = self._generate_summary(old_messages)

        return {
            "summary": summary,
            "recent_messages": recent_messages,
            "summarized_count": len(old_messages),
            "retained_count": len(recent_messages),
        }

    def _generate_summary(self, messages: List[Dict[str, str]]) -> str:
        """
        Generate a summary of conversation messages using Claude.

        Args:
            messages: Messages to summarize

        Returns:
            Summary text
        """
        if not self.client:
            # Fallback: simple concatenation if no client
            return self._simple_summary(messages)

        # Build conversation text
        conversation_text = "\n\n".join([
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in messages
        ])

        try:
            response = self.client.messages.create(
                model=settings.LLM_MODEL,
                max_tokens=1000,  # Summaries should be concise
                temperature=0.3,  # Low temp for factual summary
                system=(
                    "You are a conversation summarizer. Create a concise but comprehensive "
                    "summary of the following conversation. Focus on:\n"
                    "- Key questions asked by the user\n"
                    "- Important data points and insights discovered\n"
                    "- SQL queries executed and their results\n"
                    "- Calculations performed\n"
                    "- Patterns or trends identified\n\n"
                    "Keep the summary factual and structured. Use bullet points."
                ),
                messages=[{
                    "role": "user",
                    "content": f"Summarize this conversation:\n\n{conversation_text}"
                }]
            )

            # Extract text from response
            summary_parts = []
            for block in response.content:
                if block.type == "text":
                    summary_parts.append(block.text)

            return "\n".join(summary_parts) if summary_parts else self._simple_summary(messages)

        except Exception:
            # Fallback to simple summary if API call fails
            return self._simple_summary(messages)

    def _simple_summary(self, messages: List[Dict[str, str]]) -> str:
        """
        Create a simple summary without LLM.

        Fallback for when Claude API is unavailable.

        Args:
            messages: Messages to summarize

        Returns:
            Simple summary text
        """
        user_questions = []
        assistant_responses = []

        for msg in messages:
            if msg["role"] == "user":
                # Truncate long questions
                content = msg["content"][:100]
                if len(msg["content"]) > 100:
                    content += "..."
                user_questions.append(content)
            elif msg["role"] == "assistant":
                # Extract key phrases from assistant responses
                content = msg["content"][:150]
                if len(msg["content"]) > 150:
                    content += "..."
                assistant_responses.append(content)

        summary_parts = [
            f"[Summary of {len(messages)} messages]",
            f"\nUser asked about: {'; '.join(user_questions[:3])}",
        ]

        if len(user_questions) > 3:
            summary_parts.append(f"...and {len(user_questions) - 3} more questions")

        return "\n".join(summary_parts)

    def manage_context_window(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str = "",
        keep_recent_count: int = 10,
    ) -> Dict[str, Any]:
        """
        Manage context window by summarizing or truncating as needed.

        Main entry point for context management.

        Args:
            messages: Full conversation history
            system_prompt: System prompt text
            keep_recent_count: Minimum recent messages to keep

        Returns:
            Dict with:
            - messages: Processed messages to use
            - summary: Summary of older messages (if any)
            - was_summarized: Whether summarization occurred
            - total_tokens: Estimated total tokens
        """
        # Check if we need to do anything
        total_tokens = self.count_messages_tokens(messages)
        system_tokens = self.estimate_tokens(system_prompt)

        if total_tokens + system_tokens < self.SUMMARY_TRIGGER_TOKENS:
            # Within limits, no action needed
            return {
                "messages": messages,
                "summary": None,
                "was_summarized": False,
                "total_tokens": total_tokens + system_tokens,
            }

        # Need to summarize
        result = self.summarize_conversation(messages, keep_recent_count)

        # Build new message list: system message with summary + recent messages
        processed_messages = result["recent_messages"]

        # Calculate new token count
        new_tokens = self.count_messages_tokens(processed_messages)
        if result["summary"]:
            new_tokens += self.estimate_tokens(result["summary"])
        new_tokens += system_tokens

        return {
            "messages": processed_messages,
            "summary": result["summary"],
            "was_summarized": True,
            "total_tokens": new_tokens,
            "summarized_count": result["summarized_count"],
            "retained_count": result["retained_count"],
        }

    def inject_summary_into_system_prompt(
        self,
        system_prompt: str,
        summary: str,
    ) -> str:
        """
        Inject conversation summary into system prompt.

        Args:
            system_prompt: Original system prompt
            summary: Conversation summary to inject

        Returns:
            Enhanced system prompt with summary
        """
        if not summary:
            return system_prompt

        summary_section = (
            f"\n\n## Conversation History Summary\n\n"
            f"This is a summary of the earlier conversation:\n\n{summary}\n\n"
            f"Use this context to maintain continuity in your responses."
        )

        return system_prompt + summary_section


# Singleton instance
_context_manager: Optional[ContextManager] = None


def get_context_manager() -> ContextManager:
    """Get or create the context manager singleton."""
    global _context_manager
    if _context_manager is None:
        _context_manager = ContextManager()
    return _context_manager
