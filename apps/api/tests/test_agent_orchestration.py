import pytest
import os

# Set TESTING environment variable BEFORE importing app modules
os.environ["TESTING"] = "True"

from app.models.agent import Agent
from app.models.agent_group import AgentGroup
from app.models.agent_relationship import AgentRelationship
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

def test_agent_relationship_model():
    """Test AgentRelationship model has required fields."""
    assert hasattr(AgentRelationship, 'id')
    assert hasattr(AgentRelationship, 'group_id')
    assert hasattr(AgentRelationship, 'from_agent_id')
    assert hasattr(AgentRelationship, 'to_agent_id')
    assert hasattr(AgentRelationship, 'relationship_type')
    assert hasattr(AgentRelationship, 'trust_level')
    assert hasattr(AgentRelationship, 'communication_style')
    assert hasattr(AgentRelationship, 'handoff_rules')
    assert hasattr(AgentRelationship, 'created_at')

def test_agent_task_model():
    """Test AgentTask model has required fields."""
    from app.models.agent_task import AgentTask

    assert hasattr(AgentTask, 'id')
    assert hasattr(AgentTask, 'group_id')
    assert hasattr(AgentTask, 'assigned_agent_id')
    assert hasattr(AgentTask, 'created_by_agent_id')
    assert hasattr(AgentTask, 'human_requested')
    assert hasattr(AgentTask, 'status')
    assert hasattr(AgentTask, 'priority')
    assert hasattr(AgentTask, 'task_type')
    assert hasattr(AgentTask, 'objective')
    assert hasattr(AgentTask, 'context')
    assert hasattr(AgentTask, 'reasoning')
    assert hasattr(AgentTask, 'output')
    assert hasattr(AgentTask, 'confidence')
    assert hasattr(AgentTask, 'error')
    assert hasattr(AgentTask, 'parent_task_id')
    assert hasattr(AgentTask, 'requires_approval')
    assert hasattr(AgentTask, 'tokens_used')
    assert hasattr(AgentTask, 'cost')
    assert hasattr(AgentTask, 'created_at')
    assert hasattr(AgentTask, 'started_at')
    assert hasattr(AgentTask, 'completed_at')

def test_agent_message_model():
    """Test AgentMessage model has required fields."""
    from app.models.agent_message import AgentMessage

    assert hasattr(AgentMessage, 'id')
    assert hasattr(AgentMessage, 'group_id')
    assert hasattr(AgentMessage, 'task_id')
    assert hasattr(AgentMessage, 'from_agent_id')
    assert hasattr(AgentMessage, 'to_agent_id')
    assert hasattr(AgentMessage, 'message_type')
    assert hasattr(AgentMessage, 'content')
    assert hasattr(AgentMessage, 'reasoning')
    assert hasattr(AgentMessage, 'requires_response')
    assert hasattr(AgentMessage, 'response_deadline')
    assert hasattr(AgentMessage, 'created_at')

def test_agent_skill_model():
    """Test AgentSkill model has required fields."""
    from app.models.agent_skill import AgentSkill

    assert hasattr(AgentSkill, 'id')
    assert hasattr(AgentSkill, 'agent_id')
    assert hasattr(AgentSkill, 'skill_name')
    assert hasattr(AgentSkill, 'proficiency')
    assert hasattr(AgentSkill, 'times_used')
    assert hasattr(AgentSkill, 'success_rate')
    assert hasattr(AgentSkill, 'learned_from')
    assert hasattr(AgentSkill, 'examples')
    assert hasattr(AgentSkill, 'created_at')
    assert hasattr(AgentSkill, 'last_used_at')
