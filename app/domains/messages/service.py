from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.messages.schemas import MessageIngestRequest, MessageIngestResponse
from app.engine.pipeline import process_message
from app.models import Conversation


class ConversationNotFoundError(Exception):
    pass


async def ingest_message(db: AsyncSession, payload: MessageIngestRequest) -> MessageIngestResponse:
    conversation = await db.get(Conversation, payload.conversation_id)
    if conversation is None:
        raise ConversationNotFoundError(payload.conversation_id)

    result = await process_message(db, conversation, payload.raw_text, payload.normalized_text)

    return MessageIngestResponse(
        message_id=result.message.id,
        intent=result.message.intent,
        intent_confidence=result.message.intent_confidence,
        model_tier=result.message.model_tier.value if result.message.model_tier else None,
        escalation_reason=result.message.escalation_reason,
        order_id=result.order.id if result.order else None,
        order_status=result.order.status.value if result.order else None,
    )
