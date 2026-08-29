from decimal import Decimal

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.checkout.order_writer import ResolvedOrderLine, write_order
from app.engine.tools.errors import ActionArgumentError
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.conversation import Conversation
from app.models.delivery_area import DeliveryArea
from app.models.enums import CartStatus, DeliveryAreaStatus, ModelTier, OrderSource, OrderStatus
from app.models.merchant import Merchant
from app.models.order import Order
from app.models.product import Product
from app.models.product_variant import ProductVariant


async def validate_delivery_area(session: AsyncSession, merchant_id: str, address: str | None) -> dict:
    """Real delivery-area lookup (SRD §29). A merchant with no configured
    active areas always gets an available default, preserving the pre-delivery
    total == subtotal behavior. Once a merchant opts in, unmatched addresses
    escalate instead of silently shipping a zero fee."""
    result = await session.execute(
        select(DeliveryArea).where(
            DeliveryArea.merchant_id == merchant_id,
            DeliveryArea.status == DeliveryAreaStatus.ACTIVE,
        )
    )
    areas = result.scalars().all()

    if not areas:
        return {"status": "available", "delivery_fee": "0.00", "estimated_delivery": None}
    if address is None:
        return {"status": "unavailable", "reason": "no_address_provided"}

    address_lower = address.lower()
    matches = [area for area in areas if area.area.lower() in address_lower]
    if not matches:
        return {"status": "unavailable", "reason": "no_matching_area"}

    # Longest (most specific) area string wins, ranked like
    # store_knowledge.service.search's keyword-length scoring.
    best = max(matches, key=lambda area: len(area.area))
    return {
        "status": "available",
        "delivery_fee": str(Decimal(str(best.delivery_fee)).quantize(Decimal("0.01"))),
        "estimated_delivery": best.estimated_delivery,
    }


async def get_checkout_state(session: AsyncSession, merchant_id: str, conversation_id: str) -> dict:
    merchant = await session.get(Merchant, merchant_id)
    result = await session.execute(
        select(CartItem, Product)
        .join(Cart, Cart.id == CartItem.cart_id)
        .join(Product, Product.id == CartItem.product_id)
        .where(
            Cart.conversation_id == conversation_id,
            Cart.status == CartStatus.ACTIVE,
            Cart.merchant_id == merchant_id,
        )
    )
    rows = result.all()

    items = []
    subtotal = Decimal("0.00")
    for item, product in rows:
        line_total = (product.price * Decimal(str(item.quantity))).quantize(Decimal("0.01"))
        subtotal += line_total
        items.append(
            {
                "line_item_id": item.id,
                "product_id": product.id,
                "name": product.name,
                "quantity": item.quantity,
                "unit_price": str(product.price),
                "line_total": str(line_total),
            }
        )

    return {"items": items, "subtotal": str(subtotal), "currency": merchant.currency}


async def _get_active_cart_items(
    session: AsyncSession, merchant_id: str, conversation_id: str
) -> list[tuple[CartItem, Product, ProductVariant | None]]:
    result = await session.execute(
        select(CartItem, Product, ProductVariant)
        .join(Cart, Cart.id == CartItem.cart_id)
        .join(Product, Product.id == CartItem.product_id)
        .outerjoin(ProductVariant, ProductVariant.id == CartItem.variant_id)
        .where(
            Cart.conversation_id == conversation_id,
            Cart.status == CartStatus.ACTIVE,
            Cart.merchant_id == merchant_id,
        )
    )
    return result.all()


