from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.schemas import token as token_schema
from app.schemas import user as user_schema
from app.schemas import tenant as tenant_schema
from app.api import deps
from app.core import security
from app.core.config import settings
from app.services import base as base_service
from app.services import users as user_service

router = APIRouter()

@router.post("/login", response_model=token_schema.Token)
def login_for_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    user = base_service.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    claims = {"user_id": str(user.id)}
    if user.tenant_id:
        claims["tenant_id"] = str(user.tenant_id)

    access_token = security.create_access_token(
        user.email,
        expires_delta=access_token_expires,
        additional_claims=claims,
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=user_schema.User)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: user_schema.UserCreate,
    tenant_in: tenant_schema.TenantCreate
):
    user = user_service.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = user_service.create_user_with_tenant(db, user_in=user_in, tenant_in=tenant_in)
    return user

@router.get("/users/me", response_model=user_schema.User)
def read_users_me(
    current_user: user_schema.User = Depends(deps.get_current_active_user)
):
    """
    Get current user.
    """
    return current_user
