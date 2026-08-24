from app.engine.context_budget import build_context_prompt


class FakeMessage:
    def __init__(self, direction, text):
        self.direction = direction
        self.normalized_text = text
        self.raw_text = text


class FakeExample:
    def __init__(self, text, intent):
        self.normalized_text = text
        self.intent = intent


def test_build_context_prompt_includes_history_and_current():
    from app.models.enums import Direction

    history = [FakeMessage(Direction.INBOUND, "hi"), FakeMessage(Direction.OUTBOUND, "hello")]
    prompt = build_context_prompt(history=history, slots={}, current_text="عايز اطلب", max_turns=10)
    assert "عايز اطلب" in prompt
    assert "hi" in prompt


def test_build_context_prompt_includes_examples():
    # Regression: examples come from LabeledExample rows, which expose
    # `normalized_text` (not `message_text`) — reading the wrong attribute
    # raises AttributeError for every request once any example is retrieved.
    examples = [FakeExample("فستان صيفي بكام؟", "question")]
    prompt = build_context_prompt(history=[], slots={}, current_text="عايز اطلب", max_turns=10, examples=examples)
    assert "فستان صيفي بكام؟ -> intent: question" in prompt
