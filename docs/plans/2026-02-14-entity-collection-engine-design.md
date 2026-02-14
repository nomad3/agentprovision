# Entity Collection Engine — Design Document

**Date**: 2026-02-14
**Status**: Draft
**Author**: Claude Opus 4.6 + Human CEO

## Problem

Agents need a generic capability to **build structured databases of entities from any web source** — leads, companies, articles, job listings, competitors — and manage the full lifecycle (collect, qualify, enrich, act) through the orchestration engine. The platform must enforce enterprise-grade guardrails over OpenClaw browser automation and LLM outputs.

## Architecture Decision

**Extend the existing Knowledge Graph.** The `KnowledgeEntity` + `KnowledgeRelation` models already provide tenant-scoped entities with types, attributes, confidence scores, agent provenance, and relationships. No new models needed — we refactor and harden what exists.

## Current State

### What Works
- `KnowledgeEntity`: entity_type, name, attributes (JSON), confidence, source_agent_id
- `KnowledgeRelation`: from/to entity, relation_type, strength, evidence
- `KnowledgeExtractionService`: LLM-based extraction from chat transcripts
- `TaskExecutionWorkflow`: 4-step Temporal pipeline (dispatch → recall → execute → evaluate)
- `SkillRouter`: routes skill calls to tenant's OpenClaw with credential injection
- `ExecutionTrace`: step-by-step audit trail

### What's Missing
1. **No collection workflow** — entities come only from chat extraction, not from agent-driven web scraping
2. **No peekaboo skill** in the registry — browser automation isn't wirable
3. **No entity lifecycle** — no status tracking (draft → verified → enriched → actioned)
4. **No batch operations** — can't create/update entities in bulk from agent output
5. **No guardrails** — no validation, dedup, rate limiting, or content policies on entity creation
6. **No collection tracking** — no way to see "this agent collected 47 entities from LinkedIn in this task"
7. **Knowledge extraction is chat-only** — needs to work with arbitrary content (HTML, scraped text, structured data)

## Design

### 1. Entity Lifecycle Extension

Add `status` and `collection_task_id` to `KnowledgeEntity`:

```
status: draft → verified → enriched → actioned → archived
collection_task_id: FK → agent_tasks.id  (which task created this entity)
```

This connects every entity back to the task that produced it, giving full traceability: CEO sees task → sees 47 entities collected → sees each entity's attributes and relations.

**Migration**: `029_extend_knowledge_entities.sql`
- `ALTER TABLE knowledge_entities ADD COLUMN status VARCHAR DEFAULT 'draft';`
- `ALTER TABLE knowledge_entities ADD COLUMN collection_task_id UUID REFERENCES agent_tasks(id);`
- `ALTER TABLE knowledge_entities ADD COLUMN source_url TEXT;`
- `ALTER TABLE knowledge_entities ADD COLUMN enrichment_data JSON;`
- `CREATE INDEX idx_knowledge_entities_status ON knowledge_entities(status);`
- `CREATE INDEX idx_knowledge_entities_collection_task ON knowledge_entities(collection_task_id);`
- `CREATE INDEX idx_knowledge_entities_type_tenant ON knowledge_entities(entity_type, tenant_id);`

### 2. Peekaboo Skill Registration

Add `peekaboo` to `SKILL_CREDENTIAL_SCHEMAS` in `skill_configs.py`:

```python
"peekaboo": {
    "display_name": "Peekaboo (Browser Automation)",
    "description": "macOS UI automation for web scraping, form filling, and browser interaction — no API keys needed",
    "icon": "FaDesktop",
    "credentials": [],  # No credentials — runs on user's machine via OpenClaw
}
```

Also add `linkedin` as a composite skill that uses peekaboo under the hood:

```python
"linkedin": {
    "display_name": "LinkedIn",
    "description": "LinkedIn prospecting via browser automation — profile scraping, connection requests, messaging",
    "icon": "FaLinkedin",
    "credentials": [
        {"key": "session_cookie", "label": "Session Cookie (li_at)", "type": "password", "required": False},
    ],
}
```

