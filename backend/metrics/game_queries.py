"""Métricas del minijuego de derivadas, en un payload de dicts planos.

Mismo criterio que `metrics/queries.py`: un `SELECT` por tabla y el resto es
Python. Los motivos son los mismos (dev en SQLite, producción en Postgres, datos
chicos), y arriba de eso hay uno propio del juego: acá casi ninguna métrica es
una agregación. La curva de supervivencia por número de ejercicio, la
calibración del Elo y la sesionización por huecos son recorridos sobre series
ordenadas, y escribirlos en SQL portable sería peor código para el mismo
resultado.

**Definiciones que no se negocian.** Son las que, si se aflojan, convierten el
panel en un generador de números lindos:

  - **Estudiante** = fila de `game_players` con `is_bot = false`. Los sembrados
    pueblan el ranking para que el primero en llegar tenga a quién escalar
    (scripts/seed_game_bots.py); contarlos como gente inflaría todo.
  - **Respuesta** = intento con `parse_ok = true`. Lo que no parsea se registra
    igual pero vive en su propia sección: es fricción del input, no matemática.
  - **P1** = aciertos al PRIMER intento sobre primeros intentos, **excluyendo
    los ejercicios con la tabla abierta**. Con la tabla a la vista la derivada
    deja de ser una pregunta, y mezclar esas respuestas sube el P1 sin que nadie
    haya resuelto nada. Es el mismo espíritu del `quality_score = 5` de
    Intervalo: la tasa que importa es la del primer intento limpio.
  - **Derivada resuelta** = acierto. Un ejercicio se cierra al acertar o al
    gastar el segundo intento, así que no hay doble conteo.
  - **Activo en la semana** = al menos una respuesta en esa semana.
  - **Sesión de juego** = tanda de respuestas separadas por menos de
    `SESSION_GAP_MINUTES`. El juego no tiene un objeto «sesión» —se entra por un
    link y se juega hasta que uno se cansa— así que la sesión se reconstruye por
    huecos, que es la única definición disponible y hay que decirlo en voz alta.

**Zona horaria.** Igual que el panel de Intervalo: columnas naive en UTC, el día
del negocio es el de Argentina, todo pasa por `local_date()`. Semanas de lunes a
domingo.
"""
from __future__ import annotations

import statistics
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session as DBSession

from .queries import REAL_MODES, _pct, _rows, local_date, week_start

# Hueco que corta una sesión de juego. Media hora es lo que dura un empuje de
# cafecito y lo que la industria usa como default de sesión; lo importante no es
# el número exacto sino que sea UNO y esté escrito en un solo lugar.
SESSION_GAP_MINUTES = 30

# Bins de p̂ para la calibración y para todo lo que se corta por dificultad.
# Los bordes 0,70 y 0,80 no son redondeo: son los de la banda objetivo
# (elo.TARGET_LOW / TARGET_HIGH), así que la columna del medio es exactamente
# «lo que el motor intentó servir».
PHAT_BINS: tuple[float, ...] = (0.0, 0.40, 0.55, 0.70, 0.80, 0.90, 1.01)
PHAT_LABELS: tuple[str, ...] = ("<40%", "40–55%", "55–70%", "70–80%", "80–90%", ">90%")

# Hitos que el producto ya usa para decidir cosas: a las 5 se pide la universidad, a
# las 12 el registro, cada 25 aparece el cafecito (desktop-layout.tsx). El panel
# los marca para poder ver si el escalón de abandono cae JUSTO ahí, que sería el
# producto pinchando su propia partida.
MILESTONES: tuple[int, ...] = (1, 3, 5, 10, 12, 20, 25, 40)

# Hasta dónde se dibuja la curva de supervivencia por ejercicio.
DEPTH_MAX = 40

# Una partida se considera CERRADA si el estudiante no respondió nada en las
# últimas 24 h. La supervivencia se calcula solo sobre partidas cerradas: quien
# está jugando ahora mismo todavía puede sumar ejercicios, y meterlo en el
# denominador hunde la cola por reloj y no por comportamiento — el mismo error
# que ya se corrigió en la retención D+k del panel de Intervalo.
CLOSED_AFTER_HOURS = 24

# Base mínima para reportar una discrepancia entre el modelo y la realidad. Con
# menos observaciones la beta de la plantilla sigue siendo casi la semilla de su
# tier, así que la diferencia mide desconocimiento y no desajuste.
MIN_OBS_TEMPLATE = 20


def _week_of(dt: datetime | None) -> date | None:
    d = local_date(dt)
    return None if d is None else week_start(d)


def _median(values: list[float]) -> float | None:
    return round(statistics.median(values), 1) if values else None


def _p(values: list[float], q: float) -> float | None:
    """Percentil por interpolación, sin numpy. `q` en 0..1."""
    if not values:
        return None
    s = sorted(values)
    if len(s) == 1:
        return round(float(s[0]), 1)
    pos = q * (len(s) - 1)
    lo = int(pos)
    hi = min(lo + 1, len(s) - 1)
    return round(s[lo] + (s[hi] - s[lo]) * (pos - lo), 1)


def _bin_index(value: float) -> int:
    for i in range(len(PHAT_BINS) - 1):
        if PHAT_BINS[i] <= value < PHAT_BINS[i + 1]:
            return i
    return len(PHAT_LABELS) - 1


# ── Carga ────────────────────────────────────────────────────────────────────

def load(db: DBSession) -> dict:
    """Un SELECT por tabla, solo las columnas que se usan.

    `users` y `sessions` de Intervalo entran acá aunque no sean del juego: son
    lo único que puede contestar si el minijuego trae gente al producto, que es
    la otra razón por la que el minijuego existe además de la donación.
    """
    data = {
        "players": _rows(db, """
            SELECT id, user_id, alias, university, career, theta, n_updates, xp,
                   best_combo, best_rank, exercises_correct, exercises_attempted,
                   unlocked_keys, first_group_id, first_utm_source, platform, is_bot,
                   created_at, last_seen_at
            FROM game_players"""),
        "exercises": _rows(db, """
            SELECT id, player_id, template_key, theta_at_serve, beta_at_serve,
                   p_hat, status, peeked, platform, created_at, answered_at
            FROM game_exercises"""),
        "attempts": _rows(db, """
            SELECT id, exercise_id, player_id, attempt_number, parse_ok, is_correct,
                   response_ms, xp_awarded, theta_before, theta_after, created_at
            FROM game_attempts"""),
        "templates": _rows(db, """
            SELECT template_key, tier, beta, n_observations, n_correct
            FROM game_template_stats"""),
        "boosts": _rows(db, """
            SELECT id, university, cafecitos, donor_name, source, created_at, expires_at
            FROM game_boosts"""),
        "cta": _rows(db, """
            SELECT player_id, cta, action, placement, solved, university, created_at
            FROM game_cta_events"""),
        "events": _rows(db, "SELECT kind, university, player_id, created_at FROM game_events"),
        "users": _rows(db, "SELECT id, created_at FROM users"),
        "sessions": _rows(db, "SELECT user_id, mode, started_at, finished_at FROM sessions"),
    }

    # Los bots se sacan UNA vez, acá, y no en cada bloque: filtrar en diez
    # lugares es la forma segura de olvidarse en el undécimo.
    bots = {p["id"] for p in data["players"] if p["is_bot"]}
    data["players"] = [p for p in data["players"] if not p["is_bot"]]
    data["exercises"] = [e for e in data["exercises"] if e["player_id"] not in bots]
    data["attempts"] = [a for a in data["attempts"] if a["player_id"] not in bots]
    data["cta"] = [c for c in data["cta"] if c["player_id"] not in bots]
    data["_bots"] = len(bots)

    data["_ex_by_id"] = {e["id"]: e for e in data["exercises"]}
    # Respuestas de verdad: las que el parser entendió. Se ordenan una sola vez
    # porque la supervivencia, las sesiones y la escalera de θ recorren la misma
    # serie, y reordenarla tres veces es puro gasto.
    data["_answers"] = sorted(
        (a for a in data["attempts"] if a["parse_ok"]),
        key=lambda a: (a["player_id"], a["created_at"] or datetime.min),
    )
    data["_firsts"] = [a for a in data["_answers"] if a["attempt_number"] == 1]
    return data


