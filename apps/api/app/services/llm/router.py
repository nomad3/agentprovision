"""LLM Router for smart model selection."""
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.models.llm_config import LLMConfig
from app.models.llm_model import LLMModel


class LLMRouter:
    """Routes requests to optimal LLM based on task requirements."""

    def __init__(self, db: Session):
        self.db = db

    def select_model(
        self,
        tenant_id: uuid.UUID,
        task_type: str = None,
        priority: str = "balanced",  # cost, speed, quality, balanced
        config_id: uuid.UUID = None
    ) -> LLMModel:
        """
        Select best model for task based on configuration and routing rules.

        Args:
            tenant_id: Tenant ID
            task_type: Type of task (e.g., "coding", "creative", "analysis")
            priority: Optimization priority
            config_id: Optional specific config ID

        Returns:
            Selected LLMModel
        """
        # Get tenant config
        if config_id:
            config = self.db.query(LLMConfig).filter(LLMConfig.id == config_id).first()
        else:
            config = self.db.query(LLMConfig).filter(
                LLMConfig.tenant_id == tenant_id,
                LLMConfig.is_tenant_default
            ).first()

        if not config:
            # Fallback if no config found (should not happen in prod)
            raise ValueError("No LLM config found for tenant")

        # Apply routing rules if defined
        if config.routing_rules and task_type:
            rule = config.routing_rules.get(task_type)
            if rule and "model_id" in rule:
                model = self.db.query(LLMModel).filter(
                    LLMModel.id == rule["model_id"]
                ).first()
                if model and model.is_active:
                    return model

        # Default to primary model
        if config.primary_model and config.primary_model.is_active:
            return config.primary_model

        # Fallback to secondary model
        if config.fallback_model and config.fallback_model.is_active:
            return config.fallback_model

        raise ValueError("No active model available in configuration")

    def estimate_cost(self, model: LLMModel, input_tokens: int, output_tokens: int) -> float:
        """Estimate cost for token usage."""
        input_cost = (input_tokens / 1000) * float(model.input_cost_per_1k)
        output_cost = (output_tokens / 1000) * float(model.output_cost_per_1k)
        return input_cost + output_cost

    def get_tenant_config(self, tenant_id: uuid.UUID) -> Optional[LLMConfig]:
        """Get tenant's default LLM configuration."""
        from app.models.tenant import Tenant
        tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if tenant and tenant.default_llm_config_id:
            return self.db.query(LLMConfig).filter(
                LLMConfig.id == tenant.default_llm_config_id
            ).first()
        return None

    def track_usage(
        self,
        tenant_id: uuid.UUID,
        model_id: uuid.UUID,
        tokens_input: int,
        tokens_output: int,
        cost: float,
    ) -> None:
        """Track LLM usage for analytics."""
        from app.models.tenant_analytics import TenantAnalytics
        from datetime import datetime

        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        # Update or create daily analytics
        analytics = self.db.query(TenantAnalytics).filter(
            TenantAnalytics.tenant_id == tenant_id,
            TenantAnalytics.period == "daily",
            TenantAnalytics.period_start == today,
        ).first()

        if analytics:
            analytics.total_tokens_used = (analytics.total_tokens_used or 0) + tokens_input + tokens_output
            analytics.total_cost = (analytics.total_cost or 0) + cost
        else:
            analytics = TenantAnalytics(
                tenant_id=tenant_id,
                period="daily",
                period_start=today,
                total_tokens_used=tokens_input + tokens_output,
                total_cost=cost,
            )
            self.db.add(analytics)

        self.db.commit()
