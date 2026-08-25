from twilio.request_validator import RequestValidator

from app.core.config import settings
from app.domains.channels.twilio_whatsapp import parse_twilio_payload, verify_twilio_signature
from app.models import Channel

_PARAMS = {
    "MessageSid": "SM111",
    "From": "whatsapp:+201234567890",
    "To": "whatsapp:+14155238886",
    "Body": "hello",
    "ProfileName": "Test Customer",
    "NumMedia": "0",
}


def test_verify_twilio_signature_accepts_valid_signature(monkeypatch):
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "test-auth-token")
    monkeypatch.setattr(settings, "TWILIO_WEBHOOK_URL", "https://api.example.com/webhooks/whatsapp/twilio")
    validator = RequestValidator("test-auth-token")
    signature = validator.compute_signature(settings.TWILIO_WEBHOOK_URL, _PARAMS)

    assert verify_twilio_signature(_PARAMS, signature) is True


def test_verify_twilio_signature_rejects_wrong_signature(monkeypatch):
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "test-auth-token")
    monkeypatch.setattr(settings, "TWILIO_WEBHOOK_URL", "https://api.example.com/webhooks/whatsapp/twilio")

    assert verify_twilio_signature(_PARAMS, "not-a-real-signature") is False


def test_verify_twilio_signature_rejects_when_secret_unset(monkeypatch):
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "")
    monkeypatch.setattr(settings, "TWILIO_WEBHOOK_URL", "https://api.example.com/webhooks/whatsapp/twilio")
    validator = RequestValidator("test-auth-token")
    signature = validator.compute_signature(settings.TWILIO_WEBHOOK_URL, _PARAMS)

    assert verify_twilio_signature(_PARAMS, signature) is False


def test_verify_twilio_signature_rejects_missing_header(monkeypatch):
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "test-auth-token")
    monkeypatch.setattr(settings, "TWILIO_WEBHOOK_URL", "https://api.example.com/webhooks/whatsapp/twilio")

    assert verify_twilio_signature(_PARAMS, None) is False


def test_parse_twilio_payload_extracts_inbound_message():
    parsed = parse_twilio_payload(_PARAMS)

    assert parsed is not None
    assert parsed.channel == Channel.WHATSAPP
    assert parsed.external_account_id == "whatsapp:+14155238886"
    assert parsed.external_customer_id == "whatsapp:+201234567890"
    assert parsed.external_message_id == "SM111"
    assert parsed.text == "hello"


def test_parse_twilio_payload_drops_media_only_messages_with_no_body():
    params = dict(_PARAMS)
    params["Body"] = ""
    params["NumMedia"] = "1"

    assert parse_twilio_payload(params) is None


def test_parse_twilio_payload_returns_none_for_incomplete_params():
    assert parse_twilio_payload({"Body": "hello"}) is None
