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
