"""add classification schema

Revision ID: 2d17ac4bd857
Revises: 
Create Date: 2026-08-21 21:47:38.780920

"""
from collections.abc import Sequence

import pgvector.sqlalchemy
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, ENUM, JSON

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '2d17ac4bd857'
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    conv_state = sa.Enum("NEW", "GATHERING", "CONFIRMING", "COMPLETED", "ABANDONED", name="convstate")
    direction = sa.Enum("INBOUND", "OUTBOUND", name="direction")
    order_status = sa.Enum("AUTO_CONFIRMED", "PENDING_REVIEW", "CONFIRMED", "REJECTED", name="orderstatus")

    # model_tier is used on both `messages` and `orders` — create the PG enum
    # type explicitly once (create_type=False on the columns below) rather
    # than letting two separate op.create_table() calls each try to create
    # it, which raises "type already exists" on the second table.
    #
    # NOTE: `create_type` is only a real, honored parameter on
    # `sqlalchemy.dialects.postgresql.ENUM` (postgres-specific) — it is
    # NOT a recognized keyword on the generic `sqlalchemy.Enum` used for
    # `conv_state`/`direction`/`order_status` above. Passing
    # `create_type=False` to `sa.Enum(...)` is silently swallowed (it isn't
    # popped in `Enum._enum_init`) and has no effect: SQLAlchemy's
    # `ENUM.adapt_emulated_to_native()` only copies `create_type` over when
    # the source impl is already `NativeForEmulated` (i.e. already a
    # postgres ENUM), so a generic `sa.Enum` column still auto-emits
    # `CREATE TYPE` on every table that uses it — verified empirically:
    # using `sa.Enum(..., create_type=False)` here raised
    # `asyncpg.exceptions.DuplicateObjectError: type "modeltier" already
    # exists` on the second `op.create_table()` call. Using the
    # postgres-specific `ENUM` class (imported above) makes `create_type`
    # actually take effect.
    model_tier = ENUM("RULE", "NILECHAT", "ESCALATED", name="modeltier", create_type=False)
    model_tier.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "merchants",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
    )

    op.create_table(
        "conversations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("merchant_id", sa.String(), sa.ForeignKey("merchants.id"), nullable=False),
        sa.Column("customer_ref", sa.String(), nullable=False),
        sa.Column("state", conv_state, nullable=False),
        sa.Column("slots", JSON(), nullable=False, server_default="{}"),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "messages",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("conversation_id", sa.String(), sa.ForeignKey("conversations.id"), nullable=False),
        sa.Column("direction", direction, nullable=False),
        sa.Column("raw_text", sa.String(), nullable=True),
        sa.Column("normalized_text", sa.String(), nullable=True),
        sa.Column("intent", sa.String(), nullable=True),
        sa.Column("intent_confidence", sa.Float(), nullable=True),
        sa.Column("model_tier", model_tier, nullable=True),
        sa.Column("escalation_reason", sa.String(), nullable=True),
        sa.Column("embedding", pgvector.sqlalchemy.Vector(1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.execute("CREATE INDEX messages_embedding_hnsw_idx ON messages USING hnsw (embedding vector_cosine_ops)")

    op.create_table(
        "products",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("merchant_id", sa.String(), sa.ForeignKey("merchants.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("aliases", ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("variants", JSON(), nullable=False, server_default="{}"),
        sa.Column("embedding", pgvector.sqlalchemy.Vector(1024), nullable=True),
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("conversation_id", sa.String(), sa.ForeignKey("conversations.id"), nullable=False),
        sa.Column("extracted_payload", JSON(), nullable=False),
        sa.Column("confirmed_payload", JSON(), nullable=True),
        sa.Column("status", order_status, nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("extracted_by_tier", model_tier, nullable=False),
    )

    op.create_table(
        "labeled_examples",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("merchant_id", sa.String(), nullable=True),
        sa.Column("normalized_text", sa.String(), nullable=False),
        sa.Column("intent", sa.String(), nullable=False),
        sa.Column("extraction", JSON(), nullable=True),
        sa.Column("embedding", pgvector.sqlalchemy.Vector(1024), nullable=True),
        sa.Column("source", sa.String(), nullable=False),
    )
    op.execute("CREATE INDEX labeled_examples_embedding_hnsw_idx ON labeled_examples USING hnsw (embedding vector_cosine_ops)")


def downgrade() -> None:
    op.drop_index("labeled_examples_embedding_hnsw_idx", table_name="labeled_examples")
    op.drop_table("labeled_examples")
    op.drop_table("orders")
    op.drop_table("products")
    op.drop_index("messages_embedding_hnsw_idx", table_name="messages")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("merchants")
    sa.Enum(name="orderstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="modeltier").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="direction").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="convstate").drop(op.get_bind(), checkfirst=True)
