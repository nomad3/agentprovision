# Lead Scoring Skill Design

**Goal:** Replace signal entities with an LLM-powered scoring skill that computes a composite 0-100 score for lead entities.

**Architecture:** A new `LeadScoringTool` follows the existing Tool base class pattern. It loads an entity's context (properties, relations, enrichment data), sends it to an LLM with a scoring rubric, and writes the result back to the entity. Agents stop creating signal entities; raw intelligence goes into entity properties instead.

**Tech Stack:** Python (FastAPI, SQLAlchemy), LLM via existing multi-provider router, ADK FunctionTool, React Bootstrap UI

---

## Data Model Changes

### Add to `knowledge_entities` table
- `score` — Integer, nullable, 0-100. Composite lead score.
- `scored_at` — DateTime, nullable. When the entity was last scored.

### Entity properties JSON (post-scoring)
```json
{
  "score_breakdown": {
    "hiring": 25,
    "tech_stack": 20,
    "funding": 15,
    "company_size": 10,
    "news": 0
  },
  "score_reasoning": "Hiring 3 AI engineers, uses LangChain, Series A 4 months ago..."
}
```

### Remove from system
- Stop creating entities with `category='signal'`
- Clean up existing signal entities: extract useful data into parent entity properties, delete signal entities and `has_signal` relations
- Remove `signal` from category filter in UI

---

## API Tool: LeadScoringTool

New tool in `apps/api/app/services/tool_executor.py` following the `Tool` base class.

### Schema
- **Input:** `entity_id` (UUID) or `entity_name` (string)
- **Output:** `ToolResult` with score, breakdown, reasoning

### Flow
1. Load entity + all relations + related entities from knowledge graph
2. Build LLM prompt with entity context (name, description, properties, source_url, enrichment_data, related entities)
3. LLM returns structured JSON: `{score, breakdown, reasoning}`
4. Write `score` and `scored_at` to entity row
5. Write `score_breakdown` and `score_reasoning` into entity `properties`
6. Return result to caller

### Scoring Rubric (0-100)
| Signal Category | Max Points | Description |
|---|---|---|
| Hiring signals | 25 | Job posts mentioning AI/ML/agents/orchestration |
| Tech stack alignment | 20 | Uses LangChain, OpenAI, Anthropic, competing tools |
| Funding recency | 20 | Recent raise = higher score |
| Company size/stage fit | 15 | Mid-market and growth-stage companies score higher |
| News/momentum | 10 | Launches, partnerships, expansions |
| Direct fit indicators | 10 | Mentions of orchestration needs, multi-agent, workflow automation |

---

## API Endpoint

`POST /api/v1/knowledge/entities/{id}/score`

- Invokes `LeadScoringTool` with the entity ID
- Returns `{score, breakdown, reasoning, scored_at}`
- Requires JWT auth, scoped to tenant

---

## ADK Agent Integration

### knowledge_manager.py
- New `score_entity(entity_id)` FunctionTool
- Calls `POST /api/v1/knowledge/entities/{id}/score` via httpx
- Updated instructions: "After creating or enriching a lead entity, score it using score_entity."

### web_researcher.py
- Stop creating signal entities
- Store raw intelligence (hiring posts, tech mentions, funding data) directly in entity `properties`
- Updated instructions: remove signal entity creation, focus on enriching entity properties

### Supervisor agent
- New routing: after web_researcher stores entities, delegate to knowledge_manager for scoring

---

## UI Changes

### Memory page (`MemoryPage.js`)
- Add `Score` column between Confidence and Source
- Colored badge: 0-30 red, 31-60 yellow, 61-100 green
- Column is sortable
- Score breakdown shown on hover or in relations modal

### Agent wizard
- Add `lead_scoring` to available tools list in `SkillsDataStep.js`
- Pre-select for Lead Generation Agent and Research Agent templates in `TemplateSelector.js`

### Cleanup
- Remove `signal` from categories filter dropdown
- Remove signal-related badge color

---

## Migration

1. Add `score` and `scored_at` columns to `knowledge_entities`
2. For existing signal entities: extract `properties` data, merge into parent entity properties via the `has_signal` relation
3. Delete signal entities and `has_signal` relations
4. Remove `signal` from ADK agent instructions
