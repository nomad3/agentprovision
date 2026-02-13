from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime
import uuid

# Supported instance types
InstanceType = Literal["openclaw"]

# Instance status values
InstanceStatus = Literal["provisioning", "running", "stopped", "upgrading", "error", "destroying"]


class TenantInstanceBase(BaseModel):
    instance_type: InstanceType = "openclaw"
    version: Optional[str] = None
    k8s_namespace: str = "prod"
    resource_config: Optional[dict] = None


class TenantInstanceCreate(TenantInstanceBase):
    pass


class TenantInstanceUpdate(BaseModel):
    version: Optional[str] = None
    resource_config: Optional[dict] = None


class TenantInstance(TenantInstanceBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    status: InstanceStatus = "provisioning"
    internal_url: Optional[str] = None
    helm_release: Optional[str] = None
    health: Optional[dict] = None
    error: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True
