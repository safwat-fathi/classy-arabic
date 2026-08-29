from app.engine.schemas import GetDeliveryInfoAction
from app.engine.tools.delivery import handle_get_delivery_info


async def test_handle_get_delivery_info_returns_available_default_for_unconfigured_merchant(
    db_session, merchant, conversation
):
    action = GetDeliveryInfoAction(action="get_delivery_info", address="Nasr City", confidence=0.9)
    result = await handle_get_delivery_info(db_session, action, merchant.id, conversation.id, "msg-1")
    assert result["status"] == "available"
    assert result["delivery_fee"] == "0.00"


async def test_dispatch_get_delivery_info_executes(db_session, merchant, conversation):
    from app.engine.tools.registry import dispatch_action

    action = GetDeliveryInfoAction(action="get_delivery_info", address="Nasr City", confidence=0.9)
    outcome = await dispatch_action(
        db_session, action, merchant_id=merchant.id, conversation_id=conversation.id, message_id="msg-2"
    )
    assert outcome.status == "executed"
    assert outcome.result["status"] == "available"
