from httpx import ASGITransport, AsyncClient

from app.core.database import get_db
from app.main import app
from app.models import Merchant, Product


async def test_list_products_returns_only_merchant_scoped_products(db_session, merchant):
    other_merchant = Merchant(name="Other Merchant")
    db_session.add(other_merchant)
    await db_session.flush()

    other = Product(merchant_id=other_merchant.id, name="Other Merchant Product")
    mine = Product(
        merchant_id=merchant.id,
        name="My Product",
        aliases=["alias1"],
        variants={"sizes": ["M"]},
    )
    db_session.add_all([other, mine])
    await db_session.flush()

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/products/", params={"merchant_id": merchant.id})
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["name"] == "My Product"
    assert body[0]["aliases"] == ["alias1"]
    assert body[0]["variants"] == {"sizes": ["M"]}


async def test_list_products_requires_merchant_id(db_session, merchant):
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/products/")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 422
