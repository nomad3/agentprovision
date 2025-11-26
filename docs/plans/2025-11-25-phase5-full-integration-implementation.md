# Phase 5: Full Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate all Phase 1-4 features into existing models, enhance ChatService with orchestration/memory/LLM routing, and build frontend pages.

**Architecture:** Three-part integration: (A) Extend existing models with new foreign keys and fields, (B) Enhance ChatService to use orchestration, memory, and multi-LLM routing, (C) Build React pages for Teams, Memory Explorer, LLM Settings, and Branding.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, React, Bootstrap 5

---

## Part A: Model Integration (Tasks 1-5)

### Task 1: Extend Agent Model with LLM Config

**Files:**
- Modify: `apps/api/app/models/agent.py`
- Modify: `apps/api/app/schemas/agent.py`
- Modify: `apps/api/tests/test_whitelabel.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_whitelabel.py`:

```python
def test_agent_extended_fields():
    """Test Agent model has integration fields."""
    from app.models.agent import Agent

    assert hasattr(Agent, 'llm_config_id')
    assert hasattr(Agent, 'memory_config')
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_agent_extended_fields -v`
Expected: FAIL with "AssertionError"

**Step 3: Write minimal implementation**

Add to `apps/api/app/models/agent.py` after line 23:

```python
    # LLM and Memory configuration
    llm_config_id = Column(UUID(as_uuid=True), ForeignKey("llm_configs.id"), nullable=True)
    memory_config = Column(JSON, nullable=True)  # {"retention_days": 30, "max_memories": 1000}

    # Relationships
    llm_config = relationship("LLMConfig", foreign_keys=[llm_config_id])
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_agent_extended_fields -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/models/agent.py apps/api/tests/test_whitelabel.py
git commit -m "feat(integration): add llm_config_id and memory_config to Agent"
```

---

### Task 2: Extend ChatSession Model

**Files:**
- Modify: `apps/api/app/models/chat.py`
- Modify: `apps/api/tests/test_whitelabel.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_whitelabel.py`:

```python
def test_chat_session_extended_fields():
    """Test ChatSession model has integration fields."""
    from app.models.chat import ChatSession

    assert hasattr(ChatSession, 'agent_group_id')
    assert hasattr(ChatSession, 'root_task_id')
    assert hasattr(ChatSession, 'memory_context')
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_chat_session_extended_fields -v`
Expected: FAIL

**Step 3: Write minimal implementation**

Add to `apps/api/app/models/chat.py` in ChatSession class after line 18:

```python
    # Orchestration integration
    agent_group_id = Column(UUID(as_uuid=True), ForeignKey("agent_groups.id"), nullable=True)
    root_task_id = Column(UUID(as_uuid=True), ForeignKey("agent_tasks.id"), nullable=True)
    memory_context = Column(JSON, nullable=True)  # {"summary": "...", "key_entities": [...]}

    # Relationships
    agent_group = relationship("AgentGroup", foreign_keys=[agent_group_id])
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_chat_session_extended_fields -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/models/chat.py apps/api/tests/test_whitelabel.py
git commit -m "feat(integration): add agent_group_id and memory_context to ChatSession"
```

---

### Task 3: Extend ChatMessage Model

**Files:**
- Modify: `apps/api/app/models/chat.py`
- Modify: `apps/api/tests/test_whitelabel.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_whitelabel.py`:

```python
def test_chat_message_extended_fields():
    """Test ChatMessage model has integration fields."""
    from app.models.chat import ChatMessage

    assert hasattr(ChatMessage, 'agent_id')
    assert hasattr(ChatMessage, 'task_id')
    assert hasattr(ChatMessage, 'reasoning')
    assert hasattr(ChatMessage, 'confidence')
    assert hasattr(ChatMessage, 'tokens_used')
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_chat_message_extended_fields -v`
Expected: FAIL

**Step 3: Write minimal implementation**

Add to `apps/api/app/models/chat.py` in ChatMessage class after line 40:

