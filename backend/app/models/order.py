from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Float, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id
from app.models.enums import ModelTier, OrderSource, OrderStatus

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.message import Message
    from app.models.order_item import OrderItem


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (UniqueConstraint("merchant_id", "order_number", name="uq_orders_merchant_order_number"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), nullable=False, index=True)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"), nullable=False, index=True)
    message_id: Mapped[str] = mapped_column(ForeignKey("messages.id"), nullable=False, index=True)
    extracted_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    confirmed_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[OrderStatus] = mapped_column(SAEnum(OrderStatus, name="orderstatus"), nullable=False, index=True)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    extracted_by_tier: Mapped[ModelTier] = mapped_column(SAEnum(ModelTier, name="modeltier"), nullable=False)
    escalation_reason: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    source: Mapped[OrderSource] = mapped_column(
        SAEnum(OrderSource, name="ordersource"),
        nullable=False,
        default=OrderSource.AI_EXTRACTION,
        server_default="AI_EXTRACTION",
    )
    cart_id: Mapped[str | None] = mapped_column(ForeignKey("carts.id"), nullable=True)
    order_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String, nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    delivery_address: Mapped[str | None] = mapped_column(String, nullable=True)
    subtotal: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    total: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    conversation: Mapped[Conversation] = relationship(back_populates="orders")
    message: Mapped[Message] = relationship(back_populates="order")
    items: Mapped[list[OrderItem]] = relationship(back_populates="order", cascade="all, delete-orphan")
