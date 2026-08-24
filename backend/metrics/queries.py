"""Todas las métricas del panel, en un payload de dicts planos.

**Por qué se agrega en Python y no en SQL.** El instinto es escribir
`date_trunc`, `filter (where ...)` y `generate_series` y dejar que Postgres haga
el trabajo. Acá conviene lo contrario, por dos motivos:

  1. El dev local corre SQLite y producción Postgres. Todo lo que hace linda la
     agregación en SQL es dialecto de Postgres, así que el panel no se podría
     ni levantar ni testear localmente — y el check de `scripts/` sigue la
     convención del repo de sembrar un SQLite temporal.
  2. Los datos son chicos: ~10k respuestas, ~2k sesiones, ~400 usuarios. Traer
     las columnas justas y agrupar en memoria tarda milisegundos y cuesta unos
     pocos MB. La complejidad de un SQL portable no se paga.

Si algún día `answers` pasa el millón de filas esto hay que dar vuelta. Hasta
entonces, un solo `SELECT` por tabla y el resto es Python legible.

**Zona horaria.** Las columnas son `datetime.utcnow()`, o sea naive en UTC. El
día y la semana del negocio son los de Argentina, así que todo pasa por
`local_date()`. Las semanas arrancan lunes.

**Definiciones que no se negocian** (los mismos criterios del reporte semanal,
ver docs/reports/FORMATO.md):
  - Sesión = `mode IN ('main','practice')`. Las de `onboarding` son el ejercicio
    de prueba del alta y las de `test` son QA; contarlas fue lo que infló el
    "97% completó una sesión" durante dos semanas.
  - P1 = % de respuestas con `quality_score = 5` (acierto al primer intento).
    `is_correct` cuenta hasta el tercer intento y da ~93% en todos lados.
  - Duración = `finished_at - started_at`. `duration_seconds` está muerta.
  - Terminada = `finished_at IS NOT NULL`.
"""
from __future__ import annotations

import statistics
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta

from sqlalchemy import text
from sqlalchemy.orm import Session as DBSession

# Argentina no tiene DST desde 2009, así que un offset fijo alcanza y evita
# depender de la base de tzdata del contenedor (ver el comentario de tzdata en
# requirements.txt: la imagen de Railway no trae los alias viejos).
AR_OFFSET = timedelta(hours=-3)

REAL_MODES = ("main", "practice")

# Códigos de carrera válidos del onboarding (web/.../onboarding-wizard.tsx).
# Cualquier otra cosa cae en "Otra". Las etiquetas y los emojis viven en
# render.py: acá solo importa qué claves existen.
CAREER_LABEL = ("E", "S", "T", "M")

# Prefijo del id de grupo de WhatsApp → facultad. El id es "uba042": prefijo de
# universidad + número (ver web/src/lib/analytics/attribution.ts).
ORIGIN_LABEL = {"uba": "UBA", "utn": "UTN", "unc": "UNC", "unlp": "UNLP", "unsam": "UNSAM"}

# Canales muestreados de la micro-encuesta y su reparto nominal, para poder
# contrastar la mezcla real contra la esperada (ver feedback_survey.py).
SURVEY_NOMINAL = {"D": 0.60, "A": 0.25, "B": 0.15}

D_ORDER = ["aburrido", "justo", "interesante"]
A_ORDER = ["muy_facil", "justo", "muy_dificil"]

# Los chips de razón del canal D vienen apareados por eje: cada eje tiene una
# razón positiva y una negativa. Agrupar por eje es lo que responde "¿los
# problemas fallan por contexto o por falta de ingenio?" sin mirar el polo.
D_AXIS = {
    "me_hizo_pensar": ("Ingenio", "pos"), "pura_cuenta": ("Ingenio", "neg"),
    "buen_contexto": ("Contexto", "pos"), "no_le_vi_sentido": ("Contexto", "neg"),
    "aprendi_algo": ("Aporte", "pos"), "ya_lo_sabia": ("Aporte", "neg"),
}

