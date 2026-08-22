from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.database import engine
from app.models import Conversation, ConvState, Merchant


@pytest.fixture
async def db_session():
    connection = await engine.connect()
    transaction = await connection.begin()
    # join_transaction_mode="create_savepoint": code under test (e.g. a
    # router calling db.commit()) commits/rolls back a SAVEPOINT, not the
    # outer transaction — the outer `transaction` below still rolls back
    # everything at teardown. Without this, a single .commit() inside the
    # test would end the outer transaction early and leak rows into the
    # real dev database.
    session_maker = async_sessionmaker(
        bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
    )
    session = session_maker()

    try:
        yield session
    finally:
        await session.close()
        await transaction.rollback()
        await connection.close()


@pytest.fixture
async def merchant(db_session):
    m = Merchant(name="Test Merchant")
    db_session.add(m)
    await db_session.flush()
    return m


@pytest.fixture
async def conversation(db_session, merchant):
    c = Conversation(
        merchant_id=merchant.id,
        customer_ref="test-customer-1",
        state=ConvState.GATHERING,
        slots={},
        last_message_at=datetime.now(UTC),
    )
    db_session.add(c)
    await db_session.flush()
    return c


@pytest.fixture
def mock_ai(httpx2_mock):
    # openai>=3.3.1 makes its HTTP calls through `httpx2` (a separate package
    # from `httpx`), which plain `respx.mock()` cannot intercept — the request
    # falls through to a real network call instead of being mocked. The
    # `httpx2_mock` fixture (from pytest-httpx2) is respx wired to patch
    # httpx2's transport instead; `mock_ai` just forwards it so every existing
    # `mock_ai.post(...)` call site keeps working unchanged.
    yield httpx2_mock
