from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ModelTier, OrderSource, OrderStatus
from app.models.order import Order
from app.models.order_item import OrderItem


@dataclass(frozen=True)
class ResolvedOrderLine:
    product_id: str
    variant_id: str | None
    name_snapshot: str
    variant_snapshot: str | None
    unit_price: Decimal
    quantity: float


async def write_order(
    session: AsyncSession,
    *,
    merchant_id: str,
    conversation_id: str,
    message_id: str,
    status: OrderStatus,
    source: OrderSource,
    lines: list[ResolvedOrderLine],
    extracted_payload: dict,
    confidence_score: float,
    extracted_by_tier: ModelTier,
    escalation_reason: str | None = None,
    delivery_fee: Decimal | None = None,
    cart_id: str | None = None,
    customer_name: str | None = None,
    customer_phone: str | None = None,
    delivery_address: str | None = None,
    assign_order_number: bool = True,
) -> Order:
    """Single, service-owned writer for `Order`/`OrderItem` rows.

    `status` and `assign_order_number` are always caller-supplied - this
    function never derives or defaults either from the other inputs. The
    cart-checkout caller (app/domains/checkout/service.py::create_order)
    always assigns a sequential order number and always passes
    status=OrderStatus.CONFIRMED; a future extraction-based caller never
    assigns a number and computes its own status. Collapsing that
    distinction here would be wrong for one caller or the other.

    Cart-idempotency (detecting an already-checked-out cart and returning
    its existing order) and customer-info validation are caller concerns,
    not this function's - it unconditionally writes one Order plus one
    OrderItem per line.
    """
    order_number = None
    if assign_order_number:
        # Atomic increment-and-read, copied verbatim from the raw-SQL this
        # replaces in create_order - do not rewrite as an ORM update, the
        # RETURNING clause is what keeps this atomic under concurrent
        # checkouts for the same merchant.
        order_number_result = await session.execute(
            text(
                "UPDATE merchants SET next_order_number = next_order_number + 1 "
                "WHERE id = :mid RETURNING next_order_number - 1"
            ),
            {"mid": merchant_id},
        )
        order_number = order_number_result.scalar_one()

    # Empty lines is legal: a caller may write an order with zero resolved
    # line items, keeping only extracted_payload as the record.
    subtotal = sum((line.unit_price * Decimal(str(line.quantity)) for line in lines), Decimal("0.00")).quantize(
        Decimal("0.01")
    )
    total = subtotal + (delivery_fee if delivery_fee is not None else Decimal("0.00"))

    order = Order(
        merchant_id=merchant_id,
        conversation_id=conversation_id,
        message_id=message_id,
        extracted_payload=extracted_payload,
        status=status,
        confidence_score=confidence_score,
        extracted_by_tier=extracted_by_tier,
        escalation_reason=escalation_reason,
        source=source,
        cart_id=cart_id,
        order_number=order_number,
        customer_name=customer_name,
        customer_phone=customer_phone,
        delivery_address=delivery_address,
        subtotal=subtotal,
        total=total,
        # delivery_fee stays None for unresolved lookups (extraction path);
        # an explicitly resolved zero fee records Decimal("0.00").
        delivery_fee=delivery_fee,
    )
    session.add(order)
    await session.flush()

    for line in lines:
        session.add(
            OrderItem(
                order_id=order.id,
                product_id=line.product_id,
                variant_id=line.variant_id,
                name_snapshot=line.name_snapshot,
                variant_snapshot=line.variant_snapshot,
                unit_price=line.unit_price,
                quantity=line.quantity,
            )
        )
    await session.flush()

    return order
