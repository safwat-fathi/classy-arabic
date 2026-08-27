from datetime import UTC, datetime, timedelta

import jwt

from app.core.config import settings
from app.domains.auth.tokens import create_access_token, decode_access_token


def test_create_and_decode_access_token_round_trip():
    token = create_access_token("merchant-123")

    assert decode_access_token(token) == "merchant-123"


def test_decode_access_token_returns_none_when_expired():
    expired_payload = {"sub": "merchant-123", "exp": datetime.now(UTC) - timedelta(minutes=1)}
    token = jwt.encode(expired_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    assert decode_access_token(token) is None


def test_decode_access_token_returns_none_when_tampered():
    token = create_access_token("merchant-123")
    last_char = token[-1]
    replacement = "A" if last_char != "A" else "B"
    tampered = token[:-1] + replacement

    assert decode_access_token(tampered) is None


def test_decode_access_token_returns_none_for_garbage_input():
    assert decode_access_token("not-a-jwt-at-all") is None
