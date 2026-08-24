from __future__ import annotations

import time
from dataclasses import dataclass

from openai import APIError, AsyncOpenAI
from pydantic import BaseModel, ValidationError

from app.core.config import settings
from app.engine.clients import (
    AICallError,
    get_deepseek_client,
    get_embedding_client,
    get_nilechat_client,
    parse_json_content,
    record_ai_call,
)
from app.engine.schemas import json_schema_response_format


@dataclass(frozen=True)
class Provider:
    name: str  # "nilechat" | "escalated" — matches the tier vocabulary already used throughout the engine
    client: AsyncOpenAI
    model: str
    temperature: float


def nilechat_provider() -> Provider:
    return Provider("nilechat", get_nilechat_client(), settings.NILECHAT_MODEL, settings.NILECHAT_TEMPERATURE)


def escalated_provider() -> Provider:
    return Provider("escalated", get_deepseek_client(), settings.DEEPSEEK_MODEL, settings.DEEPSEEK_TEMPERATURE)


async def complete[T: BaseModel](
    provider: Provider,
    *,
    system_prompt: str,
    user_prompt: str,
    schema_model: type[BaseModel],
    parse_model: type[T],
    schema_name: str,
) -> T:
    kwargs: dict = {
        "model": provider.model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": json_schema_response_format(schema_model, schema_name),
        "temperature": provider.temperature,
    }
    if provider.name == "escalated" and settings.OPENROUTER_PROVIDERS:
        kwargs["extra_body"] = {"provider": {"order": settings.OPENROUTER_PROVIDERS}}

    start = time.monotonic()
    try:
        response = await provider.client.chat.completions.create(**kwargs)
    except APIError as exc:
        raise AICallError(str(exc)) from exc

    record_ai_call(provider.name, provider.model, start, response.usage)

    content = parse_json_content(response)
    try:
        return parse_model.model_validate(content)
    except ValidationError as exc:
        raise AICallError(f"schema validation failed: {exc}") from exc


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
    }
    if provider.name == "escalated" and settings.OPENROUTER_PROVIDERS:
        kwargs["extra_body"] = {"provider": {"order": settings.OPENROUTER_PROVIDERS}}

    start = time.monotonic()
    try:
        response = await provider.client.chat.completions.create(**kwargs)
    except APIError as exc:
        raise AICallError(str(exc)) from exc
    record_ai_call(provider.name, provider.model, start, response.usage)
    return parse_json_content(response)
