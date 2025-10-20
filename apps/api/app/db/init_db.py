import time
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.db import base  # noqa: F401
from app.db.session import engine

# make sure all SQL Alchemy models are imported (app.db.base) before initializing DB
# otherwise, SQL Alchemy might fail to initialize relationships properly
# for more details: https://github.com/tiangolo/full-stack-fastapi-postgresql/issues/28
from app.models.user import User
from app.models.tenant import Tenant
from app.models.data_source import DataSource
from app.models.data_pipeline import DataPipeline
from app.models.notebook import Notebook
from app.models.agent import Agent
from app.models.tool import Tool
from app.models.connector import Connector
from app.models.deployment import Deployment  # noqa: F401
from app.models.vector_store import VectorStore # noqa: F401
from app.models.agent_kit import AgentKit # noqa: F401

from app.core.security import get_password_hash

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

    seed_demo_data(db)


def seed_demo_data(db: Session) -> None:
    demo_email = "test@example.com"
    existing_user = db.query(User).filter(User.email == demo_email).first()
    if existing_user:
        return

    demo_tenant = Tenant(name="Demo Enterprise")
    db.add(demo_tenant)
    db.flush()

    demo_user = User(
        email=demo_email,
        full_name="Demo Operator",
        hashed_password=get_password_hash("password"),
        tenant_id=demo_tenant.id,
        is_active=True,
    )
    db.add(demo_user)

    data_sources = [
        DataSource(
            name="Snowflake Revenue Warehouse",
            type="warehouse",
            config={},
            tenant_id=demo_tenant.id,
        ),
        DataSource(
            name="Product Telemetry Stream",
            type="stream",
            config={},
            tenant_id=demo_tenant.id,
        ),
    ]
    db.add_all(data_sources)
    db.flush()

    data_pipelines = [
        DataPipeline(
            name="ARR Forecasting",
            config={},
            tenant_id=demo_tenant.id,
        ),
        DataPipeline(
            name="Usage Churn Risk",
            config={},
            tenant_id=demo_tenant.id,
        ),
    ]
    db.add_all(data_pipelines)
    db.flush()

    notebooks = [
        Notebook(
            name="Executive ARR Summary",
            tenant_id=demo_tenant.id,
        ),
        Notebook(
            name="Churn Risk Deep Dive",
            tenant_id=demo_tenant.id,
        ),
    ]
    db.add_all(notebooks)

    agents = [
        Agent(
            name="Revenue Copilot",
            tenant_id=demo_tenant.id,
        ),
        Agent(
            name="Telemetry Sentinel",
            tenant_id=demo_tenant.id,
        ),
    ]
    db.add_all(agents)

    tools = [
        Tool(
            name="Scenario Planner",
            tenant_id=demo_tenant.id,
        ),
        Tool(
            name="Retention Playbook",
            tenant_id=demo_tenant.id,
        ),
    ]
    db.add_all(tools)

    vector_stores = [
        VectorStore(
            name="Customer Feedback Embeddings",
            description="Vector store for customer feedback analysis",
            config={"provider": "pinecone", "index": "customer-feedback"},
            tenant_id=demo_tenant.id,
        ),
        VectorStore(
            name="Product Documentation Embeddings",
            description="Vector store for product documentation RAG",
            config={"provider": "weaviate", "index": "product-docs"},
            tenant_id=demo_tenant.id,
        ),
    ]
    db.add_all(vector_stores)

    agent_kits = [
        AgentKit(
            name="Customer Support Agent Kit",
            description="Kit for deploying customer support agents",
            version="1.0.0",
            config={"base_model": "gpt-4", "tools": ["faq_retrieval", "order_status"]},
            tenant_id=demo_tenant.id,
        ),
        AgentKit(
            name="Data Analysis Agent Kit",
            description="Kit for deploying data analysis agents",
            version="1.1.0",
            config={"base_model": "claude-3", "tools": ["sql_query", "chart_generation"]},
            tenant_id=demo_tenant.id,
        ),
    ]
    db.add_all(agent_kits)

    deployments = [
        Deployment(
            name="Revenue Copilot - Prod",
            agent_id=agents[0].id,
            tenant_id=demo_tenant.id,
        ),
        Deployment(
            name="Telemetry Sentinel - Staging",
            agent_id=agents[1].id,
            tenant_id=demo_tenant.id,
        ),
    ]
    db.add_all(deployments)

    db.commit()
