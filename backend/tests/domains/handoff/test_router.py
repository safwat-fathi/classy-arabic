import pytest
from datetime import datetime, UTC
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.auth.dependencies import get_current_merchant
from app.main import app
from app.models.conversation import Conversation
from app.models.human_handoff import HumanHandoff
from app.models.merchant import Merchant


@pytest.fixture
async def sample_conversation(db_session: AsyncSession, merchant: Merchant) -> Conversation:
    from app.models.enums import ConvState
    conversation = Conversation(
        merchant_id=merchant.id,
        customer_ref="test_customer",
        state=ConvState.GATHERING,
        ai_enabled=True,
        human_takeover=False,
        last_message_at=datetime.now(UTC),
    )
    db_session.add(conversation)
    await db_session.flush()
    return conversation


@pytest.fixture
def override_deps(db_session: AsyncSession, merchant: Merchant):
    async def _override_get_db():
        yield db_session

    async def _override_get_current_merchant():
        return merchant

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_merchant] = _override_get_current_merchant
    yield
    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(get_current_merchant, None)


@pytest.mark.asyncio
async def test_takeover_conversation(
    override_deps,
    db_session: AsyncSession,
    sample_conversation: Conversation,
):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            f"/conversations/{sample_conversation.id}/takeover",
            json={"reason": "MERCHANT_TAKEOVER", "notes": "Taking over manually"}
        )
    assert response.status_code == 204

    await db_session.refresh(sample_conversation)
    assert sample_conversation.human_takeover is True

    handoffs = (await db_session.execute(select(HumanHandoff).where(HumanHandoff.conversation_id == sample_conversation.id))).scalars().all()
    assert len(handoffs) == 1
    assert handoffs[0].reason == "MERCHANT_TAKEOVER"
    assert handoffs[0].notes == "Taking over manually"
    assert handoffs[0].resolved_at is None


@pytest.mark.asyncio
async def test_return_to_ai(
    override_deps,
    db_session: AsyncSession,
    sample_conversation: Conversation,
):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # First takeover
        await client.post(
            f"/conversations/{sample_conversation.id}/takeover",
            json={"reason": "MERCHANT_TAKEOVER"}
        )

        # Then return to AI
        response = await client.post(
            f"/conversations/{sample_conversation.id}/return-to-ai",
            json={"notes": "Issue resolved"}
        )
    assert response.status_code == 204

    await db_session.refresh(sample_conversation)
    assert sample_conversation.human_takeover is False

    handoffs = (await db_session.execute(select(HumanHandoff).where(HumanHandoff.conversation_id == sample_conversation.id))).scalars().all()
    assert len(handoffs) == 1
    assert handoffs[0].resolved_at is not None
    assert handoffs[0].notes == "Issue resolved"
