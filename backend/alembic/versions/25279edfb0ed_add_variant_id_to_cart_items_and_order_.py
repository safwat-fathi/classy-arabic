"""add variant_id to cart_items and order_items

Revision ID: 25279edfb0ed
Revises: 4f209de00b23
Create Date: 2026-08-27 21:39:03.103960

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '25279edfb0ed'
down_revision: Union[str, Sequence[str], None] = '4f209de00b23'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("cart_items", sa.Column("variant_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_cart_items_variant_id_product_variants",
        "cart_items",
        "product_variants",
        ["variant_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_cart_items_variant_id", "cart_items", ["variant_id"])
    # Dropping this is mandatory: if it survived alongside the two new
    # partial indexes below, two variants of the same product could never
    # coexist in a cart (this constraint would reject the second row
    # outright, since it does not know about variant_id at all).
    op.drop_constraint("uq_cart_items_cart_product", "cart_items", type_="unique")
    op.create_index(
        "uq_cart_items_cart_product_no_variant",
        "cart_items",
        ["cart_id", "product_id"],
        unique=True,
        postgresql_where=sa.text("variant_id IS NULL"),
    )
    op.create_index(
        "uq_cart_items_cart_product_variant",
        "cart_items",
        ["cart_id", "product_id", "variant_id"],
        unique=True,
        postgresql_where=sa.text("variant_id IS NOT NULL"),
    )

    op.add_column("order_items", sa.Column("variant_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_order_items_variant_id_product_variants",
        "order_items",
        "product_variants",
        ["variant_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_order_items_variant_id", "order_items", ["variant_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_order_items_variant_id", table_name="order_items")
    op.drop_constraint("fk_order_items_variant_id_product_variants", "order_items", type_="foreignkey")
    op.drop_column("order_items", "variant_id")

    op.drop_index(
        "uq_cart_items_cart_product_variant", table_name="cart_items", postgresql_where=sa.text("variant_id IS NOT NULL")
    )
    op.drop_index(
        "uq_cart_items_cart_product_no_variant", table_name="cart_items", postgresql_where=sa.text("variant_id IS NULL")
    )
    op.create_unique_constraint("uq_cart_items_cart_product", "cart_items", ["cart_id", "product_id"])
    op.drop_index("ix_cart_items_variant_id", table_name="cart_items")
    op.drop_constraint("fk_cart_items_variant_id_product_variants", "cart_items", type_="foreignkey")
    op.drop_column("cart_items", "variant_id")
