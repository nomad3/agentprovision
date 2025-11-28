from typing import List, Optional
import uuid
from sqlalchemy.orm import Session

from app.models.dataset_group import DatasetGroup
from app.models.dataset import Dataset
from app.schemas.dataset_group import DatasetGroupCreate, DatasetGroupUpdate

def get_dataset_group(db: Session, group_id: uuid.UUID) -> Optional[DatasetGroup]:
    return db.query(DatasetGroup).filter(DatasetGroup.id == group_id).first()

def get_dataset_groups_by_tenant(
    db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> List[DatasetGroup]:
    return (
        db.query(DatasetGroup)
        .filter(DatasetGroup.tenant_id == tenant_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_dataset_group(
    db: Session, item_in: DatasetGroupCreate, tenant_id: uuid.UUID
) -> DatasetGroup:
    db_obj = DatasetGroup(
        name=item_in.name,
        description=item_in.description,
        tenant_id=tenant_id,
    )

    if item_in.dataset_ids:
        datasets = db.query(Dataset).filter(Dataset.id.in_(item_in.dataset_ids)).all()
        db_obj.datasets = datasets

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_dataset_group(
    db: Session, db_obj: DatasetGroup, obj_in: DatasetGroupUpdate
) -> DatasetGroup:
    update_data = obj_in.dict(exclude_unset=True)

    if "dataset_ids" in update_data:
        dataset_ids = update_data.pop("dataset_ids")
        if dataset_ids is not None:
            datasets = db.query(Dataset).filter(Dataset.id.in_(dataset_ids)).all()
            db_obj.datasets = datasets

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_dataset_group(db: Session, group_id: uuid.UUID) -> Optional[DatasetGroup]:
    obj = db.query(DatasetGroup).filter(DatasetGroup.id == group_id).first()
    if obj:
        db.delete(obj)
        db.commit()
    return obj
