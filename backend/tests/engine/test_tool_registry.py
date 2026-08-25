from sqlalchemy import select

from app.engine.schemas import GetCheckoutStateAction, GetProductAction
from app.engine.tools import registry as registry_module
from app.engine.tools.errors import ToolUnavailableError
from app.engine.tools.registry import dispatch_action
from app.models.ai_action import AIAction
from app.models.product import Product


async def _unavailable(session, action, merchant_id, conversation_id):
    raise ToolUnavailableError("checkout state requires a Cart which does not exist yet")


async def _echo_product(session, action, merchant_id, conversation_id):
    return {"product": {"id": action.product_id}}


async def test_dispatch_rejects_unapproved_action(db_session, merchant, conversation):
    action = GetProductAction(action="get_product", product_id="missing", confidence=0.9)
    outcome = await dispatch_action(
        db_session, action, merchant_id=merchant.id,
        conversation_id=conversation.id, message_id="msg-1",
    )
    assert outcome.status == "rejected"
    assert outcome.errors[0].code == "product_not_found"

    rows = (
        await db_session.execute(select(AIAction).where(AIAction.conversation_id == conversation.id))
    ).scalars().all()
    assert len(rows) == 1
    assert rows[0].status == "rejected"


async def test_dispatch_records_tool_unavailable_as_failed(db_session, merchant, conversation, monkeypatch):
    # Scoped to this test via monkeypatch — must NOT permanently mutate the
    # module-global _REGISTRY, since Task 11 later registers a real handler
    # under this same action name and a leaked test double would shadow it.
    monkeypatch.setitem(registry_module._REGISTRY, "get_checkout_state", _unavailable)
    action = GetCheckoutStateAction(action="get_checkout_state", confidence=0.9)
    outcome = await dispatch_action(
        db_session, action, merchant_id=merchant.id,
        conversation_id=conversation.id, message_id="msg-2",
    )
    assert outcome.status == "failed"
    assert outcome.errors[0].code == "tool_unavailable"


async def test_dispatch_executes_approved_action(db_session, merchant, conversation, monkeypatch):
    product = Product(id="p-ok", merchant_id=merchant.id, name="Shoes")
    db_session.add(product)
    await db_session.flush()
    # Same scoping concern as above — Task 5 registers the real "get_product" handler.
    monkeypatch.setitem(registry_module._REGISTRY, "get_product", _echo_product)

    action = GetProductAction(action="get_product", product_id="p-ok", confidence=0.9)
    outcome = await dispatch_action(
        db_session, action, merchant_id=merchant.id,
        conversation_id=conversation.id, message_id="msg-3",
    )
    assert outcome.status == "executed"
    assert outcome.result == {"product": {"id": "p-ok"}}


async def test_dispatch_action_commits_the_audit_row(db_session, merchant, conversation):
    action = GetProductAction(action="get_product", product_id="missing", confidence=0.9)
    await dispatch_action(
        db_session, action, merchant_id=merchant.id,
        conversation_id=conversation.id, message_id="msg-commit-check",
    )
    # in_transaction() is False only once a commit has actually happened —
    # flush() alone leaves the transaction open.
    assert db_session.in_transaction() is False
