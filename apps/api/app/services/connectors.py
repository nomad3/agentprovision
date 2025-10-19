from typing import List

from sqlalchemy.orm import Session
import uuid

from app.models.connector import Connector
from app.schemas.connector import ConnectorCreate, ConnectorBase

def get_connector(db: Session, connector_id: uuid.UUID) -> Connector | None:
    return db.query(Connector).filter(Connector.id == connector_id).first()

def get_connectors_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Connector]:
    return db.query(Connector).filter(Connector.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_connector(db: Session, *, item_in: ConnectorCreate, tenant_id: uuid.UUID) -> Connector:
    db_item = Connector(**item_in.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_connector(db: Session, *, db_obj: Connector, obj_in: ConnectorBase) -> Connector:
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

def delete_connector(db: Session, *, connector_id: uuid.UUID) -> Connector | None:
    connector = db.query(Connector).filter(Connector.id == connector_id).first()
    if connector:
        db.delete(connector)
        db.commit()
    return connector
