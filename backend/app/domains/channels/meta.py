import hashlib
import hmac

from app.core.config import settings
from app.domains.channels.schemas import ParsedInboundMessage
from app.models import Channel

_OBJECT_TO_CHANNEL = {
    "page": Channel.FACEBOOK,
    "instagram": Channel.INSTAGRAM,
}


def verify_meta_signature(raw_body: bytes, signature_header: str | None) -> bool:
    if not settings.META_APP_SECRET or not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(settings.META_APP_SECRET.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    provided = signature_header.removeprefix("sha256=")
    return hmac.compare_digest(expected, provided)


def parse_meta_payload(payload: dict) -> list[ParsedInboundMessage]:
    channel = _OBJECT_TO_CHANNEL.get(payload.get("object"))
    if channel is None:
        return []

    parsed: list[ParsedInboundMessage] = []
    for entry in payload.get("entry", []):
        page_id = entry.get("id")
        for event in entry.get("messaging", []):
            message = event.get("message")
            if not message or message.get("is_echo"):
                continue
            text = message.get("text")
            if not text:
                continue
            parsed.append(
                ParsedInboundMessage(
                    channel=channel,
                    external_account_id=page_id,
                    external_customer_id=event["sender"]["id"],
                    external_message_id=message["mid"],
                    text=text,
                )
            )
    return parsed
