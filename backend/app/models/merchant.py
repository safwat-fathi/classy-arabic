from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.product import Product


class Merchant(Base):
    __tablename__ = "merchants"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String, nullable=False)

    products: Mapped[list[Product]] = relationship(back_populates="merchant")
    conversations: Mapped[list[Conversation]] = relationship(back_populates="merchant")