async def create_order(
    session: AsyncSession, merchant_id: str, conversation_id: str, confirm: bool, message_id: str
) -> dict:
    cart_result = await session.execute(
        select(Cart).where(
            Cart.conversation_id == conversation_id,
            Cart.status == CartStatus.ACTIVE,
            Cart.merchant_id == merchant_id,
        )
    )
    cart = cart_result.scalar_one_or_none()
    if cart is None:
        # No active cart: either nothing was ever added, or this is a retry
        # against a cart already converted by a previous create_order call
        # (SRD S37) - the latter must return the existing order, not "empty".
        checked_out = await session.execute(
            select(Cart)
            .where(
                Cart.conversation_id == conversation_id,
                Cart.status == CartStatus.CHECKED_OUT,
                Cart.merchant_id == merchant_id,
            )
            .order_by(Cart.created_at.desc())
            .limit(1)
        )
        done_cart = checked_out.scalar_one_or_none()
        if done_cart is not None:
            existing = await session.execute(
                select(Order).where(Order.cart_id == done_cart.id, Order.merchant_id == merchant_id)
            )
            order = existing.scalar_one_or_none()
            if order is not None:
                return {"order_id": order.id, "order_number": order.order_number, "total": str(order.total)}
        raise ActionArgumentError(["cart is empty - nothing to check out"])

    rows = await _get_active_cart_items(session, merchant_id, conversation_id)
    if not rows:
        raise ActionArgumentError(["cart is empty - nothing to check out"])

    conversation = await session.get(Conversation, conversation_id)
    slots = conversation.slots or {}
    missing = [field for field in ("customer_name", "customer_phone") if not slots.get(field)]
    if not slots.get("customer_address"):
        missing.append("customer_address")
    if missing:
        raise ActionArgumentError([f"missing required customer info: {', '.join(missing)}"])

    if not confirm:
        state = await get_checkout_state(session, merchant_id, conversation_id)
        return {"confirmed": False, **state}

    # Atomic conversion guard (SRD S37): if this conditional UPDATE returns no
    # row, the cart was already checked out and this call is a retry - return
    # the existing order instead of creating a duplicate.
    converted = await session.execute(
        update(Cart)
        .where(Cart.id == cart.id, Cart.status == CartStatus.ACTIVE)
        .values(status=CartStatus.CHECKED_OUT)
        .returning(Cart.id)
    )
    if converted.scalar_one_or_none() is None:
        existing = await session.execute(
            select(Order).where(Order.cart_id == cart.id, Order.merchant_id == merchant_id)
        )
        order = existing.scalar_one()
        return {"order_id": order.id, "order_number": order.order_number, "total": str(order.total)}

    # Re-check deliverability on the actual write path: no merchant-configured
    # areas -> always available; configured areas + unmatched address -> reject.
    delivery = await validate_delivery_area(session, merchant_id, slots["customer_address"])
    if delivery["status"] != "available":
        raise ActionArgumentError([f"delivery not available: {delivery.get('reason', 'unknown')}"])
    delivery_fee = Decimal(delivery["delivery_fee"])

    # Price-fallback rule mirrors app/domains/cart/service.py::add_item: a
    # variant's own price wins when set; otherwise fall back to the parent
    # product's price.
    lines = [
        ResolvedOrderLine(
            product_id=product.id,
            variant_id=item.variant_id,
            name_snapshot=product.name,
            variant_snapshot=variant.label if variant is not None else None,
            unit_price=variant.price if (variant is not None and variant.price is not None) else product.price,
            quantity=item.quantity,
        )
        for item, product, variant in rows
    ]

    # message_id is the message that triggered this tool call (the confirming
    # message), threaded through dispatch_action - the closest analogue to
    # pipeline.py's extraction-triggered message_id.
    order = await write_order(
        session,
        merchant_id=merchant_id,
        conversation_id=conversation_id,
        message_id=message_id,
        status=OrderStatus.CONFIRMED,
        source=OrderSource.CART_CHECKOUT,
        lines=lines,
        extracted_payload={},
        confidence_score=1.0,
        extracted_by_tier=ModelTier.DEEPSEEK,
        cart_id=cart.id,
        customer_name=slots["customer_name"],
        customer_phone=slots["customer_phone"],
        delivery_address=slots["customer_address"],
        delivery_fee=delivery_fee,
        assign_order_number=True,
    )

    return {"order_id": order.id, "order_number": order.order_number, "total": str(order.total)}