# Banda de calibración de dificultad: sale de cruzar los votos de la encuesta de
# dificultad contra el comportamiento real. Fuera de esa franja el ítem está mal
# calibrado (muy fácil arriba, muy difícil abajo).
P1_BAND = (55, 77)


def local_date(dt: datetime | None) -> date | None:
    return None if dt is None else (dt + AR_OFFSET).date()


def week_start(d: date) -> date:
    """Lunes de la semana de `d`."""
    return d - timedelta(days=d.weekday())


def _as_dt(v):
    """Normaliza una columna de fecha a `datetime`.

    Hace falta porque los dos motores devuelven cosas distintas para el MISMO
    `SELECT` en texto plano: psycopg2 entrega `datetime`, pero SQLite guarda las
    fechas como texto y sin el mapeo de tipos del ORM (que un `text()` no
    aplica) las devuelve como `str`. Sin esto el panel anda en producción y
    explota en local, que es la peor forma de que ande.
    """
    if v is None or isinstance(v, datetime):
        return v
    try:
        return datetime.fromisoformat(str(v))
    except ValueError:
        return None


def _rows(db: DBSession, sql: str) -> list[dict]:
    res = db.execute(text(sql))
    cols = list(res.keys())
    # Convención del esquema: toda columna de fecha termina en `_at`.
    dt_cols = [c for c in cols if c.endswith("_at")]
    out = []
    for r in res.fetchall():
        d = dict(zip(cols, r))
        for c in dt_cols:
            d[c] = _as_dt(d[c])
        out.append(d)
    return out


def _pct(num: float, den: float) -> float | None:
    """None y no 0 cuando no hay denominador: un 0% dibujado es una afirmación
    ('nadie lo hizo') y un None es la ausencia de dato. Confundirlos es cómo un
    panel vacío termina pareciendo una caída."""
    return None if not den else round(100.0 * num / den, 1)


# ── Carga ────────────────────────────────────────────────────────────────────

def load(db: DBSession) -> dict:
    """Un SELECT por tabla, solo las columnas que se usan."""
    data = {
        "users": _rows(db, """
            SELECT id, created_at, first_group_id, first_utm_source, total_xp,
                   notify_enabled, email_unsubscribed,
                   bounce_email_sent_at, winback_email_sent_at,
                   streak_email_sent_at, streak_email_sent_tier
            FROM users"""),
        "enrollments": _rows(db, """
            SELECT user_id, course_id, university, career, known_units, enrolled_at
            FROM enrollments"""),
        "sessions": _rows(db, """
            SELECT id, user_id, course_id, mode, started_at, finished_at, exercises_total
            FROM sessions"""),
        "answers": _rows(db, """
            SELECT session_id, user_id, course_id, exercise_external_id, belt,
                   exercise_type, quality_score, answered_at
            FROM answers"""),
        "feedback": _rows(db, """
            SELECT user_id, course_id, exercise_external_id, question_type, value,
                   reason, shown_at, answered_at, thanks_sent_at
            FROM exercise_feedback"""),
        "courses": _rows(db, "SELECT id, slug FROM courses"),
        "push": _rows(db, "SELECT DISTINCT user_id FROM push_subscriptions"),
        "sends": _rows(db, """
            SELECT category, sent_at, delivery_status, opened_at FROM notification_sends"""),
    }
    return data


# ── Bloques ──────────────────────────────────────────────────────────────────

def _weeks_back(week: date, n: int) -> list[date]:
    """La semana elegida y las n-1 anteriores, de más vieja a más nueva."""
    return [week - timedelta(weeks=i) for i in range(n - 1, -1, -1)]


def _user_week(users: list[dict]) -> dict[int, date]:
    return {u["id"]: week_start(local_date(u["created_at"])) for u in users}


def _real_sessions(sessions: list[dict]) -> list[dict]:
    return [s for s in sessions if s["mode"] in REAL_MODES]


