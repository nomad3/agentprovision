import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_register_and_login_flow() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "email": "test-user@example.com",
            "password": "TestPass!123",
            "full_name": "Test User",
            "tenant_name": "Test Org",
        }
        register_response = await client.post("/api/v1/auth/register", json=payload)
        assert register_response.status_code == 201
        assert "access_token" in register_response.json()

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": payload["email"], "password": payload["password"]},
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        me_response = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_response.status_code == 200
        data = me_response.json()
        assert data["email"] == payload["email"]
        assert data["tenant_name"] == payload["tenant_name"]
