import pytest

from app.domains.cart.service import add_item, remove_item, update_item


async def test_add_item_raises_not_implemented():
    with pytest.raises(NotImplementedError):
        await add_item("m1", "c1", "p1", 2)


async def test_update_item_raises_not_implemented():
    with pytest.raises(NotImplementedError):
        await update_item("m1", "c1", "li1", 3)


async def test_remove_item_raises_not_implemented():
    with pytest.raises(NotImplementedError):
        await remove_item("m1", "c1", "li1")
