from decimal import Decimal

from sqlalchemy import delete, select

from app.models import Product, ProductVariant, VariantStatus


async def test_product_variant_round_trip(db_session, merchant):
    product = Product(merchant_id=merchant.id, name="Blue Shirt", price=Decimal("199.99"))
    db_session.add(product)
    await db_session.flush()

    variant = ProductVariant(
        product_id=product.id,
        label="M / Blue",
        sku="SHIRT-M-BLU",
        price=Decimal("219.99"),
        stock=10,
        attributes={"size": "M", "color": "Blue"},
    )
    db_session.add(variant)
    await db_session.flush()
    await db_session.refresh(variant)

    assert variant.id is not None
    assert variant.label == "M / Blue"
    assert variant.price == Decimal("219.99")
    assert variant.attributes == {"size": "M", "color": "Blue"}


async def test_product_variant_status_defaults_to_active(db_session, merchant):
    product = Product(merchant_id=merchant.id, name="Blue Shirt")
    db_session.add(product)
    await db_session.flush()

    variant = ProductVariant(product_id=product.id, label="M / Blue")
    db_session.add(variant)
    await db_session.flush()
    await db_session.refresh(variant)

    assert variant.status == VariantStatus.ACTIVE


async def test_deleting_product_cascades_to_variants(db_session, merchant):
    product = Product(merchant_id=merchant.id, name="Blue Shirt")
    db_session.add(product)
    await db_session.flush()

    variant = ProductVariant(product_id=product.id, label="M / Blue")
    db_session.add(variant)
    await db_session.flush()
    variant_id = variant.id

    await db_session.execute(delete(Product).where(Product.id == product.id))
    await db_session.flush()

    result = await db_session.execute(select(ProductVariant).where(ProductVariant.id == variant_id))
    assert result.scalar_one_or_none() is None
