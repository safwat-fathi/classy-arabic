import pytest

from app.engine.schemas import AddToCartAction, RemoveFromCartAction, UpdateCartAction
from app.engine.tools.cart import handle_add_to_cart, handle_remove_from_cart, handle_update_cart
from app.engine.tools.errors import ToolUnavailableError
from app.models.product import Product


async def test_handle_add_to_cart_raises_tool_unavailable(db_session, merchant, conversation):
    db_session.add(Product(id="p1", merchant_id=merchant.id, name="Shoes", aliases=[]))
    await db_session.flush()
    action = AddToCartAction(action="add_to_cart", product_id="p1", quantity=1, confidence=0.9)
    with pytest.raises(ToolUnavailableError):
        await handle_add_to_cart(db_session, action, merchant.id, conversation.id)


async def test_handle_update_cart_raises_tool_unavailable(db_session, merchant, conversation):
    action = UpdateCartAction(action="update_cart", line_item_id="li1", quantity=2, confidence=0.9)
    with pytest.raises(ToolUnavailableError):
        await handle_update_cart(db_session, action, merchant.id, conversation.id)


async def test_handle_remove_from_cart_raises_tool_unavailable(db_session, merchant, conversation):
    action = RemoveFromCartAction(action="remove_from_cart", line_item_id="li1", confidence=0.9)
    with pytest.raises(ToolUnavailableError):
        await handle_remove_from_cart(db_session, action, merchant.id, conversation.id)
