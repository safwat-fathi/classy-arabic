import logging
import time

import httpx
from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger("app.engine.ai_calls")


def get_nilechat_client() -> AsyncOpenAI:
    return AsyncOpenAI(base_url=settings.NILECHAT_BASE_URL, api_key=settings.NILECHAT_API_KEY, http_client=httpx.AsyncClient())


def get_deepseek_client() -> AsyncOpenAI:
    return AsyncOpenAI(base_url=settings.OPENROUTER_BASE_URL, api_key=settings.OPENROUTER_API_KEY, http_client=httpx.AsyncClient())


def get_embedding_client() -> AsyncOpenAI:
    return AsyncOpenAI(base_url=settings.EMBEDDING_BASE_URL, api_key=settings.EMBEDDING_API_KEY, http_client=httpx.AsyncClient())


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
