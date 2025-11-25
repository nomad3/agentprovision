"""Tests for Phase 3: Multi-LLM System."""
import pytest
import os

os.environ["TESTING"] = "True"


def test_llm_provider_model():
    """Test LLMProvider model has required fields."""
    from app.models.llm_provider import LLMProvider

    assert hasattr(LLMProvider, 'id')
    assert hasattr(LLMProvider, 'name')
    assert hasattr(LLMProvider, 'display_name')
    assert hasattr(LLMProvider, 'base_url')
    assert hasattr(LLMProvider, 'auth_type')
    assert hasattr(LLMProvider, 'supported_features')
    assert hasattr(LLMProvider, 'is_active')


def test_llm_model_model():
    """Test LLMModel has required fields."""
    from app.models.llm_model import LLMModel

    assert hasattr(LLMModel, 'id')
    assert hasattr(LLMModel, 'provider_id')
    assert hasattr(LLMModel, 'model_id')
    assert hasattr(LLMModel, 'display_name')
    assert hasattr(LLMModel, 'context_window')
    assert hasattr(LLMModel, 'input_cost_per_1k')
    assert hasattr(LLMModel, 'output_cost_per_1k')
    assert hasattr(LLMModel, 'speed_tier')
    assert hasattr(LLMModel, 'quality_tier')
    assert hasattr(LLMModel, 'is_active')


def test_llm_config_model():
    """Test LLMConfig has required fields."""
    from app.models.llm_config import LLMConfig

    assert hasattr(LLMConfig, 'id')
    assert hasattr(LLMConfig, 'tenant_id')
    assert hasattr(LLMConfig, 'name')
    assert hasattr(LLMConfig, 'is_tenant_default')
    assert hasattr(LLMConfig, 'primary_model_id')
    assert hasattr(LLMConfig, 'fallback_model_id')
    assert hasattr(LLMConfig, 'api_key_encrypted')
    assert hasattr(LLMConfig, 'use_platform_key')
    assert hasattr(LLMConfig, 'temperature')
    assert hasattr(LLMConfig, 'max_tokens')
    assert hasattr(LLMConfig, 'routing_rules')
    assert hasattr(LLMConfig, 'budget_limit_daily')
