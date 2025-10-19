from sqlalchemy.orm import Session

from app.db import base  # noqa: F401
from app.db.session import engine

# make sure all SQL Alchemy models are imported (app.db.base) before initializing DB
# otherwise, SQL Alchemy might fail to initialize relationships properly
# for more details: https://github.com/tiangolo/full-stack-fastapi-postgresql/issues/28
from app.models.user import User  # noqa: F401
from app.models.tenant import Tenant  # noqa: F401
from app.models.data_source import DataSource  # noqa: F401
from app.models.data_pipeline import DataPipeline  # noqa: F401
from app.models.notebook import Notebook  # noqa: F401
from app.models.agent import Agent  # noqa: F401
from app.models.tool import Tool  # noqa: F401
from app.models.connector import Connector  # noqa: F401
from app.models.deployment import Deployment  # noqa: F401

def init_db(db: Session) -> None:
    # Tables should be created with Alembic migrations
    # But for this initial setup, we'll create them directly
    base.Base.metadata.create_all(bind=engine)
