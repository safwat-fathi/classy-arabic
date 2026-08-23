import json

from app.models.enums import Direction

# Conservative chars-per-token estimate for Arabic-heavy text — no local
# tokenizer for NileChat is loaded in this service, so this deliberately
# overestimates token count (safe: a smaller constant produces a larger
# token estimate, ensuring we never underestimate and let a prompt silently overflow).
CHARS_PER_TOKEN_ESTIMATE = 2


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // CHARS_PER_TOKEN_ESTIMATE)


def build_context_prompt(
    history: list,
    slots: dict,
    current_text: str,
    max_turns: int,
    token_budget: int,
    examples: list | None = None,
    mode: str = "intent",
) -> tuple[str, bool]:
    recent = history[-max_turns:]
    lines = []

    if examples:
        lines.append("examples:")
        for ex in examples:
            if mode == "extraction":
                # Ensure the extraction JSON is formatted compactly if it exists
                ext_str = json.dumps(ex.extraction, ensure_ascii=False) if ex.extraction else "{}"
                lines.append(f"- customer: {ex.normalized_text} -> extraction: {ext_str}")
            else:
                lines.append(f"- customer: {ex.normalized_text} -> intent: {ex.intent}")
        lines.append("")

    lines.append(f"slots: {json.dumps(slots, ensure_ascii=False)}")
    for msg in recent:
        speaker = "customer" if msg.direction == Direction.INBOUND else "merchant"
        lines.append(f"{speaker}: {msg.normalized_text or msg.raw_text or ''}")
    if mode == "extraction":
        current_line = f"customer: {current_text} -> extraction:"
    else:
        current_line = f"customer: {current_text} -> intent:"
    lines.append(current_line)
    prompt = "\n".join(lines)
    overflowed = estimate_tokens(prompt) > token_budget
    return prompt, overflowed
