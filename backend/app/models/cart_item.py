from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id

if TYPE_CHECKING:
    from app.models.cart import Cart


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        # A plain 3-column UniqueConstraint(cart_id, product_id, variant_id)
        # would not dedupe variant-less rows: Postgres treats NULL != NULL,
        # so two rows with the same cart_id/product_id and variant_id=NULL
        # would not violate it. Two partial unique indexes instead: one
        # covers variant-less rows (variant_id IS NULL), the other covers
        # rows with a specific variant. Mirrors the partial-index pattern in
        # app/models/cart.py's uq_carts_one_active_per_conversation.
        Index(
            "uq_cart_items_cart_product_no_variant",
            "cart_id",
            "product_id",
            unique=True,
            postgresql_where=text("variant_id IS NULL"),
        ),
        Index(
            "uq_cart_items_cart_product_variant",
            "cart_id",
            "product_id",
            "variant_id",
            unique=True,
            postgresql_where=text("variant_id IS NOT NULL"),
        ),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    cart_id: Mapped[str] = mapped_column(ForeignKey("carts.id"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    # CASCADE, not SET NULL: if a variant were deleted and this column set to
    # NULL instead, the row could collapse onto the same (cart_id,
    # product_id, NULL) as an existing variant-less row for that product and
    # violate uq_cart_items_cart_product_no_variant above. Cascading the
    # cart_item away avoids that.
    variant_id: Mapped[str | None] = mapped_column(
        ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=True, index=True
    )
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cart: Mapped[Cart] = relationship(back_populates="items")
