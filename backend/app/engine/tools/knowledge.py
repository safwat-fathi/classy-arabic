from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.store_knowledge import service as knowledge_service
from app.engine.schemas import SearchStoreKnowledgeAction
from app.engine.tools.registry import register_tool


@register_tool("search_store_knowledge")
async def handle_search_store_knowledge(
    session: AsyncSession, action: SearchStoreKnowledgeAction, merchant_id: str, conversation_id: str, message_id: str
) -> dict:
    results = await knowledge_service.search(session, merchant_id, action.query, action.knowledge_type)
    return {"results": results}
