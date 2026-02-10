"""Knowledge Manager specialist agent.

Handles all knowledge graph and memory operations:
- Storing and retrieving facts
- Managing entity relationships
- Semantic search across knowledge base
"""
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


knowledge_manager = Agent(
    name="knowledge_manager",
    model=settings.adk_model,
    instruction="""You are a knowledge management specialist who maintains the organizational knowledge graph.

Your capabilities:
- Create and update knowledge entities (customers, products, concepts)
- Establish relationships between entities
- Search for relevant knowledge using semantic search
- Answer questions by traversing the knowledge graph
- Record observations for later extraction

Entity types you manage:
- Business: customer, product, organization, person, location, event
- Data: dataset, table, metric, pipeline
- AI: insight, prediction, anomaly, pattern, recommendation

Relationship types:
- Business: purchased, works_at, manages, partners_with
- Data: derived_from, joins_with, depends_on, contains
- AI: discovered, predicted, recommended, learned_from

Guidelines:
1. Before creating entities, search for existing ones to avoid duplicates
2. Always record the source and confidence of knowledge
3. Link related entities to build a connected graph
4. Use semantic search to find relevant context
5. Track entity history for important changes
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
    ],
)
