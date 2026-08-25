import hmac
import json
import logging

from arq import ArqRedis
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import get_arq_pool
from app.domains.channels.meta import parse_meta_payload, verify_meta_signature
from app.domains.channels.service import ingest_channel_message
from app.domains.channels.twilio_whatsapp import parse_twilio_payload, verify_twilio_signature
from app.models import Channel, WebhookEvent

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/meta")
async def verify_meta_webhook(request: Request) -> PlainTextResponse:
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge", "")
    if (
        mode == "subscribe"
        and token is not None
        and settings.META_VERIFY_TOKEN
        and hmac.compare_digest(token, settings.META_VERIFY_TOKEN)
    ):
        return PlainTextResponse(challenge)
    raise HTTPException(status_code=403, detail="verification failed")


@router.post("/meta")
async def receive_meta_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    arq_pool: ArqRedis = Depends(get_arq_pool),
) -> dict:
    raw_body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256")
    if not verify_meta_signature(raw_body, signature):
        raise HTTPException(status_code=403, detail="invalid signature")

    payload = None
    processing_error: str | None = None
    parsed_messages = []
    try:
        payload = json.loads(raw_body)
        parsed_messages = parse_meta_payload(payload)
    except Exception as exc:  # noqa: BLE001 - webhook boundary: log and ack, never let Meta retry-storm us
        processing_error = str(exc)
        logger.warning("meta_webhook_parse_failed error=%s", exc)

    channel = (
        Channel.INSTAGRAM if isinstance(payload, dict) and payload.get("object") == "instagram" else Channel.FACEBOOK
    )
    db.add(WebhookEvent(channel=channel, raw_payload=payload, processing_error=processing_error))

    new_message_ids = []
    for parsed in parsed_messages:
        message_id = await ingest_channel_message(db, parsed)
        if message_id:
            new_message_ids.append(message_id)

    await db.commit()

    for message_id in new_message_ids:
        await arq_pool.enqueue_job("process_channel_message", message_id)

    return {"status": "received"}


@router.post("/whatsapp/twilio")
async def receive_twilio_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    arq_pool: ArqRedis = Depends(get_arq_pool),
) -> dict:
    form = await request.form()
    params = dict(form)
    signature = request.headers.get("X-Twilio-Signature")
    if not verify_twilio_signature(params, signature):
        raise HTTPException(status_code=403, detail="invalid signature")

    processing_error: str | None = None
    parsed = None
    try:
        parsed = parse_twilio_payload(params)
    except Exception as exc:  # noqa: BLE001 - webhook boundary: log and ack, never let Twilio retry-storm us
        processing_error = str(exc)
        logger.warning("twilio_webhook_parse_failed error=%s", exc)

    db.add(WebhookEvent(channel=Channel.WHATSAPP, raw_payload=params, processing_error=processing_error))

    new_message_id = None
    if parsed is not None:
        new_message_id = await ingest_channel_message(db, parsed)

    await db.commit()

    if new_message_id:
        await arq_pool.enqueue_job("process_channel_message", new_message_id)

    return {"status": "received"}
