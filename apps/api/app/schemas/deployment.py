from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from app.models.deployment import DeploymentStatus


class DeploymentBase(BaseModel):
    name: str = Field(..., max_length=255)
    environment: str = Field(..., max_length=255)
    provider: str = Field(..., max_length=50)
    status: DeploymentStatus = DeploymentStatus.HEALTHY


class DeploymentCreate(DeploymentBase):
    pass


class DeploymentRead(DeploymentBase):
    id: UUID
    last_synced_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
