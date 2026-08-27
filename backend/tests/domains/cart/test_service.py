from decimal import Decimal

import pytest

from app.domains.cart.service import CartItemNotFoundError, add_item, remove_item, update_item
from app.models.product import Product
from app.models.product_variant import ProductVariant


async def test_add_item_creates_cart_and_item(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()

    result = await add_item(db_session, merchant.id, conversation.id, product.id, 2)
    assert result["quantity"] == 2
    assert result["product_id"] == product.id


async def test_add_item_twice_increments_quantity_not_duplicates_row(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()

    await add_item(db_session, merchant.id, conversation.id, product.id, 1)
    result = await add_item(db_session, merchant.id, conversation.id, product.id, 1)
    assert result["quantity"] == 2


async def test_add_item_rejects_priceless_product(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="No Price Yet")
    db_session.add(product)
    await db_session.flush()

    with pytest.raises(ValueError, match="no price set"):
        await add_item(db_session, merchant.id, conversation.id, product.id, 1)


async def test_update_item_changes_quantity(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    added = await add_item(db_session, merchant.id, conversation.id, product.id, 1)

    result = await update_item(db_session, merchant.id, conversation.id, added["line_item_id"], 5)
    assert result["quantity"] == 5


async def test_update_item_raises_for_unknown_line_item(db_session, merchant, conversation):
    with pytest.raises(CartItemNotFoundError):
        await update_item(db_session, merchant.id, conversation.id, "does-not-exist", 1)


async def test_remove_item_deletes_row(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    added = await add_item(db_session, merchant.id, conversation.id, product.id, 1)

    await remove_item(db_session, merchant.id, conversation.id, added["line_item_id"])
    with pytest.raises(CartItemNotFoundError):
        await update_item(db_session, merchant.id, conversation.id, added["line_item_id"], 1)


async def test_add_item_persists_notes(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()

    result = await add_item(db_session, merchant.id, conversation.id, product.id, 1, notes="size 42")
    assert result["notes"] == "size 42"

    from sqlalchemy import select

    from app.models.cart_item import CartItem

    item = (await db_session.execute(select(CartItem).where(CartItem.id == result["line_item_id"]))).scalar_one()
    assert item.notes == "size 42"


async def test_add_item_repeat_without_notes_preserves_existing_notes(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()

    await add_item(db_session, merchant.id, conversation.id, product.id, 1, notes="size 42")
    again = await add_item(db_session, merchant.id, conversation.id, product.id, 1)

    assert again["notes"] == "size 42"
    assert again["quantity"] == 2


async def test_update_item_rejects_line_item_from_another_merchant(db_session, merchant, conversation):
    from app.models.merchant import Merchant

    other_merchant = Merchant(name="Other Merchant")
    db_session.add(other_merchant)
    await db_session.flush()

    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    added = await add_item(db_session, merchant.id, conversation.id, product.id, 1)

    with pytest.raises(CartItemNotFoundError):
        await update_item(db_session, other_merchant.id, conversation.id, added["line_item_id"], 5)


async def test_add_item_with_variant_creates_separate_line_from_variant_less_item(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shirt", price=250)
    db_session.add(product)
    await db_session.flush()
    variant = ProductVariant(product_id=product.id, label="M / Blue")
    db_session.add(variant)
    await db_session.flush()

    plain = await add_item(db_session, merchant.id, conversation.id, product.id, 1)
    with_variant = await add_item(db_session, merchant.id, conversation.id, product.id, 1, variant_id=variant.id)

    assert plain["line_item_id"] != with_variant["line_item_id"]
    assert plain["variant_id"] is None
    assert with_variant["variant_id"] == variant.id


async def test_add_item_twice_with_same_variant_increments_quantity(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shirt", price=250)
    db_session.add(product)
    await db_session.flush()
    variant = ProductVariant(product_id=product.id, label="M / Blue")
    db_session.add(variant)
    await db_session.flush()

    await add_item(db_session, merchant.id, conversation.id, product.id, 1, variant_id=variant.id)
    result = await add_item(db_session, merchant.id, conversation.id, product.id, 2, variant_id=variant.id)

    assert result["quantity"] == 3
    assert result["variant_id"] == variant.id


async def test_add_item_uses_variant_price_over_product_price(db_session, merchant, conversation):
    # CartItem has no price column, so the resolved price is never persisted
    # or returned - the only observable proxy for "which price won" is
    # whether the priceless side of the pair would have raised on its own.
    # Here the product has NO price; if variant.price were not checked first,
    # this would raise the "no price set" ValueError. It doesn't, proving
    # the variant's own price was used instead of (i.e. "over") the
    # product's.
    product = Product(merchant_id=merchant.id, name="Shirt")
    db_session.add(product)
    await db_session.flush()
    variant = ProductVariant(product_id=product.id, label="M / Blue", price=Decimal("150.00"))
    db_session.add(variant)
    await db_session.flush()

    result = await add_item(db_session, merchant.id, conversation.id, product.id, 1, variant_id=variant.id)
    assert result["variant_id"] == variant.id


async def test_add_item_falls_back_to_product_price_when_variant_has_no_price(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shirt", price=Decimal("100.00"))
    db_session.add(product)
    await db_session.flush()
    variant = ProductVariant(product_id=product.id, label="M / Blue")
    db_session.add(variant)
    await db_session.flush()

    result = await add_item(db_session, merchant.id, conversation.id, product.id, 1, variant_id=variant.id)
    assert result["variant_id"] == variant.id


async def test_add_item_rejects_priceless_variant(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="No Price Yet")
    db_session.add(product)
    await db_session.flush()
    variant = ProductVariant(product_id=product.id, label="M / Blue")
    db_session.add(variant)
    await db_session.flush()

    with pytest.raises(ValueError, match="no price set"):
        await add_item(db_session, merchant.id, conversation.id, product.id, 1, variant_id=variant.id)


async def test_update_item_rejects_line_item_from_checked_out_cart(db_session, merchant, conversation):
    from sqlalchemy import select

    from app.models.cart import Cart
    from app.models.enums import CartStatus

    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    db_session.add(product)
    await db_session.flush()
    added = await add_item(db_session, merchant.id, conversation.id, product.id, 1)

    cart = (await db_session.execute(select(Cart).where(Cart.conversation_id == conversation.id))).scalar_one()
    cart.status = CartStatus.CHECKED_OUT
    await db_session.flush()

    with pytest.raises(CartItemNotFoundError):
        await update_item(db_session, merchant.id, conversation.id, added["line_item_id"], 5)
