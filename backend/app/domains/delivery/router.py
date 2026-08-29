from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import get_current_merchant
from app.domains.delivery.schemas import DeliveryAreaCreate, DeliveryAreaRead, DeliveryAreaUpdate
from app.domains.delivery.service import (
    create_delivery_area,
    delete_delivery_area,
    list_delivery_areas,
    update_delivery_area,
)
from app.models import DeliveryArea, Merchant

router = APIRouter()


def _to_read(area: DeliveryArea) -> DeliveryAreaRead:
    return DeliveryAreaRead(
        id=area.id,
        merchant_id=area.merchant_id,
        area=area.area,
        delivery_fee=str(Decimal(str(area.delivery_fee)).quantize(Decimal("0.01"))),
        estimated_delivery=area.estimated_delivery,
        status=area.status.value,
    )


@router.get("/", response_model=list[DeliveryAreaRead])
async def get_delivery_areas(
    current_merchant: Merchant = Depends(get_current_merchant), db: AsyncSession = Depends(get_db)
) -> list[DeliveryAreaRead]:
    areas = await list_delivery_areas(db, current_merchant.id)
    return [_to_read(area) for area in areas]


@router.post("/", response_model=DeliveryAreaRead, status_code=201)
async def post_delivery_area(
    data: DeliveryAreaCreate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> DeliveryAreaRead:
    area = await create_delivery_area(db, current_merchant.id, data)
    return _to_read(area)


@router.patch("/{area_id}", response_model=DeliveryAreaRead)
async def patch_delivery_area(
    area_id: str,
    data: DeliveryAreaUpdate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> DeliveryAreaRead:
    area = await update_delivery_area(db, current_merchant.id, area_id, data)
    if area is None:
        raise HTTPException(status_code=404, detail="delivery area not found")
    return _to_read(area)


@router.delete("/{area_id}", status_code=204)
async def delete_delivery_area_endpoint(
    area_id: str,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Response:
    deleted = await delete_delivery_area(db, current_merchant.id, area_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="delivery area not found")
    return Response(status_code=204)
