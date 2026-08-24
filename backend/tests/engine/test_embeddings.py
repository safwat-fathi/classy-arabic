import httpx

from app.core.config import settings
from app.engine.embeddings import embed_text, find_similar_examples
from app.models import LabeledExample, Merchant


async def test_embed_text_calls_embedding_endpoint(mock_ai):
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(
            200,
            json={
                "object": "list",
                "data": [{"object": "embedding", "index": 0, "embedding": [0.1] * 1024}],
                "model": "bge-m3",
                "usage": {"prompt_tokens": 3, "total_tokens": 3},
            },
        )
    )
    vector = await embed_text("عايز اطلب")
    assert len(vector) == 1024


async def test_find_similar_examples_prefers_merchant_scope(db_session, merchant):
    close_to_query = [1.0] * 1024

    merchant_example = LabeledExample(
        merchant_id=merchant.id,
        normalized_text="merchant example",
        intent="purchase_intent",
        embedding=close_to_query,
        source="merchant_correction",
    )
    global_example = LabeledExample(
        merchant_id=None,
        normalized_text="global example",
        intent="purchase_intent",
        embedding=close_to_query,
        source="cluster_labeling",
    )
    db_session.add_all([merchant_example, global_example])
    await db_session.flush()

    results = await find_similar_examples(db_session, close_to_query, merchant.id, limit=5)
    assert results[0].normalized_text == "merchant example"


async def test_find_similar_examples_falls_back_to_global_pool(db_session, merchant):
    embedding = [1.0] * 1024
    global_example = LabeledExample(
        merchant_id=None,
        normalized_text="global only",
        intent="purchase_intent",
        embedding=embedding,
        source="cluster_labeling",
    )
    db_session.add(global_example)
    await db_session.flush()

    results = await find_similar_examples(db_session, embedding, merchant.id, limit=5)
    assert len(results) == 1
    assert results[0].normalized_text == "global only"


async def test_find_similar_examples_never_returns_other_merchants_data(db_session, merchant):
    other = Merchant(name="Other Merchant")
    db_session.add(other)
    await db_session.flush()
    other_example = LabeledExample(
        merchant_id=other.id,
        normalized_text="other merchant's example",
        intent="other",
        embedding=[0.1] * 1024,
        source="manual_seed",
    )
    db_session.add(other_example)
    await db_session.flush()

    results = await find_similar_examples(db_session, [0.1] * 1024, merchant_id=merchant.id)

    assert other_example.id not in {r.id for r in results}
