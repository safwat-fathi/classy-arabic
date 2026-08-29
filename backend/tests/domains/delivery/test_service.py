from sqlalchemy import select

from app.domains.delivery.schemas import DeliveryAreaCreate, DeliveryAreaUpdate
from app.domains.delivery.service import (
    create_delivery_area,
    delete_delivery_area,
    list_delivery_areas,
    update_delivery_area,
)
from app.models import DeliveryArea, Merchant


async def test_create_and_list_delivery_areas(db_session, merchant):
    created = await create_delivery_area(
        db_session, merchant.id, DeliveryAreaCreate(area="Nasr City", delivery_fee=25.0, estimated_delivery="same day")
    )
    assert created.status.value == "ACTIVE"

    areas = await list_delivery_areas(db_session, merchant.id)
    assert [a for a in areas if a.id == created.id][0].area == "Nasr City"


async def test_list_delivery_areas_scoped_to_merchant(db_session, merchant):
    other = Merchant(name="Other")
    db_session.add(other)
    await db_session.flush()
    await create_delivery_area(db_session, other.id, DeliveryAreaCreate(area="Maadi", delivery_fee=10.0))

    areas = await list_delivery_areas(db_session, merchant.id)
    assert all(area.area != "Maadi" for area in areas)


async def test_update_delivery_area(db_session, merchant):
    area = await create_delivery_area(db_session, merchant.id, DeliveryAreaCreate(area="Nasr City", delivery_fee=25.0))
    updated = await update_delivery_area(
        db_session, merchant.id, area.id, DeliveryAreaUpdate(delivery_fee=40.0, estimated_delivery="1-2 days")
    )
    assert str(updated.delivery_fee) == "40.00"
    assert updated.estimated_delivery == "1-2 days"


async def test_update_delivery_area_rejects_other_merchants_area(db_session, merchant):
    other = Merchant(name="Other")
    db_session.add(other)
    await db_session.flush()
    area = await create_delivery_area(db_session, other.id, DeliveryAreaCreate(area="Maadi", delivery_fee=10.0))

    assert await update_delivery_area(db_session, merchant.id, area.id, DeliveryAreaUpdate(delivery_fee=99.0)) is None


async def test_delete_delivery_area(db_session, merchant):
    area = await create_delivery_area(db_session, merchant.id, DeliveryAreaCreate(area="Nasr City", delivery_fee=25.0))
    assert await delete_delivery_area(db_session, merchant.id, area.id) is True
    assert (await db_session.execute(select(DeliveryArea).where(DeliveryArea.id == area.id))).scalar_one_or_none() is None


async def test_delete_delivery_area_rejects_other_merchants_area(db_session, merchant):
    other = Merchant(name="Other")
    db_session.add(other)
    await db_session.flush()
    area = await create_delivery_area(db_session, other.id, DeliveryAreaCreate(area="Maadi", delivery_fee=10.0))

    assert await delete_delivery_area(db_session, merchant.id, area.id) is False
    assert (await db_session.execute(select(DeliveryArea).where(DeliveryArea.id == area.id))).scalar_one() is not None
