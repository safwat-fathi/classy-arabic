import pytest

from app.engine.schemas import AddToCartAction, RemoveFromCartAction, UpdateCartAction
from app.engine.tools.cart import handle_add_to_cart, handle_remove_from_cart, handle_update_cart
from app.engine.tools.errors import ActionArgumentError
from app.models.product import Product


async def test_handle_add_to_cart_adds_item(db_session, merchant, conversation):
    db_session.add(Product(id="p1", merchant_id=merchant.id, name="Shoes", price=250, aliases=[]))
    await db_session.flush()
    action = AddToCartAction(action="add_to_cart", product_id="p1", quantity=2, confidence=0.9)
    result = await handle_add_to_cart(db_session, action, merchant.id, conversation.id, "msg-1")
    assert result["product_id"] == "p1"
    assert result["quantity"] == 2


async def test_handle_add_to_cart_threads_notes_through(db_session, merchant, conversation):
    db_session.add(Product(id="p3", merchant_id=merchant.id, name="Shoes", price=250, aliases=[]))
    await db_session.flush()
    action = AddToCartAction(action="add_to_cart", product_id="p3", quantity=1, notes="size 42", confidence=0.9)
    result = await handle_add_to_cart(db_session, action, merchant.id, conversation.id, "msg-1")
    assert result["notes"] == "size 42"


async def test_handle_add_to_cart_rejects_priceless_product(db_session, merchant, conversation):
    db_session.add(Product(id="p2", merchant_id=merchant.id, name="No Price", aliases=[]))
    await db_session.flush()
    action = AddToCartAction(action="add_to_cart", product_id="p2", quantity=1, confidence=0.9)
    with pytest.raises(ActionArgumentError):
        await handle_add_to_cart(db_session, action, merchant.id, conversation.id, "msg-1")


async def test_handle_update_cart_requires_existing_line_item(db_session, merchant, conversation):
    action = UpdateCartAction(action="update_cart", line_item_id="li1", quantity=2, confidence=0.9)
    with pytest.raises(ActionArgumentError):
        await handle_update_cart(db_session, action, merchant.id, conversation.id, "msg-1")


async def test_handle_remove_from_cart_requires_existing_line_item(db_session, merchant, conversation):
    action = RemoveFromCartAction(action="remove_from_cart", line_item_id="li1", confidence=0.9)
    with pytest.raises(ActionArgumentError):
        await handle_remove_from_cart(db_session, action, merchant.id, conversation.id, "msg-1")
