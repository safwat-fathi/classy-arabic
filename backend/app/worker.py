from collections.abc import Callable
from contextlib import AbstractAsyncContextManager
from functools import partial

from arq.connections import RedisSettings
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session_maker
from app.core.locks import conversation_lock
from app.engine.pipeline import process_message
from app.models import Conversation, Message


async def _process_channel_message(
    session: AsyncSession,
    lock_cm: Callable[[str], AbstractAsyncContextManager[None]],
    message_id: str,
) -> None:
    message = await session.get(Message, message_id)
    if message is None:
        return
    conversation = await session.get(Conversation, message.conversation_id)
    async with lock_cm(conversation.id):
        await process_message(session, conversation, message)
        await session.commit()


async def process_channel_message(ctx: dict, message_id: str) -> None:
    async with async_session_maker() as session:
        lock_cm = partial(conversation_lock, ctx["redis"])
        await _process_channel_message(session, lock_cm, message_id)


class WorkerSettings:
    functions = [process_channel_message]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
