import asyncio

from arq import create_pool
from arq.connections import RedisSettings

from app.core.config import settings
from app.core.locks import conversation_lock


async def test_lock_excludes_concurrent_holders():
    redis = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    order: list[str] = []

    async def hold(name: str, delay: float) -> None:
        async with conversation_lock(redis, "conv-lock-test"):
            order.append(f"{name}-start")
            await asyncio.sleep(delay)
            order.append(f"{name}-end")

    await asyncio.gather(hold("a", 0.05), hold("b", 0.0))

    # Whichever task acquires the lock first must fully finish (its "-end")
    # before the other one's "-start" — i.e. no interleaving.
    assert order in (["a-start", "a-end", "b-start", "b-end"], ["b-start", "b-end", "a-start", "a-end"])

    await redis.aclose()


async def test_lock_releases_on_exception():
    redis = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))

    with __import__("pytest").raises(ValueError):
        async with conversation_lock(redis, "conv-lock-test-2"):
            raise ValueError("boom")

    # Lock must be released even though the body raised — acquiring it again
    # immediately must succeed rather than hang/timeout.
    async with conversation_lock(redis, "conv-lock-test-2"):
        pass

    await redis.aclose()
