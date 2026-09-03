from datetime import UTC, datetime

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.enums import HandoffReason
from app.models.human_handoff import HumanHandoff


class ConversationNotFoundError(Exception):
    pass


async def takeover_conversation(
    session: AsyncSession, merchant_id: str, conversation_id: str, reason: HandoffReason, notes: str | None = None
) -> None:
    conversation = await session.get(Conversation, conversation_id)
    if conversation is None or conversation.merchant_id != merchant_id:
        raise ConversationNotFoundError(conversation_id)

    conversation.human_takeover = True

    handoff = HumanHandoff(
        conversation_id=conversation_id,
        reason=reason,
        notes=notes,
    )
    session.add(handoff)


async def return_to_ai(session: AsyncSession, merchant_id: str, conversation_id: str, notes: str | None = None) -> None:
    conversation = await session.get(Conversation, conversation_id)
    if conversation is None or conversation.merchant_id != merchant_id:
        raise ConversationNotFoundError(conversation_id)

    conversation.human_takeover = False

    # Resolve any pending handoffs
    await session.execute(
        update(HumanHandoff)
        .where(HumanHandoff.conversation_id == conversation_id, HumanHandoff.resolved_at.is_(None))
        .values(resolved_at=datetime.now(UTC), notes=notes)
    )
