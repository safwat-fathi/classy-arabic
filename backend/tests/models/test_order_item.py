from decimal import Decimal

from app.models import Order, OrderItem, OrderSource, OrderStatus
from app.models.enums import ModelTier


async def test_order_item_round_trip(db_session, merchant, conversation, message):
    order = Order(
        merchant_id=merchant.id,
        conversation_id=conversation.id,
        message_id=message.id,
        extracted_payload={},
        status=OrderStatus.PENDING_REVIEW,
        confidence_score=1.0,
        extracted_by_tier=ModelTier.DEEPSEEK,
        source=OrderSource.CART_CHECKOUT,
    )
    db_session.add(order)
    await db_session.flush()

    item = OrderItem(order_id=order.id, name_snapshot="Blue Shirt", unit_price=199.99, quantity=2)
    db_session.add(item)
    await db_session.flush()
    await db_session.refresh(item)

    assert item.id is not None
    assert item.unit_price == Decimal("199.99")


async def test_order_source_defaults_to_ai_extraction(db_session, merchant, conversation, message):
    order = Order(
        merchant_id=merchant.id,
        conversation_id=conversation.id,
        message_id=message.id,
        extracted_payload={},
        status=OrderStatus.PENDING_REVIEW,
        confidence_score=1.0,
        extracted_by_tier=ModelTier.DEEPSEEK,
    )
    db_session.add(order)
    await db_session.flush()
    await db_session.refresh(order)

    assert order.source == OrderSource.AI_EXTRACTION
    assert order.order_number is None
