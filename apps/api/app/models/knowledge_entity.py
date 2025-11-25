"""KnowledgeEntity model for knowledge graph nodes"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, JSON, DateTime, Float
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
    attributes = Column(JSON, nullable=True)  # Flexible attribute storage

    # Confidence and provenance
    confidence = Column(Float, default=1.0)  # How confident are we in this entity
    source_agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tenant = relationship("Tenant")
    source_agent = relationship("Agent")
