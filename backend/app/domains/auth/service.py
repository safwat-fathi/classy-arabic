import logging

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.auth.meta_client import FacebookIdentity, FacebookPage, subscribe_page_to_app
from app.models import Channel, ChannelConnection, Merchant

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

    try:
        # A savepoint or nested transaction could be required here depending on the setup,
        # but in most postgres async configs, flushing a duplicate triggers an IntegrityError.
        # We need to explicitly catch it. Since we are in an open transaction, an error will
        # invalidate the transaction, so we must rollback first before querying again.
        await db.flush()
        return merchant
    except IntegrityError:
        await db.rollback()
        result = await db.execute(select(Merchant).where(Merchant.facebook_user_id == identity.facebook_user_id))
        merchant = result.scalar_one_or_none()
        if merchant is not None:
            return merchant
        raise


async def provision_channel_connections(
    db: AsyncSession, merchant_id: str, pages: list[FacebookPage]
) -> tuple[int, list[str]]:
    """For each FB page, upsert a ChannelConnection with its page access token.
    Returns the count of pages connected and a list of conflicted page IDs."""
    connected = 0
    conflicts = []

    # Track the page IDs we are provisioning to deactivate the rest
    provisioned_page_ids = set()

    for page in pages:
        provisioned_page_ids.add(page.page_id)
        result = await db.execute(
            select(ChannelConnection).where(
                ChannelConnection.channel == Channel.FACEBOOK,
                ChannelConnection.external_account_id == page.page_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            if existing.merchant_id != merchant_id:
                logger.warning(
                    "page_conflict page_id=%s owned_by=%s requested_by=%s",
                    page.page_id,
                    existing.merchant_id,
                    merchant_id,
                )
                conflicts.append(page.page_id)
                continue

            existing.page_access_token = page.access_token
            existing.account_name = page.name
            existing.is_active = True
        else:
            db.add(
                ChannelConnection(
                    merchant_id=merchant_id,
                    channel=Channel.FACEBOOK,
                    external_account_id=page.page_id,
                    account_name=page.name,
                    page_access_token=page.access_token,
                )
            )
        await subscribe_page_to_app(page)
        connected += 1
        logger.info(
            "channel_connection_provisioned merchant_id=%s page_id=%s page_name=%s",
            merchant_id,
            page.page_id,
            page.name,
        )
    # Deactivate pages that the user unchecked
    result = await db.execute(
        select(ChannelConnection).where(
            ChannelConnection.merchant_id == merchant_id,
            ChannelConnection.channel == Channel.FACEBOOK,
        )
    )
    existing_connections = result.scalars().all()
    for conn in existing_connections:
        if conn.external_account_id not in provisioned_page_ids:
            conn.is_active = False

    await db.flush()
    return connected, conflicts
