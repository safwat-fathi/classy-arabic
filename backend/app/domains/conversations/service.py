from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.conversations.schemas import ConversationRead, MessageRead
from app.models import Conversation, Message


async def list_conversations(db: AsyncSession, merchant_id: str) -> list[ConversationRead]:
    stmt = (
        select(Conversation)
        .where(Conversation.merchant_id == merchant_id)
        .order_by(Conversation.last_message_at.desc())
    )
    result = await db.execute(stmt)
    conversations = result.scalars().all()
    return [
        ConversationRead(
            id=c.id,
            merchant_id=c.merchant_id,
            customer_ref=c.customer_ref,
            state=c.state.value,
            slots=c.slots,
            last_message_at=c.last_message_at,
            ai_enabled=c.ai_enabled,
            human_takeover=c.human_takeover,
        )
        for c in conversations
    ]


async def get_conversation_messages(
    db: AsyncSession, merchant_id: str, conversation_id: str
) -> list[MessageRead] | None:
    conversation = await db.get(Conversation, conversation_id)
    if conversation is None or conversation.merchant_id != merchant_id:
        return None
    stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    result = await db.execute(stmt)
    return [
        MessageRead(
            id=m.id,
            conversation_id=m.conversation_id,
            direction=m.direction.value,
            raw_text=m.raw_text,
            intent=m.intent,
            intent_confidence=m.intent_confidence,
            created_at=m.created_at,
        )
        for m in result.scalars().all()
    ]
