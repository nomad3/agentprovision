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
from app.models.agent_group import AgentGroup  # noqa: F401
from app.models.agent_relationship import AgentRelationship  # noqa: F401
from app.models.agent_task import AgentTask  # noqa: F401
from app.models.agent_message import AgentMessage  # noqa: F401
from app.models.agent_skill import AgentSkill  # noqa: F401
from app.models.agent_memory import AgentMemory  # noqa: F401
from app.models.knowledge_entity import KnowledgeEntity  # noqa: F401
from app.models.knowledge_relation import KnowledgeRelation  # noqa: F401
from app.models.llm_provider import LLMProvider  # noqa: F401
from app.models.llm_model import LLMModel  # noqa: F401
from app.models.llm_config import LLMConfig  # noqa: F401
from app.models.tenant_branding import TenantBranding  # noqa: F401
from app.models.tenant_features import TenantFeatures  # noqa: F401
from app.models.tenant_analytics import TenantAnalytics  # noqa: F401
from app.models.tool import Tool
from app.models.connector import Connector
from app.models.deployment import Deployment  # noqa: F401
from app.models.vector_store import VectorStore  # noqa: F401
from app.models.agent_kit import AgentKit  # noqa: F401
from app.models.dataset import Dataset
from app.models.chat import ChatSession, ChatMessage

from app.core.security import get_password_hash
from app.services import datasets as dataset_service

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
            config={
                "primary_objective": "Provide excellent customer support by answering questions and resolving issues",
                "base_model": "gpt-4",
                "tools": ["faq_retrieval", "order_status"]
            },
            tenant_id=demo_tenant.id,
        ),
        AgentKit(
            name="Data Analysis Agent Kit",
            description="Kit for deploying data analysis agents",
            version="1.1.0",
            config={
                "primary_objective": "Analyze data and provide actionable insights to drive business decisions",
                "base_model": "claude-3",
                "tools": ["sql_query", "chart_generation"]
            },
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

    revenue_dataset_rows = [
        {
            "order_id": "1001",
            "customer_name": "Acme Corp",
            "segment": "Enterprise",
            "region": "North America",
            "revenue": 125000,
            "cost": 83000,
            "profit": 42000,
            "order_date": "2024-01-15",
        },
        {
            "order_id": "1002",
            "customer_name": "Globex Inc",
            "segment": "Mid-Market",
            "region": "Europe",
            "revenue": 78000,
            "cost": 52000,
            "profit": 26000,
            "order_date": "2024-02-10",
        },
        {
            "order_id": "1003",
            "customer_name": "Initech",
            "segment": "SMB",
            "region": "North America",
            "revenue": 45000,
            "cost": 29000,
            "profit": 16000,
            "order_date": "2024-02-28",
        },
        {
            "order_id": "1004",
            "customer_name": "Stark Industries",
            "segment": "Enterprise",
            "region": "Asia-Pacific",
            "revenue": 152000,
            "cost": 101000,
            "profit": 51000,
            "order_date": "2024-03-07",
        },
        {
            "order_id": "1005",
            "customer_name": "Wayne Enterprises",
            "segment": "Enterprise",
            "region": "Latin America",
            "revenue": 98500,
            "cost": 64000,
            "profit": 34500,
            "order_date": "2024-03-21",
        },
    ]

    # Use the proper ingestion service to create dataset with parquet file
    seeded_dataset = dataset_service.ingest_records(
        db,
        tenant_id=demo_tenant.id,
        records=revenue_dataset_rows,
        name="Revenue Performance",
        description="Sample revenue transactions for demo analysis",
        source_type="seed",
    )

    demo_chat_session = ChatSession(
        title="Q1 Revenue Review",
        dataset_id=seeded_dataset.id,
        agent_kit_id=agent_kits[1].id,
        tenant_id=demo_tenant.id,
    )
    db.add(demo_chat_session)
    db.flush()

    chat_messages = [
        ChatMessage(
            session_id=demo_chat_session.id,
            role="user",
            content="What were our top customer segments last quarter?",
        ),
        ChatMessage(
            session_id=demo_chat_session.id,
            role="assistant",
            content="Enterprise accounts generated the highest share of revenue, led by Acme Corp and Wayne Enterprises.",
            context={
                "summary": {
                    "numeric_columns": [
                        {"column": "revenue", "avg": 99800.0, "min": 45000, "max": 152000},
                        {"column": "profit", "avg": 33900.0, "min": 16000, "max": 51000},
                    ]
                }
            },
        ),
    ]
    db.add_all(chat_messages)

    db.commit()
