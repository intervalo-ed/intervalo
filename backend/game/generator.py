"""Selección de plantilla y servida de ejercicios.

Política del reporte del motor adaptada al juego: rampa inicial por tier,
banda objetivo p̂ ∈ [0.70, 0.80] y ε-exploración hacia la plantilla con menos
observaciones. Anti-repetición: no servir ninguna de las últimas _RECENT_EXCLUDE
plantillas, y antes de romper esa regla se prueba ensanchando la banda.
"""

from __future__ import annotations

import json
import random
from datetime import datetime

import sympy
from sqlalchemy.orm import Session

from models import GameExercise, GamePlayer, GameTemplateStat

from . import elo
from .cycler import CyclingRandom, ForcedRandom
from .templates import TEMPLATE_BY_KEY, TEMPLATES, GameTemplate, latex_es, x

# Cuántas de las últimas plantillas servidas quedan fuera de juego.
#
# Estuvo en 3, y 3 fabricaba un ciclo de 4. La banda objetivo tiene entre 3 y 8
# plantillas según el θ; restarle las 3 recientes dejaba a menudo UNA sola
# candidata legal, y `rng.choice` sobre una lista de uno no es azar. Medido en
# producción sobre 7.838 ejercicios: la repetición de enunciado era del 2,4% en
# los primeros diez, 50,1% entre el 26 y el 50, y 77,5% del 51 en adelante; un
# jugador contó «4 veces la misma en 10 oportunidades consecutivas», que es
# exactamente la salida esperada de un ciclo de 4.
#
# Ocho no sale de una simulación sino de la forma del problema: es lo que hace
# falta para que la ventana tape una tanda entera de las que la gente hace de
# una sentada, y es el número a partir del cual la escalera de abajo —ensanchar
# la banda antes que repetir— empieza a hacer el trabajo pesado.
_RECENT_EXCLUDE = 8

# La escalera de rescate, en orden de preferencia.
#
# Antes había tres ramas que, al quedarse sin candidatas, devolvían EN SILENCIO
# las recién vistas. Con una ventana de 8 sobre una banda de 3 a 8 plantillas,
# esas ramas pasarían a ser el camino normal, así que el orden se invierte:
# primero se afloja la DIFICULTAD y solo después la ventana.
#
# El criterio es que una derivada un poco mal calibrada se nota menos que la
# cuarta vez de la misma. Una fuera de banda sigue siendo una derivada que la
# persona no vio; la repetida ya no es un ejercicio, es una transcripción — y es
# lo que el reporte llamó «demasiado mecánico, podría liquidar el entusiasmo».
_BANDAS = (
    (elo.TARGET_LOW, elo.TARGET_HIGH),
    (0.55, 0.92),
    (0.35, 0.98),
)

# Y recién si NINGUNA banda tiene candidatas se acorta la ventana, de a pedazos y
# no tirándola entera: 4 y 2 todavía tapan la vuelta inmediata, que es la que se
# nota. El 0 final está para que la función no pueda quedarse sin nada que servir
# — es la garantía de terminación, no una opción.
_VENTANAS = (_RECENT_EXCLUDE, 4, 2, 0)

# Los primeros ejercicios que ve CUALQUIER jugador nuevo, fijos, para no
# depender de cómo caiga el Elo/la rampa en el arranque: x, x² y 2x², de más
# angosto a un poco más armado, para amigarse con el juego antes de que el
# motor empiece a elegir. Se cuenta por EJERCICIOS SERVIDOS en total, no por
# respuestas — un jugador nuevo no eligió nada todavía, así que "los primeros
# 3 que ve" es la cuenta correcta aunque salteé alguno.
ONBOARDING: tuple[tuple[str, dict], ...] = (
    ("t0_x", {}),
    ("t1_pow", {"n": 2}),
    ("t1_kpow", {"k": 2, "n": 2}),
)


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