```python
    # Agent integration
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("agent_tasks.id"), nullable=True)

    # Response metadata
    reasoning = Column(String, nullable=True)  # Chain of thought explanation
    confidence = Column(Float, nullable=True)  # 0.0-1.0 confidence score
    tokens_used = Column(Integer, nullable=True)  # Token count for this message

    # Relationships
    agent = relationship("Agent", foreign_keys=[agent_id])
```

Add import at top: `from sqlalchemy import Column, String, ForeignKey, JSON, DateTime, Float, Integer`

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_chat_message_extended_fields -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/models/chat.py apps/api/tests/test_whitelabel.py
git commit -m "feat(integration): add agent_id, task_id, and metadata to ChatMessage"
```

---

### Task 4: Extend Tenant Model with Relationships

**Files:**
- Modify: `apps/api/app/models/tenant.py`
- Modify: `apps/api/tests/test_whitelabel.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_whitelabel.py`:

```python
def test_tenant_extended_fields():
    """Test Tenant model has integration fields."""
    from app.models.tenant import Tenant

    assert hasattr(Tenant, 'default_llm_config_id')
    assert hasattr(Tenant, 'branding')
    assert hasattr(Tenant, 'features')
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_tenant_extended_fields -v`
Expected: FAIL

**Step 3: Write minimal implementation**

Replace `apps/api/app/models/tenant.py`:

```python
import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)

    # Default LLM configuration for this tenant
    default_llm_config_id = Column(UUID(as_uuid=True), ForeignKey("llm_configs.id"), nullable=True)

    # Relationships
    users = relationship("User", back_populates="tenant")
    branding = relationship("TenantBranding", uselist=False, back_populates="tenant")
    features = relationship("TenantFeatures", uselist=False, back_populates="tenant")
    default_llm_config = relationship("LLMConfig", foreign_keys=[default_llm_config_id])
```

Add back_populates to TenantBranding model (`apps/api/app/models/tenant_branding.py`):
```python
    tenant = relationship("Tenant", back_populates="branding")
```

Add back_populates to TenantFeatures model (`apps/api/app/models/tenant_features.py`):
```python
    tenant = relationship("Tenant", back_populates="features")
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_tenant_extended_fields -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/models/tenant.py apps/api/app/models/tenant_branding.py apps/api/app/models/tenant_features.py apps/api/tests/test_whitelabel.py
git commit -m "feat(integration): add LLM config and relationships to Tenant"
```

---

### Task 5: Extend AgentKit Model

**Files:**
- Modify: `apps/api/app/models/agent_kit.py`
- Modify: `apps/api/tests/test_whitelabel.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_whitelabel.py`:

```python
def test_agent_kit_extended_fields():
    """Test AgentKit model has integration fields."""
    from app.models.agent_kit import AgentKit

    assert hasattr(AgentKit, 'kit_type')
    assert hasattr(AgentKit, 'default_agents')
    assert hasattr(AgentKit, 'default_hierarchy')
    assert hasattr(AgentKit, 'industry')
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_agent_kit_extended_fields -v`
Expected: FAIL

**Step 3: Write minimal implementation**

Add to `apps/api/app/models/agent_kit.py` after line 16:

```python
    # Kit configuration
    kit_type = Column(String, default="single")  # "single", "team", "hierarchy"
    default_agents = Column(JSON, nullable=True)  # [{"name": "Analyst", "role": "analyst", ...}]
    default_hierarchy = Column(JSON, nullable=True)  # {"supervisor": "Manager", "workers": ["Analyst"]}
    industry = Column(String, nullable=True)  # "healthcare", "finance", "legal", "retail"
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_agent_kit_extended_fields -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/models/agent_kit.py apps/api/tests/test_whitelabel.py
git commit -m "feat(integration): add kit_type, default_agents, hierarchy to AgentKit"
```

---

## Part B: Service Integration (Tasks 6-8)

### Task 6: Create Enhanced Chat Service

**Files:**
- Create: `apps/api/app/services/enhanced_chat.py`
- Modify: `apps/api/tests/test_whitelabel.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_whitelabel.py`:

```python
def test_enhanced_chat_service():
    """Test EnhancedChatService exists with required methods."""
    from app.services.enhanced_chat import EnhancedChatService

    assert hasattr(EnhancedChatService, 'create_session_with_orchestration')
    assert hasattr(EnhancedChatService, 'post_message_with_memory')
    assert hasattr(EnhancedChatService, 'select_llm_for_task')
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_enhanced_chat_service -v`
Expected: FAIL

**Step 3: Write minimal implementation**

Create `apps/api/app/services/enhanced_chat.py`:

```python
"""Enhanced chat service integrating orchestration, memory, and multi-LLM."""
from typing import Optional, Tuple, List, Dict, Any
import uuid

