from decimal import Decimal

from sqlalchemy import Float, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), nullable=False, index=True)
    product_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # SET NULL, same reasoning as product_id above: historical orders must
    # survive catalog deletion (of the variant, not just the product). No
    # uniqueness constraint needed on this table.
    variant_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True, index=True
    )
    name_snapshot: Mapped[str] = mapped_column(String, nullable=False)
    variant_snapshot: Mapped[str | None] = mapped_column(String, nullable=True)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")
