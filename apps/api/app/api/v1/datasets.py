from __future__ import annotations

from typing import List
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas import dataset as dataset_schema
from app.services import datasets as dataset_service

router = APIRouter()


@router.get("/", response_model=List[dataset_schema.Dataset])
def list_datasets(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    return dataset_service.list_datasets(db, tenant_id=current_user.tenant_id)


@router.post("/upload", response_model=dataset_schema.Dataset, status_code=status.HTTP_201_CREATED)
def upload_dataset(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str | None = Form(None),
    current_user: User = Depends(deps.get_current_active_user),
):
    if file.content_type not in {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only Excel uploads are supported")
    try:
        dataset = dataset_service.ingest_excel(
            db,
            tenant_id=current_user.tenant_id,
            file=file,
            name=name,
            description=description,
        )
        return dataset
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{dataset_id}", response_model=dataset_schema.Dataset)
def read_dataset(
    dataset_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    dataset = dataset_service.get_dataset(db, dataset_id=dataset_id, tenant_id=current_user.tenant_id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    return dataset


@router.get("/{dataset_id}/preview", response_model=dataset_schema.DatasetPreview)
def preview_dataset(
    dataset_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    dataset = dataset_service.get_dataset(db, dataset_id=dataset_id, tenant_id=current_user.tenant_id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    return dataset_service.dataset_preview(dataset)


@router.get("/{dataset_id}/summary")
def dataset_summary(
    dataset_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    dataset = dataset_service.get_dataset(db, dataset_id=dataset_id, tenant_id=current_user.tenant_id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    try:
        return dataset_service.run_summary_query(dataset)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
