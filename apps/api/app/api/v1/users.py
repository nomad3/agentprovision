from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas import user as user_schema
from app.api import deps

router = APIRouter()

@router.get("/me", response_model=user_schema.User)
def read_users_me(
    current_user: user_schema.User = Depends(deps.get_current_active_user)
):
    """
    Get current user.
    """
    return current_user
