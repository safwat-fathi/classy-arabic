from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import get_current_merchant
from app.domains.store_knowledge.schemas import StoreKnowledgeCreate, StoreKnowledgeRead, StoreKnowledgeUpdate
from app.domains.store_knowledge.service import create_knowledge, delete_knowledge, list_knowledge, update_knowledge
from app.models import Merchant

router = APIRouter()


@router.get("/", response_model=list[StoreKnowledgeRead])
async def get_store_knowledge(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> list[StoreKnowledgeRead]:
    return await list_knowledge(db, current_merchant.id)


@router.post("/", response_model=StoreKnowledgeRead, status_code=201)
async def create(
    payload: StoreKnowledgeCreate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> StoreKnowledgeRead:
    result = await create_knowledge(db, current_merchant.id, payload)
    await db.commit()
    return result


@router.put("/{knowledge_id}", response_model=StoreKnowledgeRead)
async def update(
    knowledge_id: str,
    payload: StoreKnowledgeUpdate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> StoreKnowledgeRead:
    result = await update_knowledge(db, current_merchant.id, knowledge_id, payload)
    if result is None:
        raise HTTPException(status_code=404, detail="knowledge entry not found")
    await db.commit()
    return result


@router.delete("/{knowledge_id}", status_code=204)
async def delete(
    knowledge_id: str,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> None:
    deleted = await delete_knowledge(db, current_merchant.id, knowledge_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="knowledge entry not found")
    await db.commit()
