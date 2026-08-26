import pytest

from app.domains.cart.service import CartItemNotFoundError, add_item, remove_item, update_item
from app.models.product import Product


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
