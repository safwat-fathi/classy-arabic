from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.conversations.schemas import ConversationRead
from app.domains.conversations.service import list_conversations

router = APIRouter()


@router.get("/", response_model=list[ConversationRead])
async def get_conversations(
    merchant_id: str | None = None, db: AsyncSession = Depends(get_db)
) -> list[ConversationRead]:
    return await list_conversations(db, merchant_id)
