"""LLM Provider Factory for multi-provider support."""
from dataclasses import dataclass
from typing import List
import anthropic
from openai import OpenAI


@dataclass
class OpenAIMessage:
    role: str
    content: str


@dataclass
class OpenAIChoice:
    index: int
    message: OpenAIMessage
    finish_reason: str


@dataclass
class OpenAIUsage:
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


@dataclass
class OpenAIResponse:
    id: str
    choices: List[OpenAIChoice]
    usage: OpenAIUsage
    model: str


class AnthropicAdapter:
    """Adapts Anthropic SDK to OpenAI-like interface."""

    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.chat = self._Chat(self.client)

    class _Chat:
        def __init__(self, client):
            self.completions = self._Completions(client)

        class _Completions:
            def __init__(self, client):
                self.client = client

            def create(
                self,
                model: str,
                messages: List[dict],
                max_tokens: int = 4096,
                temperature: float = 0.7,
                **kwargs
            ) -> OpenAIResponse:
                """Convert OpenAI format to Anthropic and back."""
                # Extract system message
                system = None
                anthropic_messages = []

                for msg in messages:
                    if msg["role"] == "system":
                        system = msg["content"]
                    else:
                        anthropic_messages.append({
                            "role": msg["role"],
                            "content": msg["content"]
                        })

                # Call Anthropic
                response = self.client.messages.create(
                    model=model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system,
                    messages=anthropic_messages,
                )

                # Extract text from response
                text = ""
                for block in response.content:
                    if block.type == "text":
                        text += block.text

                # Convert to OpenAI format
                return OpenAIResponse(
                    id=f"chatcmpl-{response.id}" if hasattr(response, 'id') else "chatcmpl-anthropic",
                    model=model,
                    choices=[
                        OpenAIChoice(
                            index=0,
                            message=OpenAIMessage(role="assistant", content=text),
                            finish_reason="stop" if response.stop_reason == "end_turn" else response.stop_reason
                        )
                    ],
                    usage=OpenAIUsage(
                        prompt_tokens=response.usage.input_tokens,
                        completion_tokens=response.usage.output_tokens,
                        total_tokens=response.usage.input_tokens + response.usage.output_tokens
                    )
                )


class LLMProviderFactory:
    """Creates configured LLM clients for each provider."""

    PROVIDER_CONFIGS = {
        "openai": {"base_url": "https://api.openai.com/v1"},
        "deepseek": {"base_url": "https://api.deepseek.com/v1"},
        "mistral": {"base_url": "https://api.mistral.ai/v1"},
        "google": {"base_url": "https://generativelanguage.googleapis.com/v1beta/openai"},
    }

    def get_client(self, provider_name: str, api_key: str):
        """
        Get a configured LLM client for the specified provider.

        Args:
            provider_name: Name of the provider (openai, anthropic, deepseek, etc.)
            api_key: API key for the provider

        Returns:
            Configured client (OpenAI client or AnthropicAdapter)
        """
        if provider_name == "anthropic":
            return AnthropicAdapter(api_key)

        config = self.PROVIDER_CONFIGS.get(provider_name)
        if not config:
            raise ValueError(f"Unknown provider: {provider_name}")

        return OpenAI(api_key=api_key, base_url=config["base_url"])
