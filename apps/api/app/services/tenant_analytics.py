"""Tenant analytics service for usage tracking."""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, timedelta
import uuid

from app.models.tenant_analytics import TenantAnalytics
from app.models.chat import ChatMessage, ChatSession
from app.models.agent import Agent
from app.models.agent_task import AgentTask
from app.schemas.tenant_analytics import TenantAnalyticsCreate, TenantAnalyticsSummary


def get_analytics(
    db: Session,
    tenant_id: uuid.UUID,
    period: str,
    period_start: datetime
) -> Optional[TenantAnalytics]:
    """Get analytics for a specific period."""
    return db.query(TenantAnalytics).filter(
        TenantAnalytics.tenant_id == tenant_id,
        TenantAnalytics.period == period,
        TenantAnalytics.period_start == period_start
    ).first()


def get_analytics_history(
    db: Session,
    tenant_id: uuid.UUID,
    period: str = "daily",
    limit: int = 30
) -> List[TenantAnalytics]:
    """Get analytics history for a tenant."""
    return db.query(TenantAnalytics).filter(
        TenantAnalytics.tenant_id == tenant_id,
        TenantAnalytics.period == period
    ).order_by(TenantAnalytics.period_start.desc()).limit(limit).all()


def create_analytics(
    db: Session,
    tenant_id: uuid.UUID,
    analytics_in: TenantAnalyticsCreate
) -> TenantAnalytics:
    """Create analytics record."""
    analytics = TenantAnalytics(
        tenant_id=tenant_id,
        **analytics_in.model_dump()
    )
    db.add(analytics)
    db.commit()
    db.refresh(analytics)
    return analytics


def calculate_period_analytics(
    db: Session,
    tenant_id: uuid.UUID,
    period: str,
    period_start: datetime
) -> TenantAnalytics:
    """Calculate analytics for a period."""
    if period == "daily":
        period_end = period_start + timedelta(days=1)
    elif period == "weekly":
        period_end = period_start + timedelta(weeks=1)
    elif period == "monthly":
        period_end = period_start + timedelta(days=30)
    else:  # hourly
        period_end = period_start + timedelta(hours=1)

    # Count messages in period, filtered by tenant via ChatSession
    total_messages = db.query(func.count(ChatMessage.id)).join(
        ChatSession, ChatMessage.session_id == ChatSession.id
    ).filter(
        ChatSession.tenant_id == tenant_id,
        ChatMessage.created_at >= period_start,
        ChatMessage.created_at < period_end
    ).scalar() or 0

    # Count tasks, filtered by tenant via Agent
    total_tasks = db.query(func.count(AgentTask.id)).join(
        Agent, AgentTask.assigned_agent_id == Agent.id
    ).filter(
        Agent.tenant_id == tenant_id,
        AgentTask.created_at >= period_start,
        AgentTask.created_at < period_end
    ).scalar() or 0

    analytics_data = TenantAnalyticsCreate(
        period=period,
        period_start=period_start,
        total_messages=total_messages,
        total_tasks=total_tasks,
        total_tokens_used=0,  # Would calculate from usage tracking
        total_cost=0.0,
    )

    # Check if exists and update, or create new
    existing = get_analytics(db, tenant_id, period, period_start)
    if existing:
        for field, value in analytics_data.model_dump().items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing

    return create_analytics(db, tenant_id, analytics_data)


def get_analytics_summary(
    db: Session,
    tenant_id: uuid.UUID
) -> TenantAnalyticsSummary:
    """Get analytics summary for dashboard."""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday = today - timedelta(days=1)

    current = get_analytics(db, tenant_id, "daily", today)
    previous = get_analytics(db, tenant_id, "daily", yesterday)

    return TenantAnalyticsSummary(
        current_period=current,
        previous_period=previous,
        token_usage_percentage=0.0,  # Would calculate from features
        storage_usage_percentage=0.0,
        top_agents=[],
        recent_insights=[]
    )
