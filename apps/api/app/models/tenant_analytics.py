"""TenantAnalytics model for usage tracking and AI insights."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class TenantAnalytics(Base):
    """Tenant usage analytics and AI-generated insights."""
    __tablename__ = "tenant_analytics"
    __table_args__ = (
        UniqueConstraint('tenant_id', 'period', 'period_start', name='uq_tenant_analytics_period'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    period = Column(String, nullable=False)  # hourly, daily, weekly, monthly
    period_start = Column(DateTime, nullable=False, index=True)

    # Usage Metrics
    total_messages = Column(Integer, default=0)
    total_tasks = Column(Integer, default=0)
    total_tokens_used = Column(Integer, default=0)
    total_cost = Column(Float, default=0.0)

    # Agent Metrics
    active_agents = Column(Integer, default=0)
    tasks_completed = Column(Integer, default=0)
    tasks_failed = Column(Integer, default=0)
    avg_task_duration_seconds = Column(Float, nullable=True)

    # AI-Generated Insights
    ai_insights = Column(JSON, nullable=True)  # Key findings from the period
    ai_recommendations = Column(JSON, nullable=True)  # Suggested improvements
    ai_forecast = Column(JSON, nullable=True)  # Predicted usage trends

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<TenantAnalytics {self.tenant_id} {self.period} {self.period_start}>"
