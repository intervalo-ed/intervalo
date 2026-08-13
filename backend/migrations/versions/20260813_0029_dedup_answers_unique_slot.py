"""Dedup de answers por slot + unique index

El backend aceptaba respuestas repetidas para el mismo slot de una sesión: el
"ya respondiste este ejercicio" vivía solo en el useState del runner, así que un
back del navegador antes de que el summary limpiara el sessionStorage remontaba
el runner limpio y la segunda pasada insertaba 10 filas nuevas en answers,
inflaba exercises_correct por encima de exercises_total y pagaba el XP dos veces
(sesiones 995, 1023 y 1114 en producción).

La clave de dedup es el slot (session_id, exercise_id) y NO exercise_external_id:
una sesión más larga que el pool de la unidad repite externals legítimamente en
slots distintos (p. ej. práctica de 50 sobre un pool de 30, sesión 1036). Los
NULL (Answer sintético del onboarding) quedan exentos del unique en Postgres y
SQLite.

Esta migración borra los duplicados conservando la fila más antigua por slot,
descuenta el XP de las filas borradas de users.total_xp, recalcula
exercises_correct y xp_earned de las sesiones afectadas, y recién entonces crea
el índice único. El guard de aplicación vive en record_answer_db.

Revision ID: 20260813_0029
Revises: 20260812_0028
Create Date: 2026-08-13
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260813_0029"
down_revision: Union[str, Sequence[str], None] = "20260812_0028"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # Filas duplicadas: todo lo que no sea la más antigua (min id) de su slot.
    dup_rows = bind.execute(
        sa.text(
            """
            SELECT id, session_id, user_id, xp_earned
            FROM answers
            WHERE exercise_id IS NOT NULL
              AND id NOT IN (
                SELECT MIN(id) FROM answers
                WHERE exercise_id IS NOT NULL
                GROUP BY session_id, exercise_id
              )
            """
        )
    ).fetchall()

    if dup_rows:
        dup_ids = [r.id for r in dup_rows]
        affected_sessions = sorted({r.session_id for r in dup_rows})

        # XP inflado por usuario (se pagó en cada insert duplicado).
        xp_by_user: dict[int, int] = {}
        for r in dup_rows:
            xp_by_user[r.user_id] = xp_by_user.get(r.user_id, 0) + (r.xp_earned or 0)

        bind.execute(
            sa.text("DELETE FROM answers WHERE id IN :ids").bindparams(
                sa.bindparam("ids", expanding=True, value=dup_ids)
            )
        )

        for user_id, xp in xp_by_user.items():
            if xp:
                bind.execute(
                    sa.text(
                        """
                        UPDATE users
                        SET total_xp = CASE
                            WHEN total_xp >= :xp THEN total_xp - :xp ELSE 0
                        END
                        WHERE id = :uid
                        """
                    ).bindparams(xp=xp, uid=user_id)
                )

        # Contadores de sesión desde las filas que quedaron (misma cuenta que
        # hace get_summary_db al recalcular).
        bind.execute(
            sa.text(
                """
                UPDATE sessions SET
                  exercises_correct = (
                    SELECT COUNT(*) FROM answers a
                    WHERE a.session_id = sessions.id AND a.is_correct
                  ),
                  xp_earned = (
                    SELECT COALESCE(SUM(a.xp_earned), 0) FROM answers a
                    WHERE a.session_id = sessions.id
                  )
                WHERE id IN :sids
                """
            ).bindparams(sa.bindparam("sids", expanding=True, value=affected_sessions))
        )

    op.create_index(
        "uq_answers_session_slot",
        "answers",
        ["session_id", "exercise_id"],
        unique=True,
    )


def downgrade() -> None:
    # Las filas borradas eran datos corruptos; no se restauran.
    op.drop_index("uq_answers_session_slot", table_name="answers")
