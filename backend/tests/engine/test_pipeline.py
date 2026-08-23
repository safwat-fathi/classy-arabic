import httpx

from app.core.config import settings
from app.engine.pipeline import DEFAULT_INTENTS, _known_intents, process_message
from app.models import Direction, Message, ModelTier, OrderStatus, Product


def _chat_response(content: str) -> dict:
    return {
        "id": "chatcmpl-1",
        "object": "chat.completion",
        "created": 0,
        "model": "test",
        "choices": [{"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}],
    }


def _embedding_response() -> dict:
    return {
        "object": "list",
        "data": [{"object": "embedding", "index": 0, "embedding": [0.1] * 1024}],
        "model": "bge-m3",
        "usage": {"prompt_tokens": 1, "total_tokens": 1},
    }


async def test_known_intents_includes_defaults_even_when_db_has_narrower_history(db_session, conversation):
    # Regression test: a DB that only ever recorded "question" (e.g. a
    # freshly seeded one) must not narrow the model's option list down to
    # just that value — it should still see the full default set alongside
    # whatever's been observed, or the classifier gets told "question" is
    # the only valid answer and keeps reinforcing itself.
    db_session.add(
        Message(conversation_id=conversation.id, direction=Direction.INBOUND, normalized_text="hi", intent="question")
    )
    await db_session.flush()

    intents = await _known_intents(db_session)

    assert set(DEFAULT_INTENTS) <= set(intents)


async def test_known_intents_adds_newly_observed_labels(db_session, conversation):
    db_session.add(
        Message(
            conversation_id=conversation.id,
            direction=Direction.INBOUND,
            normalized_text="hi",
            intent="delivery_question",
        )
    )
    await db_session.flush()

    intents = await _known_intents(db_session)

    assert "delivery_question" in intents
    assert set(DEFAULT_INTENTS) <= set(intents)


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
                    '{"line_items": [{"product_name": "رز", "quantity": 1}], "ambiguous_fields": [], "confidence": 0.9}'
                ),
            ),
        ]
    )
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(200, json=_embedding_response())
    )

    result = await process_message(db_session, conversation, "عايز اطلب رز", "عايز اطلب رز")

    assert result.message.intent == "purchase_intent"
    assert result.message.model_tier == ModelTier.NILECHAT
    assert result.order is not None
    assert result.order.status == OrderStatus.AUTO_CONFIRMED


async def test_purchase_intent_line_items_match_seeded_product(db_session, conversation, mock_ai):
    close_vector = [1.0] * 1024
    product = Product(merchant_id=conversation.merchant_id, name="Summer Linen Dress", embedding=close_vector)
    db_session.add(product)
    await db_session.flush()

    mock_ai.post(f"{settings.NILECHAT_BASE_URL}/chat/completions").mock(
        side_effect=[
            httpx.Response(200, json=_chat_response('{"intent": "purchase_intent", "confidence": 0.9}')),
            httpx.Response(
                200,
                json=_chat_response(
                    '{"line_items": [{"product_name": "فستان صيفي", "quantity": 1.0}], '
                    '"ambiguous_fields": [], "confidence": 0.9}'
                ),
            ),
        ]
    )
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(200, json=_embedding_response())
    )

    result = await process_message(db_session, conversation, "عايز فستان صيفي", "عايز فستان صيفي")

    assert result.order is not None
    assert result.order.extracted_payload["line_items"][0]["product_id"] == product.id


async def test_classification_failure_persists_message_instead_of_losing_it(db_session, conversation, mock_ai):
    # Regression: a malformed/empty response from the classifier must not raise
    # out of process_message and lose the inbound message row — it must persist
    # the message with an explicit failure marker so the request can be retried.
    mock_ai.post(f"{settings.NILECHAT_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response("not json"))
    )
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(200, json=_embedding_response())
    )

    result = await process_message(db_session, conversation, "عايز اطلب حاجة", "عايز اطلب حاجة")

    assert result.message.id is not None
    assert result.message.escalation_reason == "ai_call_failed"
    assert result.message.intent is None
    assert result.order is None


async def test_extraction_failure_persists_message_and_classification(db_session, conversation, mock_ai):
    # Same guarantee for the extraction leg: classification already succeeded
    # and must not be thrown away just because the extraction call failed.
    mock_ai.post(f"{settings.NILECHAT_BASE_URL}/chat/completions").mock(
        side_effect=[
            httpx.Response(200, json=_chat_response('{"intent": "purchase_intent", "confidence": 0.9}')),
            httpx.Response(200, json=_chat_response("not json")),
        ]
    )
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(200, json=_embedding_response())
    )

    result = await process_message(db_session, conversation, "عايز اطلب رز", "عايز اطلب رز")

    assert result.message.intent == "purchase_intent"
    assert result.message.escalation_reason == "ai_call_failed"
    assert result.order is None


async def test_non_purchase_intent_does_not_create_order(db_session, conversation, mock_ai):
    # A short question ("how much?") must stay on tier 1 — regression guard for
    # the reasoning-heavy density check firing on any single "؟" (see
    # routing_policy.DENSITY_CHECK_MIN_LENGTH).
    mock_ai.post(f"{settings.NILECHAT_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "question", "confidence": 0.9}'))
    )
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(200, json=_embedding_response())
    )

    result = await process_message(db_session, conversation, "الاسعار كام؟", "الاسعار كام؟")

    assert result.message.intent == "question"
    assert result.message.model_tier == ModelTier.NILECHAT
    assert result.order is None
