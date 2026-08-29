from decimal import Decimal

from sqlalchemy import select

from app.models import DeliveryArea, DeliveryAreaStatus


async def test_delivery_area_round_trip(db_session, merchant):
    area = DeliveryArea(
        merchant_id=merchant.id,
        area="Nasr City",
        delivery_fee=Decimal("25.00"),
        estimated_delivery="same day",
    )
    db_session.add(area)
    await db_session.flush()

    result = await db_session.execute(select(DeliveryArea).where(DeliveryArea.id == area.id))
    stored = result.scalar_one()
    assert stored.merchant_id == merchant.id
    assert stored.area == "Nasr City"
    assert str(stored.delivery_fee) == "25.00"
    assert stored.estimated_delivery == "same day"
    assert stored.status == DeliveryAreaStatus.ACTIVE


async def test_delivery_area_status_defaults_to_active(db_session, merchant):
    area = DeliveryArea(merchant_id=merchant.id, area="Maadi", delivery_fee=Decimal("0.00"))
    db_session.add(area)
    await db_session.flush()

    assert area.status == DeliveryAreaStatus.ACTIVE
