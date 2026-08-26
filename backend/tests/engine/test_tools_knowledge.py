from app.engine.schemas import SearchStoreKnowledgeAction
from app.engine.tools.knowledge import handle_search_store_knowledge
from app.models import StoreKnowledge


async def test_handle_search_store_knowledge_returns_empty_results_when_nothing_seeded(
    db_session, merchant, conversation
):
    action = SearchStoreKnowledgeAction(action="search_store_knowledge", query="return policy", confidence=0.9)
    result = await handle_search_store_knowledge(db_session, action, merchant.id, conversation.id, "msg-1")
    assert result == {"results": []}


async def test_handle_search_store_knowledge_returns_seeded_match(db_session, merchant, conversation):
    db_session.add(
        StoreKnowledge(
            merchant_id=merchant.id, knowledge_type="returns", title="استبدال",
            content="تقدر تستبدل خلال 14 يوم.", keywords=["return policy"],
        )
    )
    await db_session.flush()

    action = SearchStoreKnowledgeAction(action="search_store_knowledge", query="return policy", confidence=0.9)
    result = await handle_search_store_knowledge(db_session, action, merchant.id, conversation.id, "msg-1")

    assert len(result["results"]) == 1
    assert result["results"][0]["content"] == "تقدر تستبدل خلال 14 يوم."
