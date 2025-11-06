#!/bin/bash
# Start Temporal worker for Databricks synchronization

cd "$(dirname "$0")/../apps/api"

echo "Starting Databricks Temporal worker..."
python -m app.workers.databricks_worker
