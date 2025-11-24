from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from app import schemas
from app.api import deps
from app.services import data_source as data_source_service
from app.models.user import User
from app.core.config import settings
import uuid

router = APIRouter()

@router.get("/", response_model=List[schemas.data_source.DataSource])
def read_data_sources(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve data sources for the current tenant.
    """
    data_sources = data_source_service.get_data_sources_by_tenant(
        db, tenant_id=current_user.tenant_id, skip=skip, limit=limit
    )
    return data_sources


@router.post("/", response_model=schemas.data_source.DataSource, status_code=status.HTTP_201_CREATED)
def create_data_source(
    *,
    db: Session = Depends(deps.get_db),
    item_in: schemas.data_source.DataSourceCreate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create new data source for the current tenant.
    """
    item = data_source_service.create_tenant_data_source(db=db, item_in=item_in, tenant_id=current_user.tenant_id)
    return item

@router.get("/{data_source_id}", response_model=schemas.data_source.DataSource)
def read_data_source_by_id(
    data_source_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve a specific data source by ID for the current tenant.
    """
    data_source = data_source_service.get_data_source(db, data_source_id=data_source_id)
    if not data_source or str(data_source.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found")
    return data_source

@router.put("/{data_source_id}", response_model=schemas.data_source.DataSource)
def update_data_source(
    *,
    db: Session = Depends(deps.get_db),
    data_source_id: uuid.UUID,
    item_in: schemas.data_source.DataSourceCreate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Update an existing data source for the current tenant.
    """
    data_source = data_source_service.get_data_source(db, data_source_id=data_source_id)
    if not data_source or str(data_source.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found")
    item = data_source_service.update_data_source(db=db, db_obj=data_source, obj_in=item_in)
    return item

@router.delete("/{data_source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_source(
    *,
    db: Session = Depends(deps.get_db),
    data_source_id: uuid.UUID,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Delete a data source for the current tenant.
    """
    data_source = data_source_service.get_data_source(db, data_source_id=data_source_id)
    if not data_source or str(data_source.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found")
    data_source_service.delete_data_source(db=db, data_source_id=data_source_id)
    return {"message": "Data source deleted successfully"}


# ==================== Internal Endpoints (MCP Server) ====================

@router.get("/{data_source_id}/with-credentials", response_model=schemas.data_source.DataSourceWithCredentials)
def get_data_source_with_credentials(
    data_source_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    x_internal_key: Optional[str] = Header(None, alias="X-Internal-Key"),
):
    """
    Get data source with decrypted credentials.

    INTERNAL USE ONLY - requires X-Internal-Key header.
    Used by MCP server to fetch connection credentials.
    """
    # Verify internal key
    if x_internal_key != settings.API_INTERNAL_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal key")

    data_source = data_source_service.get_data_source(db, data_source_id=data_source_id)
    if not data_source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found")

    # In production, decrypt sensitive fields here
    # For MVP, config is stored as-is
    return data_source