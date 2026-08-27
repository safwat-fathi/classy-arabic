import pytest
from sqlalchemy.exc import IntegrityError

from app.models import Merchant, MerchantStatus


async def test_merchant_status_defaults_to_active(db_session, merchant):
    await db_session.refresh(merchant)

    assert merchant.status == MerchantStatus.ACTIVE


async def test_merchant_facebook_user_id_unique_constraint(db_session):
    db_session.add(Merchant(name="Merchant A", facebook_user_id="fb-123"))
    await db_session.flush()

    db_session.add(Merchant(name="Merchant B", facebook_user_id="fb-123"))
    with pytest.raises(IntegrityError):
        await db_session.flush()


async def test_merchant_facebook_user_id_allows_multiple_nulls(db_session):
    db_session.add(Merchant(name="Merchant A"))
    await db_session.flush()

    db_session.add(Merchant(name="Merchant B"))
    await db_session.flush()
