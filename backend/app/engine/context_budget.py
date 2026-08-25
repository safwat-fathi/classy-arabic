import json

from app.models.enums import Direction


def build_context_prompt(
    history: list,
    slots: dict,
    current_text: str,
    max_turns: int,
    examples: list | None = None,
    mode: str = "intent",
) -> str:
    recent = history[-max_turns:]
    lines = []

    if examples:
        lines.append("examples:")
        for ex in examples:
            if mode == "extraction":
                # Ensure the extraction JSON is formatted compactly if it exists
                ext_str = json.dumps(ex.extraction, ensure_ascii=False) if ex.extraction else "{}"
                lines.append(f"- customer: {ex.normalized_text} -> extraction: {ext_str}")
            elif mode == "action":
                action_str = json.dumps(ex.action, ensure_ascii=False) if hasattr(ex, "action") and ex.action else "{}"
                lines.append(f"- customer: {ex.normalized_text} -> action: {action_str}")
            else:
                lines.append(f"- customer: {ex.normalized_text} -> intent: {ex.intent}")
        lines.append("")

    lines.append(f"slots: {json.dumps(slots, ensure_ascii=False)}")
    for msg in recent:
        speaker = "customer" if msg.direction == Direction.INBOUND else "merchant"
        lines.append(f"{speaker}: {msg.normalized_text or msg.raw_text or ''}")
    if mode == "extraction":
        current_line = f"customer: {current_text} -> extraction:"
    elif mode == "action":
        current_line = f"customer: {current_text} -> action:"
    else:
        current_line = f"customer: {current_text} -> intent:"
    lines.append(current_line)
    return "\n".join(lines)
