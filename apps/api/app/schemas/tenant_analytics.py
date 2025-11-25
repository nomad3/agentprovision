"""Pydantic schemas for TenantAnalytics."""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid


class TenantAnalyticsBase(BaseModel):
    period: str  # hourly, daily, weekly, monthly
    period_start: datetime
    total_messages: int = 0
    total_tasks: int = 0
    total_tokens_used: int = 0
    total_cost: float = 0.0
    active_agents: int = 0
    tasks_completed: int = 0
    tasks_failed: int = 0
    avg_task_duration_seconds: Optional[float] = None
    ai_insights: Optional[Dict[str, Any]] = None
    ai_recommendations: Optional[List[str]] = None
    ai_forecast: Optional[Dict[str, Any]] = None


class TenantAnalyticsCreate(TenantAnalyticsBase):
    pass


class TenantAnalytics(TenantAnalyticsBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class TenantAnalyticsSummary(BaseModel):
    """Summary of tenant analytics for dashboard."""
    current_period: Optional[TenantAnalytics] = None
    previous_period: Optional[TenantAnalytics] = None
    token_usage_percentage: float = 0.0
    storage_usage_percentage: float = 0.0
    top_agents: List[Dict[str, Any]] = []
    recent_insights: List[str] = []
