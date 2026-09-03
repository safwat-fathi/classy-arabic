import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.auth.meta_client import FacebookIdentity, FacebookPage
from app.models import ChannelConnection, Channel, Merchant

logger = logging.getLogger(__name__)


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


async def provision_channel_connections(db: AsyncSession, merchant_id: str, pages: list[FacebookPage]) -> int:
    """For each FB page, upsert a ChannelConnection with its page access token.
    Returns the count of pages connected."""
    connected = 0
    for page in pages:
        result = await db.execute(
            select(ChannelConnection).where(
                ChannelConnection.channel == Channel.FACEBOOK,
                ChannelConnection.external_account_id == page.page_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            existing.merchant_id = merchant_id
            existing.page_access_token = page.access_token
            existing.is_active = True
        else:
            db.add(
                ChannelConnection(
                    merchant_id=merchant_id,
                    channel=Channel.FACEBOOK,
                    external_account_id=page.page_id,
                    page_access_token=page.access_token,
                )
            )
        connected += 1
        logger.info("channel_connection_provisioned merchant_id=%s page_id=%s page_name=%s", merchant_id, page.page_id, page.name)
    await db.flush()
    return connected
