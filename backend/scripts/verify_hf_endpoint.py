"""Run once against a real NILECHAT_BASE_URL (e.g. a Hugging Face Inference
Endpoint) before switching production traffic to it. Confirms the endpoint
actually enforces response_format={"type": "json_schema", ...} as
constrained decoding, not just accepting-and-ignoring the field — TGI has
historically exposed guided generation through a separate `grammar` field
instead."""

import asyncio

from openai import AsyncOpenAI
from pydantic import BaseModel
from typing import Literal

from app.core.config import settings
from app.engine.schemas import json_schema_response_format


class _StrictAnswer(BaseModel):
    answer: Literal["yes", "no"]


async def main() -> None:
    client = AsyncOpenAI(base_url=settings.NILECHAT_BASE_URL, api_key=settings.NILECHAT_API_KEY)
    # Deliberately provoke an out-of-schema answer: a neutral/unknown prompt
    # that a model would naturally answer with something other than a bare
    # "yes"/"no" if the schema constraint weren't actually being enforced.
    response = await client.chat.completions.create(
        model=settings.NILECHAT_MODEL,
        messages=[
            {"role": "system", "content": "Answer strictly per the schema."},
            {"role": "user", "content": "What is the capital of France?"},
        ],
        response_format=json_schema_response_format(_StrictAnswer, "strict_answer"),
    )
    content = response.choices[0].message.content
    print(f"Raw response content: {content!r}")
    try:
        parsed = _StrictAnswer.model_validate_json(content)
        print(f"PASS: endpoint enforced the schema — parsed as {parsed.answer!r}")
    except Exception as exc:
        print(f"FAIL: endpoint did NOT enforce response_format as constrained decoding: {exc}")
        print(
            "Contingency: check whether this endpoint exposes TGI's separate `grammar` field "
            "instead of OpenAI's `response_format`, or fall back to prompt-only JSON instructions "
            "with tolerant parsing (already available via app.engine.clients.parse_json_content, "
            "which raises AICallError rather than crashing on malformed content)."
        )


if __name__ == "__main__":
    asyncio.run(main())