def _weeks_back(week: date, n: int) -> list[date]:
    return [week - timedelta(weeks=i) for i in range(n - 1, -1, -1)]


def _in_week(dt: datetime | None, week: date) -> bool:
    d = local_date(dt)
    return d is not None and week <= d <= week + timedelta(days=6)


def _clean_firsts(data: dict) -> list[dict]:
    """Primeros intentos SIN la tabla abierta: la base de P1 y de la calibración.

    Un ejercicio con `peeked` no dice nada del estudiante ni de la plantilla — el
    router ya lo excluye del Elo por eso mismo — así que tampoco puede entrar en
    ninguna tasa de acierto sin ensuciarla.
    """
    ex = data["_ex_by_id"]
    return [a for a in data["_firsts"] if not ex.get(a["exercise_id"], {}).get("peeked")]


# ── 0 · Titulares ────────────────────────────────────────────────────────────

def headline(data: dict, weeks: list[date]) -> list[dict]:
    players = data["players"]
    answers = data["_answers"]
    clean = _clean_firsts(data)

    def per_week(fn) -> list:
        return [fn(w) for w in weeks]

    def activos(w: date) -> int:
        return len({a["player_id"] for a in answers if _in_week(a["created_at"], w)})

    def resueltas(w: date) -> int:
        return sum(1 for a in answers if a["is_correct"] and _in_week(a["created_at"], w))

    def p1(w: date) -> float | None:
        wk = [a for a in clean if _in_week(a["created_at"], w)]
        return _pct(sum(1 for a in wk if a["is_correct"]), len(wk))

    def mediana_derivadas(w: date) -> float | None:
        """Mediana de derivadas resueltas por estudiante ACTIVO en la semana.

        Por activo y no por nuevo: mide cuánto juega el que juega, que es lo que
        el motor de dificultad puede mover. Cuánta gente llega a jugar es otra
        pregunta y la contesta el embudo.
        """
        por = Counter(a["player_id"] for a in answers
                      if a["is_correct"] and _in_week(a["created_at"], w))
        return _median([float(v) for v in por.values()])

    def llegan_10(w: date) -> float | None:
        """De los nuevos de la semana, cuántos pasaron las 10 derivadas.

        Diez es donde la partida deja de ser una curiosidad: después del pedido
        de universidad (5) y antes del de registro (12).
        """
        nuevos_w = [p["id"] for p in players if _in_week(p["created_at"], w)]
        if not nuevos_w:
            return None
        por = Counter(a["player_id"] for a in answers if a["is_correct"])
        return _pct(sum(1 for pid in nuevos_w if por.get(pid, 0) >= 10), len(nuevos_w))

    def registrados(w: date) -> float | None:
        nuevos_w = [p for p in players if _in_week(p["created_at"], w)]
        return _pct(sum(1 for p in nuevos_w if p["user_id"]), len(nuevos_w))

    def cafecitos(w: date) -> int:
        return sum(b["cafecitos"] for b in data["boosts"] if _in_week(b["created_at"], w))

    def card(label: str, series: list, suffix: str, hint: str) -> dict:
        value = series[-1]
        prev = series[-2] if len(series) > 1 else None
        delta = round(value - prev, 1) if (value is not None and prev is not None) else None
        return {"label": label, "value": value, "suffix": suffix, "series": series,
                "delta": delta, "hint": hint}

    return [
        card("Estudiantes nuevos",
             per_week(lambda w: sum(1 for p in players if _in_week(p["created_at"], w))),
             "", "Altas de la semana, sin los sembrados."),
        card("Estudiantes activos", per_week(activos), "",
             "Respondieron al menos una derivada esa semana."),
        card("Derivadas resueltas", per_week(resueltas), "",
             "Aciertos. El ejercicio cierra en el primero."),
        card("Derivadas por estudiante", per_week(mediana_derivadas), "",
             "Mediana entre los activos de la semana."),
        card("Acierto al primer intento", per_week(p1), "%",
             "Sin los ejercicios con la tabla abierta. El motor apunta a 70–80%."),
        card("Llegan a 10", per_week(llegan_10), "%",
             "De los nuevos de la semana, cuántos pasaron las 10 derivadas."),
        card("Se registran", per_week(registrados), "%",
             "De los nuevos de la semana, cuántos dejaron de ser invitados."),
        card("Cafecitos", per_week(cafecitos), "",
             "Los que entraron esa semana, sumando los de cada empuje."),
    ]


# ── 1 · Embudo ───────────────────────────────────────────────────────────────