def funnel(data: dict, week: date) -> dict:
    """Embudo de la cohorte que se dio de alta en `week`, observada hasta hoy.

    Arranca en "llegó a la app" y no en "creó cuenta": las cuentas las crea
    Clerk y no están en esta base, así que el escalón Clerk → app (que en la
    semana del 18/08 fue de 273 a 233) no es medible acá. Decirlo es mejor que
    inventar un techo.

    Ojo al comparar con el PDF semanal: ahí las sesiones se cortaban al domingo
    de la semana; acá la cohorte se sigue hasta hoy, así que los escalones de
    sesión dan un poco más altos. Es a propósito.
    """
    uw = _user_week(data["users"])
    cohort = {u["id"] for u in data["users"] if uw[u["id"]] == week}

    enrolled = {e["user_id"] for e in data["enrollments"]} & cohort
    opened, finished = set(), Counter()
    for s in _real_sessions(data["sessions"]):
        if s["user_id"] in cohort:
            opened.add(s["user_id"])
            if s["finished_at"] is not None:
                finished[s["user_id"]] += 1

    steps = [
        ("Llegó a la app", len(cohort)),
        ("Completó el onboarding", len(enrolled)),
        ("Abrió una sesión", len(opened)),
        ("Terminó una sesión", sum(1 for v in finished.values() if v >= 1)),
        ("Terminó más de una", sum(1 for v in finished.values() if v > 1)),
    ]
    top = steps[0][1]
    out = []
    for i, (label, n) in enumerate(steps):
        out.append({
            "label": label, "n": n,
            "pct_top": _pct(n, top),
            "pct_prev": None if i == 0 else _pct(n, steps[i - 1][1]),
        })
    return {"steps": out, "cohort": len(cohort)}


def headline(data: dict, weeks: list[date]) -> list[dict]:
    """Tarjetas de titulares: una fila por semana para el sparkline, y el delta
    contra la semana anterior."""
    uw = _user_week(data["users"])
    by_week: dict[date, dict] = {w: {"altas": 0, "termino1": 0, "termino2": 0, "d1": 0} for w in weeks}

    finished_by_user = defaultdict(list)
    for s in _real_sessions(data["sessions"]):
        if s["finished_at"] is not None:
            finished_by_user[s["user_id"]].append(local_date(s["finished_at"]))

    alta_date = {u["id"]: local_date(u["created_at"]) for u in data["users"]}
    for uid, w in uw.items():
        if w not in by_week:
            continue
        b = by_week[w]
        b["altas"] += 1
        days = finished_by_user.get(uid, [])
        if len(days) >= 1:
            b["termino1"] += 1
        if len(days) > 1:
            b["termino2"] += 1
        if alta_date[uid] + timedelta(days=1) in days:
            b["d1"] += 1

    def card(key: str, label: str, hint: str, pct_of: str | None = None) -> dict:
        series = [by_week[w][key] for w in weeks]
        if pct_of:
            series = [_pct(by_week[w][key], by_week[w][pct_of]) or 0 for w in weeks]
        cur, prev = series[-1], series[-2] if len(series) > 1 else None
        return {
            "key": key, "label": label, "hint": hint,
            "value": cur, "prev": prev, "series": series,
            "suffix": "%" if pct_of else "",
            "delta": None if prev in (None, 0) else round(cur - prev, 1),
        }

    return [
        card("altas", "Altas", "usuarios nuevos que llegaron a la app"),
        card("termino1", "Terminaron ≥1 sesión", "de la cohorte de esa semana"),
        card("termino2", "Terminaron >1", "la vara de «volvió»"),
        card("d1", "Vuelven a D+1", "% de la cohorte con sesión al día siguiente", pct_of="altas"),
    ]


