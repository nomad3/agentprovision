from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid


class AgentGroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    goal: Optional[str] = None
    strategy: Optional[Dict[str, Any]] = None
    shared_context: Optional[Dict[str, Any]] = None
    escalation_rules: Optional[Dict[str, Any]] = None


class AgentGroupCreate(AgentGroupBase):
    pass


class AgentGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    goal: Optional[str] = None
    strategy: Optional[Dict[str, Any]] = None
    shared_context: Optional[Dict[str, Any]] = None
    escalation_rules: Optional[Dict[str, Any]] = None


class AgentGroup(AgentGroupBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentGroupWithMembers(AgentGroup):
    """AgentGroup with member agents included."""
    members: List[dict] = []
