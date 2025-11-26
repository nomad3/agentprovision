"""Tests for multi-provider LLM integration."""
import pytest
from sqlalchemy import inspect
from unittest.mock import patch, MagicMock


def test_llm_config_has_provider_api_keys():
    """LLMConfig should have provider_api_keys JSON field."""
    from app.models.llm_config import LLMConfig

    # Check that the model has the column
    mapper = inspect(LLMConfig)
    column_names = [col.key for col in mapper.columns]

    assert "provider_api_keys" in column_names, "LLMConfig should have provider_api_keys column"

    # Check the column type
    provider_api_keys_col = mapper.columns.provider_api_keys
    assert provider_api_keys_col.type.__class__.__name__ == "JSON", "provider_api_keys should be JSON type"


def test_provider_factory_returns_openai_client_for_openai():
    """Factory should return OpenAI client for openai provider."""
    from app.services.llm.provider_factory import LLMProviderFactory

    factory = LLMProviderFactory()
    with patch('app.services.llm.provider_factory.OpenAI') as mock_openai:
        mock_openai.return_value = MagicMock()
        client = factory.get_client("openai", "sk-test-key")
        mock_openai.assert_called_once_with(
            api_key="sk-test-key",
            base_url="https://api.openai.com/v1"
        )


def test_provider_factory_returns_openai_client_for_deepseek():
    """Factory should return OpenAI client with DeepSeek base_url."""
    from app.services.llm.provider_factory import LLMProviderFactory

    factory = LLMProviderFactory()
    with patch('app.services.llm.provider_factory.OpenAI') as mock_openai:
        mock_openai.return_value = MagicMock()
        client = factory.get_client("deepseek", "sk-deep-key")
        mock_openai.assert_called_once_with(
            api_key="sk-deep-key",
            base_url="https://api.deepseek.com/v1"
        )


def test_provider_factory_returns_anthropic_adapter():
    """Factory should return AnthropicAdapter for anthropic provider."""
    from app.services.llm.provider_factory import LLMProviderFactory

    factory = LLMProviderFactory()
    with patch('app.services.llm.provider_factory.AnthropicAdapter') as mock_adapter:
        mock_adapter.return_value = MagicMock()
        client = factory.get_client("anthropic", "sk-ant-key")
        mock_adapter.assert_called_once_with("sk-ant-key")
