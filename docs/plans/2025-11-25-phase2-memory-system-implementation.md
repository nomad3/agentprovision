# Phase 2: Memory System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add three-tier agent memory system with hot context (PostgreSQL for now), semantic memory (vector embeddings), and knowledge graph for persistent facts.

**Architecture:** Create AgentMemory model for storing experiences with embeddings, KnowledgeEntity/KnowledgeRelation for structured knowledge graph. MemoryService handles store/recall/forget/share operations. Note: Redis integration deferred to production optimization phase - using PostgreSQL for hot context initially.

**Tech Stack:** FastAPI, SQLAlchemy, PostgreSQL, pgvector (for embeddings), Pydantic, pytest

**Reference:** See `docs/plans/2025-11-25-enterprise-ai-platform-design.md` for full design details.

---

## Task 1: Create AgentMemory Model

**Files:**
- Create: `apps/api/app/models/agent_memory.py`
- Create: `apps/api/app/schemas/agent_memory.py`
- Modify: `apps/api/app/db/init_db.py` (import new model)
- Test: `apps/api/tests/test_memory_system.py`

**Step 1: Write the failing test**

Create file `apps/api/tests/test_memory_system.py`:

```python
"""Tests for Phase 2: Memory System."""
import pytest

def test_agent_memory_model():
    """Test AgentMemory model has required fields."""
    from app.models.agent_memory import AgentMemory

    assert hasattr(AgentMemory, 'id')
    assert hasattr(AgentMemory, 'agent_id')
    assert hasattr(AgentMemory, 'tenant_id')
    assert hasattr(AgentMemory, 'memory_type')
    assert hasattr(AgentMemory, 'content')
    assert hasattr(AgentMemory, 'embedding')
    assert hasattr(AgentMemory, 'importance')
    assert hasattr(AgentMemory, 'access_count')
    assert hasattr(AgentMemory, 'source')
    assert hasattr(AgentMemory, 'source_task_id')
    assert hasattr(AgentMemory, 'expires_at')
    assert hasattr(AgentMemory, 'created_at')
    assert hasattr(AgentMemory, 'last_accessed_at')
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && pytest tests/test_memory_system.py::test_agent_memory_model -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'app.models.agent_memory'`

**Step 3: Create AgentMemory model**

Create file `apps/api/app/models/agent_memory.py`:

```python
import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, JSON, DateTime, Float, Integer, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.db.base import Base


class AgentMemory(Base):
    """Agent memory storage for experiences, facts, and learned patterns."""
    __tablename__ = "agent_memories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    # Memory classification
    memory_type = Column(String, nullable=False)  # fact, experience, skill, preference, relationship, procedure
    content = Column(Text, nullable=False)  # The actual memory content

    # Vector embedding for semantic search (stored as JSON array for now, pgvector later)
    embedding = Column(JSON, nullable=True)  # List of floats [1536 dimensions]

    # Memory importance and usage
    importance = Column(Float, default=0.5)  # 0-1, affects recall priority
    access_count = Column(Integer, default=0)  # How often recalled

    # Memory source tracking
    source = Column(String, nullable=True)  # conversation, training, observation, inference, user_feedback
    source_task_id = Column(UUID(as_uuid=True), ForeignKey("agent_tasks.id"), nullable=True)

    # Lifecycle
    expires_at = Column(DateTime, nullable=True)  # None = permanent

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_accessed_at = Column(DateTime, nullable=True)

    # Relationships
    agent = relationship("Agent")
    tenant = relationship("Tenant")
    source_task = relationship("AgentTask")
```

**Step 4: Create AgentMemory schema**

Create file `apps/api/app/schemas/agent_memory.py`:

```python
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid


class AgentMemoryBase(BaseModel):
    memory_type: str  # fact, experience, skill, preference, relationship, procedure
    content: str
    importance: Optional[float] = 0.5
    source: Optional[str] = None
    expires_at: Optional[datetime] = None


class AgentMemoryCreate(AgentMemoryBase):
    agent_id: uuid.UUID
    source_task_id: Optional[uuid.UUID] = None
    embedding: Optional[List[float]] = None


class AgentMemoryUpdate(BaseModel):
    content: Optional[str] = None
    importance: Optional[float] = None
    expires_at: Optional[datetime] = None


class AgentMemory(AgentMemoryBase):
    id: uuid.UUID
    agent_id: uuid.UUID
    tenant_id: uuid.UUID
    embedding: Optional[List[float]]
    access_count: int
    source_task_id: Optional[uuid.UUID]
    created_at: datetime
    last_accessed_at: Optional[datetime]

    class Config:
        from_attributes = True


class AgentMemoryWithSimilarity(AgentMemory):
    """Memory with similarity score from vector search."""
    similarity: float = 0.0
```

