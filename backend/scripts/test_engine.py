import asyncio
import sys

from app.core.config import settings
from app.engine.classification import classify_message
from app.engine.context_budget import build_context_prompt
from app.engine.extraction import extract_order
from app.engine.tier0_rules import match_tier0


async def test_raw_message(text: str):
    print("\n" + "=" * 60)
    print(f"📥 Testing Raw Message: '{text}'")
    print("=" * 60)

    # 1. Tier 0 Rule Check
    tier0_intent = match_tier0(text)
    if tier0_intent:
        print("⚡ [Tier 0 Short-Circuit Rule]")
        print(f"   Intent: {tier0_intent}")
        print("   Model Tier: RULE")
        print("=" * 60 + "\n")
        return

    # Build the prompt the same way app.engine.pipeline.process_message does
    # (fresh conversation: no history, empty slots) so this script exercises
    # the same model input the real HTTP pipeline sends, not a bare string.
    prompt, _overflowed = build_context_prompt(
        history=[],
        slots={},
        current_text=text,
        max_turns=settings.CONTEXT_HISTORY_TURNS,
        token_budget=settings.NILECHAT_CONTEXT_TOKEN_BUDGET,
    )

    # 2. Tier 1 / Tier 2 Classification
    print("🤖 [AI Classification Step]")
    intents = ["greeting", "spam", "reaction", "purchase_intent", "question", "other"]
    classification, tier, reason, _usage = await classify_message(
        prompt=prompt,
        known_intents=intents,
        threshold=0.7,
        overflowed=_overflowed,
        correction_count=0,
        text=text,
    )
    print(f"   Intent     : {classification.intent}")
    print(f"   Confidence : {classification.confidence:.2f}")
    print(f"   Tier Used  : {tier}")
    if reason:
        print(f"   Escalation : {reason}")

    # 3. Extraction (if purchase intent)
    if classification.intent == "purchase_intent":
        print("\n📦 [Order Extraction Step]")
        extraction, ext_tier, ext_reason, _ext_usage = await extract_order(
            prompt=prompt,
            threshold=0.7,
            overflowed=_overflowed,
            correction_count=0,
            text=text,
        )
        print(f"   Line Items       : {extraction.line_items}")
        print(f"   Address          : {extraction.address}")
        print(f"   Phone            : {extraction.phone}")
        print(f"   Payment Method   : {extraction.payment_method}")
        print(f"   Ambiguous Fields : {extraction.ambiguous_fields}")
        print(f"   Confidence       : {extraction.confidence:.2f}")
        print(f"   Tier Used        : {ext_tier}")
        if ext_reason:
            print(f"   Escalation       : {ext_reason}")

    print("=" * 60 + "\n")


if __name__ == "__main__":
    message = (
        sys.argv[1]
        if len(sys.argv) > 1
        else "عايز اطلب فستان صيفي مقاس لارج ابيض على المعادي ورقمي 01012345678 هدفع كاش"
    )
    asyncio.run(test_raw_message(message))
