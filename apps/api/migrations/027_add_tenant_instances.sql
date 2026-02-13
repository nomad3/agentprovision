-- apps/api/migrations/027_add_tenant_instances.sql
CREATE TABLE IF NOT EXISTS tenant_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    instance_type VARCHAR NOT NULL DEFAULT 'openclaw',
    version VARCHAR,
    status VARCHAR DEFAULT 'provisioning',
    internal_url VARCHAR,
    helm_release VARCHAR,
    k8s_namespace VARCHAR DEFAULT 'prod',
    resource_config JSONB,
    health JSONB,
    error VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenant_instances_tenant_id ON tenant_instances(tenant_id);
CREATE UNIQUE INDEX idx_tenant_instances_helm_release ON tenant_instances(helm_release);
