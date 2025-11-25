"""API routes for knowledge graph"""
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
