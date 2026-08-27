"""add product variants table

Revision ID: 4f209de00b23
Revises: 62d05723243d
Create Date: 2026-08-27 14:57:17.785096

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '4f209de00b23'
down_revision: Union[str, Sequence[str], None] = '62d05723243d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "product_variants",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("sku", sa.String(), nullable=True),
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("stock", sa.Integer(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("ACTIVE", "OUT_OF_STOCK", "DISCONTINUED", name="variantstatus"),
            server_default="ACTIVE",
            nullable=False,
        ),
        sa.Column("attributes", postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_product_variants_product_id", "product_variants", ["product_id"])
    op.drop_column("products", "variants")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        "products",
        sa.Column("variants", postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
    )
    op.drop_index("ix_product_variants_product_id", table_name="product_variants")
    op.drop_table("product_variants")
    sa.Enum(name="variantstatus").drop(op.get_bind(), checkfirst=True)
