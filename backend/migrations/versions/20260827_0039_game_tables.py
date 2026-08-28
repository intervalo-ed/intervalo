"""Tablas del minijuego de derivadas (game_players, game_template_stats,
game_exercises, game_attempts)

Bounded context aparte del motor SM-2 (ver backend/game/). Los jugadores pueden
ser guests (guest_token, user_id NULL) o estar linkeados a users; el XP del
juego vive en game_players.xp y no toca users.total_xp. La dificultad Elo por
plantilla se crea lazy desde código, así que esta migración no siembra datos.

Revision ID: 20260827_0039
Revises: 20260824_0038
Create Date: 2026-08-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260827_0039"
down_revision: Union[str, Sequence[str], None] = "20260824_0038"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = set(inspector.get_table_names())

    if "game_players" not in existing:
        op.create_table(
            "game_players",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("guest_token", sa.String(length=64), nullable=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("alias", sa.String(length=30), nullable=False),
            sa.Column("university", sa.String(length=120), nullable=True),
            sa.Column("career", sa.String(length=1), nullable=True),
            sa.Column("theta", sa.Float(), nullable=False, server_default="0"),
            sa.Column("n_updates", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("xp", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("current_combo", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("best_combo", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("best_rank", sa.Integer(), nullable=True),
            sa.Column("exercises_correct", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("exercises_attempted", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("first_group_id", sa.String(length=20), nullable=True),
            sa.Column("first_utm_source", sa.String(length=20), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("last_seen_at", sa.DateTime(), nullable=True),
            sa.UniqueConstraint("guest_token", name="uq_game_players_guest_token"),
            sa.UniqueConstraint("user_id", name="uq_game_players_user_id"),
            sa.UniqueConstraint("alias", name="uq_game_players_alias"),
        )
        op.create_index("ix_game_players_xp", "game_players", ["xp"])
        op.create_index("ix_game_players_first_group_id", "game_players", ["first_group_id"])

    if "game_template_stats" not in existing:
        op.create_table(
            "game_template_stats",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("template_key", sa.String(length=80), nullable=False),
            sa.Column("tier", sa.Integer(), nullable=False),
            sa.Column("beta", sa.Float(), nullable=False, server_default="0"),
            sa.Column("n_observations", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("n_correct", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.UniqueConstraint("template_key", name="uq_game_template_stats_key"),
        )

    if "game_exercises" not in existing:
        op.create_table(
            "game_exercises",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("player_id", sa.Integer(), sa.ForeignKey("game_players.id"), nullable=False),
            sa.Column("template_key", sa.String(length=80), nullable=False),
            sa.Column("params_json", sa.Text(), nullable=True),
            sa.Column("prompt_latex", sa.Text(), nullable=False),
            sa.Column("expected_derivative", sa.Text(), nullable=False),
            sa.Column("common_errors_json", sa.Text(), nullable=True),
            sa.Column("theta_at_serve", sa.Float(), nullable=False),
            sa.Column("beta_at_serve", sa.Float(), nullable=False),
            sa.Column("p_hat", sa.Float(), nullable=False),
            sa.Column("status", sa.String(length=10), nullable=False, server_default="served"),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("answered_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_game_exercises_template_key", "game_exercises", ["template_key"])
        op.create_index("idx_game_exercises_player_status", "game_exercises", ["player_id", "status"])

    if "game_attempts" not in existing:
        op.create_table(
            "game_attempts",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("exercise_id", sa.Integer(), sa.ForeignKey("game_exercises.id"), nullable=False),
            sa.Column("player_id", sa.Integer(), sa.ForeignKey("game_players.id"), nullable=False),
            sa.Column("attempt_number", sa.Integer(), nullable=False),
            sa.Column("answer_latex", sa.Text(), nullable=True),
            sa.Column("answer_parsed", sa.Text(), nullable=True),
            sa.Column("parse_ok", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("is_correct", sa.Boolean(), nullable=False),
            sa.Column("response_ms", sa.Integer(), nullable=True),
            sa.Column("xp_awarded", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("theta_before", sa.Float(), nullable=True),
            sa.Column("theta_after", sa.Float(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_game_attempts_exercise_id", "game_attempts", ["exercise_id"])
        op.create_index("ix_game_attempts_player_id", "game_attempts", ["player_id"])


def downgrade() -> None:
    op.drop_table("game_attempts")
    op.drop_table("game_exercises")
    op.drop_table("game_template_stats")
    op.drop_table("game_players")
