import httpx

from app.core.config import settings
from app.engine.extraction import extract_order


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


async def test_extract_order_stays_on_tier1_when_clean(mock_ai):
    mock_ai.post(f"{settings.NILECHAT_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(
            200,
            json=_chat_response('{"line_items": [], "ambiguous_fields": [], "confidence": 0.9}'),
        )
    )
    result, tier, reason = await extract_order("customer: order text", threshold=0.7, overflowed=False, correction_count=0)
    assert tier == "nilechat"
    assert reason is None


async def test_extract_order_escalates_on_ambiguous_fields(mock_ai):
    mock_ai.post(f"{settings.NILECHAT_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(
            200,
            json=_chat_response('{"line_items": [], "ambiguous_fields": ["address"], "confidence": 0.9}'),
        )
    )
    mock_ai.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions").mock(
        return_value=httpx.Response(
            200,
            json=_chat_response('{"line_items": [], "ambiguous_fields": [], "confidence": 0.85}'),
        )
    )
    result, tier, reason = await extract_order("customer: order text", threshold=0.7, overflowed=False, correction_count=0)
    assert tier == "escalated"
    assert reason == "ambiguous_fields_present"
