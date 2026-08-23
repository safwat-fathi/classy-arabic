import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.clients import AICallError
from app.engine.embeddings import embed_text
from app.engine.schemas import ExtractedLineItem
from app.models import Product

logger = logging.getLogger(__name__)


async def match_line_items_to_products(
    session: AsyncSession,
    merchant_id: str,
    line_items: list[ExtractedLineItem],
    max_distance: float = 0.45,
) -> list[ExtractedLineItem]:
    matched: list[ExtractedLineItem] = []
    for item in line_items:
        try:
            embedding = await embed_text(item.product_name)
        except AICallError as exc:
            logger.warning("product_match_embedding_failed product_name=%r error=%s", item.product_name, exc)
            matched.append(item.model_copy(update={"product_id": None}))
            continue
        distance_col = Product.embedding.cosine_distance(embedding)
        result = await session.execute(
            select(Product, distance_col)
            .where(Product.merchant_id == merchant_id, Product.embedding.is_not(None))
            .order_by(distance_col)
            .limit(1)
        )
        row = result.first()
        product_id = None
        if row is not None:
            product, distance = row
            if distance <= max_distance:
                product_id = product.id
        matched.append(item.model_copy(update={"product_id": product_id}))
    return matched
