"""Knowledge Manager specialist agent.

Handles all knowledge graph and memory operations:
- Storing and retrieving facts
- Managing entity relationships
- Semantic search across knowledge base
- Lead scoring for entities
"""
import logging
from typing import Optional

import httpx
from google.adk.agents import Agent

from tools.knowledge_tools import (
    create_entity,
    find_entities,
    get_entity,
    update_entity,
    merge_entities,
    create_relation,
    find_relations,
    get_path,
    get_neighborhood,
    search_knowledge,
    store_knowledge,
    record_observation,
    ask_knowledge_graph,
    get_entity_timeline,
)
from config.settings import settings

logger = logging.getLogger(__name__)

# ---------- API helper for callbacks to FastAPI backend ----------

_http_client: Optional[httpx.AsyncClient] = None


def _get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            base_url=settings.api_base_url,
            timeout=30.0,
        )
    return _http_client


async def _call_api(method: str, path: str, **kwargs) -> dict:
    """Call the FastAPI backend and return the JSON response."""
    client = _get_http_client()
    try:
        response = await client.request(method, f"/api/v1{path}", **kwargs)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        logger.error("API %s %s returned %s: %s", method, path, e.response.status_code, e.response.text[:300])
        return {"error": f"API call failed with status {e.response.status_code}"}
    except Exception as e:
        logger.error("API %s %s failed: %s", method, path, e)
        return {"error": f"API call failed: {str(e)}"}


# ---------- Tool functions ----------


async def score_entity(entity_id: str) -> dict:
    """Compute a composite lead score (0-100) for an entity.

    Uses LLM analysis of the entity's properties, relations, and context to score
    based on hiring signals, tech stack alignment, funding, company size, news, and direct fit.

    Args:
        entity_id: UUID of the entity to score.

    Returns:
        Dict with score (0-100), breakdown by category, and reasoning.
    """
    return await _call_api("POST", f"/knowledge/entities/{entity_id}/score")


knowledge_manager = Agent(
    name="knowledge_manager",
    model=settings.adk_model,
    instruction="""You are a memory and knowledge management specialist who maintains the organizational knowledge graph.

IMPORTANT: For the tenant_id parameter in all tools, use the value from the session state.
The tenant_id is available in the session state as state["tenant_id"].
If you cannot access the session state, use "auto" as tenant_id and the system will resolve it.

Your capabilities:
- Create and update entities with proper CATEGORY and TYPE classification
- Establish relationships between entities
- Search for relevant knowledge using semantic search
- Answer questions by traversing the knowledge graph
- Record observations and detect buying signals

## Entity Taxonomy

When creating entities, ALWAYS set both `category` and `entity_type`:

| Category | When to use | Example entity_types |
|---|---|---|
| lead | Companies that might buy a product/service | ai_company, enterprise, startup, saas_platform |
| contact | Decision makers and key people at companies | cto, vp_engineering, ceo, head_of_ai, founder |
| investor | VCs, angels, funding sources | vc_fund, angel_investor, corporate_vc |
| accelerator | Programs, incubators, startup programs | accelerator, incubator, startup_program |
| organization | Generic companies (when not a lead) | company, nonprofit, government |
| person | Generic people (when not a contact) | employee, researcher |

The `category` is the high-level bucket. The `entity_type` is the specific granular type - use any descriptive string.

## Lead Scoring

After creating or enriching a lead entity, score it using the score_entity tool.
This computes a composite 0-100 score based on:
- Hiring signals (AI/ML/agent job posts): 0-25 pts
- Tech stack alignment (LangChain, OpenAI, etc.): 0-20 pts
- Funding recency: 0-20 pts
- Company size/stage fit: 0-15 pts
- News/momentum: 0-10 pts
- Direct fit indicators: 0-10 pts

Always report the score and key factors to the user after scoring.

Do NOT create separate signal entities. Instead, store raw intelligence
(hiring posts, tech mentions, funding data) directly in the entity's properties field.

## Relationship Types

- Business: purchased, works_at, manages, partners_with, competes_with
- Hierarchy: subsidiary_of, division_of, invested_in
- Signals: has_signal, indicates_interest, hiring_for
- Data: derived_from, depends_on, contains

Guidelines:
1. Before creating entities, search for existing ones to avoid duplicates
2. Always set the correct category based on context
3. Always record the source and confidence of knowledge
4. Link related entities to build a connected graph
5. Use semantic search to find relevant context
6. Track entity history for important changes
""",
    tools=[
        create_entity,
        find_entities,
        get_entity,
        update_entity,
        merge_entities,
        create_relation,
        find_relations,
        get_path,
        get_neighborhood,
        search_knowledge,
        store_knowledge,
        record_observation,
        ask_knowledge_graph,
        get_entity_timeline,
        score_entity,
    ],
)