def retention(data: dict, weeks: list[date], horizon: int = 13) -> dict:
    """Curva D+k por cohorte semanal.

    **El 100% son los que estudiaron, no los que se dieron de alta.** Retener
    es traer de vuelta a alguien que ya usó el producto; quien se registró y
    nunca terminó una sesión no llegó a tener nada que repetir, y meterlo en el
    denominador mezcla dos problemas distintos —convertir y retener— en un solo
    número que baja cuando cualquiera de los dos empeora. Cuánta gente convierte
    a estudiar se mide en el embudo, que es donde corresponde.

    `observables` importa por separado: alguien que se dio de alta ayer no puede
    tener D+5 todavía, así que el denominador de cada k son solo los de la base
    que ya vivieron ese día.
    """
    uw = _user_week(data["users"])
    alta = {u["id"]: local_date(u["created_at"]) for u in data["users"]}
    today = local_date(datetime.utcnow())

    active = defaultdict(set)  # user_id -> {fechas con sesión terminada}
    for s in _real_sessions(data["sessions"]):
        if s["finished_at"] is not None:
            active[s["user_id"]].add(local_date(s["finished_at"]))

    cohorts = []
    for w in weeks:
        altas = [uid for uid, ws in uw.items() if ws == w]
        # La base a retener: los de la cohorte que terminaron alguna sesión.
        members = [uid for uid in altas if active.get(uid)]
        if not members:
            continue
        points = []
        for k in range(horizon + 1):
            obs = [uid for uid in members if alta[uid] + timedelta(days=k) <= today]
            hit = sum(1 for uid in obs if alta[uid] + timedelta(days=k) in active.get(uid, ()))
            points.append({"k": k, "obs": len(obs), "n": hit, "pct": _pct(hit, len(obs))})
        cohorts.append({"label": w.strftime("%d/%m"), "week": w.isoformat(),
                        "n": len(members), "altas": len(altas), "points": points})
    return {"cohortes": cohorts, "horizon": horizon}


def _behaviour(data: dict, uids: set[int]) -> dict:
    """Bloque de comportamiento reusado por todos los cortes de cohorte.

    Dos denominadores distintos a propósito:
      - `estudio` se mide sobre TODOS los del corte: es conversión, "de los que
        llegaron por acá, cuántos llegaron a estudiar".
      - `volvio` y `dos_dias` se miden sobre los que estudiaron: es retención, y
        el usuario a retener es el que ya usó el producto. Sobre el total, los
        dos números bajarían solo porque el origen convierte mal, y no se podría
        distinguir un origen que trae gente que no arranca de uno que trae gente
        que arranca y no vuelve. Son problemas distintos con soluciones
        distintas.
    """
    finished = Counter()
    days = defaultdict(set)
    for s in _real_sessions(data["sessions"]):
        if s["user_id"] in uids and s["finished_at"] is not None:
            finished[s["user_id"]] += 1
            days[s["user_id"]].add(local_date(s["finished_at"]))
    n = len(uids)
    base = sum(1 for v in finished.values() if v >= 1)
    return {
        "n": n,
        "base": base,
        "estudio": _pct(base, n),
        "volvio": _pct(sum(1 for v in finished.values() if v > 1), base),
        "dos_dias": _pct(sum(1 for d in days.values() if len(d) >= 2), base),
    }


