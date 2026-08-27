from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.enums import CartStatus
from app.models.product import Product
from app.models.product_variant import ProductVariant


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
    variant_id: str | None = None,
) -> dict:
    # product_id ownership, and variant_id -> product_id ownership, are
    # already validator-checked for the add_to_cart action
    # (app/engine/action_validator.py) before this is ever called; the
    # lookups here are to read `price`, not to re-validate ownership.
    product = await session.get(Product, product_id)
    if product is None:
        raise ValueError(f"product {product_id!r} has no price set - cannot add to cart")

    # Price-fallback rule: a variant's own price wins when set; otherwise
    # fall back to the parent product's price.
    price = product.price
    if variant_id is not None:
        variant = await session.get(ProductVariant, variant_id)
        if variant is None:
            raise ValueError(f"variant {variant_id!r} does not exist - cannot add to cart")
        if variant.price is not None:
            price = variant.price

    if price is None:
        target = f"variant {variant_id!r}" if variant_id is not None else f"product {product_id!r}"
        raise ValueError(f"{target} has no price set - cannot add to cart")

    cart = await _get_or_create_active_cart(session, merchant_id, conversation_id)

    # Stock validation deferred: ProductVariant has a `stock` column, but SRD
    # S25's "Validate stock" Cart Service responsibility isn't implemented
    # yet - out of scope for this task.
    insert_stmt = pg_insert(CartItem).values(
        cart_id=cart.id, product_id=product_id, variant_id=variant_id, quantity=quantity, notes=notes
    )
    # Postgres requires index_elements AND index_where to both match a
    # partial index for ON CONFLICT to resolve (same pattern as
    # app/domains/channels/service.py::ingest_channel_message). cart_items
    # has two partial unique indexes instead of one plain unique constraint
    # (see app/models/cart_item.py), so which one is targeted depends on
    # whether this row has a variant.
    if variant_id is None:
        conflict_target: dict = {"index_elements": ["cart_id", "product_id"], "index_where": text("variant_id IS NULL")}
    else:
        conflict_target = {
            "index_elements": ["cart_id", "product_id", "variant_id"],
            "index_where": text("variant_id IS NOT NULL"),
        }
    stmt = insert_stmt.on_conflict_do_update(
        **conflict_target,
        set_={
            "quantity": CartItem.quantity + quantity,
            # COALESCE, not the bare `notes` param: an omitted notes on a
            # repeat add must preserve the existing note, not null it out.
            "notes": func.coalesce(insert_stmt.excluded.notes, CartItem.notes),
        },
    ).returning(CartItem.id, CartItem.quantity, CartItem.notes)
    row = (await session.execute(stmt)).one()
    return {
        "line_item_id": row.id,
        "product_id": product_id,
        "variant_id": variant_id,
        "quantity": row.quantity,
        "notes": row.notes,
    }


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
