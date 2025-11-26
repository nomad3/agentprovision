"""LLM Provider Factory for multi-provider support."""
from openai import OpenAI


class AnthropicAdapter:
    """Placeholder - will be implemented in Task 3."""
    def __init__(self, api_key: str):
        self.api_key = api_key


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
