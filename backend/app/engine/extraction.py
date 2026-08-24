from app.engine.gateway import CallUsage, complete, escalated_provider, nilechat_provider
from app.engine.routing_policy import evaluate_postflight, evaluate_preflight
from app.engine.schemas import ExtractionResult

EXTRACTION_SYSTEM_PROMPT = (
    "Extract order details as json matching the schema: line_items, address, phone, "
    "payment_method, ambiguous_fields (list any field you are not sure about), confidence."
)


async def extract_order(
    prompt: str, threshold: float, overflowed: bool, correction_count: int, text: str
) -> tuple[ExtractionResult, str, str | None, CallUsage | None]:
    preflight_reason = evaluate_preflight(text=text, overflowed=overflowed, correction_count=correction_count)
    if preflight_reason:
        result, usage = await complete(
            escalated_provider(),
            system_prompt=EXTRACTION_SYSTEM_PROMPT,
            user_prompt=prompt,
            schema_model=ExtractionResult,
            parse_model=ExtractionResult,
            schema_name="order_extraction",
        )
        return result, "escalated", preflight_reason, usage

    result, usage = await complete(
        nilechat_provider(),
        system_prompt=EXTRACTION_SYSTEM_PROMPT,
        user_prompt=prompt,
        schema_model=ExtractionResult,
        parse_model=ExtractionResult,
        schema_name="order_extraction",
    )
    postflight_reason = evaluate_postflight(
        confidence=result.confidence,
        threshold=threshold,
        ambiguous_fields=result.ambiguous_fields,
    )
    if postflight_reason:
        result, usage = await complete(
            escalated_provider(),
            system_prompt=EXTRACTION_SYSTEM_PROMPT,
            user_prompt=prompt,
            schema_model=ExtractionResult,
            parse_model=ExtractionResult,
            schema_name="order_extraction",
        )
        return result, "escalated", postflight_reason, usage
    return result, "nilechat", None, usage
