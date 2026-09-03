import logging
from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.domains.auth.tokens import decode_access_token
from app.models import Merchant, MerchantStatus

logger = logging.getLogger("app.domains.auth")

_bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_merchant(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)] = None,
    db: AsyncSession = Depends(get_db),
) -> Merchant:
    if credentials is None:
        raise HTTPException(status_code=401, detail="not authenticated")

    # Check for public demo access
    if settings.DEMO_API_KEY and credentials.credentials == settings.DEMO_API_KEY:
        merchant_id = settings.DEMO_STOPGAP_MERCHANT_ID
    else:
        merchant_id = decode_access_token(credentials.credentials)

    if merchant_id is None:
        raise HTTPException(status_code=401, detail="invalid or expired token")

    merchant = await db.get(Merchant, merchant_id)
    if merchant is None:
        raise HTTPException(status_code=401, detail="merchant not found")

    if merchant.status != MerchantStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="merchant suspended")

    return merchant
