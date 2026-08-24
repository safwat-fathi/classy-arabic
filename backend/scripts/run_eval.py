"""Manual evaluation runner — NOT part of `make test` / CI. Hits the real
configured DEEPSEEK_MODEL via OPENROUTER_BASE_URL, so it costs real
latency/money and requires OpenRouter to be reachable. Run after any change
to tier0_rules, routing_policy, classification, or prompts.

Usage: PYTHONPATH=. .venv/bin/python scripts/run_eval.py
"""

import asyncio
import json
from pathlib import Path

from app.core.config import settings
from app.engine.classification import classify_message
from app.engine.context_budget import build_context_prompt
from app.engine.tier0_rules import match_tier0
from app.models.enums import ConvState

FIXTURES_PATH = Path(__file__).parent.parent / "eval" / "fixtures.json"
KNOWN_INTENTS = ["greeting", "spam", "reaction", "purchase_intent", "question", "other"]


async def run_case(case: dict) -> tuple[bool, str]:
    text = case["input"]
    tier0_intent = match_tier0(text)
    if tier0_intent is not None:
        ok = case["expected_reason"] is None and tier0_intent == case["expected_intent"]
        return ok, f"tier0 -> intent={tier0_intent!r}"

    prompt = build_context_prompt(
        history=[],
        slots={},
        current_text=text,
        max_turns=settings.CONTEXT_HISTORY_TURNS,
    )
    classification, reason, _usage = await classify_message(
        prompt,
        KNOWN_INTENTS,
        settings.CLASSIFICATION_CONFIDENCE_THRESHOLD,
        correction_count=0,
        text=text,
        merchant_name="Eval Merchant",
        conv_state=ConvState.GATHERING,
        slots={},
    )

    reason_ok = reason == case["expected_reason"]
    intent_ok = case["expected_intent"] is None or classification.intent == case["expected_intent"]
    detail = f"intent={classification.intent!r}"
    if reason:
        detail += f", reason={reason!r}"
    return reason_ok and intent_ok, detail


async def main() -> None:
    cases = json.loads(FIXTURES_PATH.read_text())
    passed = 0
    for case in cases:
        try:
            ok, detail = await run_case(case)
        except Exception as exc:
            print(f"[ERROR] {case['id']}: {type(exc).__name__}: {exc}")
            continue
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] {case['id']}: {detail}")
        passed += ok

    print(f"\n{passed}/{len(cases)} passed ({passed / len(cases):.0%})")


if __name__ == "__main__":
    asyncio.run(main())