### 3. Entity Collection Activity (New Temporal Activity)

Add a 5th activity to `TaskExecutionWorkflow`: **`persist_entities`**

```
dispatch → recall_memory → execute_task → persist_entities → evaluate
```

The `persist_entities` activity:
1. Parses agent output for structured entity data (JSON array)
2. Validates each entity against schema (required fields, type constraints)
3. Deduplicates against existing entities (name + entity_type + tenant_id)
4. Creates/updates `KnowledgeEntity` records with `collection_task_id`
5. Creates `KnowledgeRelation` records between entities
6. Logs `ExecutionTrace` with `step_type: "entity_persist"`, count, dedup stats
7. Returns: `{"entities_created": N, "entities_updated": M, "relations_created": K, "duplicates_skipped": D}`

### 4. Knowledge Extraction Refactor

Refactor `KnowledgeExtractionService` from chat-only to **universal extraction**:

```python
class KnowledgeExtractionService:
    def extract_from_content(db, content: str, content_type: str,
                            tenant_id, agent_id, task_id,
                            entity_schema: dict = None) -> List[KnowledgeEntity]:
        """
        Extract entities from any content type.

        content_type: "chat_transcript", "html", "structured_json", "plain_text"
        entity_schema: Optional schema to guide extraction (e.g., {"fields": ["name", "email", "company"]})
        """
```

The LLM extraction prompt adapts based on `content_type` and `entity_schema`. When the agent provides a schema (e.g., "I'm collecting SaaS companies with name, CEO, funding, tech stack"), the extraction is guided and consistent.

### 5. Enterprise Guardrails

#### 5.1 Content Validation Policy

New service: `apps/api/app/services/orchestration/entity_validator.py`

```python
class EntityValidator:
    def validate_batch(entities: List[dict], policy: ValidationPolicy) -> ValidationResult:
        """
        Validates entities before persistence.

        Checks:
        - Required fields present (name, entity_type)
        - No PII in restricted fields (configurable)
        - Entity count within rate limits
        - Content passes moderation (no spam, no prohibited content)
        - Dedup check against existing entities
        """
```

#### 5.2 Rate Limiting

