from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.database import engine
from app.models import Channel, ChannelConnection, Conversation, ConvState, Merchant, Message
from app.models._ids import new_id
from app.models.enums import Direction


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
async def message(db_session, conversation):
    msg = Message(
        id=new_id(), conversation_id=conversation.id, direction=Direction.INBOUND,
        normalized_text="عايز اشوف الاحذية"
    )
    db_session.add(msg)
    await db_session.flush()
    return msg


@pytest.fixture
def mock_ai(httpx2_mock):
    # openai>=3.3.1 makes its HTTP calls through `httpx2` (a separate package
    # from `httpx`), which plain `respx.mock()` cannot intercept — the request
    # falls through to a real network call instead of being mocked. The
    # `httpx2_mock` fixture (from pytest-httpx2) is respx wired to patch
    # httpx2's transport instead; `mock_ai` just forwards it so every existing
    # `mock_ai.post(...)` call site keeps working unchanged.
    yield httpx2_mock


@pytest.fixture
async def channel_connection(db_session, merchant):
    connection = ChannelConnection(
        merchant_id=merchant.id,
        channel=Channel.FACEBOOK,
        external_account_id="test-page-id",
    )
    db_session.add(connection)
    await db_session.flush()
    return connection


class FakeArqPool:
    def __init__(self):
        self.enqueued: list[tuple[str, tuple, dict]] = []

    async def enqueue_job(self, function: str, *args, **kwargs):
        self.enqueued.append((function, args, kwargs))
        return None


@pytest.fixture
def fake_arq_pool():
    return FakeArqPool()