def cohorts(data: dict, weeks: list[date]) -> dict:
    """Los cortes de población. Todos sobre los usuarios dados de alta en el
    rango de semanas visible, para que se comparen entre sí."""
    uw = _user_week(data["users"])
    scope = {uid for uid, w in uw.items() if w in set(weeks)}

    enr = {e["user_id"]: e for e in data["enrollments"] if e["user_id"] in scope}
    course_slug = {c["id"]: c["slug"] for c in data["courses"]}
    origin = {u["id"]: u["first_group_id"] for u in data["users"] if u["id"] in scope}

    def cut(buckets: dict[str, set[int]], min_n: int = 1) -> list[dict]:
        out = []
        for label, uids in buckets.items():
            if len(uids) < min_n:
                continue
            out.append({"label": label, **_behaviour(data, uids)})
        return sorted(out, key=lambda r: -r["n"])

    by_uni: dict[str, set[int]] = defaultdict(set)
    by_career: dict[str, set[int]] = defaultdict(set)
    by_course: dict[str, set[int]] = defaultdict(set)
    by_known: dict[str, set[int]] = defaultdict(set)
    # Se agrupa por la CLAVE cruda (sigla, código de carrera, slug de curso) y
    # no por su etiqueta legible: el etiquetado es presentación y vive en
    # render.py, y así `data.json` queda estable para consumir desde afuera.
    for uid, e in enr.items():
        by_uni[e["university"] or "Sin declarar"].add(uid)
        by_career[e["career"] if e["career"] in CAREER_LABEL else "Otra"].add(uid)
        by_course[course_slug.get(e["course_id"], "?")].add(uid)
        ku = (e["known_units"] or "").strip()
        by_known["Marcó alguna" if ku else "No marcó ninguna"].add(uid)

    by_origin: dict[str, set[int]] = defaultdict(set)
    by_group: dict[str, set[int]] = defaultdict(set)
    for uid, gid in origin.items():
        if not gid:
            by_origin["Sin atribución"].add(uid)
            continue
        prefix = "".join(ch for ch in gid if ch.isalpha())
        by_origin[ORIGIN_LABEL.get(prefix, prefix.upper())].add(uid)
        by_group[gid].add(uid)

    attributed = sum(1 for g in origin.values() if g)
    return {
        "origen": cut(by_origin),
        # Un grupo con 2 usuarios no dice nada de su tasa de vuelta; el corte
        # por grupo solo sirve donde hay volumen.
        "grupos": cut(by_group, min_n=5),
        "universidad": cut(by_uni),
        "carrera": cut(by_career),
        "curso": cut(by_course),
        "unidades": cut(by_known),
        "atribucion": {"con": attributed, "total": len(scope),
                       "pct": _pct(attributed, len(scope))},
    }


