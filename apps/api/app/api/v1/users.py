from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas import UserMe

router = APIRouter()


@router.get("/me", response_model=UserMe)
async def read_current_user(current_user: User = Depends(get_current_user)) -> UserMe:
    tenant = current_user.tenant
    return UserMe(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        tenant_id=current_user.tenant_id,
        tenant_slug=tenant.slug if tenant else "",
        tenant_name=tenant.name if tenant else "",
    )
