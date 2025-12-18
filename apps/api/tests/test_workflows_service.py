import uuid
from unittest.mock import AsyncMock

import pytest
from pytest import MonkeyPatch

from app.services import workflows


@pytest.mark.asyncio
async def test_start_workflow_sets_tenant_id_in_memo():
    tenant_id = uuid.uuid4()
    mock_handle = object()
    mock_client = AsyncMock()
    mock_client.start_workflow.return_value = mock_handle

    mock_get_client = AsyncMock(return_value=mock_client)

    with MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr("app.services.workflows._get_temporal_client", mock_get_client)
        handle = await workflows.start_workflow(
            workflow_type="TestWorkflow",
            tenant_id=tenant_id,
            task_queue="test-queue",
            arguments={"foo": "bar"},
        )

    assert handle is mock_handle
    mock_client.start_workflow.assert_awaited_once()
    awaited_kwargs = mock_client.start_workflow.await_args.kwargs
    assert awaited_kwargs["memo"] == {"tenant_id": str(tenant_id)}


@pytest.mark.asyncio
async def test_start_workflow_merges_existing_memo():
    tenant_id = uuid.uuid4()
    mock_handle = object()
    mock_client = AsyncMock()
    mock_client.start_workflow.return_value = mock_handle

    mock_get_client = AsyncMock(return_value=mock_client)

    existing_memo = {"dataset_id": "ds_123"}

    with MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr("app.services.workflows._get_temporal_client", mock_get_client)
        await workflows.start_workflow(
            workflow_type="TestWorkflow",
            tenant_id=tenant_id,
            task_queue="test-queue",
            arguments={},
            memo=existing_memo,
        )

    awaited_kwargs = mock_client.start_workflow.await_args.kwargs
    assert awaited_kwargs["memo"] == {"dataset_id": "ds_123", "tenant_id": str(tenant_id)}
    # Ensure the input memo dict is not modified in-place
    assert existing_memo == {"dataset_id": "ds_123"}
