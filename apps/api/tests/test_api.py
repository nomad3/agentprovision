import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.db.session import get_db, SessionLocal, engine # Import SessionLocal and engine
from app.core.config import settings
import os
import uuid

# Set TESTING environment variable for app.main to skip init_db
os.environ["TESTING"] = "True"

# Override the get_db dependency for tests
def override_get_db():
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(name="db_session")
def db_session_fixture():
    Base.metadata.create_all(bind=engine) # Create tables for tests
    yield SessionLocal()
    Base.metadata.drop_all(bind=engine) # Drop tables after tests

@pytest.fixture(name="test_user_data")
def test_user_data_fixture():
    return {
        "email": "test@example.com",
        "password": "testpassword",
        "full_name": "Test User",
        "tenant_name": "Test Tenant"
    }

@pytest.fixture(name="test_user_token")
def test_user_token_fixture(db_session, test_user_data):
    # Register a user
    client.post(
        "/api/v1/auth/register",
        json={
            "user_in": {
                "email": test_user_data["email"],
                "password": test_user_data["password"],
                "full_name": test_user_data["full_name"]
            },
            "tenant_in": {
                "name": test_user_data["tenant_name"]
            }
        }
    )
    # Log in to get a token
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user_data["email"],
            "password": test_user_data["password"]
        },
        headers={
            "Content-Type": "application/x-www-form-urlencoded"
        }
    )
    return response.json()["access_token"]

def test_create_user_and_tenant(db_session, test_user_data):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "user_in": {
                "email": test_user_data["email"],
                "password": test_user_data["password"],
                "full_name": test_user_data["full_name"]
            },
            "tenant_in": {
                "name": test_user_data["tenant_name"]
            }
        }
    )
    assert response.status_code == 201
    assert response.json()["email"] == test_user_data["email"]
    assert "id" in response.json()
    assert "tenant_id" in response.json()

