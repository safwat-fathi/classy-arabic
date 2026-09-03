from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.checkout.order_writer import ResolvedOrderLine, write_order
from app.domains.checkout.schemas import ManualOrderCreate, ManualOrderRead
from app.models import Conversation, Direction, Message, Product
from app.models._ids import new_id
from app.models.enums import ModelTier, OrderSource, OrderStatus
from app.models.product_variant import ProductVariant


class ProductNotFoundError(Exception):
    def __init__(self, product_id: str):
        self.product_id = product_id


class ConversationNotFoundError(Exception):
    pass


async def create_manual_order(db: AsyncSession, merchant_id: str, payload: ManualOrderCreate) -> ManualOrderRead:
    conversation = await db.get(Conversation, payload.conversation_id)
    if conversation is None or conversation.merchant_id != merchant_id:
        raise ConversationNotFoundError()

    # Build resolved lines from the catalog
    resolved_lines: list[ResolvedOrderLine] = []
    extracted_items = []
    for item in payload.line_items:
        product = await db.get(Product, item.product_id, options=[selectinload(Product.variants)])
        if product is None or product.merchant_id != merchant_id:
            raise ProductNotFoundError(item.product_id)

        variant: ProductVariant | None = None
        unit_price = product.price or Decimal("0.00")
        variant_snapshot = None

        if item.variant_id:
            variant = await db.get(ProductVariant, item.variant_id)
            if variant and variant.product_id == product.id:
                unit_price = Decimal(str(variant.price)) if variant.price is not None else unit_price
                variant_snapshot = variant.label

        resolved_lines.append(
            ResolvedOrderLine(
                product_id=product.id,
                variant_id=variant.id if variant else None,
                name_snapshot=product.name,
                variant_snapshot=variant_snapshot,
                unit_price=unit_price,
                quantity=item.quantity,
            )
        )
        extracted_items.append({
            "product_name": product.name,
            "product_id": product.id,
            "variant_id": variant.id if variant else None,
            "quantity": item.quantity,
        })

    # Create a synthetic message to satisfy the NOT NULL FK
    synthetic_message = Message(
        id=new_id(),
        conversation_id=conversation.id,
        direction=Direction.INBOUND,
        raw_text="[Manual order by merchant]",
        normalized_text="[Manual order by merchant]",
    )
    db.add(synthetic_message)
    await db.flush()

    order = await write_order(
        db,
        merchant_id=merchant_id,
        conversation_id=conversation.id,
        message_id=synthetic_message.id,
        status=OrderStatus.CONFIRMED,
        source=OrderSource.MANUAL,
        lines=resolved_lines,
        extracted_payload={"line_items": extracted_items, "source": "manual"},
        confidence_score=1.0,
        extracted_by_tier=ModelTier.RULE,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        delivery_address=payload.delivery_address,
        assign_order_number=True,
    )

    return ManualOrderRead(
        id=order.id,
        order_number=order.order_number,
        status=order.status.value,
        subtotal=float(order.subtotal) if order.subtotal else None,
        total=float(order.total) if order.total else None,
    )
