from typing import List

from sqlalchemy.orm import Session
import uuid

from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentBase

def get_agent(db: Session, agent_id: uuid.UUID) -> Agent | None:
    return db.query(Agent).filter(Agent.id == agent_id).first()

def get_agents_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Agent]:
    return db.query(Agent).filter(Agent.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_agent(db: Session, *, item_in: AgentCreate, tenant_id: uuid.UUID) -> Agent:
    db_item = Agent(**item_in.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_agent(db: Session, *, db_obj: Agent, obj_in: AgentBase) -> Agent:
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

def delete_agent(db: Session, *, agent_id: uuid.UUID) -> Agent | None:
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if agent:
        db.delete(agent)
        db.commit()
    return agent
