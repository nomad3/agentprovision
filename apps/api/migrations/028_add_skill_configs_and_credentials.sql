-- Migration 028: Add skill_configs and skill_credentials tables
-- Part of Enterprise Orchestration Engine Phase 3

-- Skill configurations per tenant
CREATE TABLE IF NOT EXISTS skill_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    instance_id UUID REFERENCES tenant_instances(id),
    skill_name VARCHAR NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    rate_limit JSONB,
    allowed_scopes JSONB,
    llm_config_id UUID REFERENCES llm_configs(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_configs_tenant_id ON skill_configs(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_configs_tenant_skill ON skill_configs(tenant_id, skill_name);

-- Encrypted credential storage for skills
CREATE TABLE IF NOT EXISTS skill_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    skill_config_id UUID NOT NULL REFERENCES skill_configs(id),
    credential_key VARCHAR NOT NULL,
    encrypted_value VARCHAR NOT NULL,
    credential_type VARCHAR DEFAULT 'api_key',
    status VARCHAR DEFAULT 'active',
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_credentials_tenant_id ON skill_credentials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_skill_credentials_skill_config_id ON skill_credentials(skill_config_id);
