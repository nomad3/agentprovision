-- Migration 030: Add description, properties, and aliases to knowledge_entities
-- Required by ADK knowledge_graph service for entity creation and semantic search

ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS properties JSON;
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS aliases JSON DEFAULT '[]';

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'knowledge_entities' AND column_name IN ('description', 'properties', 'aliases');
