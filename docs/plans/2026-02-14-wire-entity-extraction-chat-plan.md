# Wire Entity Extraction into Chat — Implementation Plan

**Date:** 2026-02-14
**Status:** Complete
**Depends on:** Entity Collection Engine (13 tasks shipped)

## Context

The Entity Collection Engine backend is complete (13 tasks shipped). The `KnowledgeExtractionService` can extract entities from any content type. Now we need to wire it into the chat flow so entities are automatically extracted from every agent conversation and visible to the user.

## Approach

**Automatic extraction after each assistant response.** After the ADK agent responds, we extract entities from the full conversation transcript and store them in the knowledge graph. The user sees extracted entities in the chat UI as a collapsible panel.

## Files to Modify

### Backend (2 files)

**1. `apps/api/app/services/chat.py`** — Add extraction after assistant response
- In `_generate_agentic_response()`, after the assistant message is persisted (line 220-226 and retry path at line 247-253), call `knowledge_extraction_service.extract_from_session()`
- Store extracted entity count in the message's `context` JSON field (`context["entities_extracted"]`)
- Wrap in try/except so extraction failures never break chat
- Import: `from app.services.knowledge_extraction import knowledge_extraction_service`

**2. `apps/api/app/api/v1/chat.py`** — Add endpoint to get entities for a session
- New endpoint: `GET /chat/sessions/{session_id}/entities` — returns all knowledge entities linked to the chat session via the extraction service
- Uses existing `knowledge.get_entities()` or a query on `KnowledgeEntity` filtered by entities that were extracted from messages in this session

### Frontend (2 files)

**3. `apps/web/src/pages/ChatPage.js`** — Show extracted entities panel
- After each message response, if `context.entities_extracted > 0`, show a small badge
- Display entity count badge on assistant messages

**4. `apps/web/src/services/chat.js`** — Add API call for session entities
- Add `getSessionEntities(sessionId)` method

## Implementation Details

### chat.py service changes (minimal, ~15 lines)

After successful ADK response paths, add:

```python
# Extract entities from conversation
entities_extracted = 0
try:
    extracted = knowledge_extraction_service.extract_from_session(
        db, session.id, session.tenant_id
    )
    entities_extracted = len(extracted)
except Exception:
    logger.warning("Entity extraction failed for session %s", session.id, exc_info=True)

# Include count in the context
if entities_extracted > 0 and context:
    context["entities_extracted"] = entities_extracted
```

### chat.py route (new endpoint, ~15 lines)

```python
@router.get("/sessions/{session_id}/entities")
def get_session_entities(session_id, db, current_user):
    # Query KnowledgeEntity for tenant
    entities = knowledge_service.get_entities(db, tenant_id=current_user.tenant_id)
    return entities
```

### ChatPage.js changes (~10 lines)

In `renderMessage()`, after the message content, check `message.context?.entities_extracted`:

```jsx
{message.context?.entities_extracted > 0 && (
  <Badge bg="info" className="mt-2" style={{ fontSize: '0.7rem' }}>
    {message.context.entities_extracted} entities extracted
  </Badge>
)}
```

## Verification

1. Open chat, send a message mentioning companies/people
2. Check API logs for "Extracted N entities"
3. See entity count badge on the assistant message
4. Navigate to Knowledge page, verify entities appear with status "draft"
5. Verify chat latency is acceptable (extraction runs synchronously but is fast ~1-2s)

## Tasks

- [x] Task 1: Add entity extraction call to chat.py service after ADK response
- [x] Task 2: Add session entities endpoint to chat.py routes
- [x] Task 3: Add entity count badge to ChatPage.js message rendering
- [x] Task 4: Add getSessionEntities API method to chat.js service