**Step 5: Update init_db.py**

Add import to `apps/api/app/db/init_db.py`:

```python
from app.models.agent_memory import AgentMemory  # noqa: F401
```

**Step 6: Run tests to verify they pass**

```bash
cd apps/api && pytest tests/test_memory_system.py -v
```

Expected: PASS

**Step 7: Commit**

```bash
git add apps/api/app/models/agent_memory.py apps/api/app/schemas/agent_memory.py apps/api/app/db/init_db.py apps/api/tests/test_memory_system.py
git commit -m "feat(memory): add AgentMemory model for agent experiences and facts"
```

---

## Task 2: Create KnowledgeEntity Model

**Files:**
- Create: `apps/api/app/models/knowledge_entity.py`
- Create: `apps/api/app/schemas/knowledge_entity.py`
- Modify: `apps/api/app/db/init_db.py`
- Test: `apps/api/tests/test_memory_system.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_memory_system.py`:

```python
def test_knowledge_entity_model():
    """Test KnowledgeEntity model has required fields."""
    from app.models.knowledge_entity import KnowledgeEntity

    assert hasattr(KnowledgeEntity, 'id')
    assert hasattr(KnowledgeEntity, 'tenant_id')
    assert hasattr(KnowledgeEntity, 'entity_type')
    assert hasattr(KnowledgeEntity, 'name')
    assert hasattr(KnowledgeEntity, 'attributes')
    assert hasattr(KnowledgeEntity, 'confidence')
    assert hasattr(KnowledgeEntity, 'source_agent_id')
    assert hasattr(KnowledgeEntity, 'created_at')
    assert hasattr(KnowledgeEntity, 'updated_at')
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && pytest tests/test_memory_system.py::test_knowledge_entity_model -v
```

Expected: FAIL

**Step 3: Create KnowledgeEntity model**

Create file `apps/api/app/models/knowledge_entity.py`:

```python
import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, JSON, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class KnowledgeEntity(Base):
    """Knowledge graph entity - represents a thing, concept, or person."""
    __tablename__ = "knowledge_entities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    # Entity definition
    entity_type = Column(String, nullable=False)  # customer, product, concept, person, organization, location
    name = Column(String, nullable=False, index=True)
    attributes = Column(JSON, nullable=True)  # Flexible attribute storage

    # Confidence and provenance
    confidence = Column(Float, default=1.0)  # How confident are we in this entity
    source_agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tenant = relationship("Tenant")
    source_agent = relationship("Agent")
```

**Step 4: Create KnowledgeEntity schema**

Create file `apps/api/app/schemas/knowledge_entity.py`:

```python
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class KnowledgeEntityBase(BaseModel):
    entity_type: str  # customer, product, concept, person, organization, location
    name: str
    attributes: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = 1.0


class KnowledgeEntityCreate(KnowledgeEntityBase):
    source_agent_id: Optional[uuid.UUID] = None


class KnowledgeEntityUpdate(BaseModel):
    name: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None


class KnowledgeEntity(KnowledgeEntityBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    source_agent_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

**Step 5: Update init_db.py**

```python
from app.models.knowledge_entity import KnowledgeEntity  # noqa: F401
```

**Step 6: Run tests**

```bash
cd apps/api && pytest tests/test_memory_system.py -v
```

Expected: PASS

**Step 7: Commit**

```bash
git add apps/api/app/models/knowledge_entity.py apps/api/app/schemas/knowledge_entity.py apps/api/app/db/init_db.py apps/api/tests/test_memory_system.py
git commit -m "feat(memory): add KnowledgeEntity model for knowledge graph"
```

---

## Task 3: Create KnowledgeRelation Model

**Files:**
- Create: `apps/api/app/models/knowledge_relation.py`
- Create: `apps/api/app/schemas/knowledge_relation.py`
- Modify: `apps/api/app/db/init_db.py`
- Test: `apps/api/tests/test_memory_system.py`

**Step 1: Write the failing test**

Add to test file:

```python
def test_knowledge_relation_model():
    """Test KnowledgeRelation model has required fields."""
    from app.models.knowledge_relation import KnowledgeRelation

    assert hasattr(KnowledgeRelation, 'id')
    assert hasattr(KnowledgeRelation, 'tenant_id')
    assert hasattr(KnowledgeRelation, 'from_entity_id')
    assert hasattr(KnowledgeRelation, 'to_entity_id')
    assert hasattr(KnowledgeRelation, 'relation_type')
    assert hasattr(KnowledgeRelation, 'strength')
    assert hasattr(KnowledgeRelation, 'evidence')
    assert hasattr(KnowledgeRelation, 'discovered_by_agent_id')
    assert hasattr(KnowledgeRelation, 'created_at')
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && pytest tests/test_memory_system.py::test_knowledge_relation_model -v
```

**Step 3: Create KnowledgeRelation model**

Create file `apps/api/app/models/knowledge_relation.py`:

```python
import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, JSON, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class KnowledgeRelation(Base):
    """Knowledge graph relation - connects two entities."""
    __tablename__ = "knowledge_relations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    # Relation endpoints
    from_entity_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_entities.id"), nullable=False)
    to_entity_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_entities.id"), nullable=False)

    # Relation definition
    relation_type = Column(String, nullable=False)  # works_at, purchased, prefers, related_to, knows, owns
    strength = Column(Float, default=1.0)  # How strong is this relationship
    evidence = Column(JSON, nullable=True)  # Supporting evidence/context

    # Provenance
    discovered_by_agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tenant = relationship("Tenant")
    from_entity = relationship("KnowledgeEntity", foreign_keys=[from_entity_id])
    to_entity = relationship("KnowledgeEntity", foreign_keys=[to_entity_id])
    discovered_by_agent = relationship("Agent")
