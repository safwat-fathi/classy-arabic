from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.products import service as products_service
from app.engine.schemas import GetProductAction, SearchProductsAction
from app.engine.tools.registry import register_tool


@register_tool("search_products")
async def handle_search_products(
    session: AsyncSession, action: SearchProductsAction, merchant_id: str, conversation_id: str
) -> dict:
    products = await products_service.search_products(session, merchant_id, action.query, action.filters)
    return {"products": [p.model_dump() for p in products]}


@register_tool("get_product")
async def handle_get_product(
    session: AsyncSession, action: GetProductAction, merchant_id: str, conversation_id: str
) -> dict:
    # existence + merchant ownership already validated by evaluate_action (Task 3)
    product = await products_service.get_product(session, merchant_id, action.product_id)
    return {"product": product.model_dump()}
