from datetime import UTC, datetime, timedelta

import jwt

from app.core.config import settings


def create_access_token(merchant_id: str) -> str:
    """Encode a JWT with claims {"sub": merchant_id, "exp": <now + JWT_EXPIRE_MINUTES>}."""
    expire = datetime.now(UTC) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": merchant_id, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Decode and validate a JWT. Returns the merchant_id (the "sub" claim) on
    success. Returns None on any failure — expired, bad signature, malformed,
    missing "sub" claim. Never raises (catches jwt's exceptions internally),
    matching this repo's "return Optional, never raise" convention for
    fallible pure-ish functions (see app/engine/product_matching.py::match_variant_hint)."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.exceptions.PyJWTError:
        return None

    sub = payload.get("sub")
    if not isinstance(sub, str):
        return None
    return sub
