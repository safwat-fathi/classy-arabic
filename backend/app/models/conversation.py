from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id
from app.models.enums import ConvState

if TYPE_CHECKING:
    from app.models.channel_connection import ChannelConnection
    from app.models.human_handoff import HumanHandoff
    from app.models.merchant import Merchant
    from app.models.message import Message
    from app.models.order import Order


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (
        UniqueConstraint(
            "channel_connection_id", "customer_ref", name="uq_conversations_channel_connection_customer_ref"
        ),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), nullable=False, index=True)
    channel_connection_id: Mapped[str | None] = mapped_column(
        ForeignKey("channel_connections.id"), nullable=True, index=True
    )
    customer_ref: Mapped[str] = mapped_column(String, nullable=False)
    state: Mapped[ConvState] = mapped_column(SAEnum(ConvState, name="convstate"), nullable=False)
    ai_enabled: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    human_takeover: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    slots: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    last_message_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    merchant: Mapped[Merchant] = relationship(back_populates="conversations")
    channel_connection: Mapped[ChannelConnection | None] = relationship(back_populates="conversations")
    messages: Mapped[list[Message]] = relationship(back_populates="conversation")
    orders: Mapped[list[Order]] = relationship(back_populates="conversation")
    handoffs: Mapped[list[HumanHandoff]] = relationship(back_populates="conversation")
