from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id
from app.models.enums import CartStatus

if TYPE_CHECKING:
    from app.models.cart_item import CartItem


class Cart(Base):
    __tablename__ = "carts"
    __table_args__ = (
        Index(
            "uq_carts_one_active_per_conversation",
            "conversation_id",
            unique=True,
            postgresql_where=text("status = 'ACTIVE'"),
        ),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), nullable=False, index=True)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"), nullable=False, index=True)
    status: Mapped[CartStatus] = mapped_column(
        SAEnum(CartStatus, name="cartstatus"), nullable=False, default=CartStatus.ACTIVE, server_default="ACTIVE"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items: Mapped[list[CartItem]] = relationship(back_populates="cart", cascade="all, delete-orphan")
