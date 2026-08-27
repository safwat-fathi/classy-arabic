import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.core.config import settings
from app.domains.auth.dependencies import get_current_merchant
from app.domains.auth.tokens import create_access_token
from app.models import Merchant
from app.models.enums import MerchantStatus


def _bearer(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


async def test_get_current_merchant_valid_token_returns_merchant(db_session, merchant, monkeypatch):
    monkeypatch.setattr(settings, "AUTH_DEV_BYPASS_MERCHANT_ID", "")
    token = create_access_token(merchant.id)

    result = await get_current_merchant(credentials=_bearer(token), db=db_session)

    assert result.id == merchant.id


async def test_get_current_merchant_missing_token_raises_401(db_session, monkeypatch):
    monkeypatch.setattr(settings, "AUTH_DEV_BYPASS_MERCHANT_ID", "")

    with pytest.raises(HTTPException) as exc_info:
        await get_current_merchant(credentials=None, db=db_session)

    assert exc_info.value.status_code == 401


async def test_get_current_merchant_invalid_token_raises_401(db_session, monkeypatch):
    monkeypatch.setattr(settings, "AUTH_DEV_BYPASS_MERCHANT_ID", "")

    with pytest.raises(HTTPException) as exc_info:
        await get_current_merchant(credentials=_bearer("not-a-real-token"), db=db_session)

    assert exc_info.value.status_code == 401


async def test_get_current_merchant_suspended_merchant_raises_403(db_session, monkeypatch):
    monkeypatch.setattr(settings, "AUTH_DEV_BYPASS_MERCHANT_ID", "")
    suspended = Merchant(name="Suspended Merchant", status=MerchantStatus.SUSPENDED)
    db_session.add(suspended)
    await db_session.flush()
    token = create_access_token(suspended.id)

    with pytest.raises(HTTPException) as exc_info:
        await get_current_merchant(credentials=_bearer(token), db=db_session)

    assert exc_info.value.status_code == 403


async def test_get_current_merchant_dev_bypass_returns_merchant_when_configured_and_no_token(
    db_session, merchant, monkeypatch
):
    monkeypatch.setattr(settings, "AUTH_DEV_BYPASS_MERCHANT_ID", merchant.id)

    result = await get_current_merchant(credentials=None, db=db_session)

    assert result.id == merchant.id


async def test_get_current_merchant_supplied_but_invalid_token_does_not_fall_back_to_bypass(
    db_session, merchant, monkeypatch
):
    # A supplied-but-invalid token must still 401, never silently fall through
    # to the dev bypass even when one is configured.
    monkeypatch.setattr(settings, "AUTH_DEV_BYPASS_MERCHANT_ID", merchant.id)

    with pytest.raises(HTTPException) as exc_info:
        await get_current_merchant(credentials=_bearer("not-a-real-token"), db=db_session)

    assert exc_info.value.status_code == 401


async def test_get_current_merchant_stale_bypass_id_raises_401(db_session, monkeypatch):
    monkeypatch.setattr(settings, "AUTH_DEV_BYPASS_MERCHANT_ID", "does-not-exist")

    with pytest.raises(HTTPException) as exc_info:
        await get_current_merchant(credentials=None, db=db_session)

    assert exc_info.value.status_code == 401
