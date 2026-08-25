import httpx

from app.core.config import settings
from app.engine.product_matching import match_line_items_to_products
from app.engine.schemas import ExtractedLineItem
from app.models import Merchant, Product


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
