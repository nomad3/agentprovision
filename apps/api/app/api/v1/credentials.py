from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import schemas
from app.api import deps
from app.services import credentials as credential_service
from app.models.user import User
import uuid

router = APIRouter()

@router.get("/", response_model=List[schemas.credential.Credential])
def read_credentials(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve credentials for the current tenant.
    """
    credentials = credential_service.get_credentials_by_tenant(
        db, tenant_id=current_user.tenant_id, skip=skip, limit=limit
    )
    return credentials


@router.post("/", response_model=schemas.credential.Credential, status_code=status.HTTP_201_CREATED)
def create_credential(
    *,
    db: Session = Depends(deps.get_db),
    item_in: schemas.credential.CredentialCreate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create new credential for the current tenant.
    """
    item = credential_service.create_tenant_credential(db=db, item_in=item_in, tenant_id=current_user.tenant_id)
    return item

@router.get("/{credential_id}", response_model=schemas.credential.Credential)
def read_credential_by_id(
    credential_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve a specific credential by ID for the current tenant.
    """
    credential = credential_service.get_credential(db, credential_id=credential_id)
    if not credential or str(credential.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")
    return credential

@router.put("/{credential_id}", response_model=schemas.credential.Credential)
def update_credential(
    *,
    db: Session = Depends(deps.get_db),
    credential_id: uuid.UUID,
    item_in: schemas.credential.CredentialCreate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Update an existing credential for the current tenant.
    """
    credential = credential_service.get_credential(db, credential_id=credential_id)
    if not credential or str(credential.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")
    item = credential_service.update_credential(db=db, db_obj=credential, obj_in=item_in)
    return item

@router.delete("/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_credential(
    *,
    db: Session = Depends(deps.get_db),
    credential_id: uuid.UUID,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Delete a credential for the current tenant.
    """
    credential = credential_service.get_credential(db, credential_id=credential_id)
    if not credential or str(credential.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")
    credential_service.delete_credential(db=db, credential_id=credential_id)
    return {"message": "Credential deleted successfully"}
