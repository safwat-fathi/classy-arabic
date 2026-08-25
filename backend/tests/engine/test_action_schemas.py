import pytest
from pydantic import ValidationError

from app.engine.schemas import ProposedActionEnvelope


def test_parses_add_to_cart_envelope():
    raw = '{"action": "add_to_cart", "product_id": "p1", "quantity": 2, "confidence": 0.9}'
    envelope = ProposedActionEnvelope.model_validate_json(raw)
    assert envelope.root.action == "add_to_cart"
    assert envelope.root.product_id == "p1"
    assert envelope.root.quantity == 2


def test_rejects_unknown_action():
    raw = '{"action": "delete_everything", "confidence": 0.9}'
    with pytest.raises(ValidationError):
        ProposedActionEnvelope.model_validate_json(raw)


def test_confidence_normalizes_over_one():
    raw = '{"action": "get_checkout_state", "confidence": 90}'
    envelope = ProposedActionEnvelope.model_validate_json(raw)
    assert envelope.root.confidence == 0.9


def test_add_to_cart_rejects_nonpositive_quantity():
    raw = '{"action": "add_to_cart", "product_id": "p1", "quantity": 0, "confidence": 0.9}'
    with pytest.raises(ValidationError):
        ProposedActionEnvelope.model_validate_json(raw)


def test_search_products_rejects_empty_query():
    raw = '{"action": "search_products", "query": "", "confidence": 0.9}'
    with pytest.raises(ValidationError):
        ProposedActionEnvelope.model_validate_json(raw)
