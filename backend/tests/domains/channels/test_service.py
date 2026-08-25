from sqlalchemy import select

from app.domains.channels.schemas import ParsedInboundMessage
from app.domains.channels.service import ingest_channel_message
from app.models import Channel, Conversation, Message


async def test_ingest_creates_conversation_and_message(db_session, channel_connection):
    parsed = ParsedInboundMessage(
        channel=Channel.FACEBOOK,
        external_account_id="test-page-id",
        external_customer_id="customer-1",
        external_message_id="mid.111",
        text="hello",
    )

    message_id = await ingest_channel_message(db_session, parsed)
    await db_session.flush()

    assert message_id is not None
    message = await db_session.get(Message, message_id)
    assert message.raw_text == "hello"
    assert message.external_message_id == "mid.111"

    conversation = await db_session.get(Conversation, message.conversation_id)
    assert conversation.channel_connection_id == channel_connection.id
    assert conversation.customer_ref == "customer-1"


async def test_ingest_reuses_existing_conversation_for_same_customer(db_session, channel_connection):
    first = ParsedInboundMessage(
        channel=Channel.FACEBOOK,
        external_account_id="test-page-id",
        external_customer_id="customer-1",
        external_message_id="mid.111",
        text="hello",
    )
    second = ParsedInboundMessage(
        channel=Channel.FACEBOOK,
        external_account_id="test-page-id",
        external_customer_id="customer-1",
        external_message_id="mid.222",
        text="hello again",
    )

    first_id = await ingest_channel_message(db_session, first)
    second_id = await ingest_channel_message(db_session, second)
    await db_session.flush()

    first_message = await db_session.get(Message, first_id)
    second_message = await db_session.get(Message, second_id)
    assert first_message.conversation_id == second_message.conversation_id

    conversations = (
        await db_session.execute(select(Conversation).where(Conversation.customer_ref == "customer-1"))
    ).scalars().all()
    assert len(conversations) == 1


async def test_ingest_is_idempotent_on_duplicate_external_message_id(db_session, channel_connection):
    parsed = ParsedInboundMessage(
        channel=Channel.FACEBOOK,
        external_account_id="test-page-id",
        external_customer_id="customer-1",
        external_message_id="mid.111",
        text="hello",
    )

    first_id = await ingest_channel_message(db_session, parsed)
    await db_session.flush()
    second_id = await ingest_channel_message(db_session, parsed)
    await db_session.flush()

    assert first_id is not None
    assert second_id is None


async def test_ingest_drops_messages_for_unmapped_account(db_session):
    parsed = ParsedInboundMessage(
        channel=Channel.FACEBOOK,
        external_account_id="no-such-page",
        external_customer_id="customer-1",
        external_message_id="mid.111",
        text="hello",
    )

    message_id = await ingest_channel_message(db_session, parsed)

    assert message_id is None
