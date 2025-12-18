"""Lightweight HTTP client for interacting with the ADK API server."""
from __future__ import annotations

from typing import Any, Dict, List, Optional
import uuid

import httpx

from app.core.config import settings


class ADKNotConfiguredError(RuntimeError):
    """Raised when ADK integration is requested without configuration."""


class ADKClient:
    """Simple wrapper around the ADK FastAPI server."""

    def __init__(
        self,
        *,
        base_url: str,
        app_name: str,
        timeout: float = 60.0,
        client: Optional[httpx.Client] = None,
    ) -> None:
        if not base_url:
            raise ADKNotConfiguredError("ADK_BASE_URL is not configured.")
        self.base_url = base_url.rstrip("/")
        self.app_name = app_name
        self._client = client or httpx.Client(base_url=self.base_url, timeout=timeout)

    def create_session(
        self,
        *,
        user_id: uuid.UUID,
        state: Optional[Dict[str, Any]] = None,
        events: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {}
        if state:
            payload["state"] = state
        if events:
            payload["events"] = events

        response = self._client.post(
            f"/apps/{self.app_name}/users/{user_id}/sessions",
            json=payload or None,
        )
        response.raise_for_status()
        return response.json()

    def run(
        self,
        *,
        user_id: uuid.UUID,
        session_id: str,
        message: str,
        state_delta: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        body: Dict[str, Any] = {
            "app_name": self.app_name,
            "user_id": str(user_id),
            "session_id": session_id,
            "new_message": {
                "role": "user",
                "parts": [{"text": message}],
            },
        }
        if state_delta:
            body["state_delta"] = state_delta

        response = self._client.post("/run", json=body)
        response.raise_for_status()
        return response.json()

    def close(self) -> None:
        self._client.close()


_adk_client: Optional[ADKClient] = None


def get_adk_client() -> ADKClient:
    """Return a cached ADK client instance."""
    global _adk_client
    if _adk_client is None:
        if not settings.ADK_BASE_URL:
            raise ADKNotConfiguredError("ADK_BASE_URL is not configured.")
        _adk_client = ADKClient(
            base_url=settings.ADK_BASE_URL,
            app_name=settings.ADK_APP_NAME,
        )
    return _adk_client