def funnel(data: dict, week: date) -> dict:
    """Embudo de la cohorte que abrió el juego en `week`, seguida hasta hoy.

    Arranca en «abrió el juego» y no en «vio el link»: la fila de
    `game_players` se crea en la primera carga, así que todo lo anterior
    (impresiones de WhatsApp, clicks que no llegaron a cargar) solo lo sabe
    PostHog. El embudo lo dice en vez de fingir que empieza antes.
    """
    cohort = [p for p in data["players"] if _in_week(p["created_at"], week)]
    ids = {p["id"] for p in cohort}
    answers = [a for a in data["_answers"] if a["player_id"] in ids]

    served: Counter = Counter(e["player_id"] for e in data["exercises"] if e["player_id"] in ids)
    correct_by = Counter(a["player_id"] for a in answers if a["is_correct"])
    respondieron = {a["player_id"] for a in answers}
    dias_by: dict[int, set] = defaultdict(set)
    for a in answers:
        dias_by[a["player_id"]].add(local_date(a["created_at"]))

    base = len(cohort)
    # `cadena` marca los pasos que SÍ están anidados: cada uno es un subconjunto
    # del anterior, así que «% del paso anterior» significa algo. Los otros tres
    # no lo están —se puede cargar la universidad sin haber llegado a 25, y quien
    # viene de Intervalo llega registrado desde el minuto cero— y para ellos el
    # único denominador honesto es la cohorte. Sin esta distinción salían cosas
    # como «600% del paso anterior», que no quiere decir nada.
    steps = [
        ("Abrió el juego", base, True),
        ("Vio una derivada", sum(1 for pid in ids if served.get(pid)), True),
        ("Respondió", len(respondieron), True),
        ("Acertó una", sum(1 for pid in ids if correct_by.get(pid, 0) >= 1), True),
        ("Llegó a 5", sum(1 for pid in ids if correct_by.get(pid, 0) >= 5), True),
        ("Llegó a 10", sum(1 for pid in ids if correct_by.get(pid, 0) >= 10), True),
        ("Llegó a 25", sum(1 for pid in ids if correct_by.get(pid, 0) >= 25), True),
        ("Cargó universidad", sum(1 for p in cohort if p["university"]), False),
        ("Se registró", sum(1 for p in cohort if p["user_id"]), False),
        ("Volvió otro día", sum(1 for pid in ids if len(dias_by.get(pid, ())) >= 2), False),
    ]

    out, prev = [], None
    for label, n, cadena in steps:
        out.append({"label": label, "n": n, "cadena": cadena, "pct_base": _pct(n, base),
                    "pct_prev": _pct(n, prev) if (cadena and prev) else None})
        if cadena:
            prev = n
    return {"base": base, "steps": out}


# ── 2 · Sesiones y vuelta ────────────────────────────────────────────────────

def _sessions_of(answers: list[dict]) -> list[dict]:
    """Corta la serie de respuestas de UN estudiante en sesiones por huecos."""
    out: list[dict] = []
    cur: dict | None = None
    for a in answers:
        t = a["created_at"]
        if t is None:
            continue
        if cur is None or (t - cur["end"]) > timedelta(minutes=SESSION_GAP_MINUTES):
            cur = {"player_id": a["player_id"], "start": t, "end": t, "n": 0}
            out.append(cur)
        cur["end"] = t
        cur["n"] += 1
    return out


def sesiones(data: dict, weeks: list[date]) -> dict:
    """Sesiones reconstruidas por huecos, y la vuelta día a día.

    Hay que leerlo sabiendo qué es: una pausa de cuarenta minutos con la pestaña
    abierta cuenta acá como dos sesiones. No hay forma de distinguirlo sin un
    heartbeat del cliente, y no vale la pena sumar uno solo para esto.
    """
    by_player: dict[int, list[dict]] = defaultdict(list)
    for a in data["_answers"]:
        by_player[a["player_id"]].append(a)

    todas: list[dict] = []
    for answers in by_player.values():
        todas.extend(_sessions_of(answers))

    filas = []
    for w in weeks:
        wk = [s for s in todas if _in_week(s["start"], w)]
        estudiantes = len({s["player_id"] for s in wk})
        minutos = [round((s["end"] - s["start"]).total_seconds() / 60, 1) for s in wk]
        filas.append({
            "semana": w,
            "sesiones": len(wk),
            "estudiantes": estudiantes,
            "por_estudiante": round(len(wk) / estudiantes, 2) if estudiantes else None,
            "derivadas_mediana": _median([float(s["n"]) for s in wk]),
            "minutos_mediana": _median(minutos),
            "minutos_p90": _p(minutos, 0.90),
            # Una sesión de una sola respuesta es alguien que abrió, contestó y
            # se fue: es el rebote del juego y merece su propia columna.
            "rebote": _pct(sum(1 for s in wk if s["n"] == 1), len(wk)),
        })

    dias_by: dict[int, set] = defaultdict(set)
    semanas_by: dict[int, set] = defaultdict(set)
    for a in data["_answers"]:
        dias_by[a["player_id"]].add(local_date(a["created_at"]))
        semanas_by[a["player_id"]].add(_week_of(a["created_at"]))

    vuelta = []
    for w in weeks:
        cohort = [p["id"] for p in data["players"] if _in_week(p["created_at"], w)]
        jugaron = [pid for pid in cohort if pid in dias_by]
        vuelta.append({
            "semana": w,
            "n": len(jugaron),
            "otro_dia": _pct(sum(1 for pid in jugaron if len(dias_by[pid]) >= 2), len(jugaron)),
            "otra_semana": _pct(sum(1 for pid in jugaron if len(semanas_by[pid]) >= 2),
                                len(jugaron)),
        })

    return {"filas": filas, "vuelta": vuelta}


# ── 3 · Profundidad de partida ───────────────────────────────────────────────

def profundidad(data: dict, weeks: list[date], now: datetime | None = None) -> dict:
    """Cuántas derivadas aguanta la gente, y dónde exactamente se va.

    Es LA métrica del juego. El Elo, el ranking y el cafecito existen para mover
    esta curva, así que conviene mirarla antes que a ellos.

    Solo entran partidas CERRADAS (sin actividad en las últimas
    `CLOSED_AFTER_HOURS` horas): quien está jugando ahora mismo todavía puede
    sumar ejercicios, y contarlo hunde la cola por reloj y no por comportamiento.
    """
    now = now or datetime.utcnow()
    corte = now - timedelta(hours=CLOSED_AFTER_HOURS)
    desde = weeks[0]

    por_estudiante = Counter(a["player_id"] for a in data["_firsts"])
    cohort = [p for p in data["players"]
              if (local_date(p["created_at"]) or date.max) >= desde and por_estudiante.get(p["id"])]
    cerrados = [p for p in cohort if (p["last_seen_at"] or datetime.min) < corte]
    largos = [por_estudiante[p["id"]] for p in cerrados]
    base = len(largos)

    curva = []
    for k in range(1, DEPTH_MAX + 1):
        vivos = sum(1 for n in largos if n >= k)
        siguen = sum(1 for n in largos if n >= k + 1)
        curva.append({
            "k": k,
            "vivos": vivos,
            "pct": _pct(vivos, base),
            # Riesgo: de los que llegaron a k, qué fracción NO llegó a k+1. Es
            # lo que localiza el escalón; la curva acumulada lo suaviza y lo
            # esconde.
            "abandono": _pct(vivos - siguen, vivos),
        })

    hitos = [{"k": k, "vivos": sum(1 for n in largos if n >= k),
              "pct": _pct(sum(1 for n in largos if n >= k), base)}
             for k in MILESTONES if k <= DEPTH_MAX]

    # El escalón más grande de los primeros 20, que es el tramo donde el
    # producto interviene (universidad a las 5, registro a las 12). Se pide una
    # base mínima: un abandono del 100% sobre 2 personas no es un escalón.
    tramo = [c for c in curva if c["k"] <= 20 and c["vivos"] >= 5]
    peor = max(tramo, key=lambda c: c["abandono"] or 0) if tramo else None

    return {
        "base": base,
        "abiertos": len(cohort) - len(cerrados),
        "curva": curva,
        "hitos": hitos,
        "mediana": _median([float(n) for n in largos]),
        "p90": _p([float(n) for n in largos], 0.90),
        "peor_escalon": peor,
    }


