from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import schemas
from app.api import deps
from app.services import integrations as integration_service
from app.services import n8n_service
from app.models.user import User
from app.models.connector import Connector
import uuid

router = APIRouter()

@router.get("/", response_model=List[schemas.integration.Integration])
def read_integrations(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve integrations for the current tenant.
    """
    integrations = integration_service.get_integrations_by_tenant(
        db, tenant_id=current_user.tenant_id, skip=skip, limit=limit
    )
    return integrations


@router.post("/", response_model=schemas.integration.Integration, status_code=status.HTTP_201_CREATED)
def create_integration(
    *,
    db: Session = Depends(deps.get_db),
    item_in: schemas.integration.IntegrationCreate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create new integration for the current tenant.
    """
    item = integration_service.create_tenant_integration(db=db, item_in=item_in, tenant_id=current_user.tenant_id)
    return item

@router.get("/{integration_id}", response_model=schemas.integration.Integration)
def read_integration_by_id(
    integration_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve a specific integration by ID for the current tenant.
    """
    integration = integration_service.get_integration(db, integration_id=integration_id)
    if not integration or str(integration.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found")
    return integration

@router.put("/{integration_id}", response_model=schemas.integration.Integration)
def update_integration(
    *,
    db: Session = Depends(deps.get_db),
    integration_id: uuid.UUID,
    item_in: schemas.integration.IntegrationCreate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Update an existing integration for the current tenant.
    """
    integration = integration_service.get_integration(db, integration_id=integration_id)
    if not integration or str(integration.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found")
    item = integration_service.update_integration(db=db, db_obj=integration, obj_in=item_in)
    return item

@router.delete("/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_integration(
    *,
    db: Session = Depends(deps.get_db),
    integration_id: uuid.UUID,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Delete an integration for the current tenant.
    """
    integration = integration_service.get_integration(db, integration_id=integration_id)
    if not integration or str(integration.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found")
    integration_service.delete_integration(db=db, integration_id=integration_id)
    return {"message": "Integration deleted successfully"}

@router.get("/available", response_model=List[schemas.connector.Connector])
def get_available_connectors(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve a list of available connectors (n8n workflows).
    """
    # In a real scenario, this would fetch from a predefined catalog or dynamically from n8n
    # For now, we'll return a hardcoded list of connectors
    return [
        Connector(id=uuid.uuid4(), name="Salesforce CRM", description="Connects to Salesforce CRM", type="n8n", n8n_workflow_id="salesforce-workflow-id", schema={}, config={}, tenant_id=current_user.tenant_id),
        Connector(id=uuid.uuid4(), name="Snowflake Data Warehouse", description="Connects to Snowflake Data Warehouse", type="n8n", n8n_workflow_id="snowflake-workflow-id", schema={}, config={}, tenant_id=current_user.tenant_id),
    ]
