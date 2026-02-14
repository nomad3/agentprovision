from __future__ import annotations

import logging
from typing import Any, Dict, List, Tuple
import uuid

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.agent_kit import AgentKit
from app.models.chat import ChatSession as ChatSessionModel, ChatMessage
from app.models.dataset import Dataset
from app.services import agent_kits as agent_kit_service
from app.services import datasets as dataset_service
from app.services.adk_client import ADKNotConfiguredError, get_adk_client
from app.services.knowledge_extraction import knowledge_extraction_service

logger = logging.getLogger(__name__)

ADK_UNCONFIGURED_MESSAGE = (
    "Agentic responses require the ADK service. Please configure ADK_BASE_URL."
)
ADK_FAILURE_MESSAGE = "The ADK service is temporarily unavailable. Please retry in a moment."


def list_sessions(db: Session, *, tenant_id: uuid.UUID) -> List[ChatSessionModel]:
    return (
        db.query(ChatSessionModel)
        .filter(ChatSessionModel.tenant_id == tenant_id)
        .order_by(ChatSessionModel.created_at.desc())
        .all()
    )


def get_session(db: Session, *, session_id: uuid.UUID, tenant_id: uuid.UUID) -> ChatSessionModel | None:
    session = db.query(ChatSessionModel).filter(ChatSessionModel.id == session_id).first()
    if session and str(session.tenant_id) == str(tenant_id):
        return session
    return None


