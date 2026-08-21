from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.core.database import Base
from app.models._ids import new_id
from app.models.enums import Direction, ModelTier


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"), nullable=False)
    direction: Mapped[Direction] = mapped_column(SAEnum(Direction, name="direction"), nullable=False)
    raw_text: Mapped[str | None] = mapped_column(String, nullable=True)
    normalized_text: Mapped[str | None] = mapped_column(String, nullable=True)
    intent: Mapped[str | None] = mapped_column(String, nullable=True)
    intent_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    model_tier: Mapped[ModelTier | None] = mapped_column(SAEnum(ModelTier, name="modeltier"), nullable=True)
    escalation_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")