Per-tenant, per-skill rate limits (already in `SkillConfig.rate_limit` JSON field):
- `max_entities_per_task`: Max entities a single task can create (default: 500)
- `max_entities_per_hour`: Hourly entity creation limit (default: 1000)
- `max_peekaboo_actions_per_hour`: Browser actions per hour (default: 60, matching OpenClaw's 20/hr LinkedIn limit but configurable)

#### 5.3 OpenClaw Reliability

The `SkillRouter` gets enhanced error handling:
- **Circuit breaker**: If OpenClaw instance fails 3x in 5 minutes, pause and alert
- **Health monitoring**: Periodic health checks via `GET /health` on OpenClaw internal URL
- **Graceful degradation**: If OpenClaw is down, task goes to `waiting_for_retry` instead of `failed`
- **Output validation**: Agent output is validated before entity persistence (no garbage in)

#### 5.4 LLM Output Guardrails

The extraction prompt enforces:
- Structured JSON output with schema validation
- Confidence scores on every entity (low confidence → `draft` status, needs review)
- Source attribution (URL, timestamp) on every entity
- No hallucinated data — entities must come from scraped content, not LLM imagination

### 6. Collection Task Template

A new concept: **Task Templates** — pre-configured task definitions that CEOs can launch with parameters.

Stored in `AgentTask.context` as structured data:

```json
{
  "template": "entity_collection",
  "config": {
    "entity_type": "prospect",
    "entity_schema": {
      "fields": ["name", "title", "company", "email", "linkedin_url", "tech_stack"],
      "required": ["name", "company"]
    },
    "sources": [
      {"type": "linkedin_search", "query": "SaaS CEO Series A Python"},
      {"type": "web_search", "query": "SaaS companies Series A 2025"}
    ],
    "target_count": 50,
    "skills_required": ["peekaboo", "linkedin"],
    "output_dataset": "prospect_pipeline_q1_2026",
    "guardrails": {
      "max_per_source": 30,
      "require_email": false,
      "dedup_on": ["name", "company"]
    }
  }
}
```

No new model — this lives in the existing `AgentTask.context` JSON field.

### 7. Entity Collection API Endpoints

Add to existing knowledge routes (`apps/api/app/api/v1/knowledge.py`):

```
GET  /knowledge/entities?entity_type=prospect&status=verified&task_id=<uuid>
     Filter entities by type, status, collection task

GET  /knowledge/entities/{id}/relations
     Get all relations for an entity

POST /knowledge/entities/bulk
     Bulk create entities (used by persist_entities activity)

PUT  /knowledge/entities/{id}/status
     Update entity status (draft → verified → enriched)

GET  /knowledge/collections/{task_id}/summary
     Collection summary: counts by status, entity types, sources
```

### 8. Frontend: Entity Explorer

Extend the existing pages — no new pages:

- **Task Console**: When viewing a collection task, show entity count badge and inline entity list
- **Memory Page** (rename to "Knowledge"): Add entity type filter tabs, status badges, bulk actions (verify, archive)
- **Agent Detail**: Show "Entities collected by this agent" section

### 9. Data Flow

```
CEO creates task (template: entity_collection)
    ↓
TaskExecutionWorkflow starts (Temporal)
    ↓
1. dispatch_task → selects ProspectorAI agent
    ↓
2. recall_memory → loads relevant past experiences
    ↓
3. execute_task → agent calls SkillRouter
    ↓
   SkillRouter → OpenClaw (peekaboo) → scrapes LinkedIn/web
    ↓
   Agent receives scraped content
    ↓
   Agent formats entities as structured JSON
    ↓
4. persist_entities (NEW) → validates → deduplicates → stores
    ↓
   KnowledgeEntity records created (status: draft)
    ↓
   KnowledgeRelation records created (person → works_at → company)
    ↓
   ExecutionTrace logged (47 entities, 3 dupes skipped)
    ↓
5. evaluate_task → scores quality, stores agent memory
    ↓
CEO reviews in Task Console → sees 47 entities → verifies → launches outreach
```

### 10. What We DON'T Build (YAGNI)

- No separate "Leads" model or CRM features
- No email sending (use Gmail skill via OpenClaw)
- No LinkedIn API integration (peekaboo handles it)
- No custom UI for lead management (entity explorer is generic)
- No vector search on entities (future enhancement)
- No real-time scraping dashboard (trace + polling is enough)

## Implementation Phases

### Phase 1: Foundation (Tasks 1-5)
1. Migration 029: Extend knowledge_entities (status, collection_task_id, source_url, enrichment_data)
2. Update KnowledgeEntity model + schema with new fields
3. Add peekaboo + linkedin to skill registry
4. Refactor KnowledgeExtractionService to universal extraction
5. Add EntityValidator service

### Phase 2: Orchestration (Tasks 6-9)
6. Add persist_entities activity to TaskExecutionWorkflow
7. Enhance SkillRouter with circuit breaker + health monitoring
8. Add LLM output guardrails (schema validation, confidence scoring)
9. Add collection summary endpoint + bulk entity operations

### Phase 3: Frontend + Polish (Tasks 10-12)
10. Task Console: entity count badges + inline entity list for collection tasks
11. Knowledge page: entity type tabs, status filters, bulk actions
12. Agent detail: entities collected section

## Success Criteria

- CEO can create a "collect 50 SaaS prospects" task
- Agent uses peekaboo to scrape, entities land in knowledge graph with full traceability
- Every entity traces back to: which task, which agent, which source URL
- Rate limits prevent runaway scraping
- Content validation prevents garbage entities
- Circuit breaker protects against OpenClaw failures
- Same flow works for any entity type, not just leads
