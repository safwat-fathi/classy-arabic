from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.products.schemas import ProductRead
from app.domains.products.service import list_products

router = APIRouter()


@router.get("/", response_model=list[ProductRead])
async def get_products(merchant_id: str, db: AsyncSession = Depends(get_db)) -> list[ProductRead]:
    return await list_products(db, merchant_id)
