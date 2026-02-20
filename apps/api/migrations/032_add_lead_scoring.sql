-- 032_add_lead_scoring.sql
-- Add lead scoring columns to knowledge_entities
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS score INTEGER;
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS scored_at TIMESTAMP;
