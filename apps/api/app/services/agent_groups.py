from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.models.agent_group import AgentGroup
from app.schemas.agent_group import AgentGroupCreate, AgentGroupUpdate


def create_agent_group(db: Session, group_in: AgentGroupCreate, tenant_id: uuid.UUID) -> AgentGroup:
    """Create a new agent group."""
    group = AgentGroup(
        name=group_in.name,
        description=group_in.description,
        tenant_id=tenant_id,
        goal=group_in.goal,
        strategy=group_in.strategy,
        shared_context=group_in.shared_context,
        escalation_rules=group_in.escalation_rules
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


def get_agent_group(db: Session, group_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[AgentGroup]:
    """Get agent group by ID."""
    return db.query(AgentGroup).filter(
        AgentGroup.id == group_id,
        AgentGroup.tenant_id == tenant_id
    ).first()


def get_agent_groups(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[AgentGroup]:
    """List all agent groups for a tenant."""
    return db.query(AgentGroup).filter(
        AgentGroup.tenant_id == tenant_id
    ).offset(skip).limit(limit).all()


def update_agent_group(db: Session, group_id: uuid.UUID, tenant_id: uuid.UUID, group_in: AgentGroupUpdate) -> Optional[AgentGroup]:
    """Update an agent group."""
    group = get_agent_group(db, group_id, tenant_id)
    if not group:
        return None

    update_data = group_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)

    db.commit()
    db.refresh(group)
    return group


def delete_agent_group(db: Session, group_id: uuid.UUID, tenant_id: uuid.UUID) -> bool:
    """Delete an agent group."""
    group = get_agent_group(db, group_id, tenant_id)
    if not group:
        return False
    db.delete(group)
    db.commit()
    return True
