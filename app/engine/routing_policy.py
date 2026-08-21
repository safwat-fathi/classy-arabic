CONDITIONAL_MARKERS = ("لو", "يبقى", "اذا", "إذا")
REASONING_LENGTH_THRESHOLD = 300
QUESTION_MARK_DENSITY_THRESHOLD = 0.02


def check_confidence_threshold(confidence: float, threshold: float) -> str | None:
    if confidence < threshold:
        return "confidence_below_threshold"
    return None


def check_ambiguous_fields(ambiguous_fields: list[str]) -> str | None:
    if ambiguous_fields:
        return "ambiguous_fields_present"
    return None


def check_context_overflow(overflowed: bool) -> str | None:
    if overflowed:
        return "context_budget_overflow"
    return None


def check_repeated_correction(correction_count: int) -> str | None:
    if correction_count >= 2:
        return "repeated_correction"
    return None


def check_reasoning_heavy(text: str) -> str | None:
    question_marks = text.count("?") + text.count("؟")
    density = question_marks / max(1, len(text))
    has_conditional = any(marker in text for marker in CONDITIONAL_MARKERS)
    if len(text) > REASONING_LENGTH_THRESHOLD or density > QUESTION_MARK_DENSITY_THRESHOLD or has_conditional:
        return "reasoning_heavy_content"
    return None


def evaluate_escalation(
    *,
    confidence: float,
    threshold: float,
    ambiguous_fields: list[str] | None = None,
    overflowed: bool = False,
    correction_count: int = 0,
    text: str = "",
) -> str | None:
    checks = [
        check_confidence_threshold(confidence, threshold),
        check_ambiguous_fields(ambiguous_fields or []),
        check_context_overflow(overflowed),
        check_repeated_correction(correction_count),
        check_reasoning_heavy(text),
    ]
    for reason in checks:
        if reason:
            return reason
    return None
