"""Tests for Phase 4: Whitelabel System."""
import pytest
import os

os.environ["TESTING"] = "True"


def test_tenant_branding_model():
    """Test TenantBranding model has required fields."""
    from app.models.tenant_branding import TenantBranding

    assert hasattr(TenantBranding, 'id')
    assert hasattr(TenantBranding, 'tenant_id')
    assert hasattr(TenantBranding, 'company_name')
    assert hasattr(TenantBranding, 'logo_url')
    assert hasattr(TenantBranding, 'logo_dark_url')
    assert hasattr(TenantBranding, 'favicon_url')
    assert hasattr(TenantBranding, 'support_email')
    assert hasattr(TenantBranding, 'primary_color')
    assert hasattr(TenantBranding, 'secondary_color')
    assert hasattr(TenantBranding, 'accent_color')
    assert hasattr(TenantBranding, 'background_color')
    assert hasattr(TenantBranding, 'sidebar_bg')
    assert hasattr(TenantBranding, 'ai_assistant_name')
    assert hasattr(TenantBranding, 'ai_assistant_persona')
    assert hasattr(TenantBranding, 'custom_domain')
    assert hasattr(TenantBranding, 'domain_verified')
    assert hasattr(TenantBranding, 'industry')
    assert hasattr(TenantBranding, 'compliance_mode')


def test_tenant_features_model():
    """Test TenantFeatures model has required fields."""
    from app.models.tenant_features import TenantFeatures

    assert hasattr(TenantFeatures, 'id')
    assert hasattr(TenantFeatures, 'tenant_id')
    # Core Features
    assert hasattr(TenantFeatures, 'agents_enabled')
    assert hasattr(TenantFeatures, 'agent_groups_enabled')
    assert hasattr(TenantFeatures, 'datasets_enabled')
    assert hasattr(TenantFeatures, 'chat_enabled')
    assert hasattr(TenantFeatures, 'multi_llm_enabled')
    assert hasattr(TenantFeatures, 'agent_memory_enabled')
    # AI Intelligence
    assert hasattr(TenantFeatures, 'ai_insights_enabled')
    assert hasattr(TenantFeatures, 'ai_recommendations_enabled')
    assert hasattr(TenantFeatures, 'ai_anomaly_detection')
    # Limits
    assert hasattr(TenantFeatures, 'max_agents')
    assert hasattr(TenantFeatures, 'max_agent_groups')
    assert hasattr(TenantFeatures, 'monthly_token_limit')
    assert hasattr(TenantFeatures, 'storage_limit_gb')
    # UI
    assert hasattr(TenantFeatures, 'hide_agentprovision_branding')
    assert hasattr(TenantFeatures, 'plan_type')


def test_tenant_analytics_model():
    """Test TenantAnalytics model has required fields."""
    from app.models.tenant_analytics import TenantAnalytics

    assert hasattr(TenantAnalytics, 'id')
    assert hasattr(TenantAnalytics, 'tenant_id')
    assert hasattr(TenantAnalytics, 'period')
    assert hasattr(TenantAnalytics, 'period_start')
    # Usage Metrics
    assert hasattr(TenantAnalytics, 'total_messages')
    assert hasattr(TenantAnalytics, 'total_tasks')
    assert hasattr(TenantAnalytics, 'total_tokens_used')
    assert hasattr(TenantAnalytics, 'total_cost')
    # AI-Generated
    assert hasattr(TenantAnalytics, 'ai_insights')
    assert hasattr(TenantAnalytics, 'ai_recommendations')
    assert hasattr(TenantAnalytics, 'ai_forecast')


def test_branding_api_routes():
    """Test branding API routes exist."""
    from app.api.v1 import branding

    assert hasattr(branding, 'router')
    assert hasattr(branding, 'get_branding')
    assert hasattr(branding, 'update_branding')


def test_features_api_routes():
    """Test features API routes exist."""
    from app.api.v1 import features

    assert hasattr(features, 'router')
    assert hasattr(features, 'get_features')
    assert hasattr(features, 'check_feature')
