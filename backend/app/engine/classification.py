from typing import Any, Literal, cast

from pydantic import BaseModel, Field, create_model

from app.engine.gateway import CallUsage, complete, deepseek_provider
from app.engine.prompts import CLASSIFICATION_TASK_BLOCK, build_system_prompt
from app.engine.routing_policy import evaluate_postflight, evaluate_preflight
from app.engine.schemas import IntentClassification
from app.models.enums import ConvState


def _intent_response_schema(known_intents: list[str]) -> type[BaseModel]:
    # A plain `str` field only constrains JSON *shape*, not its value — a
    # model can still emit a value outside `known_intents` despite prompt
    # instructions saying not to. Building the JSON schema with a `Literal`
    # of the exact known intents makes grammar-constrained decoding
    # physically unable to produce anything else, independent of how
    # reliably the model follows instructions. Parsing/validation still
    # goes through the static `IntentClassification` model (keeps its
    # `normalize_confidence` validator) — this dynamic model only shapes
    # what gets sent upstream.
    return create_model(
        "IntentClassification",
        intent=(cast(Any, Literal)[tuple(known_intents)], ...),
        confidence=(float, Field(ge=0.0, le=1.0)),
    )


async def classify_message(
    prompt: str,
    known_intents: list[str],
    threshold: float,
    correction_count: int,
    text: str,
    merchant_name: str,
    conv_state: ConvState,
    slots: dict,
) -> tuple[IntentClassification, str | None, CallUsage]:
    system_prompt = build_system_prompt(
        task_block=CLASSIFICATION_TASK_BLOCK.format(known_intents=", ".join(known_intents)),
        merchant_name=merchant_name,
        conv_state=conv_state,
        slots=slots,
    )
    schema_model = _intent_response_schema(known_intents)

    result, usage = await complete(
        deepseek_provider(),
        system_prompt=system_prompt,
        user_prompt=prompt,
        schema_model=schema_model,
        parse_model=IntentClassification,
        schema_name="intent_classification",
    )

    reason = evaluate_preflight(text=text, correction_count=correction_count) or evaluate_postflight(
        confidence=result.confidence, threshold=threshold
    )
    return result, reason, usage
