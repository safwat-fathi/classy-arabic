from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.enums import CartStatus
from app.models.product import Product


class CartItemNotFoundError(Exception):
    """line_item_id does not reference an existing cart item for this conversation's cart."""


async def _get_or_create_active_cart(session: AsyncSession, merchant_id: str, conversation_id: str) -> Cart:
    result = await session.execute(
        select(Cart).where(
            Cart.conversation_id == conversation_id,
            Cart.merchant_id == merchant_id,
            Cart.status == CartStatus.ACTIVE,
        )
    )
    cart = result.scalar_one_or_none()
    if cart is not None:
        return cart
    cart = Cart(merchant_id=merchant_id, conversation_id=conversation_id)
    session.add(cart)
    await session.flush()
    return cart


async def add_item(
    session: AsyncSession,
    merchant_id: str,
    conversation_id: str,
    product_id: str,
    quantity: float,
    notes: str | None = None,
) -> dict:
    # product_id ownership is already validator-checked for the add_to_cart
    # action (app/engine/action_validator.py) before this is ever called; a
    # fresh lookup here is still needed to read `price`, not to re-validate
    # ownership.
    product = await session.get(Product, product_id)
    if product is None or product.price is None:
        raise ValueError(f"product {product_id!r} has no price set - cannot add to cart")

    cart = await _get_or_create_active_cart(session, merchant_id, conversation_id)

    # Stock/variant resolution deferred: SRD S25 lists "Resolve variant" and
    # "Validate stock" as Cart Service responsibilities, but Product has no
    # stock column and no structured variant model (Global Constraints) -
    # see the sibling tool-layer plan's Global Constraints for the same
    # acknowledged gap. Nothing to check yet.
    insert_stmt = pg_insert(CartItem).values(cart_id=cart.id, product_id=product_id, quantity=quantity, notes=notes)
    stmt = insert_stmt.on_conflict_do_update(
        index_elements=["cart_id", "product_id"],
        set_={
            "quantity": CartItem.quantity + quantity,
            # COALESCE, not the bare `notes` param: an omitted notes on a
            # repeat add must preserve the existing note, not null it out.
            "notes": func.coalesce(insert_stmt.excluded.notes, CartItem.notes),
        },
    ).returning(CartItem.id, CartItem.quantity, CartItem.notes)
    row = (await session.execute(stmt)).one()
    return {"line_item_id": row.id, "product_id": product_id, "quantity": row.quantity, "notes": row.notes}


async def _get_item_for_conversation(
    session: AsyncSession, merchant_id: str, conversation_id: str, line_item_id: str
) -> CartItem:
    result = await session.execute(
        select(CartItem)
        .join(Cart, Cart.id == CartItem.cart_id)
        .where(
            CartItem.id == line_item_id,
            Cart.conversation_id == conversation_id,
            Cart.merchant_id == merchant_id,
            Cart.status == CartStatus.ACTIVE,
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise CartItemNotFoundError(f"line_item_id {line_item_id!r} not found in this conversation's active cart")
    return item


async def update_item(
    session: AsyncSession, merchant_id: str, conversation_id: str, line_item_id: str, quantity: float
) -> dict:
    item = await _get_item_for_conversation(session, merchant_id, conversation_id, line_item_id)
    item.quantity = quantity
    await session.flush()
    return {"line_item_id": item.id, "product_id": item.product_id, "quantity": item.quantity}


async def remove_item(session: AsyncSession, merchant_id: str, conversation_id: str, line_item_id: str) -> None:
    item = await _get_item_for_conversation(session, merchant_id, conversation_id, line_item_id)
    await session.delete(item)
    await session.flush()
