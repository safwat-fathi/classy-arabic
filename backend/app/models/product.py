from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import ARRAY, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id

if TYPE_CHECKING:
    from app.models.merchant import Merchant


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    aliases: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    variants: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(1024), nullable=True)

    merchant: Mapped[Merchant] = relationship(back_populates="products")
