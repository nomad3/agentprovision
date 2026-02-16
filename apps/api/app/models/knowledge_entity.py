"""KnowledgeEntity model for knowledge graph nodes"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, ForeignKey, JSON, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class KnowledgeEntity(Base):
    """Knowledge graph entity - represents a thing, concept, or person."""
    __tablename__ = "knowledge_entities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    # Entity definition
    entity_type = Column(String, nullable=False)  # customer, product, concept, person, organization, location
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)  # Entity description for semantic search
    attributes = Column(JSON, nullable=True)  # Flexible attribute storage
    properties = Column(JSON, nullable=True)  # Structured properties (used by ADK)
    aliases = Column(JSON, default=list)  # Alternative names for the entity

    # Confidence and provenance
    confidence = Column(Float, default=1.0)  # How confident are we in this entity
    source_agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)

    # Entity lifecycle
    status = Column(String(20), default="draft")  # draft, verified, enriched, actioned, archived
    collection_task_id = Column(UUID(as_uuid=True), ForeignKey("agent_tasks.id"), nullable=True)
    source_url = Column(String, nullable=True)
    enrichment_data = Column(JSON, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tenant = relationship("Tenant")
    source_agent = relationship("Agent")
    collection_task = relationship("AgentTask", foreign_keys=[collection_task_id])
