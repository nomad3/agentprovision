"""Pydantic schemas for KnowledgeRelation"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class KnowledgeRelationBase(BaseModel):
    from_entity_id: uuid.UUID
    to_entity_id: uuid.UUID
    relation_type: str  # works_at, purchased, prefers, related_to, knows, owns
    strength: Optional[float] = 1.0
    evidence: Optional[Dict[str, Any]] = None


class KnowledgeRelationCreate(KnowledgeRelationBase):
    discovered_by_agent_id: Optional[uuid.UUID] = None


class KnowledgeRelationUpdate(BaseModel):
    strength: Optional[float] = None
    evidence: Optional[Dict[str, Any]] = None


class KnowledgeRelation(KnowledgeRelationBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    discovered_by_agent_id: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True
