from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import get_current_merchant
from app.domains.handoff import service
from app.domains.handoff.schemas import HandoffReturnRequest, HandoffTakeoverRequest
from app.domains.handoff.service import ConversationNotFoundError
from app.models.merchant import Merchant

router = APIRouter()


@router.post(
    "/{conversation_id}/takeover",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Take over conversation from AI",
)
async def takeover_conversation(
    conversation_id: str,
    payload: HandoffTakeoverRequest,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.takeover_conversation(
            db,
            current_merchant.id,
            conversation_id,
            payload.reason,
            payload.notes,
        )
        await db.commit()
    except ConversationNotFoundError:
        raise HTTPException(status_code=404, detail="Conversation not found")


@router.post(
    "/{conversation_id}/return-to-ai",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Return conversation to AI",
)
async def return_to_ai(
    conversation_id: str,
    payload: HandoffReturnRequest,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.return_to_ai(
            db,
            current_merchant.id,
            conversation_id,
            payload.notes,
        )
        await db.commit()
    except ConversationNotFoundError:
        raise HTTPException(status_code=404, detail="Conversation not found")
