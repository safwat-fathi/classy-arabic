import pytest

from app.engine.schemas import SearchStoreKnowledgeAction
from app.engine.tools.errors import ToolUnavailableError
from app.engine.tools.knowledge import handle_search_store_knowledge


async def test_handle_search_store_knowledge_raises_tool_unavailable(db_session, merchant, conversation):
    action = SearchStoreKnowledgeAction(action="search_store_knowledge", query="return policy", confidence=0.9)
    with pytest.raises(ToolUnavailableError):
        await handle_search_store_knowledge(db_session, action, merchant.id, conversation.id)
