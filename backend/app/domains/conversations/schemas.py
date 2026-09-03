from datetime import datetime

from pydantic import BaseModel


class ConversationRead(BaseModel):
    id: str
    merchant_id: str
    customer_ref: str
    state: str
    slots: dict
    last_message_at: datetime
    ai_enabled: bool = True
    human_takeover: bool = False


class MessageRead(BaseModel):
    id: str
    conversation_id: str
    direction: str
    raw_text: str | None
    intent: str | None = None
    intent_confidence: float | None = None
    created_at: datetime


class ReplyRequest(BaseModel):
    text: str
