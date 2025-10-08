from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "agentprovision",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    broker_transport_options={"visibility_timeout": 3600},
)


@celery_app.task(name="agents.execute_workflow")
def execute_agent_workflow(agent_id: str) -> dict[str, str]:
    """Placeholder task for executing an agent run."""
    return {"agent_id": agent_id, "status": "queued"}
