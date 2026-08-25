from app.engine.schemas import GetProductAction, SearchProductsAction
from app.engine.tools.catalog import handle_get_product, handle_search_products
from app.models.product import Product


async def test_handle_search_products(db_session, merchant, conversation):
    db_session.add(Product(id="p1", merchant_id=merchant.id, name="Blue Shirt", aliases=[]))
    await db_session.flush()

    action = SearchProductsAction(action="search_products", query="shirt", confidence=0.9)
    result = await handle_search_products(db_session, action, merchant.id, conversation.id, "msg-1")
    assert result["products"][0]["id"] == "p1"


async def test_handle_get_product_returns_product(db_session, merchant, conversation):
    db_session.add(Product(id="p1", merchant_id=merchant.id, name="Blue Shirt", aliases=[]))
    await db_session.flush()

    action = GetProductAction(action="get_product", product_id="p1", confidence=0.9)
    result = await handle_get_product(db_session, action, merchant.id, conversation.id, "msg-1")
    assert result["product"]["name"] == "Blue Shirt"