def producto(data: dict, weeks: list[date]) -> dict:
    """Sesiones, abandono, duración y P1."""
    lo = weeks[0]
    hi = weeks[-1] + timedelta(days=7)
    course_slug = {c["id"]: c["slug"] for c in data["courses"]}

    sess = [s for s in _real_sessions(data["sessions"])
            if lo <= local_date(s["started_at"]) < hi]
    ids = {s["id"] for s in sess}

    por_curso: dict[tuple, dict] = defaultdict(lambda: {"iniciadas": 0, "terminadas": 0})
    duraciones = defaultdict(list)
    for s in sess:
        k = (course_slug.get(s["course_id"], "?"), s["mode"])
        por_curso[k]["iniciadas"] += 1
        if s["finished_at"] is not None:
            por_curso[k]["terminadas"] += 1
            duraciones[s["mode"]].append((s["finished_at"] - s["started_at"]).total_seconds())

    sesiones = [{"curso": c, "modo": m, **v, "pct": _pct(v["terminadas"], v["iniciadas"])}
                for (c, m), v in sorted(por_curso.items())]

    # Sesiones que se abrieron y no resolvieron NADA. Van aparte del abandono
    # porque son otro problema: quien corta en el ejercicio 6 se cansó, quien
    # corta en el 0 nunca arrancó (carga lenta, se abrió sin intención, el
    # primer ejercicio asustó). Mezclarlos esconde el más grande de los dos.
    #
    # `answers.intra_session_position` está SIEMPRE en NULL en producción (el
    # cliente nunca la reporta), así que esto se cuenta por respuestas.
    por_sesion = Counter()
    for a in data["answers"]:
        if a["session_id"] in ids:
            por_sesion[a["session_id"]] += 1

    ans = [a for a in data["answers"]
           if a["session_id"] in ids and a["quality_score"] is not None]

    def p1_by(key: str) -> list[dict]:
        agg = defaultdict(lambda: [0, 0])
        for a in ans:
            g = agg[a[key]]
            g[1] += 1
            if a["quality_score"] == 5:
                g[0] += 1
        return sorted(
            [{"label": k, "n": tot, "p1": _pct(ok, tot)} for k, (ok, tot) in agg.items() if tot >= 10],
            key=lambda r: -(r["p1"] or 0))

    # El corte principal del bloque: accuracy y abandono lado a lado por curso.
    # Son las dos caras de lo mismo —si un curso cuesta más, se abandona más— y
    # sirven mucho más comparadas entre sí que cada una por su lado.
    p1_curso = defaultdict(lambda: [0, 0])
    for a in ans:
        g = p1_curso[course_slug.get(a["course_id"], "?")]
        g[1] += 1
        if a["quality_score"] == 5:
            g[0] += 1

    cursos = []
    for slug in sorted({course_slug.get(s["course_id"], "?") for s in sess}):
        fila = {"curso": slug}
        ok, tot = p1_curso.get(slug, (0, 0))
        fila["p1"] = _pct(ok, tot)
        fila["respuestas"] = tot
        for modo in REAL_MODES:
            m = [s for s in sess
                 if s["mode"] == modo and course_slug.get(s["course_id"]) == slug]
            sin_fin = sum(1 for s in m if s["finished_at"] is None)
            fila[f"{modo}_n"] = len(m)
            fila[f"{modo}_abandono"] = _pct(sin_fin, len(m))
            fila[f"{modo}_cero"] = sum(1 for s in m if por_sesion[s["id"]] == 0)
        cursos.append(fila)

    return {
        "sesiones": sesiones,
        "cursos": cursos,
        "sin_respuesta": {
            m: sum(1 for s in sess if s["mode"] == m and por_sesion[s["id"]] == 0)
            for m in REAL_MODES},
        "duracion": {m: round(statistics.median(v) / 60, 1) for m, v in duraciones.items() if v},
        "p1_skill": p1_by("exercise_type"),
        "p1_belt": p1_by("belt"),
        "p1_global": _pct(sum(1 for a in ans if a["quality_score"] == 5), len(ans)),
        "respuestas": len(ans),
        "banda": P1_BAND,
    }


def encuestas(data: dict, weeks: list[date]) -> dict:
    """Micro-encuestas: mezcla de canales, canal D y ranking de ítems.

    El ranking va **estratificado por P1**. El interés reportado correlaciona
    fortísimo con "me salió": un ejercicio resuelto al primer intento se siente
    interesante mucho más seguido que uno que trabó, sin importar su calidad.
    Sin ese control, `value` mide autoestima y no calidad del problema. Si el
    orden se sostiene en los dos estratos, la señal es del ejercicio; si se da
    vuelta, es del desempeño.
    """
    lo, hi = weeks[0], weeks[-1] + timedelta(days=7)
    fb = [f for f in data["feedback"] if lo <= local_date(f["shown_at"]) < hi]

    mix = []
    for ch in ("D", "A", "B"):
        shown = [f for f in fb if f["question_type"] == ch]
        ans = [f for f in shown if f["answered_at"] is not None]
        mix.append({"canal": ch, "shown": len(shown), "answered": len(ans),
                    "tasa": _pct(len(ans), len(shown)),
                    "real": _pct(len(shown), sum(1 for f in fb if f["question_type"] in SURVEY_NOMINAL)),
                    "nominal": round(SURVEY_NOMINAL[ch] * 100)})

    def dist(channel: str, order: list[str]) -> list[dict]:
        vals = Counter(f["value"] for f in fb
                       if f["question_type"] == channel and f["answered_at"] is not None)
        tot = sum(vals.values())
        return [{"label": v, "n": vals.get(v, 0), "pct": _pct(vals.get(v, 0), tot)} for v in order]

    razones = Counter(f["reason"] for f in fb
                      if f["question_type"] == "D" and f["reason"])
    ejes: dict[str, dict] = defaultdict(lambda: {"pos": 0, "neg": 0})
    for r, n in razones.items():
        axis, sign = D_AXIS.get(r, (None, None))
        if axis:
            ejes[axis][sign] += n

    # P1 por ítem, para estratificar el ranking de interés.
    p1_item: dict[str, tuple[int, int]] = {}
    agg = defaultdict(lambda: [0, 0])
    for a in data["answers"]:
        if a["exercise_external_id"] and a["quality_score"] is not None:
            g = agg[a["exercise_external_id"]]
            g[1] += 1
            if a["quality_score"] == 5:
                g[0] += 1
    p1_item = {k: (ok, tot) for k, (ok, tot) in agg.items()}

    SCORE = {"interesante": 1, "justo": 0, "aburrido": -1}
    per_item = defaultdict(list)
    for f in fb:
        if f["question_type"] == "D" and f["value"] in SCORE:
            per_item[f["exercise_external_id"]].append(SCORE[f["value"]])

    items = []
    for ext, scores in per_item.items():
        ok, tot = p1_item.get(ext, (0, 0))
        items.append({
            "item": ext, "n": len(scores),
            "score": round(sum(scores) / len(scores), 2),
            "p1": _pct(ok, tot), "respuestas": tot,
        })
    items.sort(key=lambda r: r["score"])

    reportes = [f for f in fb if f["question_type"] == "C"]
    return {
        "mix": mix,
        "d": dist("D", D_ORDER),
        "a": dist("A", A_ORDER),
        "ejes": [{"eje": k, **v} for k, v in sorted(ejes.items())],
        "items": items,
        "reportes": len(reportes),
        "total": len(fb),
    }


