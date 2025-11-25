"""API routes for agent memories"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.agent_memory import AgentMemoryInDB, AgentMemoryCreate, AgentMemoryUpdate
from app.services import memories as service

router = APIRouter()


@router.post("", response_model=AgentMemoryInDB, status_code=201)
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


@router.get("/agent/{agent_id}", response_model=List[AgentMemoryInDB])
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


@router.get("/{memory_id}", response_model=AgentMemoryInDB)
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


@router.patch("/{memory_id}", response_model=AgentMemoryInDB)
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
