"""harden order and add order_items

Revision ID: 258125eec0a2
Revises: 59f0a9f00cb5
Create Date: 2026-08-25 23:07:18.400576

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "258125eec0a2"
down_revision: str | Sequence[str] | None = "59f0a9f00cb5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "order_items",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("order_id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=True),
        sa.Column("name_snapshot", sa.String(), nullable=False),
        sa.Column("variant_snapshot", sa.String(), nullable=True),
        sa.Column("unit_price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.id"],
        ),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_order_items_order_id"), "order_items", ["order_id"], unique=False)
    op.create_index(op.f("ix_order_items_product_id"), "order_items", ["product_id"], unique=False)
    op.add_column("orders", sa.Column("merchant_id", sa.String(), nullable=True))
    sa.Enum("AI_EXTRACTION", "CART_CHECKOUT", name="ordersource").create(op.get_bind(), checkfirst=False)
    op.add_column(
        "orders",
        sa.Column(
            "source",
            sa.Enum("AI_EXTRACTION", "CART_CHECKOUT", name="ordersource"),
            server_default="AI_EXTRACTION",
            nullable=False,
        ),
    )
    op.add_column("orders", sa.Column("cart_id", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("order_number", sa.Integer(), nullable=True))
    op.add_column("orders", sa.Column("customer_name", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("customer_phone", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("delivery_address", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("subtotal", sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column("orders", sa.Column("total", sa.Numeric(precision=10, scale=2), nullable=True))
    # Backfill merchant_id from the order's conversation before tightening
    # nullability — there is no way to add a NOT NULL column to a table with
    # existing rows otherwise.
    op.execute(
        """
        UPDATE orders SET merchant_id = conversations.merchant_id
        FROM conversations WHERE orders.conversation_id = conversations.id
        """
    )
    op.alter_column("orders", "merchant_id", nullable=False)
    op.create_index(op.f("ix_orders_merchant_id"), "orders", ["merchant_id"], unique=False)
    op.create_unique_constraint("uq_orders_merchant_order_number", "orders", ["merchant_id", "order_number"])
    op.create_foreign_key("fk_orders_cart_id_carts", "orders", "carts", ["cart_id"], ["id"])
    op.create_foreign_key("fk_orders_merchant_id_merchants", "orders", "merchants", ["merchant_id"], ["id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("fk_orders_merchant_id_merchants", "orders", type_="foreignkey")
    op.drop_constraint("fk_orders_cart_id_carts", "orders", type_="foreignkey")
    op.drop_constraint("uq_orders_merchant_order_number", "orders", type_="unique")
    op.drop_index(op.f("ix_orders_merchant_id"), table_name="orders")
    op.drop_column("orders", "total")
    op.drop_column("orders", "subtotal")
    op.drop_column("orders", "delivery_address")
    op.drop_column("orders", "customer_phone")
    op.drop_column("orders", "customer_name")
    op.drop_column("orders", "order_number")
    op.drop_column("orders", "cart_id")
    op.drop_column("orders", "source")
    op.drop_column("orders", "merchant_id")
    op.drop_index(op.f("ix_order_items_product_id"), table_name="order_items")
    op.drop_index(op.f("ix_order_items_order_id"), table_name="order_items")
    op.drop_table("order_items")
    sa.Enum(name="ordersource").drop(op.get_bind(), checkfirst=True)
