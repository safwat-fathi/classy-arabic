from app.domains.products.service import get_product, search_products
from app.models.merchant import Merchant
from app.models.product import Product


async def test_search_products_matches_name_substring(db_session, merchant):
    db_session.add(Product(id="p1", merchant_id=merchant.id, name="Blue Shirt", aliases=[]))
    db_session.add(Product(id="p2", merchant_id=merchant.id, name="Red Shoes", aliases=[]))
    await db_session.flush()

    results = await search_products(db_session, merchant.id, "shirt", {})
    assert [p.id for p in results] == ["p1"]


async def test_search_products_scoped_to_merchant(db_session, merchant):
    other_merchant = Merchant(name="Other")
    db_session.add(other_merchant)
    await db_session.flush()
    db_session.add(Product(id="p1", merchant_id=other_merchant.id, name="Blue Shirt", aliases=[]))
    await db_session.flush()

    results = await search_products(db_session, merchant.id, "shirt", {})
    assert results == []


async def test_get_product_returns_none_for_other_merchant(db_session, merchant):
    other_merchant = Merchant(name="Other")
    db_session.add(other_merchant)
    await db_session.flush()
    db_session.add(Product(id="p1", merchant_id=other_merchant.id, name="Blue Shirt", aliases=[]))
    await db_session.flush()

    assert await get_product(db_session, merchant.id, "p1") is None


async def test_get_product_returns_owned_product(db_session, merchant):
    db_session.add(Product(id="p1", merchant_id=merchant.id, name="Blue Shirt", aliases=[]))
    await db_session.flush()

    result = await get_product(db_session, merchant.id, "p1")
    assert result.name == "Blue Shirt"
