from typing import List

from sqlalchemy.orm import Session
import uuid

from app.models.integration import Integration
from app.schemas.integration import IntegrationCreate, IntegrationBase
from app.services import n8n_service

def get_integration(db: Session, integration_id: uuid.UUID) -> Integration | None:
    return db.query(Integration).filter(Integration.id == integration_id).first()

def get_integrations_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Integration]:
    return db.query(Integration).filter(Integration.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_integration(db: Session, *, item_in: IntegrationCreate, tenant_id: uuid.UUID) -> Integration:
    # Deploy n8n workflow if the connector type is n8n
    # This is a simplified example. In a real scenario, you would fetch the connector details
    # and use its schema to build the n8n workflow dynamically.
    if item_in.connector_id: # Assuming connector_id implies an n8n connector for now
        # Placeholder for n8n workflow deployment logic
        # For now, we'll just simulate a successful deployment
        print(f"Simulating n8n workflow deployment for connector {item_in.connector_id}")
        # workflow_response = n8n_service.deploy_workflow(item_in.config) # Actual call
        # if workflow_response:
        #     n8n_workflow_id = workflow_response["id"]
        # else:
        #     raise Exception("Failed to deploy n8n workflow")
        n8n_workflow_id = str(uuid.uuid4()) # Simulated n8n workflow ID
    else:
        n8n_workflow_id = None

    db_item = Integration(**item_in.dict(), tenant_id=tenant_id)
    # Store n8n_workflow_id in the integration config or a dedicated field if added to model
    if n8n_workflow_id:
        if not db_item.config:
            db_item.config = {}
        db_item.config["n8n_workflow_id"] = n8n_workflow_id

    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_integration(db: Session, *, db_obj: Integration, obj_in: IntegrationBase) -> Integration:
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

def delete_integration(db: Session, *, integration_id: uuid.UUID) -> Integration | None:
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if integration:
        # Deactivate/delete n8n workflow if applicable
        if integration.config and "n8n_workflow_id" in integration.config:
            print(f"Simulating n8n workflow deletion for {integration.config.get("n8n_workflow_id")}")
            # n8n_service.delete_workflow(integration.config["n8n_workflow_id"]) # Actual call

        db.delete(integration)
        db.commit()
    return integration