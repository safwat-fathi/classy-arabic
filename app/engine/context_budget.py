import json

from app.models.enums import Direction

# Conservative chars-per-token estimate for Arabic-heavy text — no local
# tokenizer for NileChat is loaded in this service, so this deliberately
# overestimates token count (safe: trims more than strictly necessary,
# never underestimates and lets a prompt silently overflow).
CHARS_PER_TOKEN_ESTIMATE = 3


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // CHARS_PER_TOKEN_ESTIMATE)


def build_context_prompt(
    history: list,
    slots: dict,
    current_text: str,
    max_turns: int,
    token_budget: int,
) -> tuple[str, bool]:
    recent = history[-max_turns:]
    lines = []
    for msg in recent:
        speaker = "customer" if msg.direction == Direction.INBOUND else "merchant"
        lines.append(f"{speaker}: {msg.normalized_text or msg.raw_text or ''}")
    slots_line = f"slots: {json.dumps(slots, ensure_ascii=False)}"
    current_line = f"customer: {current_text}"
    prompt = "\n".join([slots_line, *lines, current_line])
    overflowed = estimate_tokens(prompt) > token_budget
    return prompt, overflowed
