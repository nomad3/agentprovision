from __future__ import annotations

from typing import List, Tuple
import uuid

from sqlalchemy.orm import Session

from app.models.chat import ChatSession as ChatSessionModel, ChatMessage
from app.models.dataset import Dataset
from app.models.agent_kit import AgentKit
from app.schemas.agent_kit import AgentKitConfig
from app.services import datasets as dataset_service
from app.services import agent_kits as agent_kit_service


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
    dataset_id: uuid.UUID,
    agent_kit_id: uuid.UUID,
    title: str | None = None,
) -> ChatSessionModel:
    dataset = dataset_service.get_dataset(db, dataset_id=dataset_id, tenant_id=tenant_id)
    if not dataset:
        raise ValueError("Dataset not found for tenant")

    agent_kit = agent_kit_service.get_agent_kit(db, agent_kit_id=agent_kit_id)
    if not agent_kit or str(agent_kit.tenant_id) != str(tenant_id):
        raise ValueError("Agent kit not found for tenant")

    session = ChatSessionModel(
        title=title or f"{agent_kit.name} on {dataset.name}",
        dataset_id=dataset.id,
        agent_kit_id=agent_kit.id,
        tenant_id=tenant_id,
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
    context: dict | None = None,
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
    content: str,
) -> Tuple[ChatMessage, ChatMessage]:
    user_message = _append_message(db, session=session, role="user", content=content)
    assistant_message = _generate_agentic_response(db, session=session, user_message=content)
    return user_message, assistant_message


def _generate_agentic_response(
    db: Session,
    *,
    session: ChatSessionModel,
    user_message: str,
) -> ChatMessage:
    dataset: Dataset = session.dataset
    agent_kit: AgentKit | None = session.agent_kit

    if not agent_kit:
        response_text = "No agent kit is attached to this session yet."
        return _append_message(db, session=session, role="assistant", content=response_text, context=None)

    try:
        config = AgentKitConfig.parse_obj(agent_kit.config)
    except Exception as exc:  # noqa: BLE001
        response_text = "Agent kit configuration is invalid."
        return _append_message(
            db,
            session=session,
            role="assistant",
            content=response_text,
            context={"error": str(exc)},
        )

    try:
        simulation = agent_kit_service.simulate_agent_kit(db=db, agent_kit=agent_kit)
    except ValueError as exc:
        simulation = None
        simulation_error = str(exc)
    else:
        simulation_error = None

    summary_payload = dataset_service.run_summary_query(dataset)
    sample_rows = dataset.sample_rows or []

    response_lines: List[str] = []
    response_lines.append(
        f"Using agent kit '{agent_kit.name}' to pursue: {config.primary_objective}."
    )

    if config.metrics:
        response_lines.append("Key metrics monitored: " + ", ".join(config.metrics) + ".")

    if summary_payload["numeric_columns"]:
        top_columns = summary_payload["numeric_columns"][:3]
        formatted = "; ".join(
            f"{col['column']}: avg {col['avg']:.2f} (min {col['min']}, max {col['max']})"
            for col in top_columns
            if col["avg"] is not None
        )
        if formatted:
            response_lines.append("Top numeric signals: " + formatted + ".")

    if sample_rows:
        exemplar = sample_rows[0]
        row_preview = ", ".join(f"{key}={value}" for key, value in exemplar.items())
        response_lines.append("Sample record: " + row_preview + ".")

    if simulation and simulation.steps:
        response_lines.append(
            "Next recommended action: " + simulation.steps[0].recommended_prompt
            if simulation.steps[0].recommended_prompt
            else "Following the first playbook step." 
        )
    elif simulation_error:
        response_lines.append("Note: " + simulation_error)

    if config.handoff_channels:
        response_lines.append(
            "Escalation paths: " + ", ".join(config.handoff_channels) + "."
        )

    response_lines.append(
        "User question acknowledged. Provide additional directives for deeper analysis or filtering."
    )

    response_text = "\n".join(response_lines)

    context_payload = {
        "summary": summary_payload,
        "sample_rows": sample_rows[:3],
        "simulation": simulation.dict() if simulation else None,
        "user_message": user_message,
    }

    return _append_message(
        db,
        session=session,
        role="assistant",
        content=response_text,
        context=context_payload,
    )
