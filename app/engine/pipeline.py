from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.engine.classification import classify_message
from app.engine.context_budget import build_context_prompt
from app.engine.embeddings import embed_text
from app.engine.extraction import extract_order
from app.engine.tier0_rules import match_tier0
from app.models import (
    Conversation,
    ConvState,
    Direction,
    Message,
    ModelTier,
    Order,
    OrderStatus,
)

DEFAULT_INTENTS = ["greeting", "spam", "reaction", "purchase_intent", "question", "other"]


@dataclass
class PipelineResult:
    message: Message
    order: Order | None


async def _known_intents(session: AsyncSession) -> list[str]:
    result = await session.execute(select(Message.intent).where(Message.intent.is_not(None)).distinct())
    intents = {row[0] for row in result.all()}
    return sorted(intents) if intents else list(DEFAULT_INTENTS)


async def _correction_count(session: AsyncSession, conversation_id: str) -> int:
    result = await session.execute(
        select(func.count(Order.id)).where(
            Order.conversation_id == conversation_id,
            or_(Order.status == OrderStatus.REJECTED, Order.confirmed_payload.is_not(None)),
        )
    )
    return result.scalar_one()


async def process_message(
    session: AsyncSession, conversation: Conversation, raw_text: str, normalized_text: str
) -> PipelineResult:
    message = Message(
        conversation_id=conversation.id,
        direction=Direction.INBOUND,
        raw_text=raw_text,
        normalized_text=normalized_text,
    )
    session.add(message)
    conversation.last_message_at = datetime.now(UTC)

    tier0_intent = match_tier0(normalized_text)
    if tier0_intent:
        message.intent = tier0_intent
        message.intent_confidence = 1.0
        message.model_tier = ModelTier.RULE
        await session.flush()
        return PipelineResult(message=message, order=None)

    history_result = await session.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.desc())
        .limit(settings.CONTEXT_HISTORY_TURNS)
    )
    history = list(reversed(history_result.scalars().all()))

    prompt, overflowed = build_context_prompt(
        history=history,
        slots=conversation.slots,
        current_text=normalized_text,
        max_turns=settings.CONTEXT_HISTORY_TURNS,
        token_budget=settings.NILECHAT_CONTEXT_TOKEN_BUDGET,
    )

    known_intents = await _known_intents(session)
    classification, tier, reason = await classify_message(
        prompt, known_intents, settings.CLASSIFICATION_CONFIDENCE_THRESHOLD
    )

    message.intent = classification.intent
    message.intent_confidence = classification.confidence
    message.model_tier = ModelTier.NILECHAT if tier == "nilechat" else ModelTier.ESCALATED
    message.escalation_reason = reason
    message.embedding = await embed_text(normalized_text)

    order = None
    if classification.intent == "purchase_intent" and conversation.state in (ConvState.GATHERING, ConvState.CONFIRMING):
        correction_count = await _correction_count(session, conversation.id)
        extraction, extraction_tier, extraction_reason = await extract_order(
            prompt, settings.CLASSIFICATION_CONFIDENCE_THRESHOLD, overflowed, correction_count
        )
        status = (
            OrderStatus.AUTO_CONFIRMED
            if not extraction.ambiguous_fields and extraction.confidence >= settings.CLASSIFICATION_CONFIDENCE_THRESHOLD
            else OrderStatus.PENDING_REVIEW
        )
        order = Order(
            conversation_id=conversation.id,
            extracted_payload=extraction.model_dump(mode="json"),
            status=status,
            confidence_score=extraction.confidence,
            extracted_by_tier=ModelTier.NILECHAT if extraction_tier == "nilechat" else ModelTier.ESCALATED,
        )
        session.add(order)
        if extraction_reason and not message.escalation_reason:
            message.escalation_reason = extraction_reason

    await session.flush()
    return PipelineResult(message=message, order=order)
