from app.engine.routing_policy import evaluate_escalation


def test_no_escalation_when_all_clear():
    reason = evaluate_escalation(confidence=0.9, threshold=0.7, text="عايز اطلب رز")
    assert reason is None


def test_escalates_on_low_confidence():
    reason = evaluate_escalation(confidence=0.5, threshold=0.7, text="عايز اطلب")
    assert reason == "confidence_below_threshold"


def test_escalates_on_ambiguous_fields():
    reason = evaluate_escalation(confidence=0.9, threshold=0.7, ambiguous_fields=["address"], text="x")
    assert reason == "ambiguous_fields_present"


def test_escalates_on_context_overflow():
    reason = evaluate_escalation(confidence=0.9, threshold=0.7, overflowed=True, text="x")
    assert reason == "context_budget_overflow"


def test_escalates_on_repeated_correction():
    reason = evaluate_escalation(confidence=0.9, threshold=0.7, correction_count=2, text="x")
    assert reason == "repeated_correction"


def test_escalates_on_reasoning_heavy_conditional():
    reason = evaluate_escalation(confidence=0.9, threshold=0.7, text="لو السعر يزيد يبقى هغير الطلب")
    assert reason == "reasoning_heavy_content"
