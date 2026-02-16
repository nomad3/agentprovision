-- Migration 030: Add description, properties, aliases to knowledge_entities
-- and create supporting tables required by ADK knowledge_graph service

ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS properties JSON;
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS aliases JSON DEFAULT '[]';

-- Knowledge observations table (used by ADK for recording facts from conversations)
CREATE TABLE IF NOT EXISTS knowledge_observations (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR NOT NULL,
    observation_text TEXT NOT NULL,
    observation_type VARCHAR(50) DEFAULT 'fact',
    source_type VARCHAR(50) DEFAULT 'conversation',
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge entity history table (used by ADK for entity version tracking)
CREATE TABLE IF NOT EXISTS knowledge_entity_history (
    id SERIAL PRIMARY KEY,
    entity_id UUID NOT NULL,
    version INTEGER DEFAULT 1,
    properties_snapshot JSON,
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'knowledge_entities' AND column_name IN ('description', 'properties', 'aliases');
