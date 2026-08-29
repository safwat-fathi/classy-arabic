"""add delivery areas and order delivery fee

Revision ID: 42a2a7e31122
Revises: fb95b9ae4001
Create Date: 2026-08-29 12:06:25.200190

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '42a2a7e31122'
down_revision: Union[str, Sequence[str], None] = 'fb95b9ae4001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "delivery_areas",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("merchant_id", sa.String(), nullable=False),
        sa.Column("area", sa.String(), nullable=False),
        sa.Column("delivery_fee", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("estimated_delivery", sa.String(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("ACTIVE", "INACTIVE", name="deliveryareastatus"),
            server_default="ACTIVE",
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["merchant_id"], ["merchants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_delivery_areas_merchant_id", "delivery_areas", ["merchant_id"])
    op.add_column("orders", sa.Column("delivery_fee", sa.Numeric(precision=10, scale=2), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("orders", "delivery_fee")
    op.drop_index("ix_delivery_areas_merchant_id", table_name="delivery_areas")
    op.drop_table("delivery_areas")
    sa.Enum(name="deliveryareastatus").drop(op.get_bind(), checkfirst=True)
