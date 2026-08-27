from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import get_current_merchant
from app.domains.conversations.schemas import ConversationRead
from app.domains.conversations.service import list_conversations
from app.models import Merchant

router = APIRouter()


@router.get("/", response_model=list[ConversationRead])
async def get_conversations(
    current_merchant: Merchant = Depends(get_current_merchant), db: AsyncSession = Depends(get_db)
) -> list[ConversationRead]:
    return await list_conversations(db, current_merchant.id)