```

**Step 4: Create KnowledgeRelation schema**

Create file `apps/api/app/schemas/knowledge_relation.py`:

```python
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class KnowledgeRelationBase(BaseModel):
    from_entity_id: uuid.UUID
    to_entity_id: uuid.UUID
    relation_type: str  # works_at, purchased, prefers, related_to, knows, owns
    strength: Optional[float] = 1.0
    evidence: Optional[Dict[str, Any]] = None


class KnowledgeRelationCreate(KnowledgeRelationBase):
    discovered_by_agent_id: Optional[uuid.UUID] = None


class KnowledgeRelationUpdate(BaseModel):
    strength: Optional[float] = None
    evidence: Optional[Dict[str, Any]] = None


class KnowledgeRelation(KnowledgeRelationBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    discovered_by_agent_id: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True
```

**Step 5: Update init_db.py**

```python
from app.models.knowledge_relation import KnowledgeRelation  # noqa: F401
```

**Step 6: Run tests**

```bash
cd apps/api && pytest tests/test_memory_system.py -v
```

**Step 7: Commit**

```bash
git add apps/api/app/models/knowledge_relation.py apps/api/app/schemas/knowledge_relation.py apps/api/app/db/init_db.py apps/api/tests/test_memory_system.py
git commit -m "feat(memory): add KnowledgeRelation model for knowledge graph edges"
```

---

## Task 4: Create Memory API Routes

**Files:**
- Create: `apps/api/app/services/memories.py`
- Create: `apps/api/app/api/v1/memories.py`
- Modify: `apps/api/app/api/v1/routes.py`
- Test: `apps/api/tests/test_memory_system.py`

**Step 1: Write the failing test**

Add to test file:

```python
def test_memory_schema():
    """Test AgentMemory schemas work correctly."""
    from app.schemas.agent_memory import AgentMemoryCreate
    import uuid

    create_data = AgentMemoryCreate(
        agent_id=uuid.uuid4(),
        memory_type="fact",
        content="Customer prefers email communication",
        importance=0.8,
        source="conversation"
    )
    assert create_data.memory_type == "fact"
    assert create_data.importance == 0.8
```

**Step 2: Create memories service**

Create file `apps/api/app/services/memories.py`:

```python
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from app.models.agent_memory import AgentMemory
from app.models.agent import Agent
from app.schemas.agent_memory import AgentMemoryCreate, AgentMemoryUpdate


def create_memory(db: Session, memory_in: AgentMemoryCreate, tenant_id: uuid.UUID) -> AgentMemory:
    """Create a new agent memory."""
    # Verify agent belongs to tenant
    agent = db.query(Agent).filter(
        Agent.id == memory_in.agent_id,
        Agent.tenant_id == tenant_id
    ).first()
    if not agent:
        raise ValueError("Agent not found or doesn't belong to tenant")

    memory = AgentMemory(
        agent_id=memory_in.agent_id,
        tenant_id=tenant_id,
        memory_type=memory_in.memory_type,
        content=memory_in.content,
        embedding=memory_in.embedding,
        importance=memory_in.importance or 0.5,
        source=memory_in.source,
        source_task_id=memory_in.source_task_id,
        expires_at=memory_in.expires_at
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return memory


def get_memory(db: Session, memory_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[AgentMemory]:
    """Get memory by ID."""
    memory = db.query(AgentMemory).filter(
        AgentMemory.id == memory_id,
        AgentMemory.tenant_id == tenant_id
    ).first()

    if memory:
        # Update access count and timestamp
        memory.access_count += 1
        memory.last_accessed_at = datetime.utcnow()
        db.commit()
        db.refresh(memory)

    return memory


def get_agent_memories(
    db: Session,
    agent_id: uuid.UUID,
    tenant_id: uuid.UUID,
    memory_type: str = None,
    skip: int = 0,
    limit: int = 100
) -> List[AgentMemory]:
    """List memories for an agent."""
    query = db.query(AgentMemory).filter(
        AgentMemory.agent_id == agent_id,
        AgentMemory.tenant_id == tenant_id
    )

    if memory_type:
        query = query.filter(AgentMemory.memory_type == memory_type)

    # Filter expired memories
    query = query.filter(
        (AgentMemory.expires_at.is_(None)) | (AgentMemory.expires_at > datetime.utcnow())
    )

    return query.order_by(AgentMemory.importance.desc()).offset(skip).limit(limit).all()


def update_memory(
    db: Session,
    memory_id: uuid.UUID,
    tenant_id: uuid.UUID,
    memory_in: AgentMemoryUpdate
) -> Optional[AgentMemory]:
    """Update a memory."""
    memory = db.query(AgentMemory).filter(
        AgentMemory.id == memory_id,
        AgentMemory.tenant_id == tenant_id
    ).first()

    if not memory:
        return None

    update_data = memory_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(memory, field, value)

    db.commit()
    db.refresh(memory)
    return memory


def delete_memory(db: Session, memory_id: uuid.UUID, tenant_id: uuid.UUID) -> bool:
    """Delete a memory (forget)."""
    memory = db.query(AgentMemory).filter(
        AgentMemory.id == memory_id,
        AgentMemory.tenant_id == tenant_id
    ).first()

    if not memory:
        return False

    db.delete(memory)
    db.commit()
    return True
```

**Step 3: Create memories routes**

Create file `apps/api/app/api/v1/memories.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.agent_memory import AgentMemory, AgentMemoryCreate, AgentMemoryUpdate
from app.services import memories as service

router = APIRouter()


@router.post("", response_model=AgentMemory, status_code=201)
def create_memory(
    memory_in: AgentMemoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Store a new memory for an agent."""
    try:
        return service.create_memory(db, memory_in, current_user.tenant_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/agent/{agent_id}", response_model=List[AgentMemory])
def get_agent_memories(
    agent_id: uuid.UUID,
    memory_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all memories for an agent."""
    return service.get_agent_memories(
        db, agent_id, current_user.tenant_id, memory_type, skip, limit
    )


@router.get("/{memory_id}", response_model=AgentMemory)
def get_memory(
    memory_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recall a specific memory."""
    memory = service.get_memory(db, memory_id, current_user.tenant_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory


@router.patch("/{memory_id}", response_model=AgentMemory)
def update_memory(
    memory_id: uuid.UUID,
    memory_in: AgentMemoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a memory's importance or content."""
    memory = service.update_memory(db, memory_id, current_user.tenant_id, memory_in)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory


@router.delete("/{memory_id}", status_code=204)
def delete_memory(
    memory_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Forget a memory."""
    if not service.delete_memory(db, memory_id, current_user.tenant_id):
        raise HTTPException(status_code=404, detail="Memory not found")
```

**Step 4: Update routes.py**

Add to `apps/api/app/api/v1/routes.py`:

```python
from app.api.v1 import memories

router.include_router(memories.router, prefix="/memories", tags=["memories"])
```

**Step 5: Run tests**

```bash
cd apps/api && pytest tests/test_memory_system.py -v
```

**Step 6: Commit**

```bash
git add apps/api/app/services/memories.py apps/api/app/api/v1/memories.py apps/api/app/api/v1/routes.py apps/api/tests/test_memory_system.py
git commit -m "feat(memory): add Memory API routes for store/recall/forget"
```

---

## Task 5: Create Knowledge Graph API Routes

**Files:**
- Create: `apps/api/app/services/knowledge.py`
- Create: `apps/api/app/api/v1/knowledge.py`
- Modify: `apps/api/app/api/v1/routes.py`
- Test: `apps/api/tests/test_memory_system.py`

**Step 1: Write the failing test**

Add to test file:

```python
def test_knowledge_entity_schema():
    """Test KnowledgeEntity schemas work correctly."""
    from app.schemas.knowledge_entity import KnowledgeEntityCreate

    create_data = KnowledgeEntityCreate(
        entity_type="customer",
        name="Acme Corp",
        attributes={"industry": "tech", "size": "enterprise"},
        confidence=0.95
    )
    assert create_data.entity_type == "customer"
    assert create_data.name == "Acme Corp"


def test_knowledge_relation_schema():
    """Test KnowledgeRelation schemas work correctly."""
    from app.schemas.knowledge_relation import KnowledgeRelationCreate
    import uuid

    create_data = KnowledgeRelationCreate(
        from_entity_id=uuid.uuid4(),
        to_entity_id=uuid.uuid4(),
        relation_type="purchased",
        strength=0.9,
        evidence={"order_id": "123"}
    )
    assert create_data.relation_type == "purchased"
```

**Step 2: Create knowledge service**

Create file `apps/api/app/services/knowledge.py`:

```python
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.models.knowledge_entity import KnowledgeEntity
from app.models.knowledge_relation import KnowledgeRelation
from app.schemas.knowledge_entity import KnowledgeEntityCreate, KnowledgeEntityUpdate
from app.schemas.knowledge_relation import KnowledgeRelationCreate, KnowledgeRelationUpdate


# Entity operations
def create_entity(db: Session, entity_in: KnowledgeEntityCreate, tenant_id: uuid.UUID) -> KnowledgeEntity:
    """Create a knowledge entity."""
    entity = KnowledgeEntity(
        tenant_id=tenant_id,
        entity_type=entity_in.entity_type,
        name=entity_in.name,
        attributes=entity_in.attributes,
        confidence=entity_in.confidence or 1.0,
        source_agent_id=entity_in.source_agent_id
    )
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


def get_entity(db: Session, entity_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[KnowledgeEntity]:
    """Get entity by ID."""
    return db.query(KnowledgeEntity).filter(
        KnowledgeEntity.id == entity_id,
        KnowledgeEntity.tenant_id == tenant_id
    ).first()


def get_entities(
    db: Session,
    tenant_id: uuid.UUID,
    entity_type: str = None,
    skip: int = 0,
    limit: int = 100
) -> List[KnowledgeEntity]:
    """List entities."""
    query = db.query(KnowledgeEntity).filter(KnowledgeEntity.tenant_id == tenant_id)
    if entity_type:
        query = query.filter(KnowledgeEntity.entity_type == entity_type)
    return query.offset(skip).limit(limit).all()


def search_entities(
    db: Session,
    tenant_id: uuid.UUID,
    name_query: str,
    entity_type: str = None
) -> List[KnowledgeEntity]:
    """Search entities by name."""
    query = db.query(KnowledgeEntity).filter(
        KnowledgeEntity.tenant_id == tenant_id,
        KnowledgeEntity.name.ilike(f"%{name_query}%")
    )
    if entity_type:
        query = query.filter(KnowledgeEntity.entity_type == entity_type)
    return query.limit(50).all()


def update_entity(
    db: Session,
    entity_id: uuid.UUID,
    tenant_id: uuid.UUID,
    entity_in: KnowledgeEntityUpdate
) -> Optional[KnowledgeEntity]:
    """Update an entity."""
    entity = get_entity(db, entity_id, tenant_id)
    if not entity:
        return None

    update_data = entity_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entity, field, value)

    db.commit()
    db.refresh(entity)
    return entity


def delete_entity(db: Session, entity_id: uuid.UUID, tenant_id: uuid.UUID) -> bool:
    """Delete an entity and its relations."""
    entity = get_entity(db, entity_id, tenant_id)
    if not entity:
        return False

    # Delete related relations
    db.query(KnowledgeRelation).filter(
        (KnowledgeRelation.from_entity_id == entity_id) |
        (KnowledgeRelation.to_entity_id == entity_id)
    ).delete(synchronize_session=False)

    db.delete(entity)
    db.commit()
    return True


# Relation operations
def create_relation(db: Session, relation_in: KnowledgeRelationCreate, tenant_id: uuid.UUID) -> KnowledgeRelation:
    """Create a relation between entities."""
    # Verify both entities exist and belong to tenant
    from_entity = get_entity(db, relation_in.from_entity_id, tenant_id)
    to_entity = get_entity(db, relation_in.to_entity_id, tenant_id)

    if not from_entity or not to_entity:
        raise ValueError("One or both entities not found")

    relation = KnowledgeRelation(
        tenant_id=tenant_id,
        from_entity_id=relation_in.from_entity_id,
        to_entity_id=relation_in.to_entity_id,
        relation_type=relation_in.relation_type,
        strength=relation_in.strength or 1.0,
        evidence=relation_in.evidence,
        discovered_by_agent_id=relation_in.discovered_by_agent_id
    )
    db.add(relation)
    db.commit()
    db.refresh(relation)
    return relation


def get_entity_relations(
    db: Session,
    entity_id: uuid.UUID,
    tenant_id: uuid.UUID,
    direction: str = "both"
) -> List[KnowledgeRelation]:
    """Get all relations for an entity."""
    query = db.query(KnowledgeRelation).filter(KnowledgeRelation.tenant_id == tenant_id)

    if direction == "outgoing":
        query = query.filter(KnowledgeRelation.from_entity_id == entity_id)
    elif direction == "incoming":
        query = query.filter(KnowledgeRelation.to_entity_id == entity_id)
    else:  # both
        query = query.filter(
            (KnowledgeRelation.from_entity_id == entity_id) |
            (KnowledgeRelation.to_entity_id == entity_id)
        )

    return query.all()


def delete_relation(db: Session, relation_id: uuid.UUID, tenant_id: uuid.UUID) -> bool:
    """Delete a relation."""
    relation = db.query(KnowledgeRelation).filter(
        KnowledgeRelation.id == relation_id,
        KnowledgeRelation.tenant_id == tenant_id
    ).first()

    if not relation:
        return False

    db.delete(relation)
    db.commit()
    return True
```

**Step 3: Create knowledge routes**

Create file `apps/api/app/api/v1/knowledge.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.knowledge_entity import KnowledgeEntity, KnowledgeEntityCreate, KnowledgeEntityUpdate
from app.schemas.knowledge_relation import KnowledgeRelation, KnowledgeRelationCreate
from app.services import knowledge as service

router = APIRouter()


# Entity endpoints
@router.post("/entities", response_model=KnowledgeEntity, status_code=201)
def create_entity(
    entity_in: KnowledgeEntityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new knowledge entity."""
    return service.create_entity(db, entity_in, current_user.tenant_id)


@router.get("/entities", response_model=List[KnowledgeEntity])
def list_entities(
    entity_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all entities."""
    return service.get_entities(db, current_user.tenant_id, entity_type, skip, limit)


@router.get("/entities/search", response_model=List[KnowledgeEntity])
def search_entities(
    q: str,
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search entities by name."""
    return service.search_entities(db, current_user.tenant_id, q, entity_type)


@router.get("/entities/{entity_id}", response_model=KnowledgeEntity)
def get_entity(
    entity_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get entity by ID."""
    entity = service.get_entity(db, entity_id, current_user.tenant_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity


@router.put("/entities/{entity_id}", response_model=KnowledgeEntity)
def update_entity(
    entity_id: uuid.UUID,
    entity_in: KnowledgeEntityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an entity."""
    entity = service.update_entity(db, entity_id, current_user.tenant_id, entity_in)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity


@router.delete("/entities/{entity_id}", status_code=204)
def delete_entity(
    entity_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an entity and its relations."""
    if not service.delete_entity(db, entity_id, current_user.tenant_id):
        raise HTTPException(status_code=404, detail="Entity not found")


# Relation endpoints
@router.post("/relations", response_model=KnowledgeRelation, status_code=201)
def create_relation(
    relation_in: KnowledgeRelationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a relation between entities."""
    try:
        return service.create_relation(db, relation_in, current_user.tenant_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/entities/{entity_id}/relations", response_model=List[KnowledgeRelation])
def get_entity_relations(
    entity_id: uuid.UUID,
    direction: str = "both",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all relations for an entity."""
    return service.get_entity_relations(db, entity_id, current_user.tenant_id, direction)


@router.delete("/relations/{relation_id}", status_code=204)
def delete_relation(
    relation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a relation."""
    if not service.delete_relation(db, relation_id, current_user.tenant_id):
        raise HTTPException(status_code=404, detail="Relation not found")
```

**Step 4: Update routes.py**

```python
from app.api.v1 import knowledge

router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
```

**Step 5: Run tests**

```bash
cd apps/api && pytest tests/test_memory_system.py -v
```

**Step 6: Commit**

```bash
git add apps/api/app/services/knowledge.py apps/api/app/api/v1/knowledge.py apps/api/app/api/v1/routes.py apps/api/tests/test_memory_system.py
git commit -m "feat(memory): add Knowledge Graph API for entities and relations"
```

---

## Task 6: Create MemoryService for Store/Recall Operations

**Files:**
- Create: `apps/api/app/services/memory/__init__.py`
- Create: `apps/api/app/services/memory/memory_service.py`
- Test: `apps/api/tests/test_memory_system.py`

**Step 1: Write the failing test**

Add to test file:

```python
def test_memory_service_class():
    """Test MemoryService class exists with required methods."""
    from app.services.memory.memory_service import MemoryService

    assert hasattr(MemoryService, 'store')
    assert hasattr(MemoryService, 'recall')
    assert hasattr(MemoryService, 'forget')
    assert hasattr(MemoryService, 'share')
    assert hasattr(MemoryService, 'get_relevant_memories')
    assert callable(getattr(MemoryService, 'store'))
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && pytest tests/test_memory_system.py::test_memory_service_class -v
```

**Step 3: Create MemoryService**

Create directory: `mkdir -p apps/api/app/services/memory`

Create `apps/api/app/services/memory/__init__.py`:

```python
from .memory_service import MemoryService

__all__ = ["MemoryService"]
```

Create `apps/api/app/services/memory/memory_service.py`:

```python
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from app.models.agent_memory import AgentMemory
from app.models.agent import Agent
from app.schemas.agent_memory import AgentMemoryCreate


class MemoryService:
    """
    Unified memory service for store/recall/forget/share operations.

    Provides a high-level interface for agent memory management,
    handling the three-tier memory system:
    - Tier 1: Hot context (PostgreSQL for now, Redis in production)
    - Tier 2: Semantic memory (vector embeddings)
    - Tier 3: Knowledge graph (permanent facts)
    """

    def __init__(self, db: Session):
        self.db = db

    def store(
        self,
        agent_id: uuid.UUID,
        tenant_id: uuid.UUID,
        memory_type: str,
        content: str,
        importance: float = 0.5,
        source: str = None,
        source_task_id: uuid.UUID = None,
        embedding: List[float] = None,
        expires_at: datetime = None
    ) -> AgentMemory:
        """
        Store a new memory for an agent.

        Args:
            agent_id: Agent to store memory for
            tenant_id: Tenant for isolation
            memory_type: Type of memory (fact, experience, skill, preference, relationship, procedure)
            content: The memory content
            importance: Priority for recall (0-1)
            source: Where this memory came from
            source_task_id: Task that generated this memory
            embedding: Vector embedding for semantic search
            expires_at: When this memory expires (None = permanent)

        Returns:
            Created AgentMemory
        """
        memory = AgentMemory(
            agent_id=agent_id,
            tenant_id=tenant_id,
            memory_type=memory_type,
            content=content,
            importance=importance,
            source=source,
            source_task_id=source_task_id,
            embedding=embedding,
            expires_at=expires_at
        )
        self.db.add(memory)
        self.db.commit()
        self.db.refresh(memory)
        return memory

    def recall(self, memory_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[AgentMemory]:
        """
        Recall a specific memory by ID.
        Updates access count and last accessed timestamp.
        """
        memory = self.db.query(AgentMemory).filter(
            AgentMemory.id == memory_id,
            AgentMemory.tenant_id == tenant_id
        ).first()

        if memory:
            memory.access_count += 1
            memory.last_accessed_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(memory)

        return memory

    def forget(self, memory_id: uuid.UUID, tenant_id: uuid.UUID) -> bool:
        """
        Delete a memory.
        Returns True if memory was deleted, False if not found.
        """
        memory = self.db.query(AgentMemory).filter(
            AgentMemory.id == memory_id,
            AgentMemory.tenant_id == tenant_id
        ).first()

        if not memory:
            return False

        self.db.delete(memory)
        self.db.commit()
        return True

    def share(
        self,
        from_agent_id: uuid.UUID,
        to_agent_id: uuid.UUID,
        memory_ids: List[uuid.UUID],
        tenant_id: uuid.UUID
    ) -> List[AgentMemory]:
        """
        Share memories from one agent to another.
        Creates copies of the memories for the target agent.
        """
        shared_memories = []

        for memory_id in memory_ids:
            original = self.db.query(AgentMemory).filter(
                AgentMemory.id == memory_id,
                AgentMemory.agent_id == from_agent_id,
                AgentMemory.tenant_id == tenant_id
            ).first()

            if original:
                # Create copy for target agent
                shared = AgentMemory(
                    agent_id=to_agent_id,
                    tenant_id=tenant_id,
                    memory_type=original.memory_type,
                    content=original.content,
                    embedding=original.embedding,
                    importance=original.importance * 0.8,  # Slightly lower importance for shared memories
                    source="shared",
                    expires_at=original.expires_at
                )
                self.db.add(shared)
                shared_memories.append(shared)

        self.db.commit()
        for memory in shared_memories:
            self.db.refresh(memory)

        return shared_memories

    def get_relevant_memories(
        self,
        agent_id: uuid.UUID,
        tenant_id: uuid.UUID,
        memory_types: List[str] = None,
        limit: int = 10,
        min_importance: float = 0.0
    ) -> List[AgentMemory]:
        """
        Get the most relevant active memories for an agent.

        Args:
            agent_id: Agent to get memories for
            tenant_id: Tenant for isolation
            memory_types: Filter by memory types (None = all)
            limit: Maximum memories to return
            min_importance: Minimum importance threshold

        Returns:
            List of memories ordered by importance
        """
        query = self.db.query(AgentMemory).filter(
            AgentMemory.agent_id == agent_id,
            AgentMemory.tenant_id == tenant_id,
            AgentMemory.importance >= min_importance
        )

        # Filter expired
        query = query.filter(
            (AgentMemory.expires_at.is_(None)) | (AgentMemory.expires_at > datetime.utcnow())
        )

        if memory_types:
            query = query.filter(AgentMemory.memory_type.in_(memory_types))

        return query.order_by(AgentMemory.importance.desc()).limit(limit).all()

    def get_recent_memories(
        self,
        agent_id: uuid.UUID,
        tenant_id: uuid.UUID,
        limit: int = 10
    ) -> List[AgentMemory]:
        """Get the most recently created/accessed memories."""
        return self.db.query(AgentMemory).filter(
            AgentMemory.agent_id == agent_id,
            AgentMemory.tenant_id == tenant_id
        ).order_by(AgentMemory.last_accessed_at.desc().nullsfirst()).limit(limit).all()

    def consolidate_memories(
        self,
        agent_id: uuid.UUID,
        tenant_id: uuid.UUID,
        min_access_count: int = 5
    ) -> int:
        """
        Consolidate frequently accessed memories by boosting their importance.
        Returns number of memories consolidated.
        """
        memories = self.db.query(AgentMemory).filter(
            AgentMemory.agent_id == agent_id,
            AgentMemory.tenant_id == tenant_id,
            AgentMemory.access_count >= min_access_count,
            AgentMemory.importance < 0.9
        ).all()

        count = 0
        for memory in memories:
            # Boost importance based on access frequency
            memory.importance = min(0.95, memory.importance + 0.1)
            count += 1

        self.db.commit()
        return count
```

**Step 4: Run tests**

```bash
cd apps/api && pytest tests/test_memory_system.py -v
```

**Step 5: Commit**

```bash
git add apps/api/app/services/memory/ apps/api/tests/test_memory_system.py
git commit -m "feat(memory): add MemoryService for unified store/recall/forget/share operations"
```

---

## Task 7: Run All Tests and Final Commit

**Step 1: Run complete test suite**

```bash
cd apps/api && pytest tests/test_memory_system.py -v
```

Expected: All tests PASS

**Step 2: Run existing tests to ensure no regressions**

```bash
cd apps/api && pytest tests/test_agent_orchestration.py -v
```

Expected: All orchestration tests still pass

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(memory): complete Phase 2 - Memory System

- Added AgentMemory model for experiences, facts, and learned patterns
- Added KnowledgeEntity model for knowledge graph nodes
- Added KnowledgeRelation model for knowledge graph edges
- Added Memory API routes (store, recall, forget)
- Added Knowledge Graph API routes (entities, relations, search)
- Added MemoryService for unified memory operations
- Supports memory types: fact, experience, skill, preference, relationship, procedure
- Vector embedding field ready for semantic search (pgvector integration later)

Part of Enterprise AI Platform - see docs/plans/2025-11-25-enterprise-ai-platform-design.md"
```

---

## Verification Checklist

After completing all tasks:

- [ ] AgentMemory model created and imported in init_db.py
- [ ] KnowledgeEntity model created and imported
- [ ] KnowledgeRelation model created and imported
- [ ] Memory API routes registered (/api/v1/memories)
- [ ] Knowledge Graph API routes registered (/api/v1/knowledge)
- [ ] MemoryService with store/recall/forget/share operations
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Code committed with descriptive messages

## New API Endpoints

After Phase 2 completion:

```
# Memory endpoints
POST   /api/v1/memories              - Store a memory
GET    /api/v1/memories/agent/{id}   - Get agent memories
GET    /api/v1/memories/{id}         - Recall specific memory
PATCH  /api/v1/memories/{id}         - Update memory
DELETE /api/v1/memories/{id}         - Forget memory

# Knowledge Graph endpoints
POST   /api/v1/knowledge/entities           - Create entity
GET    /api/v1/knowledge/entities           - List entities
GET    /api/v1/knowledge/entities/search    - Search entities
GET    /api/v1/knowledge/entities/{id}      - Get entity
PUT    /api/v1/knowledge/entities/{id}      - Update entity
DELETE /api/v1/knowledge/entities/{id}      - Delete entity
POST   /api/v1/knowledge/relations          - Create relation
GET    /api/v1/knowledge/entities/{id}/relations - Get entity relations
DELETE /api/v1/knowledge/relations/{id}     - Delete relation
```

## Next Phase

After Phase 2 is complete, proceed to **Phase 3: Multi-LLM Router** which will add:
- LLMProvider model
- LLMModel model with 50+ models across providers
- LLMConfig for tenant settings
- LLMRouter service for intelligent model selection
- Provider abstraction for API calls

---

**Plan complete.** This document contains 7 bite-sized tasks with exact file paths, complete code, and test commands.
