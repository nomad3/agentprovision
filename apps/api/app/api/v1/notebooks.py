from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.api import deps
from app.services import notebook as notebook_service

router = APIRouter()

@router.get("/", response_model=List[schemas.notebook.Notebook])
def read_notebooks(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    # current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Retrieve notebooks.
    """
    # if crud.user.is_superuser(current_user):
    #     notebooks = service.notebook.get_multi(db, skip=skip, limit=limit)
    # else:
    notebooks = notebook_service.get_notebooks_by_tenant(
        db, tenant_id=1, skip=skip, limit=limit #current_user.tenant_id
    )
    return notebooks


@router.post("/", response_model=schemas.notebook.Notebook)
def create_notebook(
    *,
    db: Session = Depends(deps.get_db),
    item_in: schemas.notebook.NotebookCreate,
    # current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Create new notebook.
    """
    item = notebook_service.create_tenant_notebook(db=db, item=item_in, tenant_id=1)
    return item
