import time

import openai
from pydantic import ValidationError

from app.core.config import settings
from app.engine.clients import AICallError, get_deepseek_client, get_nilechat_client, parse_json_content, record_ai_call
from app.engine.routing_policy import evaluate_postflight, evaluate_preflight
from app.engine.schemas import ExtractionResult, json_schema_response_format

EXTRACTION_SYSTEM_PROMPT = (
    "Extract order details as json matching the schema: line_items, address, phone, "
    "payment_method, ambiguous_fields (list any field you are not sure about), confidence."
)


async def _call(client, model: str, prompt: str, tier: str, *, temperature: float | None = None) -> ExtractionResult:
    start = time.monotonic()
    kwargs = {
        "model": model,
        "messages": [
            {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "response_format": json_schema_response_format(ExtractionResult, "order_extraction"),
    }
    if temperature is not None:
        kwargs["temperature"] = temperature
    if tier == "escalated" and settings.OPENROUTER_PROVIDERS:
        kwargs["extra_body"] = {"provider": {"order": settings.OPENROUTER_PROVIDERS, "allow_fallbacks": True}}
    try:
        response = await client.chat.completions.create(**kwargs)
    except openai.APIError as exc:
        raise AICallError(f"{tier} call failed: {exc}") from exc
    record_ai_call(tier, model, start, response.usage)
    raw = parse_json_content(response)
    try:
        return ExtractionResult.model_validate(raw)
    except ValidationError as exc:
        raise AICallError(f"{tier} response failed validation: {exc}") from exc


async def extract_order(
    prompt: str, threshold: float, overflowed: bool, correction_count: int, text: str
) -> tuple[ExtractionResult, str, str | None]:
    preflight_reason = evaluate_preflight(text=text, overflowed=overflowed, correction_count=correction_count)
    if preflight_reason:
        result = await _call(
            get_deepseek_client(),
            settings.DEEPSEEK_MODEL,
            prompt,
            "escalated",
            temperature=settings.DEEPSEEK_TEMPERATURE,
        )
        return result, "escalated", preflight_reason

    result = await _call(
        get_nilechat_client(), settings.NILECHAT_MODEL, prompt, "nilechat", temperature=settings.NILECHAT_TEMPERATURE
    )
    postflight_reason = evaluate_postflight(
        confidence=result.confidence,
        threshold=threshold,
        ambiguous_fields=result.ambiguous_fields,
    )
    if postflight_reason:
        result = await _call(
            get_deepseek_client(),
            settings.DEEPSEEK_MODEL,
            prompt,
            "escalated",
            temperature=settings.DEEPSEEK_TEMPERATURE,
        )
        return result, "escalated", postflight_reason
    return result, "nilechat", None
