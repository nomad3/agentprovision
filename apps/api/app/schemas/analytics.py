from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AnalyticsSummary(BaseModel):
    active_agents: int
    paused_agents: int
    error_agents: int
    monthly_spend: float
    deployment_health: int
    total_deployments: int


class HighlightTenant(BaseModel):
    id: UUID
    name: str
    agent_count: int
    deployment_count: int
    environments: List[str]

    model_config = ConfigDict(from_attributes=True)


class PublicMetrics(BaseModel):
    tenant_count: int
    agent_count: int
    deployment_count: int
    active_agent_count: int
    environment_count: int
    highlight_tenants: List[HighlightTenant]
    integration_catalog: List[str]
    generated_at: datetime
