from sqlalchemy import select

from app.domains.auth.meta_client import FacebookIdentity
from app.domains.auth.service import find_or_create_merchant_by_facebook_id
from app.models import Merchant
from app.models.enums import MerchantStatus


async def test_find_or_create_creates_new_merchant_on_first_login(db_session):
    identity = FacebookIdentity(facebook_user_id="fb-user-1", name="Amr")

    merchant = await find_or_create_merchant_by_facebook_id(db_session, identity)

    assert merchant.facebook_user_id == "fb-user-1"
    assert merchant.name == "Amr"
    assert merchant.status == MerchantStatus.ACTIVE

    result = await db_session.execute(select(Merchant).where(Merchant.facebook_user_id == "fb-user-1"))
    stored = result.scalar_one()
    assert stored.id == merchant.id


async def test_find_or_create_returns_existing_merchant_on_repeat_login(db_session):
    identity = FacebookIdentity(facebook_user_id="fb-user-1", name="Amr")
    first = await find_or_create_merchant_by_facebook_id(db_session, identity)

    second_identity = FacebookIdentity(facebook_user_id="fb-user-1", name="Amr Updated Name")
    second = await find_or_create_merchant_by_facebook_id(db_session, second_identity)

    assert second.id == first.id
    # Repeat login returns the existing row as-is; it does not overwrite name.
    assert second.name == "Amr"

    result = await db_session.execute(select(Merchant).where(Merchant.facebook_user_id == "fb-user-1"))
    all_matches = result.scalars().all()
    assert len(all_matches) == 1
