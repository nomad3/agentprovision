import pytest
import os

import httpx


@pytest.mark.asyncio
async def test_public_metrics_availability() -> None:
    host = os.getenv("INTEGRATION_HOST", "127.0.0.1")
    async with httpx.AsyncClient(base_url=f"http://{host}:8000", timeout=60.0) as client:
        response = await client.get("/api/v1/analytics/public/metrics")

    assert response.status_code == 200
    data = response.json()
    assert data["tenant_count"] >= 3
    assert data["agent_count"] >= 6
    assert isinstance(data["integration_catalog"], list)
    assert data["highlight_tenants"]
