import logging
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import String, and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.engine.classification import classify_message
from app.engine.clients import AICallError
from app.engine.context_budget import build_context_prompt
from app.engine.cost import estimate_cost
from app.engine.embeddings import embed_text, find_similar_examples
from app.engine.extraction import extract_order
from app.engine.gateway import CallUsage
from app.engine.product_matching import match_line_items_to_products
from app.engine.tier0_rules import match_tier0
from app.models import (
    AIUsageEvent,
    Conversation,
    ConvState,
    Direction,
    LabeledExample,
    Merchant,
    Message,
    ModelTier,
    Order,
    OrderStatus,
)

DEFAULT_INTENTS = ["greeting", "spam", "reaction", "purchase_intent", "question", "other"]

logger = logging.getLogger(__name__)


@dataclass
class PipelineResult:
    message: Message
    order: Order | None


def _usage_event(
    conversation_id: str, message_id: str, usage: CallUsage | None, *, success: bool, failed_tier: str | None = None
) -> AIUsageEvent:
    if usage is not None:
        return AIUsageEvent(
            conversation_id=conversation_id,
            message_id=message_id,
            tier=usage.tier,
            provider=usage.provider,
            model=usage.model,
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            latency_ms=usage.latency_ms,
            estimated_cost=estimate_cost(usage.model, usage.input_tokens, usage.output_tokens),
            success=success,
        )
    return AIUsageEvent(
        conversation_id=conversation_id,
        message_id=message_id,
        tier=failed_tier or "unknown",
        provider="openrouter",
        model="unknown",
        input_tokens=None,
        output_tokens=None,
        latency_ms=0.0,
        estimated_cost=None,
        success=False,
    )


async def _known_intents(session: AsyncSession) -> list[str]:
    messages = await session.execute(select(Message.intent).where(Message.intent.is_not(None)).distinct())
    labeled = await session.execute(select(LabeledExample.intent).where(LabeledExample.intent.is_not(None)).distinct())
    observed = {row[0] for row in messages.all()} | {row[0] for row in labeled.all()}
    return sorted(observed | set(DEFAULT_INTENTS))


async def _correction_count(session: AsyncSession, conversation_id: str) -> int:
    result = await session.execute(
        select(func.count(Order.id)).where(
            Order.conversation_id == conversation_id,
            or_(
                Order.status == OrderStatus.REJECTED,
                and_(
                    Order.confirmed_payload.is_not(None),
                    Order.confirmed_payload.cast(String) != Order.extracted_payload.cast(String),
                ),
            ),
        )
    )
    return result.scalar_one()


async def _merchant_name(session: AsyncSession, merchant_id: str) -> str:
    result = await session.execute(select(Merchant.name).where(Merchant.id == merchant_id))
    return result.scalar_one()


async def process_message(
    session: AsyncSession, conversation: Conversation, raw_text: str, normalized_text: str
) -> PipelineResult:
    tier0_intent = match_tier0(normalized_text)

    # Read history BEFORE adding the new message — session.execute() autoflushes,
    # which would otherwise put the message being classified into its own history
    # and duplicate it against build_context_prompt's current_line.
    history = []
    if not tier0_intent:
        history_result = await session.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.desc())
            .limit(settings.CONTEXT_HISTORY_TURNS)
        )
        history = list(reversed(history_result.scalars().all()))

    message = Message(
        conversation_id=conversation.id,
        direction=Direction.INBOUND,
        raw_text=raw_text,
        normalized_text=normalized_text,
    )
    session.add(message)
    conversation.last_message_at = datetime.now(UTC)

    if tier0_intent:
        message.intent = tier0_intent
        message.intent_confidence = 1.0
        message.model_tier = ModelTier.RULE
        await session.flush()
        return PipelineResult(message=message, order=None)

    examples: list[LabeledExample] = []
    try:
        message.embedding = await embed_text(normalized_text)
        examples = await find_similar_examples(session, message.embedding, conversation.merchant_id)
    except AICallError as exc:
        logger.warning("embedding_failed message_id=%s error=%s", message.id, exc)

    prompt = build_context_prompt(
        history=history,
        slots=conversation.slots,
        current_text=normalized_text,
        max_turns=settings.CONTEXT_HISTORY_TURNS,
        examples=examples,
    )

    known_intents = await _known_intents(session)
    correction_count = await _correction_count(session, conversation.id)
    merchant_name = await _merchant_name(session, conversation.merchant_id)
    try:
        classification, reason, usage = await classify_message(
            prompt,
            known_intents,
            settings.CLASSIFICATION_CONFIDENCE_THRESHOLD,
            correction_count,
            normalized_text,
            merchant_name,
            conversation.state,
            conversation.slots,
        )
    except AICallError as exc:
        logger.warning("classification_failed message_id=%s error=%s", message.id, exc)
        message.escalation_reason = "ai_call_failed"
        session.add(_usage_event(conversation.id, message.id, None, success=False, failed_tier="deepseek"))
        await session.flush()
        return PipelineResult(message=message, order=None)

    session.add(_usage_event(conversation.id, message.id, usage, success=True))
    message.intent = classification.intent
    message.intent_confidence = classification.confidence
    message.model_tier = ModelTier.DEEPSEEK
    message.escalation_reason = reason

    order = None
    if classification.intent == "purchase_intent" and conversation.state in (ConvState.GATHERING, ConvState.CONFIRMING):
        extraction_prompt = build_context_prompt(
            history=history,
            slots=conversation.slots,
            current_text=normalized_text,
            max_turns=settings.CONTEXT_HISTORY_TURNS,
            examples=examples,
            mode="extraction",
        )
        try:
            extraction, extraction_reason, extraction_usage = await extract_order(
                extraction_prompt,
                settings.CLASSIFICATION_CONFIDENCE_THRESHOLD,
                correction_count,
                normalized_text,
                merchant_name,
                conversation.state,
                conversation.slots,
            )
        except AICallError as exc:
            logger.warning("extraction_failed message_id=%s error=%s", message.id, exc)
            if not message.escalation_reason:
                message.escalation_reason = "ai_call_failed"
            session.add(_usage_event(conversation.id, message.id, None, success=False, failed_tier="deepseek"))
            await session.flush()
            return PipelineResult(message=message, order=None)

        session.add(_usage_event(conversation.id, message.id, extraction_usage, success=True))
        extraction.line_items = await match_line_items_to_products(
            session, conversation.merchant_id, extraction.line_items
        )
        status = (
            OrderStatus.AUTO_CONFIRMED
            if extraction.line_items
            and not extraction.ambiguous_fields
            and extraction.confidence >= settings.CLASSIFICATION_CONFIDENCE_THRESHOLD
            else OrderStatus.PENDING_REVIEW
        )
        order = Order(
            conversation_id=conversation.id,
            message_id=message.id,
            extracted_payload=extraction.model_dump(mode="json"),
            status=status,
            confidence_score=extraction.confidence,
            extracted_by_tier=ModelTier.DEEPSEEK,
            escalation_reason=extraction_reason,
        )
        session.add(order)
        if extraction_reason and not message.escalation_reason:
            message.escalation_reason = extraction_reason

    await session.flush()
    return PipelineResult(message=message, order=order)
