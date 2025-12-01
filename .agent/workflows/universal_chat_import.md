---
description: Implement Universal Chat Import and Knowledge Base Building
---

# Universal Chat Import & Knowledge Base

This feature allows users to import chat history from external LLM providers (ChatGPT, Claude, Gemini) and build a knowledge base from it.

## Goals
1.  **Import**: Support uploading chat export files (JSON).
2.  **Parse**: Normalize chat data from different providers into a common format.
3.  **Extract**: Run an LLM process over the imported chats to extract:
    *   Facts/Entities (Knowledge Graph)
    *   Summaries (Vector Store)
4.  **Query**: Allow agents to access this imported knowledge.

## Implementation Steps

### Phase 1: Backend - Import & Parsing
1.  [ ] Create `ImportedChatSession` and `ImportedChatMessage` schemas/models (or reuse existing `ChatSession` with a flag).
    *   *Decision*: Let's use a new `DataSource` type `chat_import` and store the parsed chats in a specialized way or just process them into the Knowledge Graph directly. Storing them might be useful for "replay" or "search".
    *   *Refined Decision*: Store raw import as a `Dataset` (JSON file). Then process that Dataset.
2.  [ ] Create `ChatImportService` in `apps/api/app/services/chat_import.py`.
    *   `parse_chatgpt_export(file_content)`
    *   `parse_claude_export(file_content)`
3.  [ ] Create API endpoints in `apps/api/app/api/v1/integrations.py` (or `imports.py`).
    *   `POST /imports/chat-history`

### Phase 2: Knowledge Extraction
1.  [ ] Create `KnowledgeExtractionService`.
    *   Input: List of messages.
    *   Process: Chunking -> LLM Extraction -> Entity/Relation Creation.
2.  [ ] Integrate with `KnowledgeGraph` service.

### Phase 3: Frontend
1.  [ ] Add "Import Knowledge" button on `MemoryPage` or `DataSourcesPage`.
2.  [ ] File upload UI with provider selection.
3.  [ ] Progress tracking.

## Technical Details

### ChatGPT Export Format (Simplified)
```json
[
  {
    "title": "Conversation Title",
    "mapping": {
      "uuid": {
        "message": {
          "content": { "parts": ["text"] },
          "author": { "role": "user" }
        }
      }
    }
  }
]
```

### Claude Export Format (Simplified)
```json
[
  {
    "uuid": "...",
    "name": "...",
    "chat_messages": [
      { "sender": "human", "text": "..." },
      { "sender": "assistant", "text": "..." }
    ]
  }
]
```
