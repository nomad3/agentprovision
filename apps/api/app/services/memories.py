"""Service for managing agent memories"""
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
