from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import get_current_merchant
from app.models import Merchant

router = APIRouter()


class MerchantSettingsUpdate(BaseModel):
    auto_learning_enabled: bool


class MerchantSettingsRead(BaseModel):
    auto_learning_enabled: bool


@router.get("/me/settings", response_model=MerchantSettingsRead)
async def get_settings(
    current_merchant: Merchant = Depends(get_current_merchant),
) -> MerchantSettingsRead:
    return MerchantSettingsRead(auto_learning_enabled=current_merchant.auto_learning_enabled)


@router.patch("/me/settings", response_model=MerchantSettingsRead)
async def update_settings(
    payload: MerchantSettingsUpdate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> MerchantSettingsRead:
    current_merchant.auto_learning_enabled = payload.auto_learning_enabled
    await db.commit()
    return MerchantSettingsRead(auto_learning_enabled=current_merchant.auto_learning_enabled)
