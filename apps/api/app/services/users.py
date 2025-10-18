from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate
from app.services import tenants as tenant_service
from app.schemas.tenant import TenantCreate

def get_user_by_email(db: Session, *, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def create_user_with_tenant(db: Session, *, user_in: UserCreate, tenant_in: TenantCreate) -> User:
    tenant = tenant_service.create_tenant(db, tenant_in=tenant_in)
    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        tenant_id=tenant.id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(
    db: Session, *, email: str, password: str
) -> User | None:
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
