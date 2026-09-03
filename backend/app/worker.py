import logging
from collections.abc import Callable
from contextlib import AbstractAsyncContextManager
from functools import partial

from arq.connections import RedisSettings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session_maker
from app.core.locks import conversation_lock
from app.domains.channels.reply_sender import send_facebook_reply
from app.engine.pipeline import process_message
from app.models import Channel, ChannelConnection, Conversation, Direction, Message
from app.models._ids import new_id

logger = logging.getLogger(__name__)


def _compose_reply(result) -> str | None:
    """Build a human-readable reply from the pipeline result."""
    if result.answer_text:
        return result.answer_text
    if result.order is not None:
        return f"تم استلام طلبك #{result.order.order_number or result.order.id[:8]}. هنتواصل معاك قريب!"
    return None


async def _send_outbound(session: AsyncSession, conversation: Conversation, reply_text: str) -> None:
    """Send a reply via the channel and persist the outbound message."""
    if not conversation.channel_connection_id:
        return

    connection = await session.get(ChannelConnection, conversation.channel_connection_id)
    if connection is None or not connection.page_access_token:
        logger.warning("no_page_token conversation_id=%s", conversation.id)
        return

    if connection.channel == Channel.FACEBOOK:
        sent = await send_facebook_reply(
            connection.page_access_token,
            conversation.customer_ref,
            reply_text,
        )
        if sent:
            session.add(
                Message(
                    id=new_id(),
                    conversation_id=conversation.id,
                    direction=Direction.OUTBOUND,
                    raw_text=reply_text,
                    normalized_text=reply_text,
                )
            )
            await session.flush()


async def _process_channel_message(
    session: AsyncSession,
    lock_cm: Callable[[str], AbstractAsyncContextManager[None]],
    message_id: str,
) -> None:
    message = await session.get(Message, message_id)
    if message is None or message.intent is not None:
        return
    conversation = await session.get(Conversation, message.conversation_id)
    async with lock_cm(conversation.id):
        result = await process_message(session, conversation, message)

        # Send outbound reply if the pipeline produced one
        reply_text = _compose_reply(result)
        if reply_text:
            await _send_outbound(session, conversation, reply_text)

        await session.commit()


async def process_channel_message(ctx: dict, message_id: str) -> None:
    async with async_session_maker() as session:
        lock_cm = partial(conversation_lock, ctx["redis"])
        await _process_channel_message(session, lock_cm, message_id)


class WorkerSettings:
    functions = [process_channel_message]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
