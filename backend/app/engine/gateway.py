from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from types import SimpleNamespace

from openai import APIError, AsyncOpenAI, AsyncStream
from pydantic import BaseModel, ValidationError

from app.core.config import settings
from app.engine.clients import (
    AICallError,
    get_deepseek_client,
    get_embedding_client,
    parse_json_content,
    record_ai_call,
)
from app.engine.schemas import json_schema_response_format

logger = logging.getLogger(__name__)


async def _resolve_response(response):
    """Consume an AsyncStream into a ChatCompletion-like object.

    OpenRouter may return a stream even when stream=False for certain
    model routes (e.g. ~deepseek/ prefixed models).  This helper
    transparently handles both cases so callers always get a regular
    response with .choices and .usage.
    """
    if not isinstance(response, AsyncStream):
        return response

    logger.debug("Provider returned AsyncStream despite stream=False; consuming chunks")
    content_parts: list[str] = []
    usage = None
    async for chunk in response:
        if chunk.choices:
            delta = chunk.choices[0].delta
            if delta and delta.content:
                content_parts.append(delta.content)
        if getattr(chunk, "usage", None) is not None:
            usage = chunk.usage

    message = SimpleNamespace(content="".join(content_parts), role="assistant")
    choice = SimpleNamespace(message=message, finish_reason="stop")
    return SimpleNamespace(choices=[choice], usage=usage)


@dataclass(frozen=True)
class Provider:
    name: str  # always "deepseek" — kept as a field for CallUsage/logging, not for branching
    client: AsyncOpenAI
    model: str
    temperature: float


@dataclass(frozen=True)
class CallUsage:
    tier: str
    provider: str
    model: str
    input_tokens: int | None
    output_tokens: int | None
    latency_ms: float


def deepseek_provider() -> Provider:
    return Provider("deepseek", get_deepseek_client(), settings.DEEPSEEK_MODEL, settings.DEEPSEEK_TEMPERATURE)


async def complete[T: BaseModel](
    provider: Provider,
    *,
    system_prompt: str,
    user_prompt: str,
    schema_model: type[BaseModel],
    parse_model: type[T],
    schema_name: str,
) -> tuple[T, CallUsage]:
    kwargs: dict = {
        "model": provider.model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": json_schema_response_format(schema_model, schema_name),
        "temperature": provider.temperature,
        "max_tokens": settings.AI_MAX_OUTPUT_TOKENS,
    }
    if settings.OPENROUTER_PROVIDERS:
        kwargs["extra_body"] = {"provider": {"order": settings.OPENROUTER_PROVIDERS}}

    start = time.monotonic()
    try:
        raw = await provider.client.chat.completions.create(**kwargs, stream=False)
        response = await _resolve_response(raw)
    except APIError as exc:
        raise AICallError(str(exc)) from exc

    record_ai_call(provider.name, provider.model, start, response.usage)
    latency_ms = (time.monotonic() - start) * 1000

    content = parse_json_content(response)
    try:
        result = parse_model.model_validate(content)
    except ValidationError as exc:
        raise AICallError(f"schema validation failed: {exc}") from exc

    usage = CallUsage(
        tier=provider.name,
        provider="openrouter",
        model=provider.model,
        input_tokens=getattr(response.usage, "prompt_tokens", None) if response.usage else None,
        output_tokens=getattr(response.usage, "completion_tokens", None) if response.usage else None,
        latency_ms=latency_ms,
    )
    return result, usage


async def embed(text: str) -> list[float]:
    start = time.monotonic()
    try:
        response = await get_embedding_client().embeddings.create(model=settings.EMBEDDING_MODEL, input=text)
    except APIError as exc:
        raise AICallError(str(exc)) from exc
    record_ai_call("embedding", settings.EMBEDDING_MODEL, start, response.usage)
    return list(response.data[0].embedding)


async def complete_json(provider: Provider, *, system_prompt: str, user_prompt: str) -> dict:
    kwargs: dict = {
        "model": provider.model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": provider.temperature,
        "max_tokens": settings.AI_MAX_OUTPUT_TOKENS,
    }
    if settings.OPENROUTER_PROVIDERS:
        kwargs["extra_body"] = {"provider": {"order": settings.OPENROUTER_PROVIDERS}}

    start = time.monotonic()
    try:
        raw = await provider.client.chat.completions.create(**kwargs, stream=False)
        response = await _resolve_response(raw)
    except APIError as exc:
        raise AICallError(str(exc)) from exc
    record_ai_call(provider.name, provider.model, start, response.usage)
    return parse_json_content(response)
