from app.engine.gateway import CallUsage, complete, deepseek_provider
from app.engine.prompts import EXTRACTION_TASK_BLOCK, build_system_prompt
from app.engine.routing_policy import evaluate_postflight, evaluate_preflight
from app.engine.schemas import ExtractionResult
from app.models.enums import ConvState


async def extract_order(
    prompt: str,
    threshold: float,
    correction_count: int,
    text: str,
    merchant_name: str,
    conv_state: ConvState,
    slots: dict,
) -> tuple[ExtractionResult, str | None, CallUsage]:
    system_prompt = build_system_prompt(
        task_block=EXTRACTION_TASK_BLOCK,
        merchant_name=merchant_name,
        conv_state=conv_state,
        slots=slots,
    )
    result, usage = await complete(
        deepseek_provider(),
        system_prompt=system_prompt,
        user_prompt=prompt,
        schema_model=ExtractionResult,
        parse_model=ExtractionResult,
        schema_name="order_extraction",
    )

    reason = evaluate_preflight(text=text, correction_count=correction_count) or evaluate_postflight(
        confidence=result.confidence, threshold=threshold, ambiguous_fields=result.ambiguous_fields
    )
    return result, reason, usage
