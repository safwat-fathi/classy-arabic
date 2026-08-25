from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.conversations.schemas import ConversationRead
from app.models import Conversation


async def list_conversations(db: AsyncSession, merchant_id: str) -> list[ConversationRead]:
    stmt = select(Conversation).where(Conversation.merchant_id == merchant_id).order_by(Conversation.last_message_at.desc())
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
        )
        for c in conversations
    ]
