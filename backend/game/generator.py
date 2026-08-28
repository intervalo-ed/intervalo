"""Selección de plantilla y servida de ejercicios.

Política del reporte del motor adaptada al juego: rampa inicial por tier,
banda objetivo p̂ ∈ [0.70, 0.80] y ε-exploración hacia la plantilla con menos
observaciones. Anti-repetición: no servir ninguna de las últimas 3 plantillas.
"""

from __future__ import annotations

import json
import random
from datetime import datetime

import sympy
from sqlalchemy.orm import Session

from models import GameExercise, GamePlayer, GameTemplateStat

from . import elo
from .templates import TEMPLATE_BY_KEY, TEMPLATES, GameTemplate, latex_es, x

_RECENT_EXCLUDE = 3


def get_or_create_stat(db: Session, template: GameTemplate) -> GameTemplateStat:
    stat = (
        db.query(GameTemplateStat)
        .filter(GameTemplateStat.template_key == template.key)
        .first()
    )
    if stat is None:
        stat = GameTemplateStat(
            template_key=template.key,
            tier=template.tier,
            beta=elo.BETA_SEED.get(template.tier, 0.0),
        )
        db.add(stat)
        db.flush()
    return stat


def _recent_template_keys(db: Session, player: GamePlayer) -> set[str]:
    rows = (
        db.query(GameExercise.template_key)
        .filter(GameExercise.player_id == player.id)
        .order_by(GameExercise.id.desc())
        .limit(_RECENT_EXCLUDE)
        .all()
    )
    return {key for (key,) in rows}


def pick_template(
    db: Session,
    player: GamePlayer,
    rng: random.Random | None = None,
    max_tier: int | None = None,
) -> tuple[GameTemplate, GameTemplateStat, float]:
    """`max_tier` es el tope duro que usa el salteo: bajar el θ solo inclina la
    banda objetivo, y con el castigo chico el jugador podría recibir otra vez
    algo del mismo tier. El botón promete una más fácil, así que se garantiza."""
    rng = rng or random.Random()
    recent = _recent_template_keys(db, player)

    candidates = [t for t in TEMPLATES if t.key not in recent]
    if player.n_updates < elo.RAMP_UPDATES:
        ramped = [t for t in candidates if t.tier <= player.n_updates]
        # La exclusión de recientes puede vaciar un tier chico (T0 tiene 2
        # plantillas): en la rampa la variedad importa menos que el orden.
        if not ramped:
            ramped = [t for t in TEMPLATES if t.tier <= player.n_updates]
        candidates = ramped
    if max_tier is not None:
        easier = [t for t in candidates if t.tier <= max_tier]
        # Mismo criterio que la rampa: si el tope deja el set vacío, se prefiere
        # repetir una plantilla reciente antes que faltar a la promesa. Si ni
        # así hay nada (se salteó desde T0), el tope se ignora.
        if not easier:
            easier = [t for t in TEMPLATES if t.tier <= max_tier]
        if easier:
            candidates = easier
    if not candidates:
        candidates = list(TEMPLATES)

    scored: list[tuple[GameTemplate, GameTemplateStat, float]] = []
    for template in candidates:
        stat = get_or_create_stat(db, template)
        scored.append((template, stat, elo.predict(player.theta, stat.beta)))

    in_band = [s for s in scored if elo.TARGET_LOW <= s[2] <= elo.TARGET_HIGH]

    if rng.random() < elo.EPSILON:
        explore = [s for s in scored if elo.EXPLORE_LOW <= s[2] <= elo.EXPLORE_HIGH]
        if explore:
            return min(explore, key=lambda s: s[1].n_observations)

    if in_band:
        return rng.choice(in_band)
    return min(scored, key=lambda s: abs(s[2] - elo.TARGET_MID))


def serve_exercise(
    db: Session,
    player: GamePlayer,
    rng: random.Random | None = None,
    max_tier: int | None = None,
) -> GameExercise:
    """Expira lo servido pendiente, genera un ejercicio nuevo y lo persiste.
    No commitea: el endpoint es dueño de la transacción."""
    rng = rng or random.Random()

    db.query(GameExercise).filter(
        GameExercise.player_id == player.id,
        GameExercise.status == "served",
    ).update({"status": "expired"}, synchronize_session=False)

    template, stat, p_hat = pick_template(db, player, rng, max_tier=max_tier)
    generated = template.build(rng)
    derivative = sympy.diff(generated.f, x)

    exercise = GameExercise(
        player_id=player.id,
        template_key=template.key,
        # La instancia concreta, no los parámetros sueltos. `t1_pow` genera x² y
        # x⁷ con la misma beta y no cuestan lo mismo; el día que la dificultad se
        # abra por instancia (ver docs/reports/2026-08-27-elo-derivadas.md §4b)
        # va a hacer falta saber cuál se sirvió, y ese dato no se puede
        # reconstruir hacia atrás. Se guarda la expresión y no un dict de
        # parámetros porque no cuesta tocar las 26 plantillas y es estrictamente
        # más información: de la expresión salen los parámetros, al revés no.
        params_json=json.dumps({"f": str(generated.f)}),
        prompt_latex=generated.prompt_latex or latex_es(generated.f),
        expected_derivative=str(derivative),
        common_errors_json=json.dumps(
            [{"expr": str(expr), "feedback": feedback} for expr, feedback in generated.common_errors]
        ),
        theta_at_serve=player.theta,
        beta_at_serve=stat.beta,
        p_hat=p_hat,
        status="served",
        created_at=datetime.utcnow(),
    )
    db.add(exercise)
    player.last_seen_at = datetime.utcnow()
    db.flush()
    return exercise


def template_for(exercise: GameExercise) -> GameTemplate | None:
    return TEMPLATE_BY_KEY.get(exercise.template_key)
