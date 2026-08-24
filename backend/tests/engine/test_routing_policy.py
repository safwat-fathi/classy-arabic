from app.engine.routing_policy import evaluate_postflight, evaluate_preflight


def test_no_escalation_when_all_clear():
    reason1 = evaluate_preflight(correction_count=0, text="عايز اطلب رز")
    reason2 = evaluate_postflight(confidence=0.9, threshold=0.7)
    assert reason1 is None
    assert reason2 is None


def test_escalates_on_low_confidence():
    reason = evaluate_postflight(confidence=0.5, threshold=0.7)
    assert reason == "confidence_below_threshold"


def test_escalates_on_ambiguous_fields():
    reason = evaluate_postflight(confidence=0.9, threshold=0.7, ambiguous_fields=["address"])
    assert reason == "ambiguous_fields_present"


def test_escalates_on_repeated_correction():
    reason = evaluate_preflight(correction_count=2, text="x")
    assert reason == "repeated_correction"


def test_escalates_on_reasoning_heavy_conditional():
    reason = evaluate_preflight(correction_count=0, text="لو السعر يزيد يبقى هغير الطلب")
    assert reason == "reasoning_heavy_content"


def test_short_single_question_does_not_escalate():
    # Regression: one "؟" in a short message must not trigger reasoning_heavy —
    # density (1 / len) blows past 0.02 for almost any short question, which
    # would flag most ordinary customer questions for review.
    reason = evaluate_preflight(correction_count=0, text="الاسعار كام؟")
    assert reason is None


def test_dense_multi_question_text_still_escalates():
    reason = evaluate_preflight(
        correction_count=0,
        text="عندي كذا سؤال: هل عندكوا مقاس لارج؟ هل في تفصيل مختلف؟ هل ممكن تبعتولي صورة تانية؟",
    )
    assert reason == "reasoning_heavy_content"


def test_lo_without_conditional_result_does_not_escalate():
    # Regression guard: "لو" alone is extremely common ordinary Egyptian
    # Arabic and must not trigger reasoning_heavy by itself — only paired
    # with a result marker (يبقى/بقى) does it signal actual conditional
    # reasoning, per spec §4 trigger 5's own example ("لو... يبقى...").
    reason = evaluate_preflight(correction_count=0, text="لو حبيت اطلب تاني هكلمك")
    assert reason is None