# ── 4 · El motor ─────────────────────────────────────────────────────────────

def motor(data: dict, weeks: list[date]) -> dict:
    """Diagnóstico del Elo. Tres preguntas, en este orden:

      1. **¿Está calibrado?** Si el modelo dice 75% y sale 55%, la banda
         objetivo no existe: se está sirviendo mucho más difícil de lo que se
         cree. Se mira primero porque, si falla, todo lo demás de esta sección
         mide otra cosa.
      2. **¿Le pega a la banda?** Qué fracción de lo servido cayó en
         [0,70 ; 0,80]. Un modelo calibrado que igual sirve fuera de banda es un
         problema del generador (banco chico, anti-repetición, rampa), no del
         Elo — y se arregla en otro archivo.
      3. **¿La banda es la correcta?** Es la única que el modelo no puede
         contestarse solo. Hay que mirar si la gente efectivamente sigue jugando
         después de una derivada de p̂ 0,75 más que después de una de 0,55. Para
         eso está `continuidad`, y es el número que justifica (o mueve) la banda.
    """
    desde = weeks[0]
    ex = data["_ex_by_id"]
    clean = [a for a in _clean_firsts(data) if (local_date(a["created_at"]) or date.min) >= desde]

    # 1 · Calibración: predicho vs. observado, por bin de p̂.
    bins = [{"label": lab, "n": 0, "aciertos": 0, "suma": 0.0} for lab in PHAT_LABELS]
    for a in clean:
        e = ex.get(a["exercise_id"])
        if e is None:
            continue
        b = bins[_bin_index(e["p_hat"])]
        b["n"] += 1
        b["aciertos"] += 1 if a["is_correct"] else 0
        b["suma"] += e["p_hat"]
    calibracion = [{
        "label": b["label"],
        "n": b["n"],
        "predicho": round(100 * b["suma"] / b["n"], 1) if b["n"] else None,
        "observado": _pct(b["aciertos"], b["n"]),
    } for b in bins]

    # Error de calibración medio, pesado por volumen: un solo número para poder
    # seguirlo semana a semana sin releer la tabla entera.
    con_dato = [c for c in calibracion if c["n"] and c["observado"] is not None]
    total_n = sum(c["n"] for c in con_dato)
    ece = (round(sum(c["n"] * abs(c["predicho"] - c["observado"]) for c in con_dato) / total_n, 1)
           if total_n else None)

    # 2 · Puntería del generador.
    servidos = [e for e in data["exercises"] if (local_date(e["created_at"]) or date.min) >= desde]
    hist = Counter(_bin_index(e["p_hat"]) for e in servidos)
    histograma = [{"label": PHAT_LABELS[i], "n": hist.get(i, 0)} for i in range(len(PHAT_LABELS))]
    en_banda = sum(1 for e in servidos if 0.70 <= e["p_hat"] <= 0.80)

    # 3 · Continuidad: después de esta derivada, ¿siguió jugando?
    #
    # Es el puente entre el motor y la retención, y la única forma de validar la
    # banda con datos en vez de con la teoría. Se corta también por resultado,
    # porque lo interesante no es sólo «las difíciles espantan» sino si ERRAR una
    # fácil espanta más que errar una difícil — eso apuntaría a frustración por
    # expectativa rota, que se arregla distinto.
    orden: dict[int, list[dict]] = defaultdict(list)
    for a in data["_firsts"]:
        orden[a["player_id"]].append(a)
    siguiente: dict[int, bool] = {}
    for lista in orden.values():
        for i, a in enumerate(lista):
            siguiente[a["id"]] = i + 1 < len(lista)

    cont = [{"label": lab, "ok_n": 0, "ok_s": 0, "mal_n": 0, "mal_s": 0} for lab in PHAT_LABELS]
    for a in clean:
        e = ex.get(a["exercise_id"])
        if e is None or a["id"] not in siguiente:
            continue
        c = cont[_bin_index(e["p_hat"])]
        pref = "ok" if a["is_correct"] else "mal"
        c[f"{pref}_n"] += 1
        c[f"{pref}_s"] += 1 if siguiente[a["id"]] else 0
    continuidad = [{
        "label": c["label"],
        "ok_n": c["ok_n"], "ok": _pct(c["ok_s"], c["ok_n"]),
        "mal_n": c["mal_n"], "mal": _pct(c["mal_s"], c["mal_n"]),
    } for c in cont]

    # 4 · La escalera: θ mediano según cuántas respuestas lleva encima el
    # estudiante. Es la curva de aprendizaje del juego y, de paso, dice si el Elo
    # se mueve o se quedó clavado en cero.
    theta_por_n: dict[int, list[float]] = defaultdict(list)
    contador: Counter = Counter()
    for a in data["_firsts"]:
        if a["theta_after"] is None:
            continue
        contador[a["player_id"]] += 1
        theta_por_n[contador[a["player_id"]]].append(a["theta_after"])
    escalera = [{"n": n, "estudiantes": len(theta_por_n[n]),
                 "theta": round(statistics.median(theta_por_n[n]), 2)}
                for n in sorted(theta_por_n) if n <= DEPTH_MAX]

    # 5 · Los dos escapes: saltear y mirar la tabla.
    salteos = [e for e in servidos if e["status"] == "skipped"]
    salteo_bins = Counter(_bin_index(e["p_hat"]) for e in salteos)
    servido_bins = Counter(_bin_index(e["p_hat"]) for e in servidos)
    salteo_por_bin = [{
        "label": PHAT_LABELS[i],
        "n": salteo_bins.get(i, 0),
        "pct": _pct(salteo_bins.get(i, 0), servido_bins.get(i, 0)),
    } for i in range(len(PHAT_LABELS))]

    return {
        "calibracion": calibracion,
        "ece": ece,
        "servidos": len(servidos),
        "en_banda": _pct(en_banda, len(servidos)),
        "histograma": histograma,
        "continuidad": continuidad,
        "escalera": escalera,
        "salteo_pct": _pct(len(salteos), len(servidos)),
        "salteo_por_bin": salteo_por_bin,
        "peek_pct": _pct(sum(1 for e in servidos if e["peeked"]), len(servidos)),
        "theta_mediano": _median([p["theta"] for p in data["players"] if p["n_updates"]]),
        "con_elo": sum(1 for p in data["players"] if p["n_updates"]),
    }


