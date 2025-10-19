import time
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

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
    
    # Add retry logic for database connection
    max_retries = 10
    retry_delay = 5  # seconds

    for i in range(max_retries):
        try:
            print(f"Attempting to connect to database (attempt {i+1}/{max_retries})...")
            base.Base.metadata.create_all(bind=engine)
            print("Database connection successful and tables created.")
            break
        except OperationalError as e:
            print(f"Database connection failed: {e}")
            if i < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print("Max retries reached. Could not connect to database.")
                raise