import httpx

from app.engine.classification import classify_message


def _chat_response(content: str) -> dict:
    return {
        "id": "chatcmpl-1",
        "object": "chat.completion",
        "created": 0,
        "model": "test",
        "choices": [
            {"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}
        ],
    }


async def test_classify_message_stays_on_tier1_when_confident(mock_ai):
    mock_ai.post("http://localhost:8001/v1/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "greeting", "confidence": 0.95}'))
    )
    result, tier, reason = await classify_message("customer: hi", ["greeting"], threshold=0.7)
    assert result.intent == "greeting"
    assert tier == "nilechat"
    assert reason is None


async def test_classify_message_escalates_on_low_confidence(mock_ai):
    mock_ai.post("http://localhost:8001/v1/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "other", "confidence": 0.4}'))
    )
    mock_ai.post("https://openrouter.ai/api/v1/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "purchase_intent", "confidence": 0.9}'))
    )
    result, tier, reason = await classify_message("customer: لو ممكن اعرف", ["purchase_intent"], threshold=0.7)
    assert result.intent == "purchase_intent"
    assert tier == "escalated"
    assert reason == "confidence_below_threshold"
