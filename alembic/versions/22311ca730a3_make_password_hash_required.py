"""make password hash required

Revision ID: 22311ca730a3
Revises: 5126eee2bb92
Create Date: 2026-08-23 16:13:01.530780

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '22311ca730a3'
down_revision: Union[str, Sequence[str], None] = '5126eee2bb92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "users",
        "password_hash",
        existing_type=sa.String(length=255),
        nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "password_hash",
        existing_type=sa.String(length=255),
        nullable=True,
    )