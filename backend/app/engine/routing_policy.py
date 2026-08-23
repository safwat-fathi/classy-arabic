CONDITIONAL_MARKERS = ("لو", "يبقى", "اذا", "إذا")
REASONING_LENGTH_THRESHOLD = 300
QUESTION_MARK_DENSITY_THRESHOLD = 0.02
# Density alone is meaningless on short text: a single "?" in an 8-char message
# ("بكام ده؟") already exceeds 0.02, which would send every short customer
# question straight to tier 2 — the opposite of spec §4's "small minority of
# traffic" goal. Only apply the density check once there's enough text for it
# to mean something (multiple/rapid-fire questions), not a single ordinary one.
DENSITY_CHECK_MIN_LENGTH = 60


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
    density_heavy = len(text) >= DENSITY_CHECK_MIN_LENGTH and density > QUESTION_MARK_DENSITY_THRESHOLD
    words = "".join(c if c.isalnum() else " " for c in text).split()
    has_conditional = any(marker in words for marker in CONDITIONAL_MARKERS)
    if len(text) > REASONING_LENGTH_THRESHOLD or density_heavy or has_conditional:
        return "reasoning_heavy_content"
    return None


def evaluate_preflight(*, text: str, overflowed: bool, correction_count: int) -> str | None:
    """Triggers knowable before any model call — route straight to tier 2."""
    for reason in (
        check_context_overflow(overflowed),
        check_repeated_correction(correction_count),
        check_reasoning_heavy(text),
    ):
        if reason:
            return reason
    return None


def evaluate_postflight(
    *, confidence: float, threshold: float, ambiguous_fields: list[str] | None = None
) -> str | None:
    """Triggers only knowable from tier-1 output — re-run on tier 2."""
    for reason in (check_confidence_threshold(confidence, threshold),):
        if reason:
            return reason
    return None
