# Phase 7: RAG, Vector Store, and Knowledge Graph Implementation Plan

## 1. Overview
This phase focuses on enhancing the platform's retrieval capabilities by integrating advanced RAG (Retrieval-Augmented Generation) with a Knowledge Graph. This will allow agents to reason over complex relationships and provide more accurate, context-aware answers.

## 2. Architecture

### 2.1. Vector Store Integration
- **Models**: `VectorStore` (existing)
- **Providers**: Support for Pinecone, Weaviate, Qdrant, and pgvector.
- **Service**: `VectorStoreService` to handle index management, embedding generation, and upsert operations.
- **MCP Integration**: Expose vector store operations via MCP tools.

### 2.2. Knowledge Graph System
- **Models**: `KnowledgeEntity` and `KnowledgeRelation` (from Phase 2).
- **Graph Database**: Use PostgreSQL with recursive queries (CTE) or integrate a dedicated graph DB like Neo4j if scale requires. For now, SQL-based graph storage is sufficient.
- **Graph Construction**:
    - **Extraction Agents**: Specialized agents to extract entities and relations from unstructured text (documents, chat logs).
    - **Manual Editing**: UI for users to define/edit entities and relations.

### 2.3. Hybrid Retrieval (GraphRAG)
- **Strategy**: Combine vector similarity search with graph traversal.
- **Flow**:
    1.  **Query Embedding**: Embed user query.
    2.  **Vector Search**: Retrieve top-k relevant chunks/entities.
    3.  **Graph Expansion**: Traverse the knowledge graph from retrieved entities to find related concepts (1-2 hops).
    4.  **Context Assembly**: Combine vector results and graph context into the prompt.

## 3. Implementation Steps

### 3.1. Vector Store Service Enhancement
- [ ] Implement `VectorStoreService` with adapter pattern for different providers.
- [ ] Implement document chunking and embedding pipeline (using LangChain or LlamaIndex).
- [ ] Create API endpoints for document ingestion (`/api/v1/vector-stores/{id}/ingest`).

### 3.2. Knowledge Graph Builder
- [ ] Create `GraphExtractionService` using LLMs to extract `(Subject, Predicate, Object)` triples.
- [ ] Implement `KnowledgeGraphService` to manage entities and relations in the DB.
- [ ] Add API endpoints for graph querying and visualization data.

### 3.3. RAG Pipeline Integration
- [ ] Update `EnhancedChatService` to support "GraphRAG" mode.
- [ ] Implement `GraphRetrievalTool` for agents to explicitly query the graph.
- [ ] Optimize context window usage with re-ranking.

### 3.4. Frontend Visualization
- [ ] Create `KnowledgeGraphViewer` component using `react-force-graph` or `cytoscape.js`.
- [ ] Add "Knowledge Base" page to manage and visualize the graph.
- [ ] Integrate graph visualization into the Chat interface (e.g., "Show reasoning path").

## 4. Data Models (Refinement)

```python
# app/models/knowledge_entity.py
class KnowledgeEntity(Base):
    # ... existing fields ...
    vector_id = Column(String, nullable=True)  # Link to vector store embedding
    metadata = Column(JSON, default={})

# app/models/knowledge_relation.py
class KnowledgeRelation(Base):
    # ... existing fields ...
    weight = Column(Float, default=1.0)
    source = Column(String)  # e.g., "extracted", "manual"
```

## 5. UI/UX Design
- **Graph Explorer**: Interactive node-link diagram.
    - Click node to see details/properties.
    - Filter by entity type.
- **Ingestion Status**: Progress bars for document processing.
- **Chat Citations**: Highlight used graph entities in chat responses.

## 6. Testing Strategy
- **Unit Tests**: Test vector adapters and graph traversal logic.
- **Integration Tests**: End-to-end RAG flow with sample documents.
- **Performance Tests**: Measure retrieval latency with large graphs.
