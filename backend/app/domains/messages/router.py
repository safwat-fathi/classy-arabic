from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.messages.schemas import MessageIngestRequest, MessageIngestResponse
from app.domains.messages.service import ConversationNotFoundError, ingest_message

router = APIRouter()


@router.post("", response_model=MessageIngestResponse)
async def ingest(
    payload: MessageIngestRequest, response: Response, db: AsyncSession = Depends(get_db)
) -> MessageIngestResponse:
    try:
        result = await ingest_message(db, payload)
    except ConversationNotFoundError:
        raise HTTPException(status_code=404, detail="conversation not found")
    await db.commit()
    if result.escalation_reason == "ai_call_failed":
        response.status_code = status.HTTP_202_ACCEPTED
    return result