# Cuántos días después de recibir un mail cuenta como que ese mail funcionó.
# Tres: un mail de retención que hace efecto lo hace en el día o al siguiente;
# estirarlo más se empieza a comer actividad que hubiera pasado igual.
EMAIL_ACTIVATION_DAYS = 3

EMAIL_TIPOS = [
    ("bounce", "Se registró y nunca estudió", "bounce_email_sent_at"),
    ("winback", "Estudió y hace 5+ días que no vuelve", "winback_email_sent_at"),
    ("streak", "Llegó a un hito de multiplicador", "streak_email_sent_at"),
]


def emails(data: dict, weeks: list[date]) -> dict:
    """Los cuatro mails de ciclo de vida: envíos y activación.

    **Activación** = el usuario terminó una sesión dentro de los
    EMAIL_ACTIVATION_DAYS días posteriores al envío. Es lo más cerca que se
    puede estar de "el mail funcionó" con lo que hay instrumentado, y es la
    pregunta que importa: un mail que se abre y no te trae de vuelta no sirve.

    Dos advertencias para leer estos números:

    - **`streak` no se compara con los otros.** Va a quien viene de una racha
      activa, o sea que su activación arranca altísima por selección: esa gente
      iba a volver igual. Los que miden algo son `bounce` y `winback`, donde el
      destinatario estaba inactivo por definición.
    - **No hay grupo de control.** Nadie elegible se queda sin mail, así que
      "activación" es una tasa bruta y no un efecto causal. Para saber cuánto
      aporta el mail habría que dejar un holdout sin mandar.

    Las **aperturas** no están: Resend las conoce pero no llegan a esta base.
    Necesitan un webhook de Resend (`email.opened` / `email.clicked`) contra un
    endpoint nuevo. Lo que sí quedó instrumentado desde hoy son los CLICKS: los
    botones ahora llevan `?utm_source=email&utm_campaign=<tipo>`
    (ver lifecycle_emails._cta_url), así que PostHog los separa por copy.
    """
    lo, hi = weeks[0], weeks[-1] + timedelta(days=7)

    activo = defaultdict(list)
    for s in _real_sessions(data["sessions"]):
        if s["finished_at"] is not None:
            activo[s["user_id"]].append(s["finished_at"])

    def activacion(rows: list[tuple[int, datetime]]) -> tuple[int, int]:
        """(enviados, activados) para una lista de (user_id, sent_at)."""
        hits = 0
        for uid, sent in rows:
            limite = sent + timedelta(days=EMAIL_ACTIVATION_DAYS)
            if any(sent <= f <= limite for f in activo.get(uid, ())):
                hits += 1
        return len(rows), hits

    tipos = []
    for key, desc, col in EMAIL_TIPOS:
        rows = [(u["id"], u[col]) for u in data["users"]
                if u[col] is not None and lo <= local_date(u[col]) < hi]
        enviados, act = activacion(rows)
        tipos.append({"tipo": key, "desc": desc, "enviados": enviados,
                      "activados": act, "pct": _pct(act, enviados)})

    # El agradecimiento por reportar vive en exercise_feedback, no en users: la
    # idempotencia es por reporte y un usuario puede reportar más de una vez.
    # Se cuenta por usuario-día para no inflar a quien reportó tres cosas juntas
    # (recibe un solo mail).
    thanks = {(f["user_id"], local_date(f["thanks_sent_at"])): f["thanks_sent_at"]
              for f in data["feedback"]
              if f["thanks_sent_at"] is not None
              and lo <= local_date(f["thanks_sent_at"]) < hi}
    enviados, act = activacion([(uid, sent) for (uid, _d), sent in thanks.items()])
    tipos.append({"tipo": "report_thanks", "desc": "Reportó un problema de contenido",
                  "enviados": enviados, "activados": act, "pct": _pct(act, enviados)})

    total = sum(t["enviados"] for t in tipos)
    return {
        "tipos": tipos,
        "enviados": total,
        "activados": sum(t["activados"] for t in tipos),
        "pct": _pct(sum(t["activados"] for t in tipos), total),
        "bajas": sum(1 for u in data["users"] if u["email_unsubscribed"]),
        "usuarios": len(data["users"]),
        "ventana_dias": EMAIL_ACTIVATION_DAYS,
    }


