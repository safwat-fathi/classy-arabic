from decimal import Decimal

import pytest

from app.domains.cart.service import add_item
from app.domains.checkout.service import create_order, get_checkout_state, validate_delivery_area
from app.models.merchant import Merchant
from app.models.product import Product
from app.models.product_variant import ProductVariant


async def test_validate_delivery_area_defaults_available_with_zero_configured_areas(db_session, merchant):
    result = await validate_delivery_area(db_session, merchant.id, "Nasr City")
    assert result == {"status": "available", "delivery_fee": "0.00", "estimated_delivery": None}


async def test_validate_delivery_area_matches_configured_area(db_session, merchant):
    from app.models.delivery_area import DeliveryArea

    area = DeliveryArea(merchant_id=merchant.id, area="Nasr City", delivery_fee=25, estimated_delivery="same day")
    db_session.add(area)
    await db_session.flush()

    result = await validate_delivery_area(db_session, merchant.id, "I live in nasr city, cairo")
    assert result["status"] == "available"
    assert result["delivery_fee"] == "25.00"
    assert result["estimated_delivery"] == "same day"


async def test_validate_delivery_area_picks_most_specific_match_when_multiple_match(db_session, merchant):
    from app.models.delivery_area import DeliveryArea

    cheap = DeliveryArea(merchant_id=merchant.id, area="Cairo", delivery_fee=10)
    specific = DeliveryArea(merchant_id=merchant.id, area="Nasr City", delivery_fee=25)
    db_session.add_all([cheap, specific])
    await db_session.flush()

    result = await validate_delivery_area(db_session, merchant.id, "Nasr City, Cairo")
    # Both "Cairo" and "Nasr City" match; longest string wins.
    assert result["delivery_fee"] == "25.00"


async def test_validate_delivery_area_unavailable_when_configured_but_no_match(db_session, merchant):
    from app.models.delivery_area import DeliveryArea

    db_session.add(DeliveryArea(merchant_id=merchant.id, area="Nasr City", delivery_fee=25))
    await db_session.flush()

    result = await validate_delivery_area(db_session, merchant.id, "Heliopolis")
    assert result == {"status": "unavailable", "reason": "no_matching_area"}


async def test_validate_delivery_area_unavailable_when_no_address(db_session, merchant):
    from app.models.delivery_area import DeliveryArea

    db_session.add(DeliveryArea(merchant_id=merchant.id, area="Nasr City", delivery_fee=25))
    await db_session.flush()

    result = await validate_delivery_area(db_session, merchant.id, None)
    assert result == {"status": "unavailable", "reason": "no_address_provided"}


async def test_create_order_includes_delivery_fee_in_total_when_area_matches(db_session, merchant, conversation, message):
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

    from app.models.delivery_area import DeliveryArea

    db_session.add(DeliveryArea(merchant_id=merchant.id, area="Nasr City", delivery_fee=30))
    await db_session.flush()

    result = await create_order(db_session, merchant.id, conversation.id, True, message_id=message.id)
    assert result["total"] == "530.00"

    from sqlalchemy import select

    from app.models.order import Order

    order = (await db_session.execute(select(Order).where(Order.id == result["order_id"]))).scalar_one()
    assert order.delivery_fee == Decimal("30.00")


async def test_create_order_rejects_confirm_when_delivery_unavailable(db_session, merchant, conversation, message):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 1)
    conversation.slots = {
        "customer_name": "Sara",
        "customer_phone": "01012345678",
        "customer_address": "Heliopolis",
    }
    await db_session.flush()

    from app.models.delivery_area import DeliveryArea

    db_session.add(DeliveryArea(merchant_id=merchant.id, area="Nasr City", delivery_fee=25))
    await db_session.flush()

    from app.engine.tools.errors import ActionArgumentError

    with pytest.raises(ActionArgumentError, match="delivery not available"):
        await create_order(db_session, merchant.id, conversation.id, True, message_id=message.id)


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


async def test_create_order_snapshots_variant_id_and_variant_snapshot(db_session, merchant, conversation, message):
    product = Product(merchant_id=merchant.id, name="Shirt", price=Decimal("199.99"))
    db_session.add(product)
    await db_session.flush()
    variant = ProductVariant(product_id=product.id, label="M / Blue", price=Decimal("219.99"))
    db_session.add(variant)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 1, variant_id=variant.id)
    conversation.slots = {
        "customer_name": "Sara",
        "customer_phone": "01012345678",
        "customer_address": "Nasr City",
    }
    await db_session.flush()

    result = await create_order(db_session, merchant.id, conversation.id, True, message_id=message.id)

    assert result["total"] == "219.99"

    from sqlalchemy import select

    from app.models.order import Order

    order = (await db_session.execute(select(Order).where(Order.id == result["order_id"]))).scalar_one()
    await db_session.refresh(order, attribute_names=["items"])
    assert order.items[0].variant_id == variant.id
    assert order.items[0].variant_snapshot == "M / Blue"
    assert order.items[0].unit_price == Decimal("219.99")


async def test_get_checkout_state_excludes_other_merchants_cart(db_session, merchant, conversation):
    other_merchant = Merchant(name="Other Merchant")
    db_session.add(other_merchant)
    await db_session.flush()

    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    await add_item(db_session, merchant.id, conversation.id, product.id, 2)

    # Cart belongs to `merchant`, not `other_merchant` - a lookup scoped to
    # other_merchant's id must not see it, even though conversation_id matches.
    state = await get_checkout_state(db_session, other_merchant.id, conversation.id)
    assert state == {"items": [], "subtotal": "0.00", "currency": other_merchant.currency}


async def test_create_order_rejects_conversation_owned_by_different_merchant(db_session, merchant, conversation):
    from app.engine.tools.errors import ActionArgumentError

    other_merchant = Merchant(name="Other Merchant")
    db_session.add(other_merchant)
    await db_session.flush()

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

    # The cart/conversation belong to `merchant`. Calling create_order with a
    # different merchant_id must not see - let alone check out - that cart.
    with pytest.raises(ActionArgumentError, match="cart is empty"):
        await create_order(db_session, other_merchant.id, conversation.id, True, message_id="msg-1")

    from sqlalchemy import select

    from app.models.order import Order

    # Scoped to both ids involved, not just merchant.id: the leak this test
    # guards against would create an Order under other_merchant.id, not
    # merchant.id - filtering to only the real owner would make this
    # assertion pass even if the leak fired. Fully unfiltered isn't safe
    # either since db_session runs against the real dev Postgres DB
    # (conftest.py) and could see unrelated pre-existing Order rows.
    orders = (
        (await db_session.execute(select(Order).where(Order.merchant_id.in_([merchant.id, other_merchant.id]))))
        .scalars()
        .all()
    )
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
