from dataclasses import dataclass

from app.models import Channel


@dataclass
class ParsedInboundMessage:
    channel: Channel
    external_account_id: str
    external_customer_id: str
    external_message_id: str
    text: str
