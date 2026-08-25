import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from arq import ArqRedis

_LOCK_TTL_SECONDS = 30
_ACQUIRE_POLL_SECONDS = 0.05

_RELEASE_SCRIPT = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""


@asynccontextmanager
async def conversation_lock(redis: ArqRedis, conversation_id: str) -> AsyncIterator[None]:
    """
    Redis mutex keyed `conversation:{id}:lock` (SRD §36) so two concurrent
    webhook deliveries for the same conversation can't interleave message
    processing and corrupt the chronological-history assumption in
    context_budget.py. Uses a unique per-acquisition token so a holder can
    never release a lock it doesn't own (e.g. after its own TTL expired and
    someone else acquired it).
    """
    key = f"conversation:{conversation_id}:lock"
    token = uuid.uuid4().hex
    while not await redis.set(key, token, nx=True, ex=_LOCK_TTL_SECONDS):
        import asyncio

        await asyncio.sleep(_ACQUIRE_POLL_SECONDS)
    try:
        yield
    finally:
        await redis.eval(_RELEASE_SCRIPT, 1, key, token)
