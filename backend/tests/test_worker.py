from contextlib import asynccontextmanager

from app.models import Channel, ChannelConnection, Conversation, ConvState, Direction, Message
from app.models._ids import new_id
from app.worker import _process_channel_message


@asynccontextmanager
async def _noop_lock(_conversation_id: str):
    yield


async def test_process_channel_message_classifies_tier0_message(db_session, merchant, mock_ai):
    connection = ChannelConnection(merchant_id=merchant.id, channel=Channel.FACEBOOK, external_account_id="page-1")
    db_session.add(connection)
    await db_session.flush()

    conversation = Conversation(
        merchant_id=merchant.id,
        channel_connection_id=connection.id,
        customer_ref="customer-1",
        state=ConvState.NEW,
        slots={},
        last_message_at=__import__("datetime").datetime.now(__import__("datetime").UTC),
    )
    db_session.add(conversation)
    await db_session.flush()

    message = Message(
        id=new_id(),
        conversation_id=conversation.id,
        direction=Direction.INBOUND,
        raw_text="👍",
        normalized_text="👍",
        external_message_id="mid.111",
    )
    db_session.add(message)
    await db_session.flush()

    await _process_channel_message(db_session, _noop_lock, message.id)

    await db_session.refresh(message)
    assert message.intent == "reaction"
    assert not mock_ai.calls


async def test_process_channel_message_is_a_noop_for_unknown_message_id(db_session):
    # Should not raise even if the row vanished (e.g. a stale/duplicate job) —
    # arq's own retry policy handles transient errors, this handles the
    # legitimate case of "nothing to do".
    await _process_channel_message(db_session, _noop_lock, "does-not-exist")
