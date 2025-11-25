import pytest
import os

# Set TESTING environment variable BEFORE importing app modules
os.environ["TESTING"] = "True"

from app.models.agent import Agent
from app.models.agent_group import AgentGroup
from app.schemas import agent as agent_schema

def test_agent_model_has_orchestration_fields():
    """Test that Agent model has new orchestration fields"""
    # Verify orchestration fields exist on the model class
    assert hasattr(Agent, 'role'), "Agent model should have 'role' field"
    assert hasattr(Agent, 'capabilities'), "Agent model should have 'capabilities' field"
    assert hasattr(Agent, 'personality'), "Agent model should have 'personality' field"
    assert hasattr(Agent, 'autonomy_level'), "Agent model should have 'autonomy_level' field"
    assert hasattr(Agent, 'max_delegation_depth'), "Agent model should have 'max_delegation_depth' field"

def test_agent_schema_has_orchestration_fields():
    """Test that Agent schemas include orchestration fields"""
    # Test AgentBase schema
    assert 'role' in agent_schema.AgentBase.model_fields, "AgentBase should have 'role' field"
    assert 'capabilities' in agent_schema.AgentBase.model_fields, "AgentBase should have 'capabilities' field"
    assert 'personality' in agent_schema.AgentBase.model_fields, "AgentBase should have 'personality' field"
    assert 'autonomy_level' in agent_schema.AgentBase.model_fields, "AgentBase should have 'autonomy_level' field"
    assert 'max_delegation_depth' in agent_schema.AgentBase.model_fields, "AgentBase should have 'max_delegation_depth' field"

    # Test that AgentCreate inherits these fields
    assert 'role' in agent_schema.AgentCreate.model_fields, "AgentCreate should have 'role' field"
    assert 'capabilities' in agent_schema.AgentCreate.model_fields, "AgentCreate should have 'capabilities' field"

    # Test that Agent response schema has these fields
    assert 'role' in agent_schema.Agent.model_fields, "Agent response schema should have 'role' field"
    assert 'capabilities' in agent_schema.Agent.model_fields, "Agent response schema should have 'capabilities' field"

def test_create_agent_schema_with_orchestration_fields():
    """Test that AgentCreate schema can be instantiated with orchestration fields"""
    agent_data = {
        "name": "Analyst Agent",
        "description": "Data analysis agent with orchestration capabilities",
        "config": {"llm_model": "claude-3-5-sonnet-20241022"},
        "role": "analyst",
        "capabilities": ["data_analysis", "sql_query", "report_generation"],
        "personality": {
            "tone": "professional",
            "verbosity": "concise",
            "formality": "formal"
        },
        "autonomy_level": "supervised",
        "max_delegation_depth": 3
    }

    # This should not raise an error
    agent_create = agent_schema.AgentCreate(**agent_data)

    # Verify values
    assert agent_create.role == "analyst"
    assert agent_create.capabilities == ["data_analysis", "sql_query", "report_generation"]
    assert agent_create.personality["tone"] == "professional"
    assert agent_create.autonomy_level == "supervised"
    assert agent_create.max_delegation_depth == 3

def test_agent_schema_default_values():
    """Test that orchestration fields have proper default values"""
    minimal_agent_data = {
        "name": "Basic Agent",
        "description": "Agent without orchestration fields",
        "config": {"llm_model": "claude-3-5-sonnet-20241022"}
    }

    agent_create = agent_schema.AgentCreate(**minimal_agent_data)

    # Verify defaults
    assert agent_create.autonomy_level == "supervised"
    assert agent_create.max_delegation_depth == 2
    assert agent_create.role is None
    assert agent_create.capabilities is None
    assert agent_create.personality is None

def test_agent_group_model():
    """Test AgentGroup model has required fields."""
    # Check model has all required attributes
    assert hasattr(AgentGroup, 'id')
    assert hasattr(AgentGroup, 'name')
    assert hasattr(AgentGroup, 'description')
    assert hasattr(AgentGroup, 'tenant_id')
    assert hasattr(AgentGroup, 'goal')
    assert hasattr(AgentGroup, 'strategy')
    assert hasattr(AgentGroup, 'shared_context')
    assert hasattr(AgentGroup, 'escalation_rules')
    assert hasattr(AgentGroup, 'created_at')
    assert hasattr(AgentGroup, 'updated_at')