def test_login_for_access_token(db_session, test_user_data):
    # Ensure user is registered first
    test_create_user_and_tenant(db_session, test_user_data)

    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user_data["email"],
            "password": test_user_data["password"]
        },
        headers={
            "Content-Type": "application/x-www-form-urlencoded"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_read_users_me(db_session, test_user_token):
    response = client.get(
        "/api/v1/auth/users/me",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert "email" in response.json()
    assert "id" in response.json()

def test_get_analytics_summary(db_session, test_user_token):
    response = client.get(
        "/api/v1/analytics/summary",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }

    )
    assert response.status_code == 200
    assert "total_agents" in response.json()
    assert "total_data_sources" in response.json()
    assert "total_data_pipelines" in response.json()
    assert "total_notebooks" in response.json()

# --- Data Sources Tests ---
def test_create_data_source(db_session, test_user_token):
    data = {"name": "Test DataSource", "type": "s3", "config": {"bucket": "test-bucket"}}
    response = client.post(
        "/api/v1/data_sources/",
        json=data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 201
    assert response.json()["name"] == data["name"]

def test_read_data_sources(db_session, test_user_token):
    test_create_data_source(db_session, test_user_token)
    response = client.get(
        "/api/v1/data_sources/",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_read_data_source_by_id(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/data_sources/",
        json={"name": "Another DS", "type": "gcs", "config": {"path": "test-path"}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    ds_id = create_response.json()["id"]
    response = client.get(
        f"/api/v1/data_sources/{ds_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["id"] == ds_id

def test_update_data_source(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/data_sources/",
        json={"name": "DS to Update", "type": "azure", "config": {"container": "test-container"}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    ds_id = create_response.json()["id"]
    update_data = {"name": "Updated DS", "type": "azure", "config": {"container": "updated-container"}}
    response = client.put(
        f"/api/v1/data_sources/{ds_id}",
        json=update_data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["name"] == update_data["name"]

def test_delete_data_source(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/data_sources/",
        json={"name": "DS to Delete", "type": "local", "config": {"path": "/tmp"}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    ds_id = create_response.json()["id"]
    response = client.delete(
        f"/api/v1/data_sources/{ds_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 204
    get_response = client.get(
        f"/api/v1/data_sources/{ds_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert get_response.status_code == 404

# --- Data Pipelines Tests ---
def test_create_data_pipeline(db_session, test_user_token):
    data = {"name": "Test Pipeline", "config": {"steps": ["step1", "step2"]}}
    response = client.post(
        "/api/v1/data_pipelines/",
        json=data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 201
    assert response.json()["name"] == data["name"]

def test_read_data_pipelines(db_session, test_user_token):
    test_create_data_pipeline(db_session, test_user_token)
    response = client.get(
        "/api/v1/data_pipelines/",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_read_data_pipeline_by_id(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/data_pipelines/",
        json={"name": "Another Pipeline", "config": {"steps": ["stepA"]}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    dp_id = create_response.json()["id"]
    response = client.get(
        f"/api/v1/data_pipelines/{dp_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["id"] == dp_id

def test_update_data_pipeline(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/data_pipelines/",
        json={"name": "Pipeline to Update", "config": {"steps": ["old"]}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    dp_id = create_response.json()["id"]
    update_data = {"name": "Updated Pipeline", "config": {"steps": ["new"]}}
    response = client.put(
        f"/api/v1/data_pipelines/{dp_id}",
        json=update_data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["name"] == update_data["name"]

def test_delete_data_pipeline(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/data_pipelines/",
        json={"name": "Pipeline to Delete", "config": {"steps": ["delete"]}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    dp_id = create_response.json()["id"]
    response = client.delete(
        f"/api/v1/data_pipelines/{dp_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 204
    get_response = client.get(
        f"/api/v1/data_pipelines/{dp_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert get_response.status_code == 404

# --- Notebooks Tests ---
def test_create_notebook(db_session, test_user_token):
    data = {"name": "Test Notebook", "content": {"cells": []}}
    response = client.post(
        "/api/v1/notebooks/",
        json=data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 201
    assert response.json()["name"] == data["name"]

def test_read_notebooks(db_session, test_user_token):
    test_create_notebook(db_session, test_user_token)
    response = client.get(
        "/api/v1/notebooks/",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_read_notebook_by_id(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/notebooks/",
        json={"name": "Another Notebook", "content": {"cells": ["code"]}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    nb_id = create_response.json()["id"]
    response = client.get(
        f"/api/v1/notebooks/{nb_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["id"] == nb_id

def test_update_notebook(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/notebooks/",
        json={"name": "Notebook to Update", "content": {"cells": ["old"]}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    nb_id = create_response.json()["id"]
    update_data = {"name": "Updated Notebook", "content": {"cells": ["new"]}}
    response = client.put(
        f"/api/v1/notebooks/{nb_id}",
        json=update_data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["name"] == update_data["name"]

def test_delete_notebook(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/notebooks/",
        json={"name": "Notebook to Delete", "content": {"cells": ["delete"]}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    nb_id = create_response.json()["id"]
    response = client.delete(
        f"/api/v1/notebooks/{nb_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 204
    get_response = client.get(
        f"/api/v1/notebooks/{nb_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert get_response.status_code == 404

# --- Agents Tests ---
def test_create_agent(db_session, test_user_token):
    data = {"name": "Test Agent", "description": "A test agent", "config": {"model": "gpt-3.5"}}
    response = client.post(
        "/api/v1/agents/",
        json=data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 201
    assert response.json()["name"] == data["name"]

def test_read_agents(db_session, test_user_token):
    test_create_agent(db_session, test_user_token)
    response = client.get(
        "/api/v1/agents/",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_read_agent_by_id(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/agents/",
        json={"name": "Another Agent", "description": "Another test agent", "config": {"model": "gpt-4"}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    agent_id = create_response.json()["id"]
    response = client.get(
        f"/api/v1/agents/{agent_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["id"] == agent_id

def test_update_agent(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/agents/",
        json={"name": "Agent to Update", "description": "Old description", "config": {"model": "old"}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    agent_id = create_response.json()["id"]
    update_data = {"name": "Updated Agent", "description": "New description", "config": {"model": "new"}}
    response = client.put(
        f"/api/v1/agents/{agent_id}",
        json=update_data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["name"] == update_data["name"]

def test_delete_agent(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/agents/",
        json={"name": "Agent to Delete", "description": "Delete me", "config": {"model": "delete"}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    agent_id = create_response.json()["id"]
    response = client.delete(
        f"/api/v1/agents/{agent_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 204
    get_response = client.get(
        f"/api/v1/agents/{agent_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert get_response.status_code == 404

# --- Tools Tests ---
def test_create_tool(db_session, test_user_token):
    data = {"name": "Test Tool", "description": "A test tool", "config": {"function": "func1"}}
    response = client.post(
        "/api/v1/tools/",
        json=data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 201
    assert response.json()["name"] == data["name"]

def test_read_tools(db_session, test_user_token):
    test_create_tool(db_session, test_user_token)
    response = client.get(
        "/api/v1/tools/",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_read_tool_by_id(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/tools/",
        json={"name": "Another Tool", "description": "Another test tool", "config": {"function": "func2"}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    tool_id = create_response.json()["id"]
    response = client.get(
        f"/api/v1/tools/{tool_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["id"] == tool_id

def test_update_tool(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/tools/",
        json={"name": "Tool to Update", "description": "Old description", "config": {"function": "old"}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    tool_id = create_response.json()["id"]
    update_data = {"name": "Updated Tool", "description": "New description", "config": {"function": "new"}}
    response = client.put(
        f"/api/v1/tools/{tool_id}",
        json=update_data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["name"] == update_data["name"]

def test_delete_tool(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/tools/",
        json={"name": "Tool to Delete", "description": "Delete me", "config": {"function": "delete"}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    tool_id = create_response.json()["id"]
    response = client.delete(
        f"/api/v1/tools/{tool_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 204
    get_response = client.get(
        f"/api/v1/tools/{tool_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert get_response.status_code == 404

# --- Connectors Tests ---
def test_create_connector(db_session, test_user_token):
    data = {"name": "Test Connector", "description": "A test connector", "config": {"type": "s3"}}
    response = client.post(
        "/api/v1/connectors/",
        json=data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 201
    assert response.json()["name"] == data["name"]

def test_read_connectors(db_session, test_user_token):
    test_create_connector(db_session, test_user_token)
    response = client.get(
        "/api/v1/connectors/",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_read_connector_by_id(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/connectors/",
        json={"name": "Another Connector", "description": "Another test connector", "config": {"type": "gcs"}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    connector_id = create_response.json()["id"]
    response = client.get(
        f"/api/v1/connectors/{connector_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["id"] == connector_id

def test_update_connector(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/connectors/",
        json={"name": "Connector to Update", "description": "Old description", "config": {"type": "old"}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    connector_id = create_response.json()["id"]
    update_data = {"name": "Updated Connector", "description": "New description", "config": {"type": "new"}}
    response = client.put(
        f"/api/v1/connectors/{connector_id}",
        json=update_data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["name"] == update_data["name"]

def test_delete_connector(db_session, test_user_token):
    create_response = client.post(
        "/api/v1/connectors/",
        json={"name": "Connector to Delete", "description": "Delete me", "config": {"type": "delete"}},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    connector_id = create_response.json()["id"]
    response = client.delete(
        f"/api/v1/connectors/{connector_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 204
    get_response = client.get(
        f"/api/v1/connectors/{connector_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert get_response.status_code == 404

# --- Deployments Tests ---
def test_create_deployment(db_session, test_user_token):
    # First create an agent to link to
    agent_data = {"name": "Deployment Agent", "description": "Agent for deployment", "config": {"model": "test"}}
    agent_response = client.post(
        "/api/v1/agents/",
        json=agent_data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    agent_id = agent_response.json()["id"]

    data = {"name": "Test Deployment", "description": "A test deployment", "config": {"env": "prod"}, "agent_id": agent_id}
    response = client.post(
        "/api/v1/deployments/",
        json=data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 201
    assert response.json()["name"] == data["name"]

def test_read_deployments(db_session, test_user_token):
    test_create_deployment(db_session, test_user_token)
    response = client.get(
        "/api/v1/deployments/",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_read_deployment_by_id(db_session, test_user_token):
    agent_data = {"name": "Deployment Agent 2", "description": "Agent for deployment 2", "config": {"model": "test2"}}
    agent_response = client.post(
        "/api/v1/agents/",
        json=agent_data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    agent_id = agent_response.json()["id"]

    create_response = client.post(
        "/api/v1/deployments/",
        json={"name": "Another Deployment", "description": "Another test deployment", "config": {"env": "dev"}, "agent_id": agent_id},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    dep_id = create_response.json()["id"]
    response = client.get(
        f"/api/v1/deployments/{dep_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["id"] == dep_id

def test_update_deployment(db_session, test_user_token):
    agent_data = {"name": "Deployment Agent 3", "description": "Agent for deployment 3", "config": {"model": "test3"}}
    agent_response = client.post(
        "/api/v1/agents/",
        json=agent_data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    agent_id = agent_response.json()["id"]

    create_response = client.post(
        "/api/v1/deployments/",
        json={"name": "Deployment to Update", "description": "Old description", "config": {"env": "old"}, "agent_id": agent_id},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    dep_id = create_response.json()["id"]
    update_data = {"name": "Updated Deployment", "description": "New description", "config": {"env": "new"}, "agent_id": agent_id}
    response = client.put(
        f"/api/v1/deployments/{dep_id}",
        json=update_data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["name"] == update_data["name"]

def test_delete_deployment(db_session, test_user_token):
    agent_data = {"name": "Deployment Agent 4", "description": "Agent for deployment 4", "config": {"model": "test4"}}
    agent_response = client.post(
        "/api/v1/agents/",
        json=agent_data,
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    agent_id = agent_response.json()["id"]

    create_response = client.post(
        "/api/v1/deployments/",
        json={"name": "Deployment to Delete", "description": "Delete me", "config": {"env": "delete"}, "agent_id": agent_id},
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    dep_id = create_response.json()["id"]
    response = client.delete(
        f"/api/v1/deployments/{dep_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert response.status_code == 204
    get_response = client.get(
        f"/api/v1/deployments/{dep_id}",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        }
    )
    assert get_response.status_code == 404
