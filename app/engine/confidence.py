def get_confidence(structured_output: dict) -> float:
    """Confidence is self-reported by the model as part of the constrained
    JSON output (not logprob-derived). Isolated here so swapping to a
    logprob-based measure later is a one-function change."""
    return float(structured_output.get("confidence", 0.0))
