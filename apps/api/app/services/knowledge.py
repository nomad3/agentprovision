"""Service for managing knowledge graph entities and relations"""
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
