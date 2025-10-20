from typing import List

from sqlalchemy.orm import Session
import uuid

from app.models.agent_kit import AgentKit
from app.schemas.agent_kit import AgentKitCreate, AgentKitBase

def get_agent_kit(db: Session, agent_kit_id: uuid.UUID) -> AgentKit | None:
    return db.query(AgentKit).filter(AgentKit.id == agent_kit_id).first()

def get_agent_kits_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[AgentKit]:
    return db.query(AgentKit).filter(AgentKit.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_agent_kit(db: Session, *, item_in: AgentKitCreate, tenant_id: uuid.UUID) -> AgentKit:
    db_item = AgentKit(**item_in.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_agent_kit(db: Session, *, db_obj: AgentKit, obj_in: AgentKitBase) -> AgentKit:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)
    
    for field in update_data:
        if hasattr(db_obj, field):
            setattr(db_obj, field, update_data[field])

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_agent_kit(db: Session, *, agent_kit_id: uuid.UUID) -> AgentKit | None:
    agent_kit = db.query(AgentKit).filter(AgentKit.id == agent_kit_id).first()
    if agent_kit:
        db.delete(agent_kit)
        db.commit()
    return agent_kit
