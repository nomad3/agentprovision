from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.api import deps
from app.services import data_source as data_source_service

router = APIRouter()

@router.get("/", response_model=List[schemas.data_source.DataSource])
def read_data_sources(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    # current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Retrieve data sources.
    """
    # if crud.user.is_superuser(current_user):
    #     data_sources = service.data_source.get_multi(db, skip=skip, limit=limit)
    # else:
    data_sources = data_source_service.get_data_sources_by_tenant(
        db, tenant_id=1, skip=skip, limit=limit #current_user.tenant_id
    )
    return data_sources


@router.post("/", response_model=schemas.data_source.DataSource)
def create_data_source(
    *,
    db: Session = Depends(deps.get_db),
    item_in: schemas.data_source.DataSourceCreate,
    # current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Create new data source.
    """
    item = data_source_service.create_tenant_data_source(db=db, item=item_in, tenant_id=1)
    return item
