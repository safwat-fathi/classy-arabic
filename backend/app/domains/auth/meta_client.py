from dataclasses import dataclass

import httpx

from app.core.config import settings

_DEBUG_TOKEN_URL = "https://graph.facebook.com/debug_token"
_ME_URL = "https://graph.facebook.com/me"
_ME_ACCOUNTS_URL = "https://graph.facebook.com/me/accounts"

_HTTP_TIMEOUT_SECONDS = 10.0


@dataclass(frozen=True)
class FacebookIdentity:
    facebook_user_id: str
    name: str


@dataclass(frozen=True)
class FacebookPage:
    page_id: str
    name: str
    access_token: str


async def verify_facebook_access_token(access_token: str) -> FacebookIdentity | None:
    """Verify a Facebook user access token against the Graph API. Returns the
    verified identity, or None if the token is invalid, expired, minted for a
    different app, or any HTTP call fails."""
    app_access_token = f"{settings.META_APP_ID}|{settings.META_APP_SECRET}"

    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT_SECONDS) as client:
            debug_response = await client.get(
                _DEBUG_TOKEN_URL,
                params={"input_token": access_token, "access_token": app_access_token},
            )
        debug_response.raise_for_status()
        debug_data = debug_response.json()["data"]

        if debug_data["is_valid"] is not True or debug_data["app_id"] != settings.META_APP_ID:
            return None

        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT_SECONDS) as client:
            me_response = await client.get(
                _ME_URL,
                params={"access_token": access_token, "fields": "id,name"},
            )
        me_response.raise_for_status()
        me_data = me_response.json()

        return FacebookIdentity(facebook_user_id=me_data["id"], name=me_data["name"])
    except (httpx.HTTPError, KeyError, TypeError, AttributeError, ValueError):
        return None


async def fetch_user_pages(access_token: str) -> list[FacebookPage]:
    """Fetch the Facebook Pages managed by this user. Each page comes with a
    page-scoped access token that we store to send outbound replies."""
    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT_SECONDS) as client:
            response = await client.get(
                _ME_ACCOUNTS_URL,
                params={"access_token": access_token, "fields": "id,name,access_token"},
            )
        response.raise_for_status()
        data = response.json().get("data", [])
        return [
            FacebookPage(page_id=page["id"], name=page["name"], access_token=page["access_token"])
            for page in data
            if page.get("id") and page.get("access_token")
        ]
    except (httpx.HTTPError, KeyError, TypeError, ValueError):
        return []
