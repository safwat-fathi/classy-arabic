from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engine import gateway
from app.models import LabeledExample


async def embed_text(text: str) -> list[float]:
    return await gateway.embed(text)


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
