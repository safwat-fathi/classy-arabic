from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models._ids import new_id
from app.models.enums import DeliveryAreaStatus


class DeliveryArea(Base):
    __tablename__ = "delivery_areas"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), nullable=False, index=True)
    area: Mapped[str] = mapped_column(String, nullable=False)
    delivery_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    estimated_delivery: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[DeliveryAreaStatus] = mapped_column(
        SAEnum(DeliveryAreaStatus, name="deliveryareastatus"),
        nullable=False,
        default=DeliveryAreaStatus.ACTIVE,
        server_default="ACTIVE",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
