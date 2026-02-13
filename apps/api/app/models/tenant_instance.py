import uuid
from sqlalchemy import Column, String, ForeignKey, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base


class TenantInstance(Base):
    __tablename__ = "tenant_instances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    instance_type = Column(String, nullable=False, default="openclaw")  # extensible
    version = Column(String, nullable=True)
    status = Column(String, default="provisioning")  # provisioning, running, stopped, upgrading, error, destroying
    internal_url = Column(String, nullable=True)
    helm_release = Column(String, nullable=True)
    k8s_namespace = Column(String, default="prod")
    resource_config = Column(JSON, nullable=True)  # {cpu_request, cpu_limit, memory_request, memory_limit, storage}
    health = Column(JSON, nullable=True)  # {last_check, healthy, uptime, cpu_pct, memory_pct}
    error = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant")
