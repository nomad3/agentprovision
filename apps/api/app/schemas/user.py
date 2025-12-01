from pydantic import BaseModel, EmailStr
import uuid
from .tenant import Tenant

class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    is_active: bool = True
    is_superuser: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: str | None = None

class User(UserBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    tenant: Tenant | None = None

    class Config:
        from_attributes = True
