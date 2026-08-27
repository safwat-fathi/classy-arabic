from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import get_current_merchant
from app.domains.products.schemas import ProductRead
from app.domains.products.service import list_products
from app.models import Merchant

router = APIRouter()


@router.get("/", response_model=list[ProductRead])
async def get_products(
    current_merchant: Merchant = Depends(get_current_merchant), db: AsyncSession = Depends(get_db)
) -> list[ProductRead]:
    return await list_products(db, current_merchant.id)
