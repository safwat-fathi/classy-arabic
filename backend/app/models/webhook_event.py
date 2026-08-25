from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models._ids import new_id
from app.models.enums import Channel


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    channel: Mapped[Channel] = mapped_column(SAEnum(Channel, name="channel"), nullable=False)
    raw_payload: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    processing_error: Mapped[str | None] = mapped_column(String, nullable=True)
