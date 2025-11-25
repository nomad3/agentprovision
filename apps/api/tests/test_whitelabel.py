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
