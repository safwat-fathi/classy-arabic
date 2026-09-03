"""add_page_access_token_and_manual_order_source

Revision ID: 892c0d02709a
Revises: 1fc35ea104f4
Create Date: 2026-09-03 10:21:23.835488

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "892c0d02709a"
down_revision: str | Sequence[str] | None = "1fc35ea104f4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("channel_connections", sa.Column("page_access_token", sa.String(), nullable=True))
    # Alembic doesn't auto-detect new enum values; add MANUAL to the
    # existing ordersource enum.  ALTER TYPE ... ADD VALUE cannot run
    # inside a transaction, so we commit the implicit transaction first.
    op.execute("COMMIT")
    op.execute("ALTER TYPE ordersource ADD VALUE IF NOT EXISTS 'MANUAL'")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("channel_connections", "page_access_token")
    # PostgreSQL does not support removing a value from an enum type.
    # The MANUAL value will remain harmless if the downgrade is run.
