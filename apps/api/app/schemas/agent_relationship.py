from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class AgentRelationshipBase(BaseModel):
    from_agent_id: uuid.UUID
    to_agent_id: uuid.UUID
    relationship_type: str  # "supervises", "delegates_to", "collaborates_with", "reports_to", "consults"
    trust_level: Optional[float] = 0.5
    communication_style: Optional[str] = "async"
    handoff_rules: Optional[Dict[str, Any]] = None


class AgentRelationshipCreate(AgentRelationshipBase):
    group_id: uuid.UUID


class AgentRelationshipUpdate(BaseModel):
    relationship_type: Optional[str] = None
    trust_level: Optional[float] = None
    communication_style: Optional[str] = None
    handoff_rules: Optional[Dict[str, Any]] = None


class AgentRelationship(AgentRelationshipBase):
    id: uuid.UUID
    group_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
