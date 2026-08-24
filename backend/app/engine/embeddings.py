import time

import openai
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.engine.clients import AICallError, get_embedding_client, record_ai_call
from app.models import LabeledExample


async def embed_text(text: str) -> list[float]:
    client = get_embedding_client()
    start = time.monotonic()
    try:
        response = await client.embeddings.create(model=settings.EMBEDDING_MODEL, input=text)
    except openai.APIError as exc:
        raise AICallError(f"embedding call failed: {exc}") from exc
    record_ai_call("embedding", settings.EMBEDDING_MODEL, start, response.usage)
    return list(response.data[0].embedding)


async def find_similar_examples(
    session: AsyncSession, embedding: list[float], merchant_id: str | None, limit: int = 5
) -> list[LabeledExample]:
    base_query = select(LabeledExample).order_by(LabeledExample.embedding.cosine_distance(embedding)).limit(limit)

    if merchant_id:
        scoped = await session.execute(base_query.where(LabeledExample.merchant_id == merchant_id))
        rows = list(scoped.scalars().all())
        if rows:
            return rows

    global_pool = await session.execute(base_query.where(LabeledExample.merchant_id.is_(None)))
    return list(global_pool.scalars().all())
