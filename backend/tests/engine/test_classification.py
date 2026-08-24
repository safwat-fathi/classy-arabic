import httpx

from app.core.config import settings
from app.engine.classification import classify_message


def _chat_response(content: str) -> dict:
    return {
        "id": "chatcmpl-1",
        "object": "chat.completion",
        "created": 0,
        "model": "test",
        "choices": [{"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}],
    }


async def test_classify_message_stays_on_tier1_when_confident(mock_ai):
    mock_ai.post(f"{settings.NILECHAT_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "greeting", "confidence": 0.95}'))
    )
    result, tier, reason, usage = await classify_message(
        "customer: hi", ["greeting"], threshold=0.7, overflowed=False, correction_count=0, text="customer: hi"
    )
    assert result.intent == "greeting"
    assert tier == "nilechat"
    assert reason is None
    assert usage is not None
    assert usage.tier == "nilechat"


async def test_classify_message_escalates_on_low_confidence(mock_ai):
    mock_ai.post(f"{settings.NILECHAT_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "other", "confidence": 0.4}'))
    )
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "purchase_intent", "confidence": 0.9}'))
    )
    result, tier, reason, usage = await classify_message(
        "customer: ممكن اعرف",
        ["purchase_intent"],
        threshold=0.7,
        overflowed=False,
        correction_count=0,
        text="customer: ممكن اعرف",
    )
    assert result.intent == "purchase_intent"
    assert tier == "escalated"
    assert reason == "confidence_below_threshold"
    assert usage is not None
    assert usage.tier == "escalated"
