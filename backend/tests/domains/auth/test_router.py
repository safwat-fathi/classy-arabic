import httpx
import respx
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.main import app
from app.models import Merchant
from app.models.enums import MerchantStatus

_DEBUG_TOKEN_URL = "https://graph.facebook.com/debug_token"
_ME_URL = "https://graph.facebook.com/me"


def _mock_facebook_success(*, app_id: str, facebook_user_id: str, name: str):
    respx.get(_DEBUG_TOKEN_URL).mock(
        return_value=httpx.Response(200, json={"data": {"is_valid": True, "app_id": app_id}})
    )
    respx.get(_ME_URL).mock(return_value=httpx.Response(200, json={"id": facebook_user_id, "name": name}))


@respx.mock
async def test_facebook_callback_creates_merchant_and_returns_token(db_session, monkeypatch):
    monkeypatch.setattr(settings, "META_APP_ID", "test-app-id")
    monkeypatch.setattr(settings, "META_APP_SECRET", "test-app-secret")
    _mock_facebook_success(app_id="test-app-id", facebook_user_id="fb-user-1", name="Amr")

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/auth/facebook/callback", json={"access_token": "user-access-token"})
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert body["merchant_name"] == "Amr"
    assert isinstance(body["access_token"], str) and body["access_token"]

    result = await db_session.execute(select(Merchant).where(Merchant.facebook_user_id == "fb-user-1"))
    stored = result.scalar_one()
    assert stored.id == body["merchant_id"]
    assert stored.name == "Amr"


@respx.mock
async def test_facebook_callback_rejects_invalid_facebook_token(db_session, monkeypatch):
    monkeypatch.setattr(settings, "META_APP_ID", "test-app-id")
    monkeypatch.setattr(settings, "META_APP_SECRET", "test-app-secret")
    respx.get(_DEBUG_TOKEN_URL).mock(
        return_value=httpx.Response(200, json={"data": {"is_valid": False, "app_id": "test-app-id"}})
    )

    async def _override_get_db():
        yield db_session

    merchants_before = (await db_session.execute(select(Merchant))).scalars().all()

    app.dependency_overrides[get_db] = _override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/auth/facebook/callback", json={"access_token": "bad-token"})
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 401

    merchants_after = (await db_session.execute(select(Merchant))).scalars().all()
    # A rejected Facebook token must never reach find_or_create_merchant_by_facebook_id.
    assert len(merchants_after) == len(merchants_before)


@respx.mock
async def test_facebook_callback_rejects_suspended_merchant(db_session, monkeypatch):
    monkeypatch.setattr(settings, "META_APP_ID", "test-app-id")
    monkeypatch.setattr(settings, "META_APP_SECRET", "test-app-secret")

    suspended = Merchant(name="Suspended Merchant", facebook_user_id="fb-user-2", status=MerchantStatus.SUSPENDED)
    db_session.add(suspended)
    await db_session.flush()

    _mock_facebook_success(app_id="test-app-id", facebook_user_id="fb-user-2", name="Suspended Merchant")

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/auth/facebook/callback", json={"access_token": "user-access-token"})
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 403
