import httpx

from app.core.config import settings
from app.engine.classification import classify_message
from app.models.enums import ConvState


def _chat_response(content: str) -> dict:
    return {
        "id": "chatcmpl-1",
        "object": "chat.completion",
        "created": 0,
        "model": "test",
        "choices": [{"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}],
    }


async def test_classify_message_returns_result_when_confident(mock_ai):
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "greeting", "confidence": 0.95}'))
    )
    result, reason, usage = await classify_message(
        "customer: hi",
        ["greeting"],
        threshold=0.7,
        correction_count=0,
        text="customer: hi",
        merchant_name="Test Merchant",
        conv_state=ConvState.GATHERING,
        slots={},
    )
    assert result.intent == "greeting"
    assert reason is None
    assert usage is not None
    assert usage.tier == "deepseek"


async def test_classify_message_flags_low_confidence(mock_ai):
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "other", "confidence": 0.4}'))
    )
    result, reason, usage = await classify_message(
        "customer: ممكن اعرف",
        ["purchase_intent", "other"],
        threshold=0.7,
        correction_count=0,
        text="customer: ممكن اعرف",
        merchant_name="Test Merchant",
        conv_state=ConvState.GATHERING,
        slots={},
    )
    assert result.intent == "other"
    assert reason == "confidence_below_threshold"
    assert usage is not None
    assert usage.tier == "deepseek"

async def test_classify_message_rejects_off_vocabulary_intent(mock_ai):
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(200, json=_chat_response('{"intent": "totally_made_up_intent", "confidence": 0.95}'))
    )
    result, reason, usage = await classify_message(
        "customer: hi",
        ["greeting", "other"],
        threshold=0.7,
        correction_count=0,
        text="customer: hi",
        merchant_name="Test Merchant",
        conv_state=ConvState.GATHERING,
        slots={},
    )
    assert result.intent == "other"
    assert reason == "intent_outside_known_vocabulary"
