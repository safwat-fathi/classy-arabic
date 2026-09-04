"""encrypt_page_access_token

Revision ID: ee5c64df2d8d
Revises: 892c0d02709a
Create Date: 2026-09-03 15:09:19.578486

"""

from collections.abc import Sequence

import sqlalchemy as sa
from cryptography.fernet import Fernet

from alembic import op
from app.core.config import settings

# revision identifiers, used by Alembic.
revision: str = "ee5c64df2d8d"
down_revision: str | Sequence[str] | None = "892c0d02709a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # We only want to run the data migration if ENCRYPTION_KEY is set.
    # Otherwise, it might be a fresh db init before env is fully configured.
    # But since it's required now, it should be set.
    if not settings.ENCRYPTION_KEY:
        print("Skipping page_access_token encryption: ENCRYPTION_KEY not set")
        return

    fernet = Fernet(settings.ENCRYPTION_KEY.encode())
    connection = op.get_bind()

    # Get all existing tokens
    results = connection.execute(
        sa.text("SELECT id, page_access_token FROM channel_connections WHERE page_access_token IS NOT NULL")
    )
    for row in results:
        conn_id = row[0]
        raw_token = row[1]

        # Skip if already encrypted (Fernet tokens start with gAAAAA and are long)
        if raw_token.startswith("gAAAAA") and len(raw_token) > 50:
            continue

        encrypted_token = fernet.encrypt(raw_token.encode()).decode()
        connection.execute(
            sa.text("UPDATE channel_connections SET page_access_token = :enc WHERE id = :id"),
            {"enc": encrypted_token, "id": conn_id},
        )


def downgrade() -> None:
    if not settings.ENCRYPTION_KEY:
        return

    fernet = Fernet(settings.ENCRYPTION_KEY.encode())
    connection = op.get_bind()

    results = connection.execute(
        sa.text("SELECT id, page_access_token FROM channel_connections WHERE page_access_token IS NOT NULL")
    )
    for row in results:
        conn_id = row[0]
        enc_token = row[1]

        try:
            raw_token = fernet.decrypt(enc_token.encode()).decode()
            connection.execute(
                sa.text("UPDATE channel_connections SET page_access_token = :raw WHERE id = :id"),
                {"raw": raw_token, "id": conn_id},
            )
        except Exception:
            pass  # Not a valid token, probably already raw
