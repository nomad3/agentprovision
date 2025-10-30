# Database Migrations

This directory contains SQL migration scripts for the AgentProvision database.

## Running Migrations

### Manual Execution

```bash
# Connect to database
docker exec -i agentprovision-db-1 psql -U postgres -d agentprovision < migrations/001_add_databricks_metadata.sql

# Verify
docker exec agentprovision-db-1 psql -U postgres -d agentprovision -c "\d datasets"
```

### Via Python Script

```bash
cd apps/api
python -c "
import asyncio
import asyncpg
import os

async def run_migration():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL').replace('+asyncpg', ''))

    with open('../../migrations/001_add_databricks_metadata.sql', 'r') as f:
        sql = f.read()

    await conn.execute(sql)
    print('Migration completed successfully')
    await conn.close()

asyncio.run(run_migration())
"
```

## Migration Files

- `001_add_databricks_metadata.sql` - Adds metadata_ JSONB column to all Databricks-integrated tables

## Rollback

If you need to rollback the metadata columns:

```sql
-- Remove columns
ALTER TABLE datasets DROP COLUMN IF EXISTS metadata_;
ALTER TABLE notebooks DROP COLUMN IF EXISTS metadata_;
ALTER TABLE data_pipelines DROP COLUMN IF EXISTS metadata_;
ALTER TABLE agents DROP COLUMN IF EXISTS metadata_;
ALTER TABLE vector_stores DROP COLUMN IF EXISTS metadata_;
ALTER TABLE deployments DROP COLUMN IF EXISTS metadata_;

-- Drop indexes
DROP INDEX IF EXISTS idx_datasets_metadata;
DROP INDEX IF EXISTS idx_notebooks_metadata;
DROP INDEX IF EXISTS idx_data_pipelines_metadata;
DROP INDEX IF EXISTS idx_agents_metadata;
DROP INDEX IF EXISTS idx_vector_stores_metadata;
DROP INDEX IF EXISTS idx_deployments_metadata;
```
