import json
import logging
import time

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger("app.engine.ai_calls")


class AICallError(Exception):
    """Model call failed or returned unusable content."""


def parse_json_content(response) -> dict:
    content = response.choices[0].message.content
    if not content:
        raise AICallError("empty content")
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise AICallError(f"non-json content: {content[:200]!r}") from exc


_deepseek = AsyncOpenAI(
    base_url=settings.OPENROUTER_BASE_URL,
    api_key=settings.OPENROUTER_API_KEY,
    timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
    max_retries=settings.AI_MAX_RETRIES,
)

_embedding = AsyncOpenAI(
    base_url=settings.EMBEDDING_BASE_URL,
    api_key=settings.EMBEDDING_API_KEY,
    timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
    max_retries=settings.AI_MAX_RETRIES,
)


def get_deepseek_client() -> AsyncOpenAI:
    return _deepseek


def get_embedding_client() -> AsyncOpenAI:
    return _embedding


async def close_ai_clients():
    await _deepseek.close()
    await _embedding.close()


def record_ai_call(tier: str, model: str, start_time: float, usage) -> None:
    """§7's observability requirement: log token counts + latency for every
    AI call, regardless of tier, so context-budget overflows and cost/latency
    regressions are visible without instrumenting each call site separately."""
    duration_ms = (time.monotonic() - start_time) * 1000
    logger.info(
        "ai_call tier=%s model=%s duration_ms=%.1f prompt_tokens=%s completion_tokens=%s",
        tier,
        model,
        duration_ms,
        getattr(usage, "prompt_tokens", None) if usage else None,
        getattr(usage, "completion_tokens", None) if usage else None,
    )
