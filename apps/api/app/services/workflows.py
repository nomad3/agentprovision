from __future__ import annotations

import asyncio
import uuid
from functools import lru_cache
from typing import Any, Dict, Optional

from temporalio.client import Client, WorkflowHandle
from temporalio.service import RPCError

from app.core.config import settings


class TemporalNotConfiguredError(RuntimeError):
    """Raised when Temporal connectivity is not configured."""


def _temporal_endpoint_key() -> tuple[Optional[str], str]:
    return settings.TEMPORAL_ADDRESS, settings.TEMPORAL_NAMESPACE


@lru_cache
def _temporal_endpoint_cached() -> tuple[Optional[str], str]:
    return _temporal_endpoint_key()


async def _get_temporal_client() -> Client:
    address, namespace = _temporal_endpoint_cached()
    if not address:
        raise TemporalNotConfiguredError("Temporal address is not configured.")
    try:
        return await Client.connect(address, namespace=namespace)
    except RPCError as exc:  # pragma: no cover - network failure path
        raise RuntimeError(f"Unable to connect to Temporal at {address}: {exc}") from exc


async def start_workflow(
    *,
    workflow_type: str,
    tenant_id: uuid.UUID,
    task_queue: str,
    arguments: Dict[str, Any] | None = None,
    workflow_id: str | None = None,
    memo: Dict[str, Any] | None = None,
) -> WorkflowHandle:
    client = await _get_temporal_client()
    workflow_arguments = arguments or {}
    resolved_workflow_id = workflow_id or f"{tenant_id}-{uuid.uuid4()}"
    handle = await client.start_workflow(
        workflow_type,
        workflow_arguments,
        id=resolved_workflow_id,
        task_queue=task_queue,
        memo={(memo or {}) | {"tenant_id": str(tenant_id)}},
    )
    return handle


async def describe_workflow(*, workflow_id: str, run_id: str | None = None) -> Dict[str, Any]:
    client = await _get_temporal_client()
    handle = client.get_workflow_handle(workflow_id=workflow_id, run_id=run_id)
    description = await handle.describe()

    info = description.workflow_execution_info
    return {
        "workflow_id": info.execution.workflow_id,
        "run_id": info.execution.run_id,
        "type": info.type.name,
        "status": info.status.name if info.status else None,
        "start_time": info.start_time.isoformat() if info.start_time else None,
        "close_time": info.close_time.isoformat() if info.close_time else None,
        "history_length": info.history_length,
        "memo": description.memo or {},
    }
