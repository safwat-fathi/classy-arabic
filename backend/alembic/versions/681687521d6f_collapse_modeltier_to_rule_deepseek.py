"""collapse modeltier to rule deepseek

Revision ID: 681687521d6f
Revises: 1511b3371e51
Create Date: 2026-08-25 00:17:04.277560

"""

from collections.abc import Sequence

from sqlalchemy.dialects.postgresql import ENUM

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "681687521d6f"
down_revision: str | Sequence[str] | None = "1511b3371e51"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_TABLES_AND_COLUMNS = (("messages", "model_tier"), ("orders", "extracted_by_tier"))


def upgrade() -> None:
    # NILECHAT and ESCALATED both collapse to DEEPSEEK — once there's only one
    # LLM, "ran on tier 1" and "escalated to tier 2" are the same fact ("the
    # LLM handled this"). Postgres has no ALTER TYPE ... DROP VALUE, so this
    # recreates the type: rename the old one out of the way, create the new
    # 2-value type under the original name, cast every column across via a
    # CASE mapping, then drop the old type.
    op.execute("ALTER TYPE modeltier RENAME TO modeltier_old")
    new_enum = ENUM("RULE", "DEEPSEEK", name="modeltier", create_type=False)
    new_enum.create(op.get_bind(), checkfirst=True)
    for table, column in _TABLES_AND_COLUMNS:
        op.execute(
            f"ALTER TABLE {table} ALTER COLUMN {column} TYPE modeltier "
            f"USING (CASE {column}::text "
            f"WHEN 'NILECHAT' THEN 'DEEPSEEK' "
            f"WHEN 'ESCALATED' THEN 'DEEPSEEK' "
            f"ELSE {column}::text END)::modeltier"
        )
    op.execute("DROP TYPE modeltier_old")


def downgrade() -> None:
    # Data loss is inherent here: a DEEPSEEK row written after the upgrade
    # can't be un-collapsed into "was it NILECHAT or ESCALATED" — it maps
    # back to ESCALATED (the more conservative of the two: "needed the LLM
    # and nothing said it was routine").
    op.execute("ALTER TYPE modeltier RENAME TO modeltier_new")
    old_enum = ENUM("RULE", "NILECHAT", "ESCALATED", name="modeltier", create_type=False)
    old_enum.create(op.get_bind(), checkfirst=True)
    for table, column in _TABLES_AND_COLUMNS:
        op.execute(
            f"ALTER TABLE {table} ALTER COLUMN {column} TYPE modeltier "
            f"USING (CASE {column}::text "
            f"WHEN 'DEEPSEEK' THEN 'ESCALATED' "
            f"ELSE {column}::text END)::modeltier"
        )
    op.execute("DROP TYPE modeltier_new")
