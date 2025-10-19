from typing import List

from sqlalchemy.orm import Session
import uuid

from app.models.tool import Tool
from app.schemas.tool import ToolCreate, ToolBase

def get_tool(db: Session, tool_id: uuid.UUID) -> Tool | None:
    return db.query(Tool).filter(Tool.id == tool_id).first()

def get_tools_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Tool]:
    return db.query(Tool).filter(Tool.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_tool(db: Session, *, item_in: ToolCreate, tenant_id: uuid.UUID) -> Tool:
    db_item = Tool(**item_in.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_tool(db: Session, *, db_obj: Tool, obj_in: ToolBase) -> Tool:
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

def delete_tool(db: Session, *, tool_id: uuid.UUID) -> Tool | None:
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if tool:
        db.delete(tool)
        db.commit()
    return tool
