from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.delivery.schemas import DeliveryAreaCreate, DeliveryAreaUpdate
from app.models import DeliveryArea


def _quantize_fee(value: float | Decimal | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value)).quantize(Decimal("0.01"))


async def list_delivery_areas(db: AsyncSession, merchant_id: str) -> list[DeliveryArea]:
    result = await db.execute(select(DeliveryArea).where(DeliveryArea.merchant_id == merchant_id))
    return result.scalars().all()


async def create_delivery_area(db: AsyncSession, merchant_id: str, data: DeliveryAreaCreate) -> DeliveryArea:
    area = DeliveryArea(
        merchant_id=merchant_id,
        area=data.area,
        delivery_fee=_quantize_fee(data.delivery_fee),
        estimated_delivery=data.estimated_delivery,
    )
    db.add(area)
    await db.flush()
    return area


async def update_delivery_area(
    db: AsyncSession, merchant_id: str, area_id: str, data: DeliveryAreaUpdate
) -> DeliveryArea | None:
    area = await db.get(DeliveryArea, area_id)
    if area is None or area.merchant_id != merchant_id:
        return None
    update = data.model_dump(exclude_unset=True)
    if update.get("delivery_fee") is not None:
        update["delivery_fee"] = _quantize_fee(update["delivery_fee"])
    for field, value in update.items():
        setattr(area, field, value)
    await db.flush()
    return area


async def delete_delivery_area(db: AsyncSession, merchant_id: str, area_id: str) -> bool:
    area = await db.get(DeliveryArea, area_id)
    if area is None or area.merchant_id != merchant_id:
        return False
    await db.delete(area)
    await db.flush()
    return True
