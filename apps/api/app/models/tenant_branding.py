"""TenantBranding model for whitelabel customization."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, JSON, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class TenantBranding(Base):
    """Tenant branding and whitelabel configuration."""
    __tablename__ = "tenant_branding"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), unique=True, nullable=False)

    # Brand Identity
    company_name = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    logo_dark_url = Column(String, nullable=True)
    favicon_url = Column(String, nullable=True)
    support_email = Column(String, nullable=True)

    # Colors
    primary_color = Column(String, default="#6366f1")  # Indigo
    secondary_color = Column(String, default="#8b5cf6")  # Purple
    accent_color = Column(String, default="#06b6d4")  # Cyan
    background_color = Column(String, default="#0f172a")  # Slate 900
    sidebar_bg = Column(String, default="#1e293b")  # Slate 800

    # AI Customization
    ai_assistant_name = Column(String, default="AI Assistant")
    ai_assistant_persona = Column(JSON, nullable=True)  # personality, tone, style

    # Domain
    custom_domain = Column(String, nullable=True, unique=True)
    domain_verified = Column(Boolean, default=False)
    ssl_certificate_id = Column(String, nullable=True)

    # Industry
    industry = Column(String, nullable=True)  # healthcare, finance, legal, retail
    compliance_mode = Column(JSON, nullable=True)  # ["hipaa", "sox", "gdpr"]

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<TenantBranding {self.company_name or self.tenant_id}>"
