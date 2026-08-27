from decimal import Decimal

import httpx

from app.core.config import settings
from app.engine.product_matching import (
    build_resolved_order_lines,
    match_line_items_to_products,
    resolve_variants_for_line_items,
)
from app.engine.schemas import ExtractedLineItem
from app.models import Merchant, Product
from app.models.enums import VariantStatus
from app.models.product_variant import ProductVariant


def _embedding_response(vector: list[float]) -> dict:
    return {
        "object": "list",
        "data": [{"object": "embedding", "index": 0, "embedding": vector}],
        "model": "bge-m3",
        "usage": {"prompt_tokens": 1, "total_tokens": 1},
    }


async def test_matches_close_product(db_session, merchant, mock_ai):
    close_vector = [1.0] * 1024
    product = Product(
        merchant_id=merchant.id, name="Summer Linen Dress", aliases=["فستان صيفي"], embedding=close_vector
    )
    db_session.add(product)
    await db_session.flush()

    mock_ai.post(f"{settings.EMBEDDING_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(200, json=_embedding_response(close_vector))
    )

    line_items = [ExtractedLineItem(product_name="فستان صيفي مقاس لارج", quantity=1.0)]
    matched = await match_line_items_to_products(db_session, merchant.id, line_items)

    assert matched[0].product_id == product.id


async def test_no_match_when_too_far(db_session, merchant, mock_ai):
    far_vector = [0.0] * 1023 + [1.0]
    query_vector = [1.0] * 1024
    product = Product(
        merchant_id=merchant.id, name="Classic Denim Jacket", aliases=["جاكيت جينز"], embedding=far_vector
    )
    db_session.add(product)
    await db_session.flush()

    mock_ai.post(f"{settings.EMBEDDING_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(200, json=_embedding_response(query_vector))
    )

    line_items = [ExtractedLineItem(product_name="حاجة تانية خالص", quantity=1.0)]
    matched = await match_line_items_to_products(db_session, merchant.id, line_items)

    assert matched[0].product_id is None


async def test_does_not_match_across_merchants(db_session, merchant, mock_ai):
    close_vector = [1.0] * 1024
    other_merchant = Merchant(name="Other Merchant")
    db_session.add(other_merchant)
    await db_session.flush()

    other_product = Product(merchant_id=other_merchant.id, name="Summer Linen Dress", embedding=close_vector)
    db_session.add(other_product)
    await db_session.flush()

    mock_ai.post(f"{settings.EMBEDDING_BASE_URL}/embeddings").mock(
        return_value=httpx.Response(200, json=_embedding_response(close_vector))
    )

    line_items = [ExtractedLineItem(product_name="فستان صيفي", quantity=1.0)]
    matched = await match_line_items_to_products(db_session, merchant.id, line_items)

    assert matched[0].product_id is None


async def test_resolve_variants_for_line_items_sets_variant_required_when_product_has_variants(db_session, merchant):
    product = Product(merchant_id=merchant.id, name="T-Shirt", price=Decimal("100.00"))
    db_session.add(product)
    await db_session.flush()
    variant = ProductVariant(product_id=product.id, label="XL", attributes={"size": "XL"})
    db_session.add(variant)
    await db_session.flush()

    line_items = [ExtractedLineItem(product_name="تيشيرت", quantity=1.0, product_id=product.id, variant_hint="XL")]
    resolved = await resolve_variants_for_line_items(db_session, line_items)

    assert resolved[0].variant_required is True
    assert resolved[0].variant_id == variant.id


async def test_resolve_variants_for_line_items_leaves_variant_required_false_when_product_has_no_variants(
    db_session, merchant
):
    product = Product(merchant_id=merchant.id, name="Plain Mug", price=Decimal("50.00"))
    db_session.add(product)
    await db_session.flush()

    line_items = [ExtractedLineItem(product_name="كوب", quantity=1.0, product_id=product.id)]
    resolved = await resolve_variants_for_line_items(db_session, line_items)

    assert resolved[0].variant_required is False
    assert resolved[0].variant_id is None


async def test_resolve_variants_for_line_items_skips_discontinued_variants(db_session, merchant):
    product = Product(merchant_id=merchant.id, name="Shoes", price=Decimal("300.00"))
    db_session.add(product)
    await db_session.flush()
    variant = ProductVariant(
        product_id=product.id, label="42", attributes={"size": "42"}, status=VariantStatus.DISCONTINUED
    )
    db_session.add(variant)
    await db_session.flush()

    line_items = [ExtractedLineItem(product_name="جزمة", quantity=1.0, product_id=product.id, variant_hint="42")]
    resolved = await resolve_variants_for_line_items(db_session, line_items)

    # Only ACTIVE variants count as candidates - a discontinued-only product
    # behaves like a product with no variants at all.
    assert resolved[0].variant_required is False
    assert resolved[0].variant_id is None


async def test_build_resolved_order_lines_excludes_priceless_items(db_session, merchant):
    priced = Product(merchant_id=merchant.id, name="Priced Item", price=Decimal("75.00"))
    priceless = Product(merchant_id=merchant.id, name="Priceless Item", price=None)
    db_session.add_all([priced, priceless])
    await db_session.flush()

    line_items = [
        ExtractedLineItem(product_name="Priced Item", quantity=1.0, product_id=priced.id),
        ExtractedLineItem(product_name="Priceless Item", quantity=1.0, product_id=priceless.id),
    ]
    lines, all_resolved = await build_resolved_order_lines(db_session, line_items)

    assert all_resolved is False
    assert len(lines) == 1
    assert lines[0].product_id == priced.id


async def test_build_resolved_order_lines_all_resolved_false_on_missing_variant(db_session, merchant):
    product = Product(merchant_id=merchant.id, name="T-Shirt", price=Decimal("100.00"))
    db_session.add(product)
    await db_session.flush()
    db_session.add(ProductVariant(product_id=product.id, label="XL", attributes={"size": "XL"}))
    await db_session.flush()

    # Product has an active variant but the hint never resolved to one -
    # variant_required True, variant_id None.
    line_items = [
        ExtractedLineItem(
            product_name="تيشيرت", quantity=1.0, product_id=product.id, variant_required=True, variant_id=None
        )
    ]
    lines, all_resolved = await build_resolved_order_lines(db_session, line_items)

    assert all_resolved is False
    assert lines == []
