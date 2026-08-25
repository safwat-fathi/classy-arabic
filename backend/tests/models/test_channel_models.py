from app.models import Channel, ChannelConnection, WebhookEvent


def test_channel_enum_has_expected_members():
    assert {c.value for c in Channel} == {"FACEBOOK", "INSTAGRAM", "WHATSAPP"}


async def test_channel_connection_defaults(db_session, merchant):
    connection = ChannelConnection(
        merchant_id=merchant.id,
        channel=Channel.FACEBOOK,
        external_account_id="1234567890",
    )
    db_session.add(connection)
    await db_session.flush()

    assert connection.id is not None
    assert connection.is_active is True


async def test_webhook_event_stores_raw_payload(db_session):
    event = WebhookEvent(channel=Channel.WHATSAPP, raw_payload={"hello": "world"})
    db_session.add(event)
    await db_session.flush()

    assert event.id is not None
    assert event.raw_payload == {"hello": "world"}
    assert event.processing_error is None
