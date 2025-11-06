import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.api.deps import get_db
from app.models.dataset import Dataset
from app.models.tenant import Tenant
from app.models.user import User
from app.core.security import get_password_hash
import uuid
import os

# Set TESTING environment variable
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


@pytest.fixture
def db_session():
    """Create test database session"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def auth_token(db_session):
    """Create test user and return auth token"""
    tenant = Tenant(name="Test Tenant Sync")
    db_session.add(tenant)
    db_session.commit()

    user = User(
        email=f"test_sync_{uuid.uuid4().hex[:8]}@example.com",
        hashed_password=get_password_hash("password"),
        tenant_id=tenant.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    # Login to get token
    response = client.post("/api/v1/auth/login", data={
        "username": user.email,
        "password": "password"
    })
    return response.json()["access_token"], tenant.id


def test_get_dataset_sync_status(auth_token, db_session):
    """Test getting Databricks sync status for dataset"""
    token, tenant_id = auth_token

    # Create test dataset with sync metadata
    dataset = Dataset(
        name="Test Dataset",
        source_type="upload",
        file_name="test.parquet",
        row_count=100,
        tenant_id=tenant_id,
        metadata_={
            "databricks_enabled": True,
            "sync_status": "synced",
            "bronze_table": "catalog.bronze.test",
            "silver_table": "catalog.silver.test"
        }
    )
    db_session.add(dataset)
    db_session.commit()

    # Call sync status endpoint
    response = client.get(
        f"/api/v1/datasets/{dataset.id}/databricks/status",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["sync_status"] == "synced"
    assert data["databricks_enabled"] == True
    assert "bronze_table" in data
    assert "silver_table" in data


def test_get_dataset_sync_status_not_synced(auth_token, db_session):
    """Test sync status for dataset not synced to Databricks"""
    token, tenant_id = auth_token

    dataset = Dataset(
        name="Local Only Dataset",
        source_type="upload",
        file_name="local.parquet",
        row_count=50,
        tenant_id=tenant_id,
        metadata_={}
    )
    db_session.add(dataset)
    db_session.commit()

    response = client.get(
        f"/api/v1/datasets/{dataset.id}/databricks/status",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["databricks_enabled"] == False
    assert data["sync_status"] == "not_synced"
