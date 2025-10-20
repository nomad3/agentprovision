from __future__ import annotations

from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas import chat as chat_schema
from app.services import chat as chat_service

router = APIRouter()


@router.get("/sessions", response_model=List[chat_schema.ChatSession])
def list_sessions(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    return chat_service.list_sessions(db, tenant_id=current_user.tenant_id)


@router.post(
    "/sessions",
    response_model=chat_schema.ChatSession,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    payload: chat_schema.ChatSessionCreate,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    try:
        session = chat_service.create_session(
            db,
            tenant_id=current_user.tenant_id,
            dataset_id=payload.dataset_id,
            agent_kit_id=payload.agent_kit_id,
            title=payload.title,
        )
        return session
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get(
    "/sessions/{session_id}",
    response_model=chat_schema.ChatSession,
)
def read_session(
    session_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    session = chat_service.get_session(db, session_id=session_id, tenant_id=current_user.tenant_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    return session


@router.get(
    "/sessions/{session_id}/messages",
    response_model=List[chat_schema.ChatMessage],
)
def list_messages(
    session_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    session = chat_service.get_session(db, session_id=session_id, tenant_id=current_user.tenant_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    return session.messages


@router.post(
    "/sessions/{session_id}/messages",
    response_model=chat_schema.ChatTurn,
    status_code=status.HTTP_201_CREATED,
)
def post_message(
    session_id: uuid.UUID,
    payload: chat_schema.ChatMessageCreate,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    session = chat_service.get_session(db, session_id=session_id, tenant_id=current_user.tenant_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    user_message, assistant_message = chat_service.post_user_message(
        db,
        session=session,
        content=payload.content,
    )
    return chat_schema.ChatTurn(user_message=user_message, assistant_message=assistant_message)
