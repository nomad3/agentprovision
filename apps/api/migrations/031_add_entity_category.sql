-- 031_add_entity_category.sql
-- Add category column to knowledge_entities for entity taxonomy

ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Backfill existing entities based on current entity_type
UPDATE knowledge_entities SET category = 'lead'
  WHERE entity_type IN ('organization', 'company', 'prospect', 'ai_company', 'enterprise', 'startup', 'saas_platform');

UPDATE knowledge_entities SET category = 'contact'
  WHERE entity_type IN ('person', 'cto', 'vp_engineering', 'ceo', 'head_of_ai', 'founder');

UPDATE knowledge_entities SET category = 'organization'
  WHERE category IS NULL;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_category ON knowledge_entities (category);
