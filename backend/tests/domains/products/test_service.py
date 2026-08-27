from decimal import Decimal

from app.domains.products.service import get_product, list_products, search_products
from app.models.merchant import Merchant
from app.models.product import Product
from app.models.product_variant import ProductVariant


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


async def test_get_product_includes_variants(db_session, merchant):
    product = Product(id="p1", merchant_id=merchant.id, name="Blue Shirt", aliases=[], price=Decimal("199.99"))
    db_session.add(product)
    await db_session.flush()
    db_session.add_all(
        [
            ProductVariant(product_id="p1", label="S", sku="SHIRT-S", stock=5, attributes={"size": "S"}),
            ProductVariant(
                product_id="p1",
                label="M",
                sku="SHIRT-M",
                stock=8,
                price=Decimal("219.99"),
                attributes={"size": "M"},
            ),
        ]
    )
    await db_session.flush()

    result = await get_product(db_session, merchant.id, "p1")
    assert len(result.variants) == 2
    by_label = {v.label: v for v in result.variants}
    assert by_label["S"].sku == "SHIRT-S"
    assert by_label["S"].stock == 5
    assert by_label["S"].price is None
    assert by_label["S"].status == "ACTIVE"
    assert by_label["S"].attributes == {"size": "S"}
    assert by_label["M"].price == 219.99


async def test_list_products_includes_variants(db_session, merchant):
    product = Product(id="p1", merchant_id=merchant.id, name="Blue Shirt", aliases=[])
    db_session.add(product)
    await db_session.flush()
    db_session.add(ProductVariant(product_id="p1", label="M", sku="SHIRT-M", stock=8, attributes={"size": "M"}))
    await db_session.flush()

    results = await list_products(db_session, merchant.id)
    assert len(results) == 1
    assert len(results[0].variants) == 1
    assert results[0].variants[0].label == "M"
    assert results[0].variants[0].product_id == "p1"
