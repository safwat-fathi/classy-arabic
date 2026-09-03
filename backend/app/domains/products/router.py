from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import get_current_merchant
from app.domains.products.schemas import ProductCreate, ProductRead, ProductUpdate
from app.domains.products.service import create_product, delete_product, list_products, update_product
from app.models import Merchant

router = APIRouter()


@router.get("/", response_model=list[ProductRead])
async def get_products(
    current_merchant: Merchant = Depends(get_current_merchant), db: AsyncSession = Depends(get_db)
) -> list[ProductRead]:
    return await list_products(db, current_merchant.id)


@router.post("/", response_model=ProductRead, status_code=201)
async def create(
    payload: ProductCreate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> ProductRead:
    result = await create_product(db, current_merchant.id, payload)
    await db.commit()
    return result


@router.put("/{product_id}", response_model=ProductRead)
async def update(
    product_id: str,
    payload: ProductUpdate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> ProductRead:
    result = await update_product(db, current_merchant.id, product_id, payload)
    if result is None:
        raise HTTPException(status_code=404, detail="product not found")
    await db.commit()
    return result


@router.delete("/{product_id}", status_code=204)
async def delete(
    product_id: str,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> None:
    deleted = await delete_product(db, current_merchant.id, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="product not found")
    await db.commit()
