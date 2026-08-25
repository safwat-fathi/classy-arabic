from twilio.request_validator import RequestValidator

from app.core.config import settings
from app.domains.channels.schemas import ParsedInboundMessage
from app.models import Channel


def verify_twilio_signature(params: dict, signature_header: str | None) -> bool:
    if not settings.TWILIO_AUTH_TOKEN or not signature_header:
        return False
    validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
    return validator.validate(settings.TWILIO_WEBHOOK_URL, params, signature_header)


def parse_twilio_payload(params: dict) -> ParsedInboundMessage | None:
    body = params.get("Body")
    from_number = params.get("From")
    to_number = params.get("To")
    message_sid = params.get("MessageSid")
    if not body or not from_number or not to_number or not message_sid:
        return None

    return ParsedInboundMessage(
        channel=Channel.WHATSAPP,
        external_account_id=to_number,
        external_customer_id=from_number,
        external_message_id=message_sid,
        text=body,
    )
