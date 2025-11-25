"""Pydantic schemas for KnowledgeEntity"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class KnowledgeEntityBase(BaseModel):
    entity_type: str  # customer, product, concept, person, organization, location
    name: str
    attributes: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = 1.0


class KnowledgeEntityCreate(KnowledgeEntityBase):
    source_agent_id: Optional[uuid.UUID] = None


class KnowledgeEntityUpdate(BaseModel):
    name: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None


class KnowledgeEntity(KnowledgeEntityBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    source_agent_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
