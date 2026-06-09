"""Add username column to users (Instagram-style handle)

Revision ID: 20260609_0003
Revises: 20260608_0003
Create Date: 2026-06-09
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260609_0003"
down_revision: Union[str, Sequence[str], None] = "20260608_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("username", sa.String(30), nullable=True),
    )
    op.create_index(
        op.f("ix_users_username"), "users", ["username"], unique=True
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_column("users", "username")
