from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models._ids import new_id
from app.models.enums import Channel
from app.models.types import EncryptedString

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.merchant import Merchant


class ChannelConnection(Base):
    __tablename__ = "channel_connections"
    __table_args__ = (
        UniqueConstraint("channel", "external_account_id", name="uq_channel_connections_channel_external_account_id"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), nullable=False, index=True)
    channel: Mapped[Channel] = mapped_column(SAEnum(Channel, name="channel"), nullable=False)
    external_account_id: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    page_access_token: Mapped[str | None] = mapped_column(EncryptedString, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    merchant: Mapped[Merchant] = relationship()
    conversations: Mapped[list[Conversation]] = relationship(back_populates="channel_connection")