# ── 5 · Plantillas ───────────────────────────────────────────────────────────

def plantillas(data: dict, weeks: list[date]) -> dict:
    """Una fila por plantilla generadora: qué tan difícil es, y qué tan odiada.

    `beta` y `n_observations` los mantiene el propio motor
    (game_template_stats): son el ESTADO DEL MODELO. El resto —P1 real, salteos,
    tiempo— sale de los hechos. La gracia de ponerlos al lado es ver dónde el
    modelo y la realidad discrepan, que es lo que hay que corregir a mano.
    """
    ex = data["_ex_by_id"]
    stats = {t["template_key"]: t for t in data["templates"]}
    clean = _clean_firsts(data)

    servidos: Counter = Counter()
    salteos: Counter = Counter()
    phat_sum: dict[str, float] = defaultdict(float)
    for e in data["exercises"]:
        servidos[e["template_key"]] += 1
        phat_sum[e["template_key"]] += e["p_hat"]
        if e["status"] == "skipped":
            salteos[e["template_key"]] += 1

    intentos: Counter = Counter()
    aciertos: Counter = Counter()
    tiempos: dict[str, list[float]] = defaultdict(list)
    for a in clean:
        e = ex.get(a["exercise_id"])
        if e is None:
            continue
        k = e["template_key"]
        intentos[k] += 1
        aciertos[k] += 1 if a["is_correct"] else 0
        if a["response_ms"]:
            tiempos[k].append(a["response_ms"] / 1000.0)

    filas = []
    for key in sorted(set(servidos) | set(stats)):
        st = stats.get(key, {})
        n = intentos.get(key, 0)
        filas.append({
            "key": key,
            "tier": st.get("tier"),
            "beta": round(st["beta"], 2) if st.get("beta") is not None else None,
            "servidos": servidos.get(key, 0),
            "p_hat": round(100 * phat_sum[key] / servidos[key], 1) if servidos.get(key) else None,
            "n": n,
            "p1": _pct(aciertos.get(key, 0), n),
            "salteo": _pct(salteos.get(key, 0), servidos.get(key, 0)),
            "seg": _median(tiempos.get(key, [])),
        })
    filas.sort(key=lambda f: (f["tier"] if f["tier"] is not None else 99, f["key"]))

    # Las que el motor todavía no puede juzgar: con menos de MIN_OBS_TEMPLATE
    # observaciones la beta sigue siendo casi la semilla del tier, así que el p̂
    # que se muestra es una creencia y no una medición.
    verdes = [f["key"] for f in filas if f["n"] < MIN_OBS_TEMPLATE]

    desvios = sorted(
        [f for f in filas
         if f["n"] >= MIN_OBS_TEMPLATE and f["p1"] is not None and f["p_hat"] is not None
         and abs(f["p1"] - f["p_hat"]) >= 10],
        key=lambda f: -abs(f["p1"] - f["p_hat"]))

    return {"filas": filas, "verdes": verdes, "desvios": desvios[:6],
            "cubiertas": sum(1 for f in filas if f["servidos"]), "total": len(filas)}


# ── 6 · Cafecito ─────────────────────────────────────────────────────────────

def cafecito(data: dict, weeks: list[date]) -> dict:
    """El embudo de la donación, de punta a punta.

    El último escalón es una fila en `game_boosts` que hoy inserta un script a
    mano (scripts/grant_game_boost.py), porque Cafecito no tiene webhook ni API
    pública. O sea que la conversión medida es una **cota inferior** mientras la
    carga sea manual: si alguien dona y nadie corre el script, el cafecito
    existió y el panel no lo ve. Es la primera cosa a mirar cuando el número dé
    raro.
    """
    cta = data["cta"]
    boosts = data["boosts"]

    filas = []
    for w in weeks:
        imp = [c for c in cta
               if c["cta"] == "cafecito" and c["action"] == "impression" and _in_week(c["created_at"], w)]
        clicks = [c for c in cta
                  if c["cta"] == "cafecito" and c["action"] == "click" and _in_week(c["created_at"], w)]
        bw = [b for b in boosts if _in_week(b["created_at"], w)]
        cafes = sum(b["cafecitos"] for b in bw)
        filas.append({
            "semana": w,
            "impresiones": len(imp),
            "vieron": len({c["player_id"] for c in imp}),
            "clicks": len(clicks),
            "clickearon": len({c["player_id"] for c in clicks}),
            "ctr": _pct(len({c["player_id"] for c in clicks}), len({c["player_id"] for c in imp})),
            "cafecitos": cafes,
            "empujes": len(bw),
            # Cierre del embudo. Puede pasar de 1 (una persona invita varios) y
            # por eso se llama «cafecitos por click» y no «conversión».
            "por_click": round(cafes / len(clicks), 2) if clicks else None,
        })

    # Por disparador: el cartel sale por récord, por escalada grande o por hito
    # cada 25. Cuál convierte es lo que decide dónde ponerlo.
    por_trigger = []
    for t in sorted({c["placement"] for c in cta if c["cta"] == "cafecito" and c["placement"]}):
        imp = [c for c in cta if c["cta"] == "cafecito" and c["action"] == "impression"
               and c["placement"] == t]
        clicks = [c for c in cta if c["cta"] == "cafecito" and c["action"] == "click"
                  and c["placement"] == t]
        solved = [float(c["solved"]) for c in imp if c["solved"] is not None]
        por_trigger.append({"trigger": t, "impresiones": len(imp), "clicks": len(clicks),
                            "ctr": _pct(len(clicks), len(imp)),
                            "solved_mediana": _median(solved)})
    por_trigger.sort(key=lambda r: -r["impresiones"])

    # Efecto del empuje: ¿la universidad impulsada juega más durante la ventana?
    #
    # Se compara contra ELLA MISMA fuera de la ventana y no contra las otras
    # universidades: los tamaños son muy distintos y la comparación cruzada mediría
    # sobre todo el tamaño. La unidad es respuestas por estudiante activo por hora,
    # que es lo único comparable entre una ventana de 30 minutos y el resto.
    uni_by_player = {p["id"]: p["university"] for p in data["players"]}
    rangos = [(b["university"], b["created_at"], b["expires_at"]) for b in boosts
              if b["created_at"] and b["expires_at"]]

    basal: dict[str, float | None] = {}
    conteo: dict[str, Counter] = defaultdict(Counter)
    quienes: dict[str, dict] = defaultdict(lambda: defaultdict(set))
    for a in data["_answers"]:
        uni, t = uni_by_player.get(a["player_id"]), a["created_at"]
        if not uni or t is None:
            continue
        if any(u == uni and ini <= t < fin for u, ini, fin in rangos):
            continue  # las horas con empuje no pueden ser su propia base
        hora = t.replace(minute=0, second=0, microsecond=0)
        conteo[uni][hora] += 1
        quienes[uni][hora].add(a["player_id"])
    for uni, horas in conteo.items():
        basal[uni] = _median([horas[h] / len(quienes[uni][h]) for h in horas if quienes[uni][h]])

    ventanas = []
    for b in boosts:
        ini, fin = b["created_at"], b["expires_at"]
        if ini is None or fin is None:
            continue
        dentro = [a for a in data["_answers"]
                  if uni_by_player.get(a["player_id"]) == b["university"]
                  and a["created_at"] is not None and ini <= a["created_at"] < fin]
        horas = max((fin - ini).total_seconds() / 3600.0, 1e-9)
        estudiantes = len({a["player_id"] for a in dentro})
        ritmo = round(len(dentro) / horas / estudiantes, 1) if estudiantes else None
        base_uni = basal.get(b["university"])
        ventanas.append({
            "university": b["university"], "cafecitos": b["cafecitos"], "inicio": ini,
            "respuestas": len(dentro), "estudiantes": estudiantes, "ritmo": ritmo,
            "basal": base_uni,
            "lift": round(100 * (ritmo / base_uni - 1), 1) if (ritmo and base_uni) else None,
        })
    ventanas.sort(key=lambda v: v["inicio"] or datetime.min, reverse=True)

    share_imp = sum(1 for c in cta if c["cta"] == "share" and c["action"] == "impression")
    share_click = sum(1 for c in cta if c["cta"] == "share" and c["action"] == "click")

    return {
        "filas": filas,
        "por_trigger": por_trigger,
        "ventanas": ventanas[:12],
        "share": {"impresiones": share_imp, "clicks": share_click,
                  "ctr": _pct(share_click, share_imp)},
        "total_cafecitos": sum(b["cafecitos"] for b in boosts),
        "empujes": len(boosts),
    }


