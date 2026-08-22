from httpx import ASGITransport, AsyncClient

from app.core.database import get_db
from app.main import app


def _chat_response(content: str) -> dict:
    return {
        "id": "chatcmpl-1", "object": "chat.completion", "created": 0, "model": "test",
        "choices": [{"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}],
    }


async def test_ingest_returns_404_for_unknown_conversation(db_session, mock_ai):
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/v1/messages/",
                json={"conversation_id": "does-not-exist", "raw_text": "hi", "normalized_text": "hi"},
            )
    finally:
        app.dependency_overrides.pop(get_db, None)
    assert response.status_code == 404


async def test_ingest_tier0_short_circuit_end_to_end(db_session, conversation, mock_ai):
    # Override get_db to hand the app the SAME session/transaction the
    # `conversation` fixture used, so the request sees that uncommitted row
    # (a separate pooled connection would not) and the whole test still
    # rolls back cleanly via the db_session fixture's teardown.
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/v1/messages/",
                json={"conversation_id": conversation.id, "raw_text": "👍", "normalized_text": "👍"},
            )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert body["intent"] == "reaction"
    assert body["model_tier"] == "RULE"
    assert body["order_id"] is None
