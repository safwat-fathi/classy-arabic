from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import StoreKnowledge


async def search(
    session: AsyncSession, merchant_id: str, query: str, knowledge_type: str | None = None
) -> list[dict]:
    """Keyword-match MVP for SRD §23 ("keyword/full-text retrieval"). Matches
    when any of a row's seeded trigger `keywords` appears as a substring of
    the customer's free-text query — the reverse direction from
    `Product.aliases.any(query)` (which requires an exact element match and
    is the wrong shape for this)."""
    stmt = select(StoreKnowledge).where(StoreKnowledge.merchant_id == merchant_id)
    if knowledge_type:
        stmt = stmt.where(StoreKnowledge.knowledge_type == knowledge_type)
    result = await session.execute(stmt)
    rows = result.scalars().all()

    query_lower = query.lower()
    matches = [row for row in rows if any(keyword.lower() in query_lower for keyword in row.keywords)]

    return [
        {"id": row.id, "knowledge_type": row.knowledge_type, "title": row.title, "content": row.content}
        for row in matches
    ]