# ── 7 · Rivalidad ────────────────────────────────────────────────────────────

def rivalidad(data: dict, weeks: list[date]) -> dict:
    """Universidades, concentración del ranking y actividad del feed.

    La pregunta de fondo es si el ranking está VIVO: uno cuyo top no se mueve
    deja de ser un motivo para volver, por más que el número siga subiendo.
    """
    # «Estudiante» acá son los que respondieron alguna vez, deducido de los hechos y
    # no de `game_players.exercises_attempted`: ese contador lo pone en cero el
    # botón de reiniciar, y una universidad no puede perder gente porque alguien
    # decidió empezar de nuevo.
    jugaron = {a["player_id"] for a in data["_answers"]}
    players = [p for p in data["players"] if p["id"] in jugaron]
    clean = _clean_firsts(data)
    aciertos_by = Counter(a["player_id"] for a in clean if a["is_correct"])
    intentos_by = Counter(a["player_id"] for a in clean)

    por_uni: dict[str, list[dict]] = defaultdict(list)
    for p in players:
        if p["university"]:
            por_uni[p["university"]].append(p)

    unis = []
    for uni, ps in por_uni.items():
        xp = sum(p["xp"] for p in ps)
        unis.append({
            "university": uni,
            "estudiantes": len(ps),
            "xp": xp,
            "xp_per_player": round(xp / len(ps), 1),
            "derivadas": sum(aciertos_by.get(p["id"], 0) for p in ps),
            "p1": _pct(sum(aciertos_by.get(p["id"], 0) for p in ps),
                       sum(intentos_by.get(p["id"], 0) for p in ps)),
            "registrados": _pct(sum(1 for p in ps if p["user_id"]), len(ps)),
        })
    unis.sort(key=lambda u: -u["xp_per_player"])

    # Concentración: qué fracción del XP está en el top 10. Muy concentrado, el
    # número 200 no tiene a quién alcanzar y el marcador deja de motivar.
    xps = sorted((p["xp"] for p in players), reverse=True)
    total_xp = sum(xps)

    return {
        "universidades": unis,
        "top10": _pct(sum(xps[:10]), total_xp),
        "estudiantes_con_xp": sum(1 for x in xps if x > 0),
        "eventos": [{"kind": k, "n": n} for k, n in
                    Counter(e["kind"] for e in data["events"]).most_common()],
        "carreras": [{"label": c, "n": n} for c, n in
                     Counter((p["career"] or "Otra") for p in players).most_common()],
    }


# ── 8 · Difusión ─────────────────────────────────────────────────────────────

def difusion(data: dict, weeks: list[date]) -> dict:
    """De dónde viene el estudiante, con la misma atribución que Intervalo.

    El prefijo del id de grupo es la universidad DONDE SE PLANTÓ EL LINK
    (web/src/lib/analytics/attribution.ts), que no es lo mismo que la universidad
    que la persona después declara. Comparar las dos es lo que dice si el link
    se está reenviando fuera del grupo original, que es la señal de viralidad
    más barata que tenemos.
    """
    desde = weeks[0]
    nuevos = [p for p in data["players"] if (local_date(p["created_at"]) or date.min) >= desde]
    aciertos_by = Counter(a["player_id"] for a in data["_firsts"] if a["is_correct"])

    def resumen(grupos: dict[str, list[dict]]) -> list[dict]:
        filas = [{
            "label": g,
            "n": len(ps),
            "jugaron": _pct(sum(1 for p in ps if aciertos_by.get(p["id"])), len(ps)),
            "llegan_10": _pct(sum(1 for p in ps if aciertos_by.get(p["id"], 0) >= 10), len(ps)),
            "registrados": _pct(sum(1 for p in ps if p["user_id"]), len(ps)),
        } for g, ps in grupos.items()]
        filas.sort(key=lambda f: -f["n"])
        return filas

    def prefijo(gid: str | None) -> str:
        """"uba042" → "UBA". Lo que no matchea cae en «sin grupo»."""
        letras = "".join(c for c in (gid or "") if c.isalpha())
        return letras.upper() or "sin grupo"

    por_origen: dict[str, list[dict]] = defaultdict(list)
    por_utm: dict[str, list[dict]] = defaultdict(list)
    fuera: dict[str, int] = Counter()
    for p in nuevos:
        origen = prefijo(p["first_group_id"])
        por_origen[origen].append(p)
        por_utm[p["first_utm_source"] or "directo"].append(p)
        # El link salió de un grupo de una universidad y la persona declara otra:
        # eso es el link viajando por fuera del grupo donde se plantó.
        if origen != "sin grupo" and p["university"] and p["university"].upper() != origen:
            fuera[origen] += 1

    filas = resumen(por_origen)
    for f in filas:
        f["fuera"] = _pct(fuera.get(f["label"], 0), f["n"])

    return {"origen": filas, "utm": resumen(por_utm), "nuevos": len(nuevos)}


# ── 9 · Dispositivo ──────────────────────────────────────────────────────────

