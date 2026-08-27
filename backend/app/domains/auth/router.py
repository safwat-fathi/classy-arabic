from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.meta_client import verify_facebook_access_token
from app.domains.auth.schemas import AuthTokenResponse, FacebookCallbackRequest
from app.domains.auth.service import find_or_create_merchant_by_facebook_id
from app.domains.auth.tokens import create_access_token
from app.models import MerchantStatus

router = APIRouter()


@router.post("/facebook/callback", response_model=AuthTokenResponse)
async def facebook_callback(body: FacebookCallbackRequest, db: AsyncSession = Depends(get_db)) -> AuthTokenResponse:
    identity = await verify_facebook_access_token(body.access_token)
    if identity is None:
        raise HTTPException(status_code=401, detail="invalid facebook access token")

    merchant = await find_or_create_merchant_by_facebook_id(db, identity)
    if merchant.status != MerchantStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="merchant suspended")

    await db.commit()

    token = create_access_token(merchant.id)
    return AuthTokenResponse(access_token=token, merchant_id=merchant.id, merchant_name=merchant.name)