from sqlalchemy.orm import Session

from app.models.chat import ChatSession, ChatMessage
from app.models.agent import Agent
from app.models.agent_group import AgentGroup
from app.models.agent_task import AgentTask
from app.models.agent_memory import AgentMemory
from app.services import chat as base_chat_service
from app.services.memory.memory_service import MemoryService
from app.services.llm.router import LLMRouter


class EnhancedChatService:
    """Chat service with full orchestration, memory, and LLM integration."""

    def __init__(self, db: Session, tenant_id: uuid.UUID):
        self.db = db
        self.tenant_id = tenant_id
        self.memory_service = MemoryService(db, tenant_id)
        self.llm_router = LLMRouter(db, tenant_id)

    def create_session_with_orchestration(
        self,
        dataset_id: uuid.UUID,
        agent_kit_id: uuid.UUID,
        agent_group_id: Optional[uuid.UUID] = None,
        title: Optional[str] = None,
    ) -> ChatSession:
        """Create chat session with optional agent group orchestration."""
        session = base_chat_service.create_session(
            self.db,
            tenant_id=self.tenant_id,
            dataset_id=dataset_id,
            agent_kit_id=agent_kit_id,
            title=title,
        )

        # Link to agent group if provided
        if agent_group_id:
            session.agent_group_id = agent_group_id
            self.db.commit()
            self.db.refresh(session)

        return session

    def post_message_with_memory(
        self,
        session: ChatSession,
        content: str,
        agent_id: Optional[uuid.UUID] = None,
    ) -> Tuple[ChatMessage, ChatMessage]:
        """Post message with memory recall and storage."""
        # Recall relevant memories for context
        memories = []
        if agent_id:
            memories = self.memory_service.recall(
                agent_id=agent_id,
                query=content,
                limit=5,
            )

        # Inject memory context into session
        if memories:
            memory_context = {
                "recalled_memories": [
                    {"content": m.content, "type": m.memory_type, "importance": m.importance}
                    for m in memories
                ],
            }
            session.memory_context = memory_context
            self.db.commit()

        # Post message using base service
        user_msg, assistant_msg = base_chat_service.post_user_message(
            self.db,
            session=session,
            content=content,
        )

        # Store new experience as memory
        if agent_id and assistant_msg:
            self.memory_service.store(
                agent_id=agent_id,
                content=f"User asked: {content}. I responded: {assistant_msg.content[:200]}",
                memory_type="experience",
                importance=0.5,
                source="conversation",
            )

        return user_msg, assistant_msg

    def select_llm_for_task(
        self,
        task_type: str,
        complexity: str = "medium",
        requires_vision: bool = False,
    ) -> Dict[str, Any]:
        """Select optimal LLM for a task using the router."""
        return self.llm_router.select_model(
            task_type=task_type,
            complexity=complexity,
            requires_vision=requires_vision,
        )

    def get_session_with_context(
        self,
        session_id: uuid.UUID,
    ) -> Optional[ChatSession]:
        """Get session with full orchestration and memory context."""
        session = base_chat_service.get_session(
            self.db,
            session_id=session_id,
            tenant_id=self.tenant_id,
        )
        return session


