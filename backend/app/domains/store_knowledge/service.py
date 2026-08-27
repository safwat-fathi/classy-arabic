from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import StoreKnowledge


async def search(
    session: AsyncSession, merchant_id: str, query: str, knowledge_type: str | None = None
) -> list[dict]:
    """Keyword-match MVP for SRD §23 ("keyword/full-text retrieval"). A row
    matches when any of its seeded trigger `keywords` appears as a substring
    of the customer's free-text query — the reverse direction from
    `Product.aliases.any(query)` (which requires an exact element match and
    is the wrong shape for this). Results are ranked by the length of the
    longest matching keyword, so a more specific phrase (e.g. "مواعيد العمل")
    outranks a shorter, more generic one (e.g. "مواعيد") when both match the
    same query."""
    stmt = select(StoreKnowledge).where(StoreKnowledge.merchant_id == merchant_id)
    if knowledge_type:
        stmt = stmt.where(StoreKnowledge.knowledge_type == knowledge_type)
    result = await session.execute(stmt)
    rows = result.scalars().all()

    query_lower = query.lower()
    scored = []
    for row in rows:
        best_len = max((len(keyword) for keyword in row.keywords if keyword.lower() in query_lower), default=0)
        if best_len:
            scored.append((best_len, row))
    scored.sort(key=lambda pair: pair[0], reverse=True)

    return [
        {"id": row.id, "knowledge_type": row.knowledge_type, "title": row.title, "content": row.content}
        for _, row in scored
    ]