# El teléfono y la compu son dos juegos distintos: en uno hay un flujo infinito
# de slides y un teclado matemático apoyado sobre uno táctil; en el otro está
# todo en una vista y la persona escribe con las dos manos. Agrupar iOS y
# Android bajo «teléfono» es el corte que decide dónde invertir; separarlos sale
# gratis, y en un juego que se difunde por WhatsApp en Argentina la mezcla dice
# a quién le está llegando el link.
PLATFORM_ORDER: tuple[str, ...] = ("android", "ios", "desktop")
PLATFORM_LABEL = {"android": "Android", "ios": "iOS", "desktop": "Escritorio",
                  None: "Sin dato"}
PHONE = ("android", "ios")


def dispositivo(data: dict, weeks: list[date], now: datetime | None = None) -> dict:
    """De dónde vienen y si se comportan distinto.

    Hay DOS unidades acá y conviene no mezclarlas, porque contestan preguntas
    distintas:

      - **Por estudiante** (`game_players.platform`, el de primer contacto): por
        dónde entra la gente y cuánto de cada lado llega lejos. Es el corte
        correcto para «llegan a 10» o «se registran», que son hechos de la
        persona y no de una respuesta suelta.
      - **Por ejercicio** (`game_exercises.platform`): si el juego se juega
        distinto. Es el corte correcto para el acierto, el tiempo y el salteo,
        que son hechos del aparato en el que se dio esa respuesta.

    Quien arranca en el colectivo y sigue en la compu aparece como teléfono en
    la primera y en los dos lados en la segunda. No es una inconsistencia: son
    dos preguntas.
    """
    now = now or datetime.utcnow()
    desde = weeks[0]
    ex = data["_ex_by_id"]
    nuevos = [p for p in data["players"] if (local_date(p["created_at"]) or date.min) >= desde]

    # ── De dónde vienen ──────────────────────────────────────────────────────
    por_semana = []
    for w in weeks:
        cohorte = [p for p in data["players"] if _in_week(p["created_at"], w)]
        cuenta = Counter(p["platform"] for p in cohorte)
        conocidos = sum(cuenta.get(k, 0) for k in PLATFORM_ORDER)
        por_semana.append({
            "semana": w,
            "n": len(cohorte),
            **{(k or "sin_dato"): cuenta.get(k, 0) for k in (*PLATFORM_ORDER, None)},
            # Sobre los que tienen dato, no sobre la cohorte: si no, el
            # porcentaje de teléfono cae solo por cada fila vieja sin columna.
            "pct_telefono": _pct(sum(cuenta.get(k, 0) for k in PHONE), conocidos),
        })

    mezcla = Counter(p["platform"] for p in nuevos)
    reparto = [{"label": PLATFORM_LABEL[k], "n": mezcla.get(k, 0)}
               for k in (*PLATFORM_ORDER, None) if mezcla.get(k, 0)]

    # ── Cómo se comportan ────────────────────────────────────────────────────
    clean = _clean_firsts(data)
    firsts_by_player = Counter(a["player_id"] for a in data["_firsts"])
    correct_by_player = Counter(a["player_id"] for a in data["_answers"] if a["is_correct"])

    by_player: dict[int, list[dict]] = defaultdict(list)
    for a in data["_answers"]:
        by_player[a["player_id"]].append(a)
    sesiones_por_player = {pid: _sessions_of(lista) for pid, lista in by_player.items()}

    plat_de = {p["id"]: p["platform"] for p in data["players"]}
    servidos = [e for e in data["exercises"]
                if (local_date(e["created_at"]) or date.min) >= desde]

    filas = []
    for key in (*PLATFORM_ORDER, None):
        gente = [p for p in nuevos if p["platform"] == key]
        # Hechos del aparato: se atribuyen por el ejercicio, no por la persona.
        ex_plat = [e for e in servidos if e["platform"] == key]
        limpias = [a for a in clean
                   if ex.get(a["exercise_id"], {}).get("platform") == key
                   and (local_date(a["created_at"]) or date.min) >= desde]
        envios = [a for a in data["attempts"]
                  if ex.get(a["exercise_id"], {}).get("platform") == key
                  and (local_date(a["created_at"]) or date.min) >= desde]
        ses = [x for pid, lista in sesiones_por_player.items()
               if plat_de.get(pid) == key for x in lista]
        if not gente and not ex_plat:
            continue
        filas.append({
            "platform": key,
            "label": PLATFORM_LABEL[key],
            "estudiantes": len(gente),
            "servidos": len(ex_plat),
            # Mediana sobre los que llegaron a responder algo, no sobre todos
            # los que aparecieron: con la mitad rebotando, la mediana sobre
            # todos da 0 en las dos plataformas y la columna deja de comparar
            # nada. Cuánta gente rebota ya lo dicen «rebote» y el embudo.
            "derivadas_mediana": _median(
                [float(correct_by_player.get(p["id"], 0)) for p in gente
                 if firsts_by_player.get(p["id"])]),
            "n_limpias": len(limpias),
            "p1": _pct(sum(1 for a in limpias if a["is_correct"]), len(limpias)),
            "llegan_10": _pct(sum(1 for p in gente if correct_by_player.get(p["id"], 0) >= 10),
                              len(gente)),
            "seg": _median([a["response_ms"] / 1000.0 for a in limpias if a["response_ms"]]),
            "salteo": _pct(sum(1 for e in ex_plat if e["status"] == "skipped"), len(ex_plat)),
            "peek": _pct(sum(1 for e in ex_plat if e["peeked"]), len(ex_plat)),
            # El número que más importa del corte: el teclado matemático sobre
            # una pantalla táctil es otro producto, y si acá hay una brecha
            # grande, lo que pierde gente en el teléfono puede no ser la
            # dificultad sino el input.
            "parse": _pct(sum(1 for a in envios if not a["parse_ok"]), len(envios)),
            "rebote": _pct(sum(1 for x in ses if x["n"] == 1), len(ses)),
            "registrados": _pct(sum(1 for p in gente if p["user_id"]), len(gente)),
        })

    # ── Profundidad por aparato ──────────────────────────────────────────────
    # Misma definición que la sección 2 (solo partidas cerradas), cortada por el
    # aparato de primer contacto. Es la respuesta más directa a «¿se comportan
    # distinto?»: aguantar más o menos derivadas es de lo que se trata el juego.
    corte = now - timedelta(hours=CLOSED_AFTER_HOURS)
    curvas = []
    for key in PLATFORM_ORDER:
        largos = [firsts_by_player[p["id"]] for p in nuevos
                  if p["platform"] == key and firsts_by_player.get(p["id"])
                  and (p["last_seen_at"] or datetime.min) < corte]
        if not largos:
            continue
        base = len(largos)
        curvas.append({
            "label": PLATFORM_LABEL[key],
            "base": base,
            "mediana": _median([float(n) for n in largos]),
            "puntos": [{"k": k, "vivos": sum(1 for n in largos if n >= k),
                        "pct": _pct(sum(1 for n in largos if n >= k), base)}
                       for k in range(1, DEPTH_MAX + 1)],
        })

    # ── Cambian de aparato ───────────────────────────────────────────────────
    # Jugar el mismo juego en dos aparatos es la señal más fuerte de que alguien
    # volvió a propósito: nadie cambia de dispositivo por accidente.
    plats_por_player: dict[int, set] = defaultdict(set)
    for e in data["exercises"]:
        if e["platform"]:
            plats_por_player[e["player_id"]].add(e["platform"])
    cambiaron = sum(1 for v in plats_por_player.values() if len(v) > 1)

    # ── Cafecito por aparato ─────────────────────────────────────────────────
    # Donar desde el teléfono es abrir otra app y volver; desde la compu es una
    # pestaña. Si el CTR se parte fuerte acá, lo que le falta al cafecito es
    # menos fricción y no mejor copy.
    cta_plat = []
    for key in (*PLATFORM_ORDER, None):
        imp = {c["player_id"] for c in data["cta"]
               if c["cta"] == "cafecito" and c["action"] == "impression"
               and plat_de.get(c["player_id"]) == key}
        if not imp:
            continue
        clicks = {c["player_id"] for c in data["cta"]
                  if c["cta"] == "cafecito" and c["action"] == "click"
                  and plat_de.get(c["player_id"]) == key}
        cta_plat.append({"label": PLATFORM_LABEL[key], "vieron": len(imp),
                         "clickearon": len(clicks), "ctr": _pct(len(clicks), len(imp))})

    return {
        "por_semana": por_semana,
        "reparto": reparto,
        "filas": filas,
        "curvas": curvas,
        "cambiaron": cambiaron,
        "con_aparato": len(plats_por_player),
        "cta": cta_plat,
        "sin_dato": mezcla.get(None, 0),
        "nuevos": len(nuevos),
    }


