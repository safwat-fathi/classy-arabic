import json
import time

from app.core.config import settings
from app.engine.clients import get_deepseek_client, get_nilechat_client, record_ai_call
from app.engine.routing_policy import check_confidence_threshold
from app.engine.schemas import IntentClassification, json_schema_response_format

CLASSIFICATION_SYSTEM_PROMPT = (
    "You classify customer messages into an intent label. Respond only with json "
    "matching the schema. Known intents so far: {known_intents}. "
    "If none fit, propose a short new snake_case intent label."
)


async def _call(client, model: str, prompt: str, known_intents: list[str], tier: str) -> IntentClassification:
    start = time.monotonic()
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": CLASSIFICATION_SYSTEM_PROMPT.format(known_intents=", ".join(known_intents))},
            {"role": "user", "content": prompt},
        ],
        response_format=json_schema_response_format(IntentClassification, "intent_classification"),
    )
    record_ai_call(tier, model, start, response.usage)
    raw = json.loads(response.choices[0].message.content)
    return IntentClassification.model_validate(raw)


async def classify_message(
    prompt: str, known_intents: list[str], threshold: float
) -> tuple[IntentClassification, str, str | None]:
    result = await _call(get_nilechat_client(), settings.NILECHAT_MODEL, prompt, known_intents, "nilechat")
    reason = check_confidence_threshold(result.confidence, threshold)
    if reason:
        result = await _call(get_deepseek_client(), settings.DEEPSEEK_MODEL, prompt, known_intents, "escalated")
        return result, "escalated", reason
    return result, "nilechat", None
