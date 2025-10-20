from typing import List

from sqlalchemy.orm import Session
import uuid

from app.models.credential import Credential
from app.schemas.credential import CredentialCreate, CredentialBase
from app.core.security import get_password_hash, verify_password # We can reuse these for encryption

def get_credential(db: Session, credential_id: uuid.UUID) -> Credential | None:
    return db.query(Credential).filter(Credential.id == credential_id).first()

def get_credentials_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Credential]:
    return db.query(Credential).filter(Credential.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_tenant_credential(db: Session, *, item_in: CredentialCreate, tenant_id: uuid.UUID) -> Credential:
    # In a real application, you would use a more robust encryption method.
    # For this example, we'll reuse the password hashing function.
    encrypted_creds = get_password_hash(str(item_in.credentials))
    db_item = Credential(name=item_in.name, encrypted_credentials=encrypted_creds.encode('utf-8'), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_credential(db: Session, *, db_obj: Credential, obj_in: CredentialBase) -> Credential:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)
    
    for field in update_data:
        if hasattr(db_obj, field):
            setattr(db_obj, field, update_data[field])

    if 'credentials' in update_data:
        encrypted_creds = get_password_hash(str(update_data['credentials']))
        db_obj.encrypted_credentials = encrypted_creds.encode('utf-8')

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_credential(db: Session, *, credential_id: uuid.UUID) -> Credential | None:
    credential = db.query(Credential).filter(Credential.id == credential_id).first()
    if credential:
        db.delete(credential)
        db.commit()
    return credential
