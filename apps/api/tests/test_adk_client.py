import json
import uuid

import httpx

from app.services.adk_client import ADKClient
from app.services.chat import _extract_adk_response


def test_adk_client_create_session_round_trip():
    payloads = {}

    def handler(request: httpx.Request) -> httpx.Response:
        payloads['method'] = request.method
        payloads['url'] = str(request.url)
        payloads['json'] = json.loads(request.content or b"{}")
        return httpx.Response(200, json={"id": "session-123"})

    transport = httpx.MockTransport(handler)
    http_client = httpx.Client(base_url="http://adk.local", transport=transport)

    client = ADKClient(base_url="http://adk.local", app_name="test-app", client=http_client)
    user_id = uuid.uuid4()
    response = client.create_session(user_id=user_id, state={"tenant_id": "tenant-1"})
    client.close()

    assert response["id"] == "session-123"
    assert payloads['method'] == 'POST'
    assert payloads['url'].endswith(f"/apps/test-app/users/{user_id}/sessions")
    assert payloads['json'] == {"state": {"tenant_id": "tenant-1"}}


def test_adk_client_run_payload_and_response():
    payloads = {}

    def handler(request: httpx.Request) -> httpx.Response:
        payloads['json'] = json.loads(request.content or b"{}")
        return httpx.Response(200, json=[{"author": "agent", "content": {"parts": [{"text": "hello"}]}}])

    transport = httpx.MockTransport(handler)
    http_client = httpx.Client(base_url="http://adk.local", transport=transport)

    client = ADKClient(base_url="http://adk.local", app_name="demo", client=http_client)
    events = client.run(user_id=uuid.UUID(int=1), session_id="sess-1", message="Hi")
    client.close()

    assert events[0]["author"] == "agent"
    assert payloads['json']["app_name"] == "demo"
    assert payloads['json']["new_message"] == {"role": "user", "parts": [{"text": "Hi"}]}


def test_extract_adk_response_handles_text_parts():
    events = [
        {"author": "user", "content": {"parts": [{"text": "question"}]}},
        {
            "author": "agent",
            "content": {
                "parts": [
                    {"text": "Insight line 1"},
                    {"text": "Insight line 2"},
                ]
            },
        },
    ]

    text, context = _extract_adk_response(events)
    assert "Insight line 1" in text
    assert "Insight line 2" in text
    assert context["adk_events"] == events
