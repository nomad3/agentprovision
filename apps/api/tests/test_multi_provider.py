"""Tests for multi-provider LLM integration."""
import pytest
from sqlalchemy import inspect


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
