import httpx

from app.core.config import settings
from app.domains.labeled_examples.schemas import LabeledExampleCreate, LabeledExampleUpdate
from app.domains.labeled_examples.service import create_example, update_example
from app.models import LabeledExample


def _embedding_response() -> dict:
    return {
        "object": "list",
        "data": [{"object": "embedding", "index": 0, "embedding": [0.1] * 1024}],
        "model": "bge-m3",
        "usage": {"prompt_tokens": 1, "total_tokens": 1},
    }


async def test_create_embeds_text(db_session, merchant, mock_ai):
    mock_ai.post(f"{settings.EMBEDDING_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(200, json=_embedding_response())
    )

    example = await create_example(
        db_session, merchant.id, LabeledExampleCreate(normalized_text="عايز أطلب", intent="purchase_intent")
    )

    row = await db_session.get(LabeledExample, example.id)
    assert example.merchant_id == merchant.id
    assert example.source == "merchant"
    assert row.embedding == [0.1] * 1024


async def test_create_without_embedding_still_saves_when_embed_fails(db_session, merchant, mock_ai):
    mock_ai.post(f"{settings.EMBEDDING_BASE_URL}/embeddings").mock(return_value=httpx.Response(500))

    example = await create_example(
        db_session, merchant.id, LabeledExampleCreate(normalized_text="عايز أطلب", intent="purchase_intent")
    )

    assert example.id is not None


async def test_update_re_embeds_when_text_changes(db_session, merchant, mock_ai):
    route = mock_ai.post(f"{settings.EMBEDDING_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(200, json=_embedding_response())
    )

    example = await create_example(
        db_session, merchant.id, LabeledExampleCreate(normalized_text="عايز أطلب", intent="purchase_intent")
    )
    await update_example(db_session, merchant.id, example.id, LabeledExampleUpdate(normalized_text="new text"))

    assert len(route.calls) == 2


async def test_create_rejects_non_snake_case_intent():
    import pytest
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        LabeledExampleCreate(normalized_text="x", intent="Not Snake Case!")
