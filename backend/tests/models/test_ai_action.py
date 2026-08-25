from app.models import AIAction


async def test_ai_action_round_trip(db_session, merchant, conversation):
    action = AIAction(
        merchant_id=merchant.id,
        conversation_id=conversation.id,
        message_id="msg-does-not-need-to-exist-for-this-round-trip",
        action_type="search_products",
        arguments={"query": "shoes"},
        status="executed",
        errors=[],
        result={"products": []},
    )
    db_session.add(action)
    await db_session.flush()
    await db_session.refresh(action)

    assert action.id is not None
    assert action.status == "executed"
    assert action.created_at is not None
