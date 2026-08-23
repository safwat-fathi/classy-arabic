import time
from typing import Any, Literal, cast

import openai
from pydantic import BaseModel, Field, ValidationError, create_model

from app.core.config import settings
from app.engine.clients import AICallError, get_deepseek_client, get_nilechat_client, parse_json_content, record_ai_call
from app.engine.routing_policy import evaluate_postflight, evaluate_preflight
from app.engine.schemas import IntentClassification, json_schema_response_format

CLASSIFICATION_SYSTEM_PROMPT = (
    "You classify customer messages into an intent label. Respond only with json "
    "matching the schema. Known intents so far: {known_intents}."
)


def _intent_response_schema(known_intents: list[str]) -> type[BaseModel]:
    # A plain `str` field only constrains JSON *shape*, not its value — a
    # model can (and, against a weak/quantized local model, reliably will)
    # emit a value outside `known_intents` despite prompt instructions
    # saying not to. Building the JSON schema with a `Literal` of the exact
    # known intents makes grammar-constrained decoding physically unable to
    # produce anything else, independent of how well the model follows
    # instructions. Parsing/validation still goes through the static
    # `IntentClassification` model (keeps its `normalize_confidence`
    # validator) — this dynamic model only shapes what gets sent upstream.
    return create_model(
        "IntentClassification",
        intent=(cast(Any, Literal)[tuple(known_intents)], ...),
        confidence=(float, Field(ge=0.0, le=1.0)),
    )


async def _call(
    client, model: str, prompt: str, known_intents: list[str], tier: str, *, temperature: float | None = None
) -> IntentClassification:
    start = time.monotonic()
    kwargs = {
        "model": model,
        "messages": [
            {"role": "system", "content": CLASSIFICATION_SYSTEM_PROMPT.format(known_intents=", ".join(known_intents))},
            {"role": "user", "content": prompt},
        ],
        "response_format": json_schema_response_format(_intent_response_schema(known_intents), "intent_classification"),
    }
    if temperature is not None:
        kwargs["temperature"] = temperature
    try:
        response = await client.chat.completions.create(**kwargs)
    except openai.APIError as exc:
        raise AICallError(f"{tier} call failed: {exc}") from exc
    record_ai_call(tier, model, start, response.usage)
    raw = parse_json_content(response)
    try:
        return IntentClassification.model_validate(raw)
    except ValidationError as exc:
        raise AICallError(f"{tier} response failed validation: {exc}") from exc


async def classify_message(
    prompt: str, known_intents: list[str], threshold: float, overflowed: bool, correction_count: int, text: str
) -> tuple[IntentClassification, str, str | None]:
    preflight_reason = evaluate_preflight(text=text, overflowed=overflowed, correction_count=correction_count)
    if preflight_reason:
        result = await _call(
            get_deepseek_client(),
            settings.DEEPSEEK_MODEL,
            prompt,
            known_intents,
            "escalated",
            temperature=settings.DEEPSEEK_TEMPERATURE,
        )
        return result, "escalated", preflight_reason

    result = await _call(
        get_nilechat_client(),
        settings.NILECHAT_MODEL,
        prompt,
        known_intents,
        "nilechat",
        temperature=settings.NILECHAT_TEMPERATURE,
    )
    postflight_reason = evaluate_postflight(confidence=result.confidence, threshold=threshold)
    if postflight_reason:
        result = await _call(
            get_deepseek_client(),
            settings.DEEPSEEK_MODEL,
            prompt,
            known_intents,
            "escalated",
            temperature=settings.DEEPSEEK_TEMPERATURE,
        )
        return result, "escalated", postflight_reason
    return result, "nilechat", None
