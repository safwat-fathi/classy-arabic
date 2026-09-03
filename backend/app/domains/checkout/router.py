from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import get_current_merchant
from app.domains.checkout.manual_order import ConversationNotFoundError, ProductNotFoundError, create_manual_order
from app.domains.checkout.schemas import ManualOrderCreate, ManualOrderRead
from app.models import Merchant

router = APIRouter()


@router.post("/manual", response_model=ManualOrderRead, status_code=201)
async def create_manual(
    payload: ManualOrderCreate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> ManualOrderRead:
    try:
        result = await create_manual_order(db, current_merchant.id, payload)
    except ConversationNotFoundError:
        raise HTTPException(status_code=404, detail="conversation not found")
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=404, detail=f"product not found: {exc.product_id}")
    await db.commit()
    return result
