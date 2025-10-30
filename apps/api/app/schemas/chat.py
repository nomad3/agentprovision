from __future__ import annotations

from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel


class ChatSessionBase(BaseModel):
    title: Optional[str] = None


class ChatSessionCreate(ChatSessionBase):
    dataset_id: uuid.UUID
    agent_kit_id: uuid.UUID


class ChatSession(ChatSessionBase):
    id: uuid.UUID
    dataset_id: uuid.UUID
    agent_kit_id: uuid.UUID | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageBase(BaseModel):
    content: str


class ChatMessageCreate(ChatMessageBase):
    pass


class ChatMessage(ChatMessageBase):
    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    context: dict | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatTurn(BaseModel):
    user_message: ChatMessage
    assistant_message: ChatMessage
