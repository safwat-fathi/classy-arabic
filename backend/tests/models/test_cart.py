import pytest
from sqlalchemy.exc import IntegrityError

from app.models import Cart, CartItem, CartStatus
from app.models.product import Product


async def test_cart_round_trip(db_session, merchant, conversation):
    cart = Cart(merchant_id=merchant.id, conversation_id=conversation.id)
    db_session.add(cart)
    await db_session.flush()
    await db_session.refresh(cart)

    assert cart.id is not None
    assert cart.status == CartStatus.ACTIVE


async def test_only_one_active_cart_per_conversation(db_session, merchant, conversation):
    db_session.add(Cart(merchant_id=merchant.id, conversation_id=conversation.id))
    await db_session.flush()
    db_session.add(Cart(merchant_id=merchant.id, conversation_id=conversation.id))
    with pytest.raises(IntegrityError):
        await db_session.flush()


async def test_new_cart_allowed_after_checkout(db_session, merchant, conversation):
    first = Cart(merchant_id=merchant.id, conversation_id=conversation.id)
    db_session.add(first)
    await db_session.flush()
    first.status = CartStatus.CHECKED_OUT
    await db_session.flush()

    second = Cart(merchant_id=merchant.id, conversation_id=conversation.id)
    db_session.add(second)
    await db_session.flush()
    assert second.id is not None


async def test_cart_item_round_trip(db_session, merchant, conversation):
    product = Product(merchant_id=merchant.id, name="Shoes", price=250)
    cart = Cart(merchant_id=merchant.id, conversation_id=conversation.id)
    db_session.add_all([product, cart])
    await db_session.flush()

    item = CartItem(cart_id=cart.id, product_id=product.id, quantity=2)
    db_session.add(item)
    await db_session.flush()
    await db_session.refresh(item)

    assert item.id is not None
    assert item.quantity == 2
