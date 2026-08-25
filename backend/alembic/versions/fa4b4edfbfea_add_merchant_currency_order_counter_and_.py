"""add merchant currency/order counter and product price

Revision ID: fa4b4edfbfea
Revises: 07adae190eec
Create Date: 2026-08-25 23:04:05.082271

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa4b4edfbfea'
down_revision: Union[str, Sequence[str], None] = '07adae190eec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('merchants', sa.Column('currency', sa.String(), server_default='EGP', nullable=False))
    op.add_column('merchants', sa.Column('next_order_number', sa.Integer(), server_default='1', nullable=False))
    op.add_column('products', sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('products', 'price')
    op.drop_column('merchants', 'next_order_number')
    op.drop_column('merchants', 'currency')