def stats_for(db: Session, templates: list[GameTemplate]) -> dict[str, GameTemplateStat]:
    """Las estadísticas de varias plantillas, en UNA consulta.

    `get_or_create_stat` una por una era el N+1 más caro del juego: hay 26
    plantillas, así que servir un ejercicio disparaba hasta 26 SELECT contra una
    tabla que como mucho tiene 26 filas — y servir un ejercicio es lo que pasa
    después de cada respuesta. Se traen todas juntas y solo se crean las que
    falten, que después de las primeras partidas no es ninguna.
    """
    faltan = {t.key: t for t in templates}
    encontradas = {
        stat.template_key: stat
        for stat in db.query(GameTemplateStat).filter(
            GameTemplateStat.template_key.in_(list(faltan))
        )
    }
    nuevas = False
    for key, template in faltan.items():
        if key in encontradas:
            continue
        stat = GameTemplateStat(
            template_key=key,
            tier=template.tier,
            beta=elo.BETA_SEED.get(template.tier, 0.0),
        )
        db.add(stat)
        encontradas[key] = stat
        nuevas = True
    if nuevas:
        db.flush()
    return encontradas


def beta_of(stat: GameTemplateStat) -> float:
    """La dificultad que el motor le cree a una plantilla.

    Existe para que ningún punto de decisión lea `stat.beta` crudo por
    distracción: la β cruda es el estadístico, esta es la creencia.

    `n_players` y no `n_observations`: el ancla se pesa en personas distintas,
    porque veinte respuestas de una sola no son veinte datos sobre la
    plantilla."""
    return elo.effective_beta(stat.beta, stat.tier, stat.n_players)


def _recent_template_keys(db: Session, player: GamePlayer) -> list[str]:
    """Las últimas plantillas servidas, de la más reciente a la más vieja.

    Lista y no conjunto: la escalera de `pick_template` acorta la ventana cuando
    se queda sin candidatas, y para acortarla hay que saber cuál es la más vieja.
    """
    rows = (
        db.query(GameExercise.template_key)
        .filter(GameExercise.player_id == player.id)
        .order_by(GameExercise.id.desc())
        .limit(_RECENT_EXCLUDE)
        .all()
    )
    return [key for (key,) in rows]


def desbloqueadas(player: GamePlayer) -> list[GameTemplate]:
    """Las plantillas que este jugador tiene permitido recibir hoy.

    El piso se compara contra el rating y no contra θ porque es la unidad en la
    que está escrito el criterio y la que ve el jugador en el panel: «hasta
    1200 no hay trigonométricas» se lee igual en el código que en la pantalla.

    Se mide contra el rating DE AHORA y no contra el máximo histórico, así que
    alguien parado justo en la línea puede verlas aparecer y desaparecer. Es a
    propósito mientras el piso sea uno solo: guardar el máximo alcanzado es una
    columna nueva, y la diferencia solo la nota quien orbita el umbral.
    """
    rating = elo.rating_of(player.theta)
    return [t for t in TEMPLATES if t.min_rating is None or rating >= t.min_rating]


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

    # `permitidas` y no TEMPLATES en TODAS las ramas de acá abajo: cada rescate
    # está para no quedarse sin nada que servir, y si alguno volviera a la lista
    # completa el piso de rating se evaporaría justo en el caso raro. Nunca queda
    # vacía —T0 no tiene piso—.
    permitidas = desbloqueadas(player)
    if player.n_updates < elo.RAMP_UPDATES:
        permitidas = [t for t in permitidas if t.tier <= player.n_updates] or permitidas
    if max_tier is not None:
        # El tope del salteo se aplica ACÁ y no como un filtro más adelante: el
        # botón promete una más fácil, así que es parte de qué se puede servir y
        # no algo que la escalera pueda aflojar. Si ni así hay nada (se salteó
        # desde T0), se ignora.
        permitidas = [t for t in permitidas if t.tier <= max_tier] or permitidas

    stats = stats_for(db, permitidas)
    # `effective_beta` y no `stat.beta`: la β guardada de una plantilla que
    # todavía vio poca gente está dominada por quien haya pasado por ahí, y a
    # quien pasa lo elige este mismo motor. Ver el docstring de elo.effective_beta.
    scored: list[tuple[GameTemplate, GameTemplateStat, float]] = [
        (template, stats[template.key], elo.predict(player.theta, beta_of(stats[template.key])))
        for template in permitidas
    ]

    # ε-exploración: manda sobre todo lo demás cuando toca, pero respeta la
    # ventana entera. Es un desempate entre plantillas poco vistas, o sea que si
    # la única candidata es una que la persona acaba de hacer, no hay nada que
    # explorar y se sigue de largo.
    if rng.random() < elo.EPSILON:
        explore = [
            s
            for s in scored
            if elo.EXPLORE_LOW <= s[2] <= elo.EXPLORE_HIGH and s[0].key not in recent
        ]
        if explore:
            return min(explore, key=lambda s: s[1].n_observations)

    # La escalera: primero se afloja la dificultad, después la ventana. El orden
    # es el que dice el comentario de _BANDAS — repetir es lo último.
    for ventana in _VENTANAS:
        vetadas = set(recent[:ventana])
        libres = [s for s in scored if s[0].key not in vetadas]
        if not libres:
            continue
        for low, high in _BANDAS:
            en_banda = [s for s in libres if low <= s[2] <= high]
            if en_banda:
                return rng.choice(en_banda)
        # Ninguna banda tuvo candidatas con esta ventana, pero HAY plantillas
        # libres: antes de acortar la ventana se sirve la más cercana al centro.
        # Es el caso del jugador que se pasó de rosca —en θ alto todo el catálogo
        # queda por debajo de la banda más ancha— y ahí lo correcto es darle lo
        # más difícil que haya sin repetir, no repetir lo más difícil que haya.
        return min(libres, key=lambda s: abs(s[2] - elo.TARGET_MID))

    # Inalcanzable mientras `_VENTANAS` termine en 0 y `permitidas` no esté vacía
    # (T0 no tiene piso de rating). Queda por si alguna de las dos cosas cambia.
    return min(scored, key=lambda s: abs(s[2] - elo.TARGET_MID))


