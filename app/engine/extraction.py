import json
import time

from app.core.config import settings
from app.engine.clients import get_deepseek_client, get_nilechat_client, record_ai_call
from app.engine.routing_policy import evaluate_escalation
from app.engine.schemas import ExtractionResult, json_schema_response_format

EXTRACTION_SYSTEM_PROMPT = (
    "Extract order details as json matching the schema: line_items, address, phone, "
    "payment_method, ambiguous_fields (list any field you are not sure about), confidence."
)


async def _call(client, model: str, prompt: str, tier: str) -> ExtractionResult:
    start = time.monotonic()
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        response_format=json_schema_response_format(ExtractionResult, "order_extraction"),
    )
    record_ai_call(tier, model, start, response.usage)
    raw = json.loads(response.choices[0].message.content)
    return ExtractionResult.model_validate(raw)


async def extract_order(
    prompt: str, threshold: float, overflowed: bool, correction_count: int
) -> tuple[ExtractionResult, str, str | None]:
    result = await _call(get_nilechat_client(), settings.NILECHAT_MODEL, prompt, "nilechat")
    reason = evaluate_escalation(
        confidence=result.confidence,
        threshold=threshold,
        ambiguous_fields=result.ambiguous_fields,
        overflowed=overflowed,
        correction_count=correction_count,
    )
    if reason:
        result = await _call(get_deepseek_client(), settings.DEEPSEEK_MODEL, prompt, "escalated")
        return result, "escalated", reason
    return result, "nilechat", None
