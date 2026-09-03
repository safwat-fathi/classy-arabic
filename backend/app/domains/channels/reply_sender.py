import logging

import httpx

_SEND_API_URL = "https://graph.facebook.com/v21.0/me/messages"
_HTTP_TIMEOUT_SECONDS = 10.0

logger = logging.getLogger(__name__)


async def send_facebook_reply(page_access_token: str, recipient_id: str, text: str) -> bool:
    """Send a text message to a Facebook/Messenger user via the Send API.
    Returns True on success, False on failure (logged, never raised)."""
    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT_SECONDS) as client:
            response = await client.post(
                _SEND_API_URL,
                params={"access_token": page_access_token},
                json={
                    "recipient": {"id": recipient_id},
                    "message": {"text": text},
                    "messaging_type": "RESPONSE",
                },
            )
        if response.status_code != 200:
            logger.warning("fb_send_failed status=%s body=%s", response.status_code, response.text)
            return False
        return True
    except httpx.HTTPError as exc:
        logger.warning("fb_send_error error=%s", exc)
        return False
