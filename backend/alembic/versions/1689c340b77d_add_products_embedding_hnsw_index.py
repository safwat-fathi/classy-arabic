"""add products embedding hnsw index

Revision ID: 1689c340b77d
Revises: 2d17ac4bd857
Create Date: 2026-08-22 19:40:06.289842

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "1689c340b77d"
down_revision: str | Sequence[str] | None = "2d17ac4bd857"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE INDEX products_embedding_hnsw_idx ON products USING hnsw (embedding vector_cosine_ops)")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("products_embedding_hnsw_idx", table_name="products")