# ── 10 · Puente al producto ──────────────────────────────────────────────────

def puente(data: dict, weeks: list[date]) -> dict:
    """El juego como canal de adquisición de Intervalo.

    Tener `user_id` es tener cuenta, y tener cuenta no es usar el producto: el
    escalón que importa es haber terminado una sesión de estudio de verdad
    (`mode IN ('main','practice')`, la misma definición del otro panel).
    """
    desde = weeks[0]
    nuevos = [p for p in data["players"] if (local_date(p["created_at"]) or date.min) >= desde]
    con_cuenta = [p for p in nuevos if p["user_id"]]
    ids = {p["user_id"] for p in con_cuenta}

    estudiaron = {s["user_id"] for s in data["sessions"]
                  if s["mode"] in REAL_MODES and s["user_id"] in ids and s["finished_at"]}

    # Cuál vino primero: la cuenta o el juego. Si la cuenta es anterior, esa
    # persona ya era usuaria y el juego no la trajo — contarla como adquisición
    # sería regalarle al juego gente que ya estaba adentro.
    users_by = {u["id"]: u for u in data["users"]}
    trajo = sum(
        1 for p in con_cuenta
        if (u := users_by.get(p["user_id"])) and p["created_at"] and u["created_at"]
        and u["created_at"] >= p["created_at"] - timedelta(minutes=10))

    return {
        "nuevos": len(nuevos),
        "con_cuenta": len(con_cuenta),
        "cuentas_nuevas": trajo,
        "estudiaron": len(estudiaron),
        "pct_cuenta": _pct(len(con_cuenta), len(nuevos)),
        "pct_estudiaron": _pct(len(estudiaron), len(con_cuenta)),
    }


# ── 11 · Entrada ─────────────────────────────────────────────────────────────

def entrada(data: dict, weeks: list[date]) -> dict:
    """Fricción del teclado matemático.

    Una respuesta que no parsea se ve, del otro lado de la pantalla, igual que
    una equivocada: la persona escribió algo, el juego le dijo que no, y se fue.
    Por eso vive en su propia sección — es la única parte del juego donde el que
    pierde no es el estudiante.
    """
    desde = weeks[0]
    intentos = [a for a in data["attempts"]
                if (local_date(a["created_at"]) or date.min) >= desde]
    fallos = [a for a in intentos if not a["parse_ok"]]

    # Por estudiante y no solo por intento: el promedio esconde el caso que importa
    # (poca gente chocando muchas veces contra el mismo símbolo).
    con_fallo = len({a["player_id"] for a in fallos})
    activos = len({a["player_id"] for a in intentos})

    segundos = [a["response_ms"] / 1000.0 for a in data["_firsts"] if a["response_ms"]]

    # El inventario de teclas es acumulativo, así que su tamaño mide cuán lejos
    # llegó la gente en el vocabulario del juego.
    jugaron = {a["player_id"] for a in data["_answers"]}
    inv = Counter(len([k for k in (p["unlocked_keys"] or "").split(",") if k])
                  for p in data["players"] if p["id"] in jugaron)

    return {
        "intentos": len(intentos),
        "fallos": len(fallos),
        "pct_fallos": _pct(len(fallos), len(intentos)),
        "estudiantes_con_fallo": _pct(con_fallo, activos),
        "seg_mediana": _median(segundos),
        "seg_p90": _p(segundos, 0.90),
        "teclas": [{"label": f"{n}", "n": c} for n, c in sorted(inv.items())],
        "segundo_intento": _pct(
            sum(1 for a in data["_answers"] if a["attempt_number"] == 2),
            sum(1 for a in data["_answers"] if a["attempt_number"] == 1)),
    }


# ── Entrada ──────────────────────────────────────────────────────────────────

def build(db: DBSession, week: date, weeks_shown: int = 4) -> dict:
    """Payload completo del panel del juego para la semana `week` (su lunes)."""
    data = load(db)
    weeks = _weeks_back(week, weeks_shown)
    return {
        "meta": {
            "week": week.isoformat(),
            "weeks": [w.isoformat() for w in weeks],
            "labels": [f"{w.strftime('%d/%m')}–{(w + timedelta(days=6)).strftime('%d/%m')}"
                       for w in weeks],
            "generated_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
            "tz": "-03:00",
            "estudiantes": len(data["players"]),
            "respuestas": len(data["_answers"]),
            "bots_excluidos": data["_bots"],
        },
        "headline": headline(data, weeks),
        "funnel": funnel(data, week),
        "sesiones": sesiones(data, weeks),
        "profundidad": profundidad(data, weeks),
        "motor": motor(data, weeks),
        "plantillas": plantillas(data, weeks),
        "cafecito": cafecito(data, weeks),
        "rivalidad": rivalidad(data, weeks),
        "difusion": difusion(data, weeks),
        "dispositivo": dispositivo(data, weeks),
        "puente": puente(data, weeks),
        "entrada": entrada(data, weeks),
    }