def reenganche(data: dict, weeks: list[date]) -> dict:
    lo, hi = weeks[0], weeks[-1] + timedelta(days=7)
    sends = [s for s in data["sends"] if lo <= local_date(s["sent_at"]) < hi]
    por_cat: dict[str, dict] = defaultdict(lambda: {"enviadas": 0, "abiertas": 0})
    for s in sends:
        c = por_cat[s["category"]]
        c["enviadas"] += 1
        if s["opened_at"] is not None:
            c["abiertas"] += 1

    entregadas = sum(1 for s in sends if s["delivery_status"] == "ok")
    return {
        "subs": len(data["push"]),
        "activos": sum(1 for u in data["users"] if u["notify_enabled"]),
        "enviadas": len(sends),
        "entregadas": entregadas,
        "abiertas": sum(1 for s in sends if s["opened_at"] is not None),
        "ctr": _pct(sum(1 for s in sends if s["opened_at"] is not None), len(sends)),
        "por_categoria": sorted(
            [{"categoria": k, **v, "ctr": _pct(v["abiertas"], v["enviadas"])}
             for k, v in por_cat.items()], key=lambda r: -r["enviadas"]),
        "bajas": sum(1 for u in data["users"] if u["email_unsubscribed"]),
    }


# ── Entrada ──────────────────────────────────────────────────────────────────

def build(db: DBSession, week: date, weeks_shown: int = 3) -> dict:
    """Payload completo del panel para la semana `week` (su lunes)."""
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
            "usuarios": len(data["users"]),
        },
        "headline": headline(data, weeks),
        "funnel": funnel(data, week),
        "retencion": retention(data, weeks),
        "cohortes": cohorts(data, weeks),
        "producto": producto(data, weeks),
        "encuestas": encuestas(data, weeks),
        "reenganche": reenganche(data, weeks),
        "emails": emails(data, weeks),
    }
