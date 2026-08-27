from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.auth.meta_client import FacebookIdentity
from app.models import Merchant


async def find_or_create_merchant_by_facebook_id(db: AsyncSession, identity: FacebookIdentity) -> Merchant:
    """Look up a Merchant by facebook_user_id. If found, return it (login).
    If not found, create a new Merchant with name=identity.name,
    facebook_user_id=identity.facebook_user_id (status defaults to ACTIVE per
    the model's default — no need to set it explicitly), flush, and return it
    (signup). This single function serves as both signup and login, by design
    — there is no separate registration step."""
    result = await db.execute(select(Merchant).where(Merchant.facebook_user_id == identity.facebook_user_id))
    merchant = result.scalar_one_or_none()
    if merchant is not None:
        return merchant

    merchant = Merchant(name=identity.name, facebook_user_id=identity.facebook_user_id)
    db.add(merchant)
    await db.flush()
    return merchant