def get_enhanced_chat_service(db: Session, tenant_id: uuid.UUID) -> EnhancedChatService:
    """Factory function to create EnhancedChatService."""
    return EnhancedChatService(db, tenant_id)
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_enhanced_chat_service -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/services/enhanced_chat.py apps/api/tests/test_whitelabel.py
git commit -m "feat(integration): add EnhancedChatService with orchestration and memory"
```

---

### Task 7: Add Chat API Route for Enhanced Features

**Files:**
- Modify: `apps/api/app/api/v1/chat.py`
- Modify: `apps/api/tests/test_whitelabel.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_whitelabel.py`:

```python
def test_chat_enhanced_routes():
    """Test chat API has enhanced routes."""
    from app.api.v1 import chat

    assert hasattr(chat, 'create_session_enhanced')
    assert hasattr(chat, 'post_message_enhanced')
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_chat_enhanced_routes -v`
Expected: FAIL

**Step 3: Write minimal implementation**

Add to `apps/api/app/api/v1/chat.py`:

```python
from app.services.enhanced_chat import get_enhanced_chat_service

@router.post("/sessions/enhanced", response_model=ChatSessionSchema)
def create_session_enhanced(
    *,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
    session_in: ChatSessionCreate,
    agent_group_id: Optional[uuid.UUID] = None,
):
    """Create chat session with optional agent group orchestration."""
    enhanced_service = get_enhanced_chat_service(db, current_user.tenant_id)
    return enhanced_service.create_session_with_orchestration(
        dataset_id=session_in.dataset_id,
        agent_kit_id=session_in.agent_kit_id,
        agent_group_id=agent_group_id,
        title=session_in.title,
    )


@router.post("/sessions/{session_id}/messages/enhanced")
def post_message_enhanced(
    *,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
    session_id: uuid.UUID,
    message_in: ChatMessageCreate,
    agent_id: Optional[uuid.UUID] = None,
):
    """Post message with memory integration."""
    session = chat_service.get_session(
        db, session_id=session_id, tenant_id=current_user.tenant_id
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    enhanced_service = get_enhanced_chat_service(db, current_user.tenant_id)
    user_msg, assistant_msg = enhanced_service.post_message_with_memory(
        session=session,
        content=message_in.content,
        agent_id=agent_id,
    )
    return {"user": user_msg, "assistant": assistant_msg}
```

Add imports at top:
```python
from typing import Optional
import uuid
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_chat_enhanced_routes -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/api/v1/chat.py apps/api/tests/test_whitelabel.py
git commit -m "feat(integration): add enhanced chat API routes with memory"
```

---

### Task 8: Update LLM Router Integration

**Files:**
- Modify: `apps/api/app/services/llm/router.py`
- Modify: `apps/api/tests/test_whitelabel.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_whitelabel.py`:

```python
def test_llm_router_enhanced():
    """Test LLMRouter has enhanced methods."""
    from app.services.llm.router import LLMRouter

    assert hasattr(LLMRouter, 'get_tenant_config')
    assert hasattr(LLMRouter, 'track_usage')
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_llm_router_enhanced -v`
Expected: FAIL

**Step 3: Write minimal implementation**

Add to `apps/api/app/services/llm/router.py`:

```python
    def get_tenant_config(self) -> Optional[LLMConfig]:
        """Get tenant's default LLM configuration."""
        from app.models.tenant import Tenant
        tenant = self.db.query(Tenant).filter(Tenant.id == self.tenant_id).first()
        if tenant and tenant.default_llm_config_id:
            return self.db.query(LLMConfig).filter(
                LLMConfig.id == tenant.default_llm_config_id
            ).first()
        return None

    def track_usage(
        self,
        model_id: uuid.UUID,
        tokens_input: int,
        tokens_output: int,
        cost: float,
    ) -> None:
        """Track LLM usage for analytics."""
        from app.models.tenant_analytics import TenantAnalytics
        from datetime import datetime

        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        # Update or create daily analytics
        analytics = self.db.query(TenantAnalytics).filter(
            TenantAnalytics.tenant_id == self.tenant_id,
            TenantAnalytics.period == "daily",
            TenantAnalytics.period_start == today,
        ).first()

        if analytics:
            analytics.total_tokens_used = (analytics.total_tokens_used or 0) + tokens_input + tokens_output
            analytics.total_cost = (analytics.total_cost or 0) + cost
        else:
            analytics = TenantAnalytics(
                tenant_id=self.tenant_id,
                period="daily",
                period_start=today,
                total_tokens_used=tokens_input + tokens_output,
                total_cost=cost,
            )
            self.db.add(analytics)

        self.db.commit()
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pytest tests/test_whitelabel.py::test_llm_router_enhanced -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/services/llm/router.py apps/api/tests/test_whitelabel.py
git commit -m "feat(integration): add tenant config and usage tracking to LLMRouter"
```

---

## Part C: Frontend Development (Tasks 9-13)

### Task 9: Create Teams Page

**Files:**
- Create: `apps/web/src/pages/TeamsPage.js`
- Create: `apps/web/src/services/teams.js`
- Modify: `apps/web/src/App.js`

**Step 1: Create teams service**

Create `apps/web/src/services/teams.js`:

```javascript
import api from './api';

export const teamsService = {
  async getGroups() {
    const response = await api.get('/agent_groups');
    return response.data;
  },

  async getGroup(id) {
    const response = await api.get(`/agent_groups/${id}`);
    return response.data;
  },

  async createGroup(data) {
    const response = await api.post('/agent_groups', data);
    return response.data;
  },

  async updateGroup(id, data) {
    const response = await api.put(`/agent_groups/${id}`, data);
    return response.data;
  },

  async deleteGroup(id) {
    await api.delete(`/agent_groups/${id}`);
  },

  async getGroupAgents(groupId) {
    const response = await api.get(`/agent_groups/${groupId}/agents`);
    return response.data;
  },

  async getTasks(groupId) {
    const response = await api.get(`/tasks?group_id=${groupId}`);
    return response.data;
  },
};
```

**Step 2: Create TeamsPage component**

Create `apps/web/src/pages/TeamsPage.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form } from 'react-bootstrap';
import { teamsService } from '../services/teams';

function TeamsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', goal: '' });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await teamsService.getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await teamsService.createGroup(formData);
      setShowModal(false);
      setFormData({ name: '', description: '', goal: '' });
      loadGroups();
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Agent Teams</h2>
          <p className="text-muted">Manage agent groups and orchestration</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Create Team
          </Button>
        </Col>
      </Row>

      <Row>
        {loading ? (
          <Col className="text-center py-5">Loading...</Col>
        ) : groups.length === 0 ? (
          <Col className="text-center py-5">
            <p>No teams yet. Create your first agent team!</p>
          </Col>
        ) : (
          groups.map((group) => (
            <Col md={4} key={group.id} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>{group.name}</Card.Title>
                  <Card.Text className="text-muted">{group.description}</Card.Text>
                  <div className="mb-2">
                    <Badge bg="info" className="me-2">Goal: {group.goal || 'Not set'}</Badge>
                  </div>
                  <Button variant="outline-primary" size="sm">View Team</Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Agent Team</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Team Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Team Goal</Form.Label>
              <Form.Control
                type="text"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default TeamsPage;
```

**Step 3: Add route to App.js**

Add import and route to `apps/web/src/App.js`:

```javascript
import TeamsPage from './pages/TeamsPage';

// In routes:
<Route path="/teams" element={<Layout><TeamsPage /></Layout>} />
```

**Step 4: Commit**

```bash
git add apps/web/src/pages/TeamsPage.js apps/web/src/services/teams.js apps/web/src/App.js
git commit -m "feat(frontend): add TeamsPage for agent group management"
```

---

### Task 10: Create Memory Explorer Page

**Files:**
- Create: `apps/web/src/pages/MemoryPage.js`
- Create: `apps/web/src/services/memory.js`
- Modify: `apps/web/src/App.js`

**Step 1: Create memory service**

Create `apps/web/src/services/memory.js`:

```javascript
import api from './api';

export const memoryService = {
  async getMemories(agentId) {
    const response = await api.get(`/memories/agent/${agentId}`);
    return response.data;
  },

  async storeMemory(data) {
    const response = await api.post('/memories', data);
    return response.data;
  },

  async deleteMemory(memoryId) {
    await api.delete(`/memories/${memoryId}`);
  },

  async getEntities(type = null) {
    const url = type ? `/knowledge/entities?entity_type=${type}` : '/knowledge/entities';
    const response = await api.get(url);
    return response.data;
  },

  async searchEntities(query) {
    const response = await api.get(`/knowledge/entities/search?q=${query}`);
    return response.data;
  },

  async getRelations(entityId) {
    const response = await api.get(`/knowledge/entities/${entityId}/relations`);
    return response.data;
  },
};
```

**Step 2: Create MemoryPage component**

Create `apps/web/src/pages/MemoryPage.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, InputGroup, Button, Tabs, Tab } from 'react-bootstrap';
import { memoryService } from '../services/memory';

function MemoryPage() {
  const [entities, setEntities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntities();
  }, [entityType]);

  const loadEntities = async () => {
    try {
      const data = await memoryService.getEntities(entityType || null);
      setEntities(data);
    } catch (error) {
      console.error('Failed to load entities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadEntities();
      return;
    }
    try {
      setLoading(true);
      const data = await memoryService.searchEntities(searchQuery);
      setEntities(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const entityTypes = ['customer', 'product', 'concept', 'person'];

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Memory & Knowledge</h2>
          <p className="text-muted">Explore agent memories and knowledge graph</p>
        </Col>
      </Row>

      <Tabs defaultActiveKey="knowledge" className="mb-4">
        <Tab eventKey="knowledge" title="Knowledge Graph">
          <Card>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <InputGroup>
                    <Form.Control
                      placeholder="Search entities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button variant="outline-primary" onClick={handleSearch}>Search</Button>
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                    <option value="">All Types</option>
                    {entityTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              {loading ? (
                <div className="text-center py-5">Loading...</div>
              ) : (
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Confidence</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entities.map((entity) => (
                      <tr key={entity.id}>
                        <td>{entity.name}</td>
                        <td><Badge bg="secondary">{entity.entity_type}</Badge></td>
                        <td>{(entity.confidence * 100).toFixed(0)}%</td>
                        <td>{new Date(entity.created_at).toLocaleDateString()}</td>
                        <td>
                          <Button variant="link" size="sm">View Relations</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="memories" title="Agent Memories">
          <Card>
            <Card.Body>
              <p className="text-muted">Select an agent to view their memories</p>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
}

export default MemoryPage;
```

**Step 3: Add route to App.js**

```javascript
import MemoryPage from './pages/MemoryPage';

<Route path="/memory" element={<Layout><MemoryPage /></Layout>} />
```

**Step 4: Commit**

```bash
git add apps/web/src/pages/MemoryPage.js apps/web/src/services/memory.js apps/web/src/App.js
git commit -m "feat(frontend): add MemoryPage for knowledge graph exploration"
```

---

### Task 11: Create LLM Settings Page

**Files:**
- Create: `apps/web/src/pages/LLMSettingsPage.js`
- Create: `apps/web/src/services/llm.js`
- Modify: `apps/web/src/App.js`

**Step 1: Create LLM service**

Create `apps/web/src/services/llm.js`:

```javascript
import api from './api';

export const llmService = {
  async getProviders() {
    const response = await api.get('/llm/providers');
    return response.data;
  },

  async getModels(providerName = null) {
    const url = providerName ? `/llm/models?provider_name=${providerName}` : '/llm/models';
    const response = await api.get(url);
    return response.data;
  },

  async getConfigs() {
    const response = await api.get('/llm/configs');
    return response.data;
  },

  async createConfig(data) {
    const response = await api.post('/llm/configs', data);
    return response.data;
  },
};
```

**Step 2: Create LLMSettingsPage component**

Create `apps/web/src/pages/LLMSettingsPage.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import { llmService } from '../services/llm';

function LLMSettingsPage() {
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [providersData, modelsData, configsData] = await Promise.all([
        llmService.getProviders(),
        llmService.getModels(),
        llmService.getConfigs(),
      ]);
      setProviders(providersData);
      setModels(modelsData);
      setConfigs(configsData);
    } catch (error) {
      console.error('Failed to load LLM data:', error);
    } finally {
      setLoading(false);
    }
  };

  const speedBadge = (tier) => {
    const colors = { fast: 'success', standard: 'warning', slow: 'secondary' };
    return <Badge bg={colors[tier] || 'secondary'}>{tier}</Badge>;
  };

  const qualityBadge = (tier) => {
    const colors = { best: 'primary', good: 'info', basic: 'secondary' };
    return <Badge bg={colors[tier] || 'secondary'}>{tier}</Badge>;
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>LLM Settings</h2>
          <p className="text-muted">Configure AI models and providers</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Providers</Card.Title>
              <div className="display-4 text-primary">{providers.length}</div>
              <p className="text-muted">Active providers</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Models</Card.Title>
              <div className="display-4 text-success">{models.length}</div>
              <p className="text-muted">Available models</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Configurations</Card.Title>
              <div className="display-4 text-info">{configs.length}</div>
              <p className="text-muted">Tenant configs</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Available Models</span>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">Loading...</div>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Provider</th>
                  <th>Context</th>
                  <th>Speed</th>
                  <th>Quality</th>
                  <th>Cost (per 1K)</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id}>
                    <td>{model.display_name}</td>
                    <td>
                      {providers.find(p => p.id === model.provider_id)?.display_name || 'Unknown'}
                    </td>
                    <td>{(model.context_window / 1000).toFixed(0)}K</td>
                    <td>{speedBadge(model.speed_tier)}</td>
                    <td>{qualityBadge(model.quality_tier)}</td>
                    <td>
                      ${model.input_cost_per_1k?.toFixed(4)} / ${model.output_cost_per_1k?.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LLMSettingsPage;
```

**Step 3: Add route to App.js**

```javascript
import LLMSettingsPage from './pages/LLMSettingsPage';

<Route path="/settings/llm" element={<Layout><LLMSettingsPage /></Layout>} />
```

**Step 4: Commit**

```bash
git add apps/web/src/pages/LLMSettingsPage.js apps/web/src/services/llm.js apps/web/src/App.js
git commit -m "feat(frontend): add LLMSettingsPage for model configuration"
```

---

### Task 12: Create Branding Settings Page

**Files:**
- Create: `apps/web/src/pages/BrandingPage.js`
- Create: `apps/web/src/services/branding.js`
- Modify: `apps/web/src/App.js`

**Step 1: Create branding service**

Create `apps/web/src/services/branding.js`:

```javascript
import api from './api';

export const brandingService = {
  async getBranding() {
    const response = await api.get('/branding');
    return response.data;
  },

  async updateBranding(data) {
    const response = await api.put('/branding', data);
    return response.data;
  },

  async getFeatures() {
    const response = await api.get('/features');
    return response.data;
  },

  async updateFeatures(data) {
    const response = await api.put('/features', data);
    return response.data;
  },
};
```

**Step 2: Create BrandingPage component**

Create `apps/web/src/pages/BrandingPage.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { brandingService } from '../services/branding';

function BrandingPage() {
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const data = await brandingService.getBranding();
      setBranding(data);
    } catch (error) {
      console.error('Failed to load branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await brandingService.updateBranding(branding);
      setMessage({ type: 'success', text: 'Branding saved successfully!' });
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to save branding' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setBranding({ ...branding, [field]: value });
  };

  if (loading) {
    return <Container className="py-5 text-center">Loading...</Container>;
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Branding Settings</h2>
          <p className="text-muted">Customize your platform's appearance</p>
        </Col>
      </Row>

      {message && <Alert variant={message.type}>{message.text}</Alert>}

      <Form onSubmit={handleSave}>
        <Row>
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>Brand Identity</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Company Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={branding?.company_name || ''}
                    onChange={(e) => updateField('company_name', e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Logo URL</Form.Label>
                  <Form.Control
                    type="url"
                    value={branding?.logo_url || ''}
                    onChange={(e) => updateField('logo_url', e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Support Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={branding?.support_email || ''}
                    onChange={(e) => updateField('support_email', e.target.value)}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>Colors</Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Primary Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={branding?.primary_color || '#6366f1'}
                        onChange={(e) => updateField('primary_color', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Secondary Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={branding?.secondary_color || '#8b5cf6'}
                        onChange={(e) => updateField('secondary_color', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Accent Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={branding?.accent_color || '#06b6d4'}
                        onChange={(e) => updateField('accent_color', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>AI Assistant</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Assistant Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={branding?.ai_assistant_name || ''}
                    onChange={(e) => updateField('ai_assistant_name', e.target.value)}
                    placeholder="AI Assistant"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Industry</Form.Label>
                  <Form.Select
                    value={branding?.industry || ''}
                    onChange={(e) => updateField('industry', e.target.value)}
                  >
                    <option value="">Select industry...</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="legal">Legal</option>
                    <option value="retail">Retail</option>
                    <option value="technology">Technology</option>
                  </Form.Select>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>Custom Domain</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Domain</Form.Label>
                  <Form.Control
                    type="text"
                    value={branding?.custom_domain || ''}
                    onChange={(e) => updateField('custom_domain', e.target.value)}
                    placeholder="app.yourcompany.com"
                  />
                </Form.Group>
                <p className="text-muted small">
                  {branding?.domain_verified
                    ? '✅ Domain verified'
                    : '⚠️ Domain not verified'}
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Form>
    </Container>
  );
}

export default BrandingPage;
```

**Step 3: Add route to App.js**

```javascript
import BrandingPage from './pages/BrandingPage';

<Route path="/settings/branding" element={<Layout><BrandingPage /></Layout>} />
```

**Step 4: Commit**

```bash
git add apps/web/src/pages/BrandingPage.js apps/web/src/services/branding.js apps/web/src/App.js
git commit -m "feat(frontend): add BrandingPage for whitelabel customization"
```

---

### Task 13: Update Navigation with New Pages

**Files:**
- Modify: `apps/web/src/components/Layout.js`

**Step 1: Add navigation links**

Update the sidebar navigation in `apps/web/src/components/Layout.js` to include:

```javascript
// In the navigation items array, add:
{ path: '/teams', icon: 'bi-people', label: 'Teams' },
{ path: '/memory', icon: 'bi-brain', label: 'Memory' },

// In settings section:
{ path: '/settings/llm', icon: 'bi-cpu', label: 'LLM Models' },
{ path: '/settings/branding', icon: 'bi-palette', label: 'Branding' },
```

**Step 2: Commit**

```bash
git add apps/web/src/components/Layout.js
git commit -m "feat(frontend): add navigation links for new pages"
```

---

### Task 14: Run All Tests and Final Commit

**Step 1: Run all backend tests**

Run: `cd apps/api && pytest tests/test_whitelabel.py -v`
Expected: All tests pass

**Step 2: Verify frontend builds**

Run: `cd apps/web && npm run build`
Expected: Build succeeds without errors

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(integration): complete Phase 5 - Full Integration

Part A - Model Integration:
- Agent: added llm_config_id, memory_config
- ChatSession: added agent_group_id, root_task_id, memory_context
- ChatMessage: added agent_id, task_id, reasoning, confidence, tokens_used
- Tenant: added branding/features relationships, default_llm_config_id
- AgentKit: added kit_type, default_agents, default_hierarchy, industry

Part B - Service Integration:
- EnhancedChatService with orchestration, memory, LLM routing
- Enhanced chat API routes
- LLMRouter with tenant config and usage tracking

Part C - Frontend:
- TeamsPage for agent group management
- MemoryPage for knowledge graph exploration
- LLMSettingsPage for model configuration
- BrandingPage for whitelabel customization
- Updated navigation"
```

---

## Summary

Phase 5 completes the integration:

**Part A (Tasks 1-5):** Model extensions connecting all features
**Part B (Tasks 6-8):** EnhancedChatService with full integration
**Part C (Tasks 9-14):** Frontend pages for all new features

Total: 14 tasks
Estimated time: ~2-3 hours using subagent-driven development
