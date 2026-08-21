from app.engine.schemas import ExtractionResult, IntentClassification, json_schema_response_format


def test_intent_classification_round_trips():
    parsed = IntentClassification.model_validate({"intent": "greeting", "confidence": 0.95})
    assert parsed.intent == "greeting"
    assert parsed.confidence == 0.95


def test_extraction_result_defaults():
    parsed = ExtractionResult.model_validate({"confidence": 0.8})
    assert parsed.line_items == []
    assert parsed.ambiguous_fields == []


def test_json_schema_response_format_shape():
    fmt = json_schema_response_format(IntentClassification, "intent_classification")
    assert fmt["type"] == "json_schema"
    assert fmt["json_schema"]["name"] == "intent_classification"
    assert "properties" in fmt["json_schema"]["schema"]
