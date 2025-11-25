import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)

    # Default LLM configuration for this tenant
    default_llm_config_id = Column(UUID(as_uuid=True), ForeignKey("llm_configs.id"), nullable=True)

    # Relationships
    users = relationship("User", back_populates="tenant")
    branding = relationship("TenantBranding", uselist=False, back_populates="tenant")
    features = relationship("TenantFeatures", uselist=False, back_populates="tenant")
    default_llm_config = relationship("LLMConfig", foreign_keys=[default_llm_config_id])
