import pytest

from app.domains.checkout.service import create_order, get_checkout_state, validate_delivery_area


async def test_validate_delivery_area_reports_unavailable():
    result = await validate_delivery_area("merchant-1", "Nasr City")
    assert result == {"status": "unavailable", "reason": "delivery_service_not_built"}


async def test_get_checkout_state_raises_not_implemented():
    with pytest.raises(NotImplementedError):
        await get_checkout_state("m1", "c1")


async def test_create_order_raises_not_implemented():
    with pytest.raises(NotImplementedError):
        await create_order("m1", "c1", True)
