from typing import Any, Literal, cast

from pydantic import BaseModel, Field, create_model

from app.engine.gateway import CallUsage, complete, escalated_provider, nilechat_provider
from app.engine.routing_policy import evaluate_postflight, evaluate_preflight
from app.engine.schemas import IntentClassification

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


async def classify_message(
    prompt: str, known_intents: list[str], threshold: float, overflowed: bool, correction_count: int, text: str
) -> tuple[IntentClassification, str, str | None, CallUsage | None]:
    system_prompt = CLASSIFICATION_SYSTEM_PROMPT.format(known_intents=", ".join(known_intents))
    schema_model = _intent_response_schema(known_intents)

    preflight_reason = evaluate_preflight(text=text, overflowed=overflowed, correction_count=correction_count)
    if preflight_reason:
        result, usage = await complete(
            escalated_provider(),
            system_prompt=system_prompt,
            user_prompt=prompt,
            schema_model=schema_model,
            parse_model=IntentClassification,
            schema_name="intent_classification",
        )
        return result, "escalated", preflight_reason, usage

    result, usage = await complete(
        nilechat_provider(),
        system_prompt=system_prompt,
        user_prompt=prompt,
        schema_model=schema_model,
        parse_model=IntentClassification,
        schema_name="intent_classification",
    )
    postflight_reason = evaluate_postflight(confidence=result.confidence, threshold=threshold)
    if postflight_reason:
        result, usage = await complete(
            escalated_provider(),
            system_prompt=system_prompt,
            user_prompt=prompt,
            schema_model=schema_model,
            parse_model=IntentClassification,
            schema_name="intent_classification",
        )
        return result, "escalated", postflight_reason, usage
    return result, "nilechat", None, usage
