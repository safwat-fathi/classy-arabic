from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.domains.store_knowledge.schemas import StoreKnowledgeRead
from app.models import StoreKnowledge

router = APIRouter()


@router.get("/", response_model=list[StoreKnowledgeRead])
async def get_store_knowledge(merchant_id: str, db: AsyncSession = Depends(get_db)) -> list[StoreKnowledgeRead]:
    stmt = select(StoreKnowledge).where(StoreKnowledge.merchant_id == merchant_id).order_by(StoreKnowledge.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())
