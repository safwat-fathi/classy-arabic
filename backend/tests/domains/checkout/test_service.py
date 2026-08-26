from decimal import Decimal

import pytest

from app.domains.cart.service import add_item
from app.domains.checkout.service import create_order, get_checkout_state, validate_delivery_area
from app.models.product import Product


async def test_validate_delivery_area_reports_unavailable():
    result = await validate_delivery_area("merchant-1", "Nasr City")
    assert result == {"status": "unavailable", "reason": "delivery_service_not_built"}


async def test_get_checkout_state_empty_cart(db_session, merchant, conversation):
    state = await get_checkout_state(db_session, merchant.id, conversation.id)
    assert state == {"items": [], "subtotal": "0.00", "currency": merchant.currency}


async def test_get_checkout_state_computes_live_subtotal(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 2)

    state = await get_checkout_state(db_session, merchant.id, conversation.id)
    assert state["subtotal"] == "500.00"
    assert state["items"][0]["product_id"] == product.id
    assert state["items"][0]["line_total"] == "500.00"


async def test_create_order_rejects_empty_cart(db_session, merchant, conversation):
    from app.engine.tools.errors import ActionArgumentError

    with pytest.raises(ActionArgumentError, match="cart is empty"):
        await create_order(db_session, merchant.id, conversation.id, True, message_id="msg-1")


async def test_create_order_rejects_missing_customer_info(db_session, merchant, conversation):
    from app.engine.tools.errors import ActionArgumentError

    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 1)

    with pytest.raises(ActionArgumentError, match="customer_name"):
        await create_order(db_session, merchant.id, conversation.id, True, message_id="msg-1")


async def test_create_order_snapshots_and_assigns_order_number(db_session, merchant, conversation, message):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 2)
    conversation.slots = {
        "customer_name": "Sara",
        "customer_phone": "01012345678",
        "customer_address": "Nasr City",
    }
    await db_session.flush()

    result = await create_order(db_session, merchant.id, conversation.id, True, message_id=message.id)

    assert result["order_number"] == 1
    assert result["total"] == "500.00"

    from sqlalchemy import select

    from app.models.order import Order

    order = (await db_session.execute(select(Order).where(Order.id == result["order_id"]))).scalar_one()
    assert order.source.value == "CART_CHECKOUT"
    assert order.customer_name == "Sara"
    assert order.message_id == message.id
    await db_session.refresh(order, attribute_names=["items"])
    assert order.items[0].name_snapshot == "Shoes"
    assert order.items[0].unit_price == Decimal("250.00")


async def test_create_order_is_idempotent_against_retry(db_session, merchant, conversation, message):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 1)
    conversation.slots = {
        "customer_name": "Sara",
        "customer_phone": "01012345678",
        "customer_address": "Nasr City",
    }
    await db_session.flush()

    first = await create_order(db_session, merchant.id, conversation.id, True, message_id=message.id)
    second = await create_order(db_session, merchant.id, conversation.id, True, message_id=message.id)
    assert first["order_id"] == second["order_id"]

    from sqlalchemy import select

    from app.models.order import Order

    count = (await db_session.execute(select(Order).where(Order.merchant_id == merchant.id))).scalars().all()
    assert len(count) == 1


async def test_create_order_allows_new_cart_after_checkout(db_session, merchant, conversation, message):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 1)
    conversation.slots = {
        "customer_name": "Sara",
        "customer_phone": "01012345678",
        "customer_address": "Nasr City",
    }
    await db_session.flush()

    first = await create_order(db_session, merchant.id, conversation.id, True, message_id=message.id)

    await add_item(db_session, merchant.id, conversation.id, product.id, 3)
    second = await create_order(db_session, merchant.id, conversation.id, True, message_id=message.id)

    assert first["order_number"] == 1
    assert second["order_number"] == 2
    assert first["order_id"] != second["order_id"]


async def test_create_order_confirm_false_previews_without_creating_order(db_session, merchant, conversation, message):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 2)
    conversation.slots = {
        "customer_name": "Sara",
        "customer_phone": "01012345678",
        "customer_address": "Nasr City",
    }
    await db_session.flush()

    result = await create_order(db_session, merchant.id, conversation.id, False, message_id=message.id)

    assert result["confirmed"] is False
    assert result["subtotal"] == "500.00"
    assert result["items"][0]["product_id"] == product.id

    from sqlalchemy import select

    from app.models.order import Order

    orders = (await db_session.execute(select(Order).where(Order.merchant_id == merchant.id))).scalars().all()
    assert orders == []


async def test_create_order_confirm_true_after_preview_still_creates_order(db_session, merchant, conversation, message):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 1)
    conversation.slots = {
        "customer_name": "Sara",
        "customer_phone": "01012345678",
        "customer_address": "Nasr City",
    }
    await db_session.flush()

    preview = await create_order(db_session, merchant.id, conversation.id, False, message_id=message.id)
    assert preview["confirmed"] is False

    result = await create_order(db_session, merchant.id, conversation.id, True, message_id=message.id)
    assert result["order_number"] == 1
