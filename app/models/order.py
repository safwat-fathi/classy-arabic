from __future__ import annotations

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id
from app.models.enums import ModelTier, OrderStatus


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"), nullable=False)
    extracted_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    confirmed_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[OrderStatus] = mapped_column(SAEnum(OrderStatus, name="orderstatus"), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    extracted_by_tier: Mapped[ModelTier] = mapped_column(SAEnum(ModelTier, name="modeltier"), nullable=False)

    conversation: Mapped[Conversation] = relationship(back_populates="orders")
