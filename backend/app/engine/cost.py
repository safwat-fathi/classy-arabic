"""Per-model cost-per-1k-tokens rate table. Empty by default — estimate_cost
returns None until real provider pricing is filled in here. Deliberately not
guessing at numbers: a wrong estimated_cost is worse than an absent one for
a field whose stated purpose (SRD §32) is unit-economics tracking."""

# model name -> (input $ / 1k tokens, output $ / 1k tokens)
_COST_PER_1K_TOKENS: dict[str, tuple[float, float]] = {}


def estimate_cost(model: str, input_tokens: int | None, output_tokens: int | None) -> float | None:
    rates = _COST_PER_1K_TOKENS.get(model)
    if rates is None or input_tokens is None or output_tokens is None:
        return None
    input_rate, output_rate = rates
    return (input_tokens / 1000) * input_rate + (output_tokens / 1000) * output_rate
