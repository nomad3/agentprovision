import os
import asyncio
from http import HTTPStatus

import httpx
import pytest

host = os.getenv("INTEGRATION_HOST", "127.0.0.1")
API_BASE_URL = os.getenv("INTEGRATION_API_URL", f"http://{host}:8000")
N8N_HEALTH_URL = os.getenv("INTEGRATION_N8N_URL", f"http://{host}:5678/rest/health")


@pytest.mark.asyncio
async def test_public_metrics_includes_marketplace_catalog():
    async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=60.0) as client:
        response = await client.get("/api/v1/analytics/public/metrics")

    assert response.status_code == HTTPStatus.OK
    payload = response.json()

    catalog = [item.lower() for item in payload.get("integration_catalog", [])]
    assert any("n8n" in item for item in catalog)
    assert any("mc" in item for item in catalog) or any("mcp" in item for item in catalog)


@pytest.mark.asyncio
async def test_n8n_instance_healthcheck():
    async with httpx.AsyncClient(timeout=30.0) as client:
        for _ in range(40):
            try:
                response = await client.get(N8N_HEALTH_URL)
            except httpx.HTTPError:
                await asyncio.sleep(3)
                continue

            if response.status_code == HTTPStatus.OK:
                data = response.json()
                assert data.get("status") in {"ok", "success"}
                return

            await asyncio.sleep(3)

    pytest.fail("n8n health endpoint did not become ready")
