CREATE TABLE IF NOT EXISTS execution_traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES agent_tasks(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    step_type VARCHAR NOT NULL,
    step_order INTEGER NOT NULL,
    agent_id UUID REFERENCES agents(id),
    details JSONB,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_execution_traces_task_id ON execution_traces(task_id);
CREATE INDEX idx_execution_traces_tenant_id ON execution_traces(tenant_id);
CREATE INDEX idx_execution_traces_step_type ON execution_traces(step_type);
