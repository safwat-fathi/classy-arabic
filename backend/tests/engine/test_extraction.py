import httpx

from app.core.config import settings
from app.engine.extraction import extract_order
from app.models.enums import ConvState


def _chat_response(content: str) -> dict:
    return {
        "id": "chatcmpl-1",
        "object": "chat.completion",
        "created": 0,
        "model": "test",
        "choices": [{"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}],
    }


async def test_extract_order_returns_result_when_clean(mock_ai):
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(
            200,
            json=_chat_response('{"line_items": [], "ambiguous_fields": [], "confidence": 0.9}'),
        )
    )
    result, reason, usage = await extract_order(
        "customer: order text",
        threshold=0.7,
        correction_count=0,
        text="customer: order text",
        merchant_name="Test Merchant",
        conv_state=ConvState.GATHERING,
        slots={},
    )
    assert reason is None
    assert usage is not None
    assert usage.tier == "deepseek"


async def test_extract_order_flags_ambiguous_fields(mock_ai):
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(
            200,
            json=_chat_response('{"line_items": [], "ambiguous_fields": ["address"], "confidence": 0.9}'),
        )
    )
    result, reason, usage = await extract_order(
        "customer: order text",
        threshold=0.7,
        correction_count=0,
        text="customer: order text",
        merchant_name="Test Merchant",
        conv_state=ConvState.GATHERING,
        slots={},
    )
    assert reason == "ambiguous_fields_present"
    assert usage is not None
    assert usage.tier == "deepseek"


async def test_extract_order_skips_ai_call_on_repeated_correction(mock_ai):
    result, reason, usage = await extract_order(
        "customer: x",
        threshold=0.7,
        correction_count=2,
        text="x",
        merchant_name="Test Merchant",
        conv_state=ConvState.GATHERING,
        slots={},
    )
    assert reason == "repeated_correction"
    assert usage is None
    assert not mock_ai.calls
