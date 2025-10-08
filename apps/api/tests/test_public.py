import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_public_metrics() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/analytics/public/metrics")

    assert response.status_code == 200
    data = response.json()
    assert data["tenant_count"] >= 2
    assert data["agent_count"] >= 1
    assert isinstance(data["integration_catalog"], list)
    assert data["highlight_tenants"]
