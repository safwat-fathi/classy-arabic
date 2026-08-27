from decimal import Decimal

from sqlalchemy import select

from app.domains.checkout.order_writer import ResolvedOrderLine, write_order
from app.models.enums import ModelTier, OrderSource, OrderStatus
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.product_variant import ProductVariant


async def test_write_order_assigns_sequential_order_number_when_requested(db_session, merchant, conversation, message):
    product = Product(merchant_id=merchant.id, name="Shoes", price=Decimal("250.00"))
    db_session.add(product)
    await db_session.flush()

    line = ResolvedOrderLine(
        product_id=product.id,
        variant_id=None,
        name_snapshot=product.name,
        variant_snapshot=None,
        unit_price=product.price,
        quantity=1,
    )

    first = await write_order(
        db_session,
        merchant_id=merchant.id,
        conversation_id=conversation.id,
        message_id=message.id,
        status=OrderStatus.CONFIRMED,
        source=OrderSource.CART_CHECKOUT,
        lines=[line],
        extracted_payload={},
        confidence_score=1.0,
        extracted_by_tier=ModelTier.DEEPSEEK,
        assign_order_number=True,
    )
    second = await write_order(
        db_session,
        merchant_id=merchant.id,
        conversation_id=conversation.id,
        message_id=message.id,
        status=OrderStatus.CONFIRMED,
        source=OrderSource.CART_CHECKOUT,
        lines=[line],
        extracted_payload={},
        confidence_score=1.0,
        extracted_by_tier=ModelTier.DEEPSEEK,
        assign_order_number=True,
    )

    assert first.order_number == 1
    assert second.order_number == 2


async def test_write_order_skips_order_number_when_not_requested(db_session, merchant, conversation, message):
    order = await write_order(
        db_session,
        merchant_id=merchant.id,
        conversation_id=conversation.id,
        message_id=message.id,
        status=OrderStatus.PENDING_REVIEW,
        source=OrderSource.AI_EXTRACTION,
        lines=[],
        extracted_payload={"raw": "some extraction"},
        confidence_score=0.4,
        extracted_by_tier=ModelTier.DEEPSEEK,
        assign_order_number=False,
    )

    assert order.order_number is None

    await db_session.refresh(merchant)
    assert merchant.next_order_number == 1


async def test_write_order_builds_order_items_with_variant_snapshot(db_session, merchant, conversation, message):
    product = Product(merchant_id=merchant.id, name="Shirt", price=Decimal("199.99"))
    db_session.add(product)
    await db_session.flush()
    variant = ProductVariant(product_id=product.id, label="M / Blue", price=Decimal("219.99"))
    db_session.add(variant)
    await db_session.flush()

    line = ResolvedOrderLine(
        product_id=product.id,
        variant_id=variant.id,
        name_snapshot=product.name,
        variant_snapshot=variant.label,
        unit_price=variant.price,
        quantity=1,
    )

    order = await write_order(
        db_session,
        merchant_id=merchant.id,
        conversation_id=conversation.id,
        message_id=message.id,
        status=OrderStatus.CONFIRMED,
        source=OrderSource.CART_CHECKOUT,
        lines=[line],
        extracted_payload={},
        confidence_score=1.0,
        extracted_by_tier=ModelTier.DEEPSEEK,
        assign_order_number=True,
    )

    items = (await db_session.execute(select(OrderItem).where(OrderItem.order_id == order.id))).scalars().all()
    assert len(items) == 1
    assert items[0].variant_id == variant.id
    assert items[0].variant_snapshot == "M / Blue"
    assert items[0].unit_price == Decimal("219.99")


async def test_write_order_computes_subtotal_from_lines(db_session, merchant, conversation, message):
    product_a = Product(merchant_id=merchant.id, name="Shoes", price=Decimal("250.00"))
    product_b = Product(merchant_id=merchant.id, name="Socks", price=Decimal("30.00"))
    db_session.add_all([product_a, product_b])
    await db_session.flush()

    lines = [
        ResolvedOrderLine(
            product_id=product_a.id,
            variant_id=None,
            name_snapshot=product_a.name,
            variant_snapshot=None,
            unit_price=product_a.price,
            quantity=2,
        ),
        ResolvedOrderLine(
            product_id=product_b.id,
            variant_id=None,
            name_snapshot=product_b.name,
            variant_snapshot=None,
            unit_price=product_b.price,
            quantity=3,
        ),
    ]

    order = await write_order(
        db_session,
        merchant_id=merchant.id,
        conversation_id=conversation.id,
        message_id=message.id,
        status=OrderStatus.CONFIRMED,
        source=OrderSource.CART_CHECKOUT,
        lines=lines,
        extracted_payload={},
        confidence_score=1.0,
        extracted_by_tier=ModelTier.DEEPSEEK,
        assign_order_number=True,
    )

    # 250.00*2 + 30.00*3 = 500.00 + 90.00 = 590.00
    assert order.subtotal == Decimal("590.00")
    assert order.total == Decimal("590.00")


async def test_write_order_allows_empty_lines_list(db_session, merchant, conversation, message):
    order = await write_order(
        db_session,
        merchant_id=merchant.id,
        conversation_id=conversation.id,
        message_id=message.id,
        status=OrderStatus.PENDING_REVIEW,
        source=OrderSource.AI_EXTRACTION,
        lines=[],
        extracted_payload={"raw": "customer only sent a greeting"},
        confidence_score=0.2,
        extracted_by_tier=ModelTier.DEEPSEEK,
        assign_order_number=False,
    )

    assert order.subtotal == Decimal("0.00")
    assert order.total == Decimal("0.00")

    items = (await db_session.execute(select(OrderItem).where(OrderItem.order_id == order.id))).scalars().all()
    assert items == []
