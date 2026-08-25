from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.engine.context_budget import build_context_prompt
from app.engine.gateway import AICallError, complete, deepseek_provider
from app.engine.prompts import ACTION_TASK_BLOCK, build_system_prompt
from app.engine.schemas import ProposedActionEnvelope
from app.engine.tools.registry import ActionOutcome, dispatch_action
from app.models.conversation import Conversation
from app.models.merchant import Merchant
from app.models.message import Message


@dataclass(frozen=True)
class ActionResolution:
    proposed_action: object | None
    outcome: ActionOutcome | None
    response_text: str
    escalation_reason: str | None


def _render_response(outcome: ActionOutcome, action) -> str:
    if outcome.status == "rejected":
        reason = outcome.errors[0].message if outcome.errors else "that wasn't a valid request"
        return f"Sorry, I couldn't do that — {reason}."
    if outcome.status == "failed":
        return "I can't complete that yet — let me get a teammate to help you with this."
    if action.action == "search_products":
        products = outcome.result.get("products", [])
        if not products:
            return "I couldn't find any products matching that."
        names = ", ".join(p["name"] for p in products[:5])
        return f"Found {len(products)} product(s): {names}"
    if action.action == "get_product":
        return outcome.result["product"]["name"]
    if action.action == "update_customer_info":
        note = ""
        if outcome.result["delivery_validation"]["status"] == "unavailable":
            note = " I'll confirm the delivery fee for your area separately."
        return "Got it, saved your info." + note
    return "Done."


async def resolve_action(session: AsyncSession, conversation: Conversation, message: Message) -> ActionResolution:
    history_result = await session.scalars(
        select(Message)
        .where(Message.conversation_id == conversation.id, Message.id != message.id)
        .order_by(Message.created_at.desc())
        .limit(settings.CONTEXT_HISTORY_TURNS)
    )
    history = list(reversed(history_result.all()))

    prompt = build_context_prompt(
        history, conversation.slots, message.normalized_text or message.raw_text or "", max_turns=settings.CONTEXT_HISTORY_TURNS, mode="action"
    )

    merchant_name = await session.scalar(select(Merchant.name).where(Merchant.id == conversation.merchant_id))

    system_prompt = build_system_prompt(
        task_block=ACTION_TASK_BLOCK, merchant_name=merchant_name,
        conv_state=conversation.state, slots=conversation.slots,
    )

    provider = deepseek_provider()
    envelope = None
    for _attempt in range(2):  # S44: retry once on invalid JSON, then escalate
        try:
            envelope, _ = await complete(
                provider, system_prompt=system_prompt, user_prompt=prompt,
                schema_model=ProposedActionEnvelope, parse_model=ProposedActionEnvelope, schema_name="ProposedAction",
            )
            break
        except AICallError:
            continue

    if envelope is None:
        return ActionResolution(
            proposed_action=None, outcome=None,
            response_text="Let me get a teammate to help with this.",
            escalation_reason="ai_call_failed",
        )

    action = envelope.root
    outcome = await dispatch_action(
        session, action, merchant_id=conversation.merchant_id,
        conversation_id=conversation.id, message_id=message.id,
    )

    escalation_reason = None
    if outcome.status == "rejected":
        escalation_reason = f"action_rejected:{outcome.errors[0].code}"
    elif outcome.status == "failed":
        escalation_reason = f"tool_unavailable:{action.action}"

    return ActionResolution(
        proposed_action=action, outcome=outcome,
        response_text=_render_response(outcome, action),
        escalation_reason=escalation_reason,
    )
