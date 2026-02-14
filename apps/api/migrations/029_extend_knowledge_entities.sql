-- Migration 029: Extend knowledge_entities for entity collection engine
-- Adds: status lifecycle, collection task traceability, source tracking, enrichment data

ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS collection_task_id UUID REFERENCES agent_tasks(id);
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS enrichment_data JSON;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_status ON knowledge_entities(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_collection_task ON knowledge_entities(collection_task_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_type_tenant ON knowledge_entities(entity_type, tenant_id);

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'knowledge_entities' AND column_name IN ('status', 'collection_task_id', 'source_url', 'enrichment_data');
