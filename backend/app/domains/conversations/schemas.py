from datetime import datetime

from pydantic import BaseModel


class ConversationRead(BaseModel):
    id: str
    merchant_id: str
    customer_ref: str
    state: str
    slots: dict
    last_message_at: datetime
