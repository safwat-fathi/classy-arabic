from datetime import UTC, datetime

from httpx import ASGITransport, AsyncClient

from app.core.database import get_db
from app.main import app
from app.models import ConvState, Conversation, Merchant


async def test_list_conversations_filters_by_merchant_id(db_session, merchant, conversation):
    other_merchant = Merchant(name="Other Merchant")
    db_session.add(other_merchant)
    await db_session.flush()
    other_conversation = Conversation(
        merchant_id=other_merchant.id,
        customer_ref="other-customer",
        state=ConvState.NEW,
        slots={},
        last_message_at=datetime.now(UTC),
    )
    db_session.add(other_conversation)
    await db_session.flush()

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/conversations/", params={"merchant_id": merchant.id})
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == conversation.id
    assert body[0]["merchant_id"] == merchant.id


async def test_list_conversations_without_filter_returns_all(db_session, conversation):
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/conversations/")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert any(c["id"] == conversation.id for c in body)
