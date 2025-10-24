#!/usr/bin/env bash
# Run an end-to-end demo workflow using the seeded demo credentials.

set -euo pipefail

API_BASE=${API_BASE:-"http://localhost:8000/api/v1"}
TEMPORAL_ADDRESS=${TEMPORAL_ADDRESS:-"temporal:7233"}
DEMO_EMAIL=${DEMO_EMAIL:-"test@example.com"}
DEMO_PASSWORD=${DEMO_PASSWORD:-"password"}
DATASET_NAME=${DATASET_NAME:-"Workflow Demo"}
TASK_QUEUE=${TASK_QUEUE:-"agentprovision-lifeops"}
WORKFLOW_TYPE=${WORKFLOW_TYPE:-"MorningRoutineWorkflow"}
SKIP_WORKFLOW=${SKIP_WORKFLOW:-"false"}
DESCRIBE=${DESCRIBE:-"false"}

log() {
  echo "[run_demo] $1"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd curl
require_cmd jq
require_cmd python3

log "Authenticating demo user $DEMO_EMAIL..."
TOKEN=$(curl -sS -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$DEMO_EMAIL&password=$DEMO_PASSWORD" | jq -r '.access_token')

if [[ "$TOKEN" == "null" || -z "$TOKEN" ]]; then
  echo "Failed to obtain access token." >&2
  exit 1
fi
log "Access token acquired."

log "Ingesting synthetic dataset $DATASET_NAME..."
DATASET_RESPONSE=$(curl -sS -X POST "$API_BASE/datasets/ingest" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'
