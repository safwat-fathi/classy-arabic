from pydantic import BaseModel


class MessageIngestRequest(BaseModel):
    conversation_id: str
    raw_text: str
    normalized_text: str


class MessageIngestResponse(BaseModel):
    message_id: str
    intent: str | None
    intent_confidence: float | None
    model_tier: str | None
    escalation_reason: str | None
    order_id: str | None
    order_status: str | None
