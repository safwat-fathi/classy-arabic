import httpx

from app.core.config import settings
from app.engine.pipeline import process_message
from app.models import ModelTier, OrderStatus


def _chat_response(content: str) -> dict:
    return {
        "id": "chatcmpl-1", "object": "chat.completion", "created": 0, "model": "test",
        "choices": [{"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}],
    }


def _embedding_response() -> dict:
    return {
        "object": "list",
        "data": [{"object": "embedding", "index": 0, "embedding": [0.1] * 1024}],
        "model": "bge-m3",
        "usage": {"prompt_tokens": 1, "total_tokens": 1},
    }


async def test_tier0_short_circuit_skips_ai_calls(db_session, conversation, mock_ai):
    result = await process_message(db_session, conversation, "👍", "👍")
    assert result.message.intent == "reaction"
    assert result.message.model_tier == ModelTier.RULE
    assert result.order is None
    assert not mock_ai.calls


async def test_purchase_intent_in_gathering_creates_order(db_session, conversation, mock_ai):
    mock_ai.post(f"{settings.NILECHAT_BASE_URL}/chat/completions").mock(
        side_effect=[
            httpx.Response(200, json=_chat_response('{"intent": "purchase_intent", "confidence": 0.9}')),
            httpx.Response(
                200,
                json=_chat_response(
                    '{"line_items": [], "ambiguous_fields": [], "confidence": 0.9}'
                ),
            ),
        ]
    )
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/embeddings").mock(return_value=httpx.Response(200, json=_embedding_response()))

    result = await process_message(db_session, conversation, "عايز اطلب رز", "عايز اطلب رز")

    assert result.message.intent == "purchase_intent"
    assert result.message.model_tier == ModelTier.NILECHAT
    assert result.order is not None
    assert result.order.status == OrderStatus.AUTO_CONFIRMED


async def test_non_purchase_intent_does_not_create_order(db_session, conversation, mock_ai):
    mock_ai.post(f"{settings.NILECHAT_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "question", "confidence": 0.9}'))
    )
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/embeddings").mock(return_value=httpx.Response(200, json=_embedding_response()))

    result = await process_message(db_session, conversation, "الاسعار كام؟", "الاسعار كام؟")

    assert result.message.intent == "question"
    assert result.order is None
