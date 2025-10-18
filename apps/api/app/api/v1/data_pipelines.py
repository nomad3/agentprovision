from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.api import deps
from app.services import data_pipeline as data_pipeline_service

router = APIRouter()

@router.get("/", response_model=List[schemas.data_pipeline.DataPipeline])
def read_data_pipelines(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    # current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Retrieve data pipelines.
    """
    # if crud.user.is_superuser(current_user):
    #     data_pipelines = service.data_pipeline.get_multi(db, skip=skip, limit=limit)
    # else:
    data_pipelines = data_pipeline_service.get_data_pipelines_by_tenant(
        db, tenant_id=1, skip=skip, limit=limit #current_user.tenant_id
    )
    return data_pipelines


@router.post("/", response_model=schemas.data_pipeline.DataPipeline)
def create_data_pipeline(
    *,
    db: Session = Depends(deps.get_db),
    item_in: schemas.data_pipeline.DataPipelineCreate,
    # current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Create new data pipeline.
    """
    item = data_pipeline_service.create_tenant_data_pipeline(db=db, item=item_in, tenant_id=1)
    return item
