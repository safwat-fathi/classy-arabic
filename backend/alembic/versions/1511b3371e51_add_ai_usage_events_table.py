"""add_ai_usage_events_table

Revision ID: 1511b3371e51
Revises: 0fe57d0d5041
Create Date: 2026-08-24 18:00:47.272651

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "1511b3371e51"
down_revision: str | Sequence[str] | None = "0fe57d0d5041"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # NOTE: autogenerate also proposed dropping labeled_examples_embedding_hnsw_idx,
    # messages_embedding_hnsw_idx, and products_embedding_hnsw_idx. Those are false
    # positives: they were created via raw `op.execute("CREATE INDEX ... USING hnsw ...")`
    # in earlier migrations (see 1689c340b77d and friends) rather than as declarative
    # SQLAlchemy Index objects, so they aren't represented in Base.metadata and
    # autogenerate thinks they're extraneous. Deliberately omitted here — dropping them
    # would silently remove production vector-search indexes.
    op.create_table(
        "ai_usage_events",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("conversation_id", sa.String(), nullable=True),
        sa.Column("message_id", sa.String(), nullable=True),
        sa.Column("tier", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("model", sa.String(), nullable=False),
        sa.Column("input_tokens", sa.Integer(), nullable=True),
        sa.Column("output_tokens", sa.Integer(), nullable=True),
        sa.Column("latency_ms", sa.Float(), nullable=False),
        sa.Column("estimated_cost", sa.Float(), nullable=True),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"]),
        sa.ForeignKeyConstraint(["message_id"], ["messages.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_usage_events_conversation_id"), "ai_usage_events", ["conversation_id"], unique=False)
    op.create_index(op.f("ix_ai_usage_events_message_id"), "ai_usage_events", ["message_id"], unique=False)
    op.create_index(op.f("ix_ai_usage_events_tier"), "ai_usage_events", ["tier"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_ai_usage_events_tier"), table_name="ai_usage_events")
    op.drop_index(op.f("ix_ai_usage_events_message_id"), table_name="ai_usage_events")
    op.drop_index(op.f("ix_ai_usage_events_conversation_id"), table_name="ai_usage_events")
    op.drop_table("ai_usage_events")
