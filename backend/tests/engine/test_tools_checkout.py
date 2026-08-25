import pytest

from app.engine.schemas import CreateOrderAction, GetCheckoutStateAction, UpdateCustomerInfoAction
from app.engine.tools.checkout import handle_create_order, handle_get_checkout_state, handle_update_customer_info
from app.engine.tools.errors import ActionArgumentError, ToolUnavailableError


async def test_handle_update_customer_info_captures_fields(db_session, merchant, conversation):
    action = UpdateCustomerInfoAction(
        action="update_customer_info", name="Sara", phone="01012345678",
        address="Nasr City", confidence=0.9,
    )
    result = await handle_update_customer_info(db_session, action, merchant.id, conversation.id)

    assert result["captured"] == {"name": "Sara", "phone": "01012345678", "address": "Nasr City"}
    assert result["delivery_validation"]["status"] == "unavailable"

    await db_session.flush()
    await db_session.refresh(conversation)
    assert conversation.slots["customer_name"] == "Sara"
    assert conversation.slots["customer_phone"] == "01012345678"


async def test_handle_update_customer_info_rejects_bad_phone(db_session, merchant, conversation):
    action = UpdateCustomerInfoAction(
        action="update_customer_info", phone="not-a-phone", confidence=0.9,
    )
    with pytest.raises(ActionArgumentError):
        await handle_update_customer_info(db_session, action, merchant.id, conversation.id)


async def test_handle_update_customer_info_partial_update_preserves_existing_slots(
    db_session, merchant, conversation
):
    conversation.slots = {"customer_name": "Existing Name"}
    await db_session.flush()

    action = UpdateCustomerInfoAction(action="update_customer_info", phone="01098765432", confidence=0.9)
    await handle_update_customer_info(db_session, action, merchant.id, conversation.id)

    await db_session.flush()
    await db_session.refresh(conversation)
    assert conversation.slots["customer_name"] == "Existing Name"
    assert conversation.slots["customer_phone"] == "01098765432"


async def test_handle_get_checkout_state_raises_tool_unavailable(db_session, merchant, conversation):
    action = GetCheckoutStateAction(action="get_checkout_state", confidence=0.9)
    with pytest.raises(ToolUnavailableError):
        await handle_get_checkout_state(db_session, action, merchant.id, conversation.id)


async def test_handle_create_order_raises_tool_unavailable(db_session, merchant, conversation):
    action = CreateOrderAction(action="create_order", confirm=True, confidence=0.9)
    with pytest.raises(ToolUnavailableError):
        await handle_create_order(db_session, action, merchant.id, conversation.id)
