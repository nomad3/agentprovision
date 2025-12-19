-- Update connectors table with new fields for automation support

-- Add type column
ALTER TABLE connectors ADD COLUMN IF NOT EXISTS type VARCHAR;
CREATE INDEX IF NOT EXISTS idx_connectors_type ON connectors(type);

-- Add status column
ALTER TABLE connectors ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending';

-- Add last_test_at column
ALTER TABLE connectors ADD COLUMN IF NOT EXISTS last_test_at TIMESTAMP WITHOUT TIME ZONE;

-- Add last_test_error column
ALTER TABLE connectors ADD COLUMN IF NOT EXISTS last_test_error TEXT;

-- Update existing records to have a default type if needed (optional)
-- UPDATE connectors SET type = 'snowflake' WHERE type IS NULL;
