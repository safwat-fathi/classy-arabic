"""add missing FK and intent indexes

Revision ID: fb2585d043c4
Revises: 278b7f901463
Create Date: 2026-08-23 08:04:51.220575

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "fb2585d043c4"
down_revision: str | Sequence[str] | None = "278b7f901463"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # NOTE: autogenerate also proposed dropping labeled_examples_embedding_hnsw_idx,
    # messages_embedding_hnsw_idx, and products_embedding_hnsw_idx — that's a false
    # positive. Those HNSW indexes were created with raw `op.execute(...)` in earlier
    # migrations (not a SQLAlchemy `Index()` the models declare), so autogenerate's
    # diff sees them as unmanaged and wants them gone. They are pgvector similarity
    # search's only index — dropping them would silently turn every cosine-distance
    # query back into a full table scan. Deliberately omitted here.
    op.create_index(op.f("ix_conversations_merchant_id"), "conversations", ["merchant_id"], unique=False)
    op.create_index(
        "ix_messages_conversation_id_created_at", "messages", ["conversation_id", "created_at"], unique=False
    )
    op.create_index(op.f("ix_messages_intent"), "messages", ["intent"], unique=False)
    op.create_index(op.f("ix_products_merchant_id"), "products", ["merchant_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_products_merchant_id"), table_name="products")
    op.drop_index(op.f("ix_messages_intent"), table_name="messages")
    op.drop_index("ix_messages_conversation_id_created_at", table_name="messages")
    op.drop_index(op.f("ix_conversations_merchant_id"), table_name="conversations")
