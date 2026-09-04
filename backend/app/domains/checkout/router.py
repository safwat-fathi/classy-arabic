from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.domains.auth.dependencies import get_current_merchant
from app.domains.checkout.manual_order import ConversationNotFoundError, ProductNotFoundError, create_manual_order
from app.domains.checkout.schemas import ManualOrderCreate, ManualOrderRead, OrderRead
from app.models import Merchant, Message, Order

router = APIRouter()


@router.get("/", response_model=list[OrderRead], status_code=200)
async def list_orders(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> list[OrderRead]:
    stmt = (
        select(Order)
        .join(Message, Order.message_id == Message.id)
        .where(Order.merchant_id == current_merchant.id)
        .options(selectinload(Order.items), selectinload(Order.message))
        .order_by(Message.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


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
