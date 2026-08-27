"""add merchant auth fields and labeled_example merchant fk

Revision ID: fb95b9ae4001
Revises: 25279edfb0ed
Create Date: 2026-08-28 02:12:12.549753

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fb95b9ae4001'
down_revision: Union[str, Sequence[str], None] = '25279edfb0ed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Unlike op.create_table, op.add_column does not implicitly CREATE TYPE
    # for an sa.Enum column — the type must be created explicitly first, same
    # as migration 258125eec0a2 does for "ordersource".
    sa.Enum("ACTIVE", "SUSPENDED", name="merchantstatus").create(op.get_bind(), checkfirst=False)
    op.add_column(
        "merchants",
        sa.Column(
            "status",
            sa.Enum("ACTIVE", "SUSPENDED", name="merchantstatus"),
            server_default="ACTIVE",
            nullable=False,
        ),
    )
    op.add_column("merchants", sa.Column("facebook_user_id", sa.String(), nullable=True))
    op.create_unique_constraint("uq_merchants_facebook_user_id", "merchants", ["facebook_user_id"])

    # Backfill before adding the FK: every existing labeled_examples.merchant_id
    # today references a merchant row that no longer exists (verified live
    # against this dev DB), so a straight `create_foreign_key` would fail
    # immediately on existing data. NULL out the orphans first — same
    # precedent as migration 258125eec0a2's merchant_id backfill, which also
    # runs before the constraint that depends on the column being clean.
    op.execute(
        "UPDATE labeled_examples SET merchant_id = NULL "
        "WHERE merchant_id IS NOT NULL AND merchant_id NOT IN (SELECT id FROM merchants)"
    )
    op.create_foreign_key(
        "fk_labeled_examples_merchant_id_merchants",
        "labeled_examples",
        "merchants",
        ["merchant_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("fk_labeled_examples_merchant_id_merchants", "labeled_examples", type_="foreignkey")
    # The orphan-cleanup backfill above is not reversed here: the pre-existing
    # orphaned merchant_id strings it NULLed out are gone for good, and there
    # is no record of what they were to restore.
    op.drop_constraint("uq_merchants_facebook_user_id", "merchants", type_="unique")
    op.drop_column("merchants", "facebook_user_id")
    op.drop_column("merchants", "status")
    sa.Enum(name="merchantstatus").drop(op.get_bind(), checkfirst=True)