def _build_cycled(player: GamePlayer, template: GameTemplate, rng: random.Random):
    """Genera la instancia de `template`, ciclando sus números por jugador.

    Namespacea las ranuras por `template_key:` para que dos plantillas con una
    ranura del mismo nombre (ej. "k") no se pisen dentro del mismo blob."""
    prefix = f"{template.key}:"
    full = json.loads(player.numeric_cycle_json or "{}")
    propio = {k[len(prefix):]: v for k, v in full.items() if k.startswith(prefix)}

    generated = template.build(CyclingRandom(rng, propio))

    for k in list(full):
        if k.startswith(prefix):
            del full[k]
    full.update({prefix + k: v for k, v in propio.items()})
    player.numeric_cycle_json = json.dumps(full)
    return generated


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

    served = db.query(GameExercise).filter(GameExercise.player_id == player.id).count()
    if served < len(ONBOARDING):
        key, forced_values = ONBOARDING[served]
        template = TEMPLATE_BY_KEY[key]
        stat = get_or_create_stat(db, template)
        p_hat = elo.predict(player.theta, beta_of(stat))
        generated = template.build(ForcedRandom(forced_values))
    else:
        template, stat, p_hat = pick_template(db, player, rng, max_tier=max_tier)
        generated = _build_cycled(player, template, rng)
    derivative = sympy.diff(generated.f, x)

    exercise = GameExercise(
        player_id=player.id,
        template_key=template.key,
        # La instancia concreta, no los parámetros sueltos. `t1_pow` genera x² y
        # x⁷ con la misma beta y no cuestan lo mismo; el día que la dificultad se
        # abra por instancia (ver docs/reports/2026-08-27-elo-derivadas.md §4b)
        # va a hacer falta saber cuál se sirvió, y ese dato no se puede
        # reconstruir hacia atrás. Se guarda la expresión y no un dict de
        # parámetros porque no cuesta tocar las 29 plantillas y es estrictamente
        # más información: de la expresión salen los parámetros, al revés no.
        params_json=json.dumps({"f": str(generated.f)}),
        prompt_latex=generated.prompt_latex or latex_es(generated.f),
        expected_derivative=str(derivative),
        common_errors_json=json.dumps(
            [{"expr": str(expr), "feedback": feedback} for expr, feedback in generated.common_errors]
        ),
        theta_at_serve=player.theta,
        # Se guarda la β CREÍDA y no la cruda, porque es la que produjo este
        # `p_hat`: si se guardara la otra, la calibración del panel compararía
        # una predicción contra una dificultad que no la generó.
        beta_at_serve=beta_of(stat),
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
