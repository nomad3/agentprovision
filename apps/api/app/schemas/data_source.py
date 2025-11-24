from pydantic import BaseModel
import uuid

class DataSourceBase(BaseModel):
    name: str
    type: str
    config: dict

class DataSourceCreate(DataSourceBase):
    pass

class DataSource(DataSourceBase):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        from_attributes = True


class DataSourceWithCredentials(DataSource):
    """Data source with decrypted credentials for internal use"""
    config: dict  # Includes decrypted sensitive fields
