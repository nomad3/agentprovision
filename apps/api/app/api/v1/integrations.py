from typing import Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.services.chat_import import chat_import_service
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatSession as ChatSessionSchema

router = APIRouter()

@router.post("/import/chatgpt", status_code=201)
async def import_chatgpt_history(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Import chat history from ChatGPT export (conversations.json).
    """
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="File must be a JSON file")

    content = await file.read()
    try:
        sessions_data = chat_import_service.parse_chatgpt_export(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    imported_count = 0
    for session_data in sessions_data:
        # Check if already imported (by external_id)
        existing = db.query(ChatSession).filter(
            ChatSession.tenant_id == current_user.tenant_id,
            ChatSession.external_id == session_data["external_id"],
            ChatSession.source == "chatgpt_import"
        ).first()

        if existing:
            continue

        # Create session
        db_session = ChatSession(
            title=session_data["title"],
            tenant_id=current_user.tenant_id,
            source="chatgpt_import",
            external_id=session_data["external_id"]
        )
        db.add(db_session)
        db.flush() # Get ID

        # Create messages
        for msg in session_data["messages"]:
            db_msg = ChatMessage(
                session_id=db_session.id,
                role=msg["role"],
                content=msg["content"],
                # created_at could be set if we parse it correctly
            )
            db.add(db_msg)

        imported_count += 1

    db.commit()

    # TODO: Trigger knowledge extraction background task

    return {"message": f"Successfully imported {imported_count} chat sessions from ChatGPT"}

@router.post("/import/claude", status_code=201)
async def import_claude_history(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Import chat history from Claude export (conversations.json).
    """
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="File must be a JSON file")

    content = await file.read()
    try:
        sessions_data = chat_import_service.parse_claude_export(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    imported_count = 0
    for session_data in sessions_data:
        # Check if already imported
        existing = db.query(ChatSession).filter(
            ChatSession.tenant_id == current_user.tenant_id,
            ChatSession.external_id == session_data["external_id"],
            ChatSession.source == "claude_import"
        ).first()

        if existing:
            continue

        # Create session
        db_session = ChatSession(
            title=session_data["title"],
            tenant_id=current_user.tenant_id,
            source="claude_import",
            external_id=session_data["external_id"]
        )
        db.add(db_session)
        db.flush()

        # Create messages
        for msg in session_data["messages"]:
            db_msg = ChatMessage(
                session_id=db_session.id,
                role=msg["role"],
                content=msg["content"],
            )
            db.add(db_msg)

        imported_count += 1

    db.commit()

    return {"message": f"Successfully imported {imported_count} chat sessions from Claude"}
