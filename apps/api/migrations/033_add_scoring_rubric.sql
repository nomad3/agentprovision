-- Add scoring_rubric JSONB column to agent_kits table
ALTER TABLE agent_kits ADD COLUMN IF NOT EXISTS scoring_rubric JSONB;

-- Add scoring_rubric_id to track which rubric was used for a score
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS scoring_rubric_id VARCHAR(50);
