from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Literal

from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.action_validator import ValidationError, evaluate_action
from app.engine.schemas import ProposedAction
from app.engine.tools.errors import ActionArgumentError, ToolUnavailableError
from app.models.ai_action import AIAction

ToolHandler = Callable[[AsyncSession, ProposedAction, str, str, str], Awaitable[dict]]

_REGISTRY: dict[str, ToolHandler] = {}


def register_tool(action_name: str) -> Callable[[ToolHandler], ToolHandler]:
    def _wrap(fn: ToolHandler) -> ToolHandler:
        _REGISTRY[action_name] = fn
        return fn

    return _wrap


@dataclass(frozen=True)
class ActionOutcome:
    status: Literal["executed", "rejected", "failed"]
    result: dict | None
    errors: list[ValidationError] = field(default_factory=list)


async def _record_ai_action(
    session: AsyncSession,
    action: ProposedAction,
    merchant_id: str,
    conversation_id: str,
    message_id: str,
    *,
    status: str,
    errors: list[ValidationError],
    result: dict | None,
) -> None:
    session.add(
        AIAction(
            merchant_id=merchant_id,
            conversation_id=conversation_id,
            message_id=message_id,
            action_type=action.action,
            arguments=action.model_dump(mode="json", exclude={"action", "confidence"}),
            status=status,
            errors=[{"code": e.code, "message": e.message} for e in errors],
            result=result,
        )
    )
    await session.flush()


async def dispatch_action(
    session: AsyncSession,
    action: ProposedAction,
    *,
    merchant_id: str,
    conversation_id: str,
    message_id: str,
) -> ActionOutcome:
    validation = await evaluate_action(session, action, merchant_id=merchant_id)
    if not validation.approved:
        await _record_ai_action(
            session,
            action,
            merchant_id,
            conversation_id,
            message_id,
            status="rejected",
            errors=validation.errors,
            result=None,
        )
        await session.commit()
        return ActionOutcome(status="rejected", result=None, errors=validation.errors)

    handler = _REGISTRY.get(action.action)
    if handler is None:
        # No handler registered yet (e.g. its tools/<module>.py hasn't landed
        # or hasn't been wired into tools/__init__.py) — fail the same way an
        # explicit ToolUnavailableError would, never raise a bare KeyError.
        errors = [ValidationError("tool_unavailable", f"no handler registered for action {action.action!r}")]
        await _record_ai_action(
            session,
            action,
            merchant_id,
            conversation_id,
            message_id,
            status="failed",
            errors=errors,
            result=None,
        )
        await session.commit()
        return ActionOutcome(status="failed", result=None, errors=errors)

    try:
        result = await handler(session, action, merchant_id, conversation_id, message_id)
    except ActionArgumentError as exc:
        errors = [ValidationError("argument_invalid", msg) for msg in exc.errors]
        await _record_ai_action(
            session,
            action,
            merchant_id,
            conversation_id,
            message_id,
            status="rejected",
            errors=errors,
            result=None,
        )
        await session.commit()
        return ActionOutcome(status="rejected", result=None, errors=errors)
    except ToolUnavailableError as exc:
        errors = [ValidationError("tool_unavailable", str(exc))]
        await _record_ai_action(
            session,
            action,
            merchant_id,
            conversation_id,
            message_id,
            status="failed",
            errors=errors,
            result=None,
        )
        await session.commit()
        return ActionOutcome(status="failed", result=None, errors=errors)

    await _record_ai_action(
        session,
        action,
        merchant_id,
        conversation_id,
        message_id,
        status="executed",
        errors=[],
        result=result,
    )
    await session.commit()
    return ActionOutcome(status="executed", result=result, errors=[])
