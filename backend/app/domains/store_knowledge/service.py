from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.store_knowledge.schemas import StoreKnowledgeCreate, StoreKnowledgeRead, StoreKnowledgeUpdate
from app.models import StoreKnowledge


async def search(session: AsyncSession, merchant_id: str, query: str, knowledge_type: str | None = None) -> list[dict]:
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


async def list_knowledge(db: AsyncSession, merchant_id: str) -> list[StoreKnowledgeRead]:
    stmt = (
        select(StoreKnowledge)
        .where(StoreKnowledge.merchant_id == merchant_id)
        .order_by(StoreKnowledge.created_at.desc())
    )
    result = await db.execute(stmt)
    return [StoreKnowledgeRead.model_validate(row) for row in result.scalars().all()]


async def create_knowledge(db: AsyncSession, merchant_id: str, payload: StoreKnowledgeCreate) -> StoreKnowledgeRead:
    entry = StoreKnowledge(
        merchant_id=merchant_id,
        knowledge_type=payload.knowledge_type,
        title=payload.title,
        content=payload.content,
        keywords=payload.keywords,
    )
    db.add(entry)
    await db.flush()
    return StoreKnowledgeRead.model_validate(entry)


async def update_knowledge(
    db: AsyncSession, merchant_id: str, knowledge_id: str, payload: StoreKnowledgeUpdate
) -> StoreKnowledgeRead | None:
    entry = await db.get(StoreKnowledge, knowledge_id)
    if entry is None or entry.merchant_id != merchant_id:
        return None
    if payload.knowledge_type is not None:
        entry.knowledge_type = payload.knowledge_type
    if payload.title is not None:
        entry.title = payload.title
    if payload.content is not None:
        entry.content = payload.content
    if payload.keywords is not None:
        entry.keywords = payload.keywords
    await db.flush()
    return StoreKnowledgeRead.model_validate(entry)


async def delete_knowledge(db: AsyncSession, merchant_id: str, knowledge_id: str) -> bool:
    entry = await db.get(StoreKnowledge, knowledge_id)
    if entry is None or entry.merchant_id != merchant_id:
        return False
    await db.delete(entry)
    await db.flush()
    return True