def create_session(
    db: Session,
    *,
    tenant_id: uuid.UUID,
    user_id: uuid.UUID,
    agent_kit_id: uuid.UUID,
    dataset_id: uuid.UUID | None = None,
    dataset_group_id: uuid.UUID | None = None,
    title: str | None = None,
) -> ChatSessionModel:
    if not dataset_id and not dataset_group_id:
        raise ValueError("Either dataset_id or dataset_group_id must be provided")

    dataset = None
    dataset_group = None

    if dataset_id:
        dataset = dataset_service.get_dataset(db, dataset_id=dataset_id, tenant_id=tenant_id)
        if not dataset:
            raise ValueError("Dataset not found for tenant")

    if dataset_group_id:
        from app.services import dataset_groups as dataset_group_service  # Local import to avoid cycle

        dataset_group = dataset_group_service.get_dataset_group(db, group_id=dataset_group_id)
        if not dataset_group or dataset_group.tenant_id != tenant_id:
            raise ValueError("Dataset group not found for tenant")

    agent_kit = agent_kit_service.get_agent_kit(db, agent_kit_id=agent_kit_id)
    if not agent_kit or str(agent_kit.tenant_id) != str(tenant_id):
        raise ValueError("Agent kit not found for tenant")

    session_title = title
    if not session_title:
        if dataset:
            session_title = f"{agent_kit.name} on {dataset.name}"
        elif dataset_group:
            session_title = f"{agent_kit.name} on {dataset_group.name} (Group)"

    adk_session_id = None
    if settings.ADK_BASE_URL:
        try:
            adk_state = _build_adk_state(
                tenant_id=tenant_id,
                agent_kit=agent_kit,
                dataset=dataset,
                dataset_group=dataset_group,
            )
            adk_session = get_adk_client().create_session(user_id=user_id, state=adk_state)
            adk_session_id = adk_session.get("id")
        except ADKNotConfiguredError:
            # Misconfiguration – fall back to native session metadata
            logger.warning("ADK_BASE_URL configured improperly; proceeding without ADK session.")
        except Exception as exc:  # pragma: no cover - network failure path
            logger.exception("Unable to create ADK session: %s", exc)
            raise RuntimeError("Unable to create ADK session") from exc

    session = ChatSessionModel(
        title=session_title,
        dataset_id=dataset.id if dataset else None,
        dataset_group_id=dataset_group.id if dataset_group else None,
        agent_kit_id=agent_kit.id,
        tenant_id=tenant_id,
        source="adk" if adk_session_id else "native",
        external_id=adk_session_id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _append_message(
    db: Session,
    *,
    session: ChatSessionModel,
    role: str,
    content: str,
    context: Dict[str, Any] | None = None,
) -> ChatMessage:
    message = ChatMessage(
        session_id=session.id,
        role=role,
        content=content,
        context=context,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def post_user_message(
    db: Session,
    *,
    session: ChatSessionModel,
    user_id: uuid.UUID,
    content: str,
) -> Tuple[ChatMessage, ChatMessage]:
    user_message = _append_message(db, session=session, role="user", content=content)
    assistant_message = _generate_agentic_response(
        db,
        session=session,
        user_id=user_id,
        user_message=content,
    )
    return user_message, assistant_message


def _generate_agentic_response(
    db: Session,
    *,
    session: ChatSessionModel,
    user_id: uuid.UUID,
    user_message: str,
) -> ChatMessage:
    if not settings.ADK_BASE_URL:
        logger.error(f"ADK_BASE_URL is missing in settings: {settings.ADK_BASE_URL}")
        return _append_message(
            db,
            session=session,
            role="assistant",
            content=ADK_UNCONFIGURED_MESSAGE,
            context={"error": "adk_not_configured"},
        )

    try:
        client = get_adk_client()
    except ADKNotConfiguredError as e:
        logger.error(f"get_adk_client raised ADKNotConfiguredError: {e}")
        return _append_message(
            db,
            session=session,
            role="assistant",
            content=ADK_UNCONFIGURED_MESSAGE,
            context={"error": "adk_not_configured"},
        )

    agent_kit = session.agent_kit
    dataset = session.dataset
    dataset_group = session.dataset_group

    if not agent_kit:
        return _append_message(
            db,
            session=session,
            role="assistant",
            content="No agent kit is attached to this session yet.",
            context=None,
        )

    adk_session_id = session.external_id
    if not adk_session_id:
        try:
            adk_state = _build_adk_state(
                tenant_id=session.tenant_id,
                agent_kit=agent_kit,
                dataset=dataset,
                dataset_group=dataset_group,
            )
            adk_session = client.create_session(user_id=user_id, state=adk_state)
            adk_session_id = adk_session.get("id")
            session.external_id = adk_session_id
            session.source = "adk"
            db.commit()
            db.refresh(session)
        except Exception as exc:  # pragma: no cover - network failure path
            logger.exception("Unable to create ADK session for chat: %s", exc)
            return _append_message(
                db,
                session=session,
                role="assistant",
                content=ADK_FAILURE_MESSAGE,
                context={"error": str(exc)},
            )

    try:
        events = client.run(user_id=user_id, session_id=str(adk_session_id), message=user_message)
        response_text, context = _extract_adk_response(events)
        _run_entity_extraction(db, session, context)
        return _append_message(
            db,
            session=session,
            role="assistant",
            content=response_text,
            context=context,
        )
    except Exception as exc:
        # ADK sessions are in-memory; if the pod restarted the session is gone.
        # Detect 404 "Session not found" and transparently re-create.
        is_session_lost = "404" in str(exc) or "Session not found" in str(exc)
        if is_session_lost:
            logger.warning("ADK session %s lost (pod restart?), re-creating.", adk_session_id)
            try:
                adk_state = _build_adk_state(
                    tenant_id=session.tenant_id,
                    agent_kit=agent_kit,
                    dataset=dataset,
                    dataset_group=dataset_group,
                )
                new_adk_session = client.create_session(user_id=user_id, state=adk_state)
                adk_session_id = new_adk_session.get("id")
                session.external_id = adk_session_id
                db.commit()
                db.refresh(session)
                events = client.run(user_id=user_id, session_id=str(adk_session_id), message=user_message)
                response_text, context = _extract_adk_response(events)
                _run_entity_extraction(db, session, context)
                return _append_message(
                    db,
                    session=session,
                    role="assistant",
                    content=response_text,
                    context=context,
                )
            except Exception as retry_exc:
                logger.exception("ADK retry after session re-creation also failed: %s", retry_exc)
                return _append_message(
                    db,
                    session=session,
                    role="assistant",
                    content=ADK_FAILURE_MESSAGE,
                    context={"error": str(retry_exc)},
                )
        logger.exception("ADK run failed: %s", exc)
        return _append_message(
            db,
            session=session,
            role="assistant",
            content=ADK_FAILURE_MESSAGE,
            context={"error": str(exc)},
        )


def _run_entity_extraction(
    db: Session,
    session: ChatSessionModel,
    context: Dict[str, Any] | None,
) -> None:
    """Run entity extraction on the session and store count in context.

    Wrapped in try/except so extraction failures never break chat.
    """
    try:
        extracted = knowledge_extraction_service.extract_from_session(
            db, session.id, session.tenant_id
        )
        entities_extracted = len(extracted)
        if entities_extracted > 0 and context is not None:
            context["entities_extracted"] = entities_extracted
            logger.info("Extracted %d entities from session %s", entities_extracted, session.id)
    except Exception:
        logger.warning("Entity extraction failed for session %s", session.id, exc_info=True)


def _build_adk_state(
    *,
    tenant_id: uuid.UUID,
    agent_kit: AgentKit | None,
    dataset: Dataset | None,
    dataset_group: Any | None,
) -> Dict[str, Any]:
    datasets: List[Dataset] = []
    if dataset:
        datasets = [dataset]
    elif dataset_group:
        datasets = list(dataset_group.datasets or [])

    dataset_payloads = [
        {
            "id": str(ds.id),
            "name": ds.name,
            "description": ds.description,
            "schema": ds.schema,
            "metadata": ds.metadata_,
            "source_type": ds.source_type,
        }
        for ds in datasets
    ]

    payload: Dict[str, Any] = {
        "tenant_id": str(tenant_id),
        "datasets": dataset_payloads,
        "mcp": {
            "enabled": settings.MCP_ENABLED,
            "server_url": settings.MCP_SERVER_URL,
            "auto_sync": settings.DATABRICKS_AUTO_SYNC,
        },
    }

    if dataset_group:
        payload["dataset_group"] = {
            "id": str(dataset_group.id),
            "name": dataset_group.name,
            "dataset_ids": [str(ds.id) for ds in dataset_group.datasets or []],
        }

    if agent_kit:
        payload["agent_kit"] = {
            "id": str(agent_kit.id),
            "name": agent_kit.name,
            "description": agent_kit.description,
            "config": agent_kit.config,
        }

    return payload


def _extract_adk_response(events: List[Dict[str, Any]]) -> Tuple[str, Dict[str, Any]]:
    assistant_text = ""
    for event in reversed(events):
        author = event.get("author")
        if author and author.lower() != "user":
            content = event.get("content") or {}
            parts = content.get("parts", []) if isinstance(content, dict) else []
            text_parts = []
            for part in parts:
                if isinstance(part, dict) and part.get("text"):
                    text_parts.append(part["text"])
            if text_parts:
                assistant_text = "\n".join(text_parts).strip()
                break

    if not assistant_text:
        assistant_text = "Agent run completed without a response."

    context = {"adk_events": events}
    return assistant_text, context
