"""add channel ingestion schema

Revision ID: 27e5ce804847
Revises: 681687521d6f
Create Date: 2026-08-25 14:36:14.283715

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM, JSON


# revision identifiers, used by Alembic.
revision: str = '27e5ce804847'
down_revision: Union[str, Sequence[str], None] = '681687521d6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # `channel` is used by BOTH channel_connections.channel and
    # webhook_events.channel — must use the postgres-specific ENUM with
    # create_type=False and an explicit .create(), same as `modeltier` in
    # 2d17ac4bd857_add_classification_schema.py. A plain sa.Enum here would
    # raise DuplicateObjectError on the second create_table() call.
    channel = ENUM("FACEBOOK", "INSTAGRAM", "WHATSAPP", name="channel", create_type=False)
    channel.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "channel_connections",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("merchant_id", sa.String(), sa.ForeignKey("merchants.id"), nullable=False),
        sa.Column("channel", channel, nullable=False),
        sa.Column("external_account_id", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint(
            "channel", "external_account_id", name="uq_channel_connections_channel_external_account_id"
        ),
    )
    op.create_index(
        "ix_channel_connections_merchant_id", "channel_connections", ["merchant_id"]
    )

    op.create_table(
        "webhook_events",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("channel", channel, nullable=False),
        sa.Column("raw_payload", JSON(), nullable=True),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("processing_error", sa.String(), nullable=True),
    )

    op.add_column(
        "conversations",
        sa.Column("channel_connection_id", sa.String(), sa.ForeignKey("channel_connections.id"), nullable=True),
    )
    op.create_index("ix_conversations_channel_connection_id", "conversations", ["channel_connection_id"])
    op.create_unique_constraint(
        "uq_conversations_channel_connection_customer_ref",
        "conversations",
        ["channel_connection_id", "customer_ref"],
    )

    op.add_column("messages", sa.Column("external_message_id", sa.String(), nullable=True))
    op.create_index(
        "ix_messages_external_message_id_unique",
        "messages",
        ["external_message_id"],
        unique=True,
        postgresql_where=sa.text("external_message_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_messages_external_message_id_unique", table_name="messages")
    op.drop_column("messages", "external_message_id")

    op.drop_constraint("uq_conversations_channel_connection_customer_ref", "conversations", type_="unique")
    op.drop_index("ix_conversations_channel_connection_id", table_name="conversations")
    op.drop_column("conversations", "channel_connection_id")

    op.drop_table("webhook_events")

    op.drop_index("ix_channel_connections_merchant_id", table_name="channel_connections")
    op.drop_table("channel_connections")

    sa.Enum(name="channel").drop(op.get_bind(), checkfirst=True)
