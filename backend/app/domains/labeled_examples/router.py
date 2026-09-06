from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import get_current_merchant
from app.domains.labeled_examples.schemas import LabeledExampleCreate, LabeledExampleRead, LabeledExampleUpdate
from app.domains.labeled_examples.service import (
    create_example,
    delete_example,
    list_examples,
    update_example,
)
from app.models import Merchant
from app.models.enums import DEFAULT_INTENTS

router = APIRouter()


@router.get("/", response_model=list[LabeledExampleRead])
async def get_labeled_examples(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> list[LabeledExampleRead]:
    return await list_examples(db, current_merchant.id)


@router.get("/intents", response_model=list[str])
async def get_known_intents(
    current_merchant: Merchant = Depends(get_current_merchant),
) -> list[str]:
    return DEFAULT_INTENTS


@router.post("/", response_model=LabeledExampleRead, status_code=201)
async def create(
    payload: LabeledExampleCreate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> LabeledExampleRead:
    result = await create_example(db, current_merchant.id, payload)
    await db.commit()
    return result


@router.put("/{example_id}", response_model=LabeledExampleRead)
async def update(
    example_id: str,
    payload: LabeledExampleUpdate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> LabeledExampleRead:
    result = await update_example(db, current_merchant.id, example_id, payload)
    if result is None:
        raise HTTPException(status_code=404, detail="labeled example not found")
    await db.commit()
    return result


@router.delete("/{example_id}", status_code=204)
async def delete(
    example_id: str,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> None:
    deleted = await delete_example(db, current_merchant.id, example_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="labeled example not found")
    await db.commit()
