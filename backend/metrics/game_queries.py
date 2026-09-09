"""Métricas del minijuego de derivadas, en un payload de dicts planos.

Mismo criterio que `metrics/queries.py`: un `SELECT` por tabla y el resto es
Python. Los motivos son los mismos (dev en SQLite, producción en Postgres, datos
chicos), y arriba de eso hay uno propio del juego: acá casi ninguna métrica es
una agregación. La curva de supervivencia por número de ejercicio y la
sesionización por huecos son recorridos sobre series ordenadas, y escribirlos en
SQL portable sería peor código para el mismo resultado.

**Definiciones que no se negocian.** Son las que, si se aflojan, convierten el
panel en un generador de números lindos:

  - **Estudiante** = fila de `game_players` con `is_bot = false`. Los sembrados
    pueblan el ranking para que el primero en llegar tenga a quién escalar
    (scripts/seed_game_bots.py); contarlos como gente inflaría todo.
  - **Respuesta** = intento con `parse_ok = true`. Lo que no parsea se registra
    igual pero vive en su propia sección: es fricción del input, no matemática.
  - **Derivada resuelta** = acierto. Un ejercicio se cierra al acertar o al
    gastar el segundo intento, así que no hay doble conteo.
  - **Sesión de juego** = tanda de respuestas separadas por menos de
    `SESSION_GAP_MINUTES`. El juego no tiene un objeto «sesión» —se entra por un
    link y se juega hasta que uno se cansa— así que la sesión se reconstruye por
    huecos, que es la única definición disponible y hay que decirlo en voz alta.
  - **Partida** = la PRIMERA sesión de un estudiante, y nada más. Es lo que
    mide la curva de profundidad. Antes era su vida entera, y eso tenía dos
    costos: había que esperar 24 h de silencio para leerla —la cohorte de la
    semana en curso quedaba vacía todo el día— y la curva de una cohorte vieja
    seguía moviéndose para siempre, porque alguien de agosto que vuelve en
    octubre cambia la mediana de agosto. Una cohorte cerrada tiene que ser un
    hecho, no un número móvil.
  - **Partida cerrada** = su primera sesión ya no puede crecer, o sea que pasó
    más de `SESSION_GAP_MINUTES` desde la última respuesta de esa tanda. Es la
    única que entra en la curva: quien está jugando ahora todavía puede sumar
    derivadas, y contarlo hunde la cola por reloj y no por comportamiento.

**Zona horaria.** Igual que el panel de Intervalo: columnas naive en UTC, el día
del negocio es el de Argentina, todo pasa por `local_date()`. Semanas de lunes a
domingo.
"""
from __future__ import annotations

import statistics
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session as DBSession

from .queries import _pct, _rows, local_date, week_start

# Hueco que corta una sesión de juego. Media hora es lo que dura un empuje de
# cafecito y lo que la industria usa como default de sesión; lo importante no es
# el número exacto sino que sea UNO y esté escrito en un solo lugar.
SESSION_GAP_MINUTES = 30

# Los hitos donde el producto INTERRUMPE la partida para pedir algo. Los números
# no se eligen acá: son los del front, y hay que venir a cambiarlos cuando allá
# cambien.
#
#   - carrera y universidad a las 3   (web/src/app/derivadas/hitos-del-juego.ts :: HITO_PERFIL)
#   - registro a las 12               (idem :: HITO_REGISTRO)
#   - cafecito cada 20                (web/src/app/derivadas/cafecito-cta.tsx :: CAFECITO_EVERY)
#
# El panel los marca para poder ver si el escalón de abandono cae JUSTO ahí, que
# sería el producto pinchando su propia partida. Por eso importa que estén al
# día: con la universidad marcada en la 5 cuando en realidad se pide en la 3, el
# escalón que se estaba buscando quedaba dos derivadas corrido.
PEDIDO_PERFIL = 3
PEDIDO_REGISTRO = 12
PEDIDO_CAFECITO = 20

# Hasta dónde se dibuja la curva de supervivencia por ejercicio.
DEPTH_MAX = 40

# El teléfono y la compu son dos juegos distintos: en uno hay un flujo infinito
# de slides y un teclado matemático apoyado sobre uno táctil; en el otro está
# todo en una vista y la persona escribe con las dos manos. Agrupar iOS y
# Android bajo «teléfono» es el corte que decide dónde invertir; separarlos sale
# gratis, y en un juego que se difunde por WhatsApp en Argentina la mezcla dice
# a quién le está llegando el link.
PLATFORM_ORDER: tuple[str, ...] = ("android", "ios", "desktop")
PLATFORM_LABEL = {"android": "Android", "ios": "iOS", "desktop": "Escritorio",
                  None: "Sin dato"}

# El origen de un empuje que cuenta como ingreso: `cafecito` es el que entró por
# el oyente del stream (game/cafecito_stream.py). Los otros dos —`manual`, que
# insertamos nosotros para probar, y `aforo`, que regala el propio juego— no son
# plata y no pueden sumar al titular. Pasó: el primer día de producción 20 de 35
# cafecitos eran grants a mano.
DONADO = "cafecito"

# Primera semana que el panel del juego muestra: la de la difusión.
#
# Antes de esto el juego existía pero no lo había abierto nadie, así que todas
# las cohortes anteriores son ceros estructurales. Ceros que igual se dibujan:
# el sparkline arrancaba con tres semanas planas, cada titular decía «+72 vs.
# semana anterior» comparando contra una semana en la que el producto no estaba
# difundido, y las métricas de tasa quedaban en «sin base». Nada de eso es
# información — es la ausencia de producto con formato de tendencia.
#
# El piso es del PANEL, no de los datos: si alguna vez hay filas anteriores, las
# consultas las cuentan igual. Lo único que se corta es ofrecer esas semanas
# como si fueran comparables. Mismo criterio que FIRST_WEEK en metrics/queries.py.
FIRST_WEEK = date(2026, 8, 24)


def clamp_week(w: date) -> date:
    """No dejar salir del rango que el panel sabe mostrar."""
    return min(max(w, FIRST_WEEK), week_start(local_date(datetime.utcnow())))


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


# ── Carga ────────────────────────────────────────────────────────────────────

def load(db: DBSession) -> dict:
    """Un SELECT por tabla, solo las columnas que se usan.

    Solo tablas del juego: las de Intervalo (`users`, `sessions`) se cargaban
    enteras y no las leía ninguna sección, así que eran dos recorridos completos
    por armado del panel a cambio de nada.
    """
    data = {
        "players": _rows(db, """
            SELECT id, user_id, alias, university, referred_by, referral_xp_given,
                   platform, is_bot, notify_enabled, winback_email_sent_at,
                   pwa_first_seen_at, created_at, last_seen_at
            FROM game_players"""),
        "exercises": _rows(db, "SELECT id, player_id, created_at FROM game_exercises"),
        "attempts": _rows(db, """
            SELECT player_id, attempt_number, parse_ok, is_correct, created_at
            FROM game_attempts"""),
        "boosts": _rows(db, "SELECT cafecitos, source, created_at FROM game_boosts"),
        # Los avisos push del juego y los navegadores suscriptos. Las dos tablas
        # son chicas por construcción —una fila por envío y una por navegador—
        # y sin ellas la sección de re-enganche no tiene nada que contar.
        "avisos": _rows(db, """
            SELECT player_id, category, variant_key, sent_at, delivery_status,
                   opened_at
            FROM game_notification_sends"""),
        "suscripciones": _rows(db, "SELECT player_id FROM game_push_subscriptions"),
        # De `users`, SOLO lo que el panel del juego necesita para los mails, y
        # solo de quienes tienen jugador. La tabla entera se había sacado de acá
        # a propósito —se cargaba completa y no la leía ninguna sección— así que
        # esto vuelve acotado: el marcador del resumen semanal, la baja del
        # canal y si tiene los avisos prendidos, que para un jugador registrado
        # es donde vive la preferencia (game/notifications.py).
        "usuarios": _rows(db, """
            SELECT u.id, u.email_unsubscribed, u.reclutas_email_sent_on,
                   u.notify_enabled
            FROM users u
            JOIN game_players p ON p.user_id = u.id"""),
        "cta": _rows(db, "SELECT player_id, created_at FROM game_cta_events"),
    }

    # Los bots se sacan UNA vez, acá, y no en cada bloque: filtrar en diez
    # lugares es la forma segura de olvidarse en el undécimo.
    bots = {p["id"] for p in data["players"] if p["is_bot"]}
    data["players"] = [p for p in data["players"] if not p["is_bot"]]
    data["exercises"] = [e for e in data["exercises"] if e["player_id"] not in bots]
    data["attempts"] = [a for a in data["attempts"] if a["player_id"] not in bots]
    data["cta"] = [c for c in data["cta"] if c["player_id"] not in bots]
    data["avisos"] = [a for a in data["avisos"] if a["player_id"] not in bots]
    data["suscripciones"] = [x for x in data["suscripciones"] if x["player_id"] not in bots]
    data["_bots"] = len(bots)

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
    """La semana elegida y las n-1 anteriores, de más vieja a más nueva.

    Corta en `FIRST_WEEK`: antes de la difusión el juego no tenía a nadie, y esas
    semanas vacías no son una caída sino la ausencia de producto."""
    ws = [week - timedelta(weeks=i) for i in range(n - 1, -1, -1)]
    return [w for w in ws if w >= FIRST_WEEK] or [week]


def _in_week(dt: datetime | None, week: date) -> bool:
    d = local_date(dt)
    return d is not None and week <= d <= week + timedelta(days=6)


# ── 0 · Titulares ──────────────────────────────────────────────────────────

def _sesiones(lista: list[dict]) -> list[list[dict]]:
    """Las tandas de un jugador, cortando en cada hueco largo.

    `lista` son los eventos de un solo jugador en orden —`_answers` y `_firsts`
    ya vienen ordenadas por (jugador, fecha), así que agruparlas alcanza—. Es el
    ÚNICO lugar donde se decide dónde termina una sesión: la usan el titular de
    la primera sesión, el de la segunda, el de la duración, el conteo de visitas
    y la curva de profundidad. Si se partiera en dos, el panel tendría dos
    definiciones de «sesión» y una de las dos envejecería mal.
    """
    salida: list[list[dict]] = []
    fin = None
    for a in lista:
        t = a["created_at"]
        if t is None:
            continue
        if fin is None or (t - fin) > timedelta(minutes=SESSION_GAP_MINUTES):
            salida.append([])
        fin = t
        salida[-1].append(a)
    return salida


def _primera_sesion(lista: list[dict]) -> list[dict]:
    """La primera tanda, que es la que mide la curva de profundidad."""
    tandas = _sesiones(lista)
    return tandas[0] if tandas else []


def _minutos(tanda: list[dict]) -> float:
    """Cuánto duró una tanda, del primer evento al último.

    Una tanda de un solo evento dura cero, y eso NO es un dato faltante: es
    alguien que respondió una vez y se fue. Meterlo como nulo escondería
    justamente el caso más común del juego.
    """
    if len(tanda) < 2:
        return 0.0
    return (tanda[-1]["created_at"] - tanda[0]["created_at"]).total_seconds() / 60.0


def _correctas_de_la_primera_sesion(lista: list[dict]) -> int:
    """Cuántas acertó alguien en su primera tanda."""
    return sum(1 for a in _primera_sesion(lista) if a["is_correct"])


def headline(data: dict, weeks: list[date]) -> list[dict]:
    """Los doce números de arriba, en tres filas de cuatro.

    Cada fila contesta una pregunta distinta, y el orden es el de las decisiones
    y no el de las features:

      1. **Entrada** — cuánta gente vino, cuánta es nueva, y cuántos de esos
         cruzaron los dos umbrales que los vuelven alcanzables: instalar la app y
         registrarse.
      2. **Crecimiento** — quién vuelve, quién trae gente y qué deja.
      3. **Sesiones** — qué tan profunda es la primera sentada, si hay una
         segunda, y cuánto duran.

    La tercera fila es la que estaba faltando: el juego se juega de una sentada,
    así que el número que decide todo es cuánto aguanta esa sentada y si hay
    alguna después. Estaba repartido entre un solo titular y la curva de
    profundidad.
    """
    players = data["players"]
    answers = data["_answers"]
    alta_de = {p["id"]: local_date(p["created_at"]) for p in players}

    # ── Quién estuvo cada semana ────────────────────────────────────────
    # No hay tabla de visitas: el juego no registra un pageview, registra lo que
    # la persona HACE. Así que "ingresó" se arma con toda huella fechada que deja
    # una visita —el alta, un ejercicio servido, una respuesta, un cartel visto—
    # más `last_seen_at`, que es lo único que deja quien volvió y no tocó nada.
    #
    # Lo que esto NO ve: alguien que ya existía, vuelve a abrir la página, no hace
    # nada, y otra semana vuelve y sí juega. Su primera vuelta se pierde, porque
    # `last_seen_at` es un solo instante y se lo lleva la segunda. Los pageviews
    # de verdad los tiene PostHog; acá el número es un piso, nunca un techo.
    visto: dict[date, set[int]] = defaultdict(set)
    # Y la misma huella, guardada por jugador y con su instante: es lo que
    # permite contar VISITAS —cuántas veces se sentó alguien a jugar— y no solo
    # cuántas personas distintas hubo. Una persona que entra tres veces en la
    # semana son tres visitas y un ingreso.
    huellas: dict[int, list[dict]] = defaultdict(list)

    def marcar(pid: int, cuando) -> None:
        w = _week_of(cuando)
        if w is not None:
            visto[w].add(pid)
        if cuando is not None:
            huellas[pid].append({"created_at": cuando})

    for p in players:
        marcar(p["id"], p["created_at"])
        marcar(p["id"], p["last_seen_at"])
    for e in data["exercises"]:
        marcar(e["player_id"], e["created_at"])
    for a in data["attempts"]:
        marcar(a["player_id"], a["created_at"])
    for c in data["cta"]:
        marcar(c["player_id"], c["created_at"])

    por_jugador: dict[int, list[dict]] = defaultdict(list)
    for a in answers:
        por_jugador[a["player_id"]].append(a)

    # Las tandas de cada jugador, sobre TODA huella y no solo sobre respuestas:
    # quien abre el juego, mira y se va también visitó. Se ordenan una vez.
    tandas_de: dict[int, list[list[dict]]] = {
        pid: _sesiones(sorted(hs, key=lambda h: h["created_at"]))
        for pid, hs in huellas.items()
    }

    def nuevos(w: date) -> list[dict]:
        return [p for p in players if _in_week(p["created_at"], w)]

    def per_week(fn) -> list:
        return [fn(w) for w in weeks]

    def visitas(w: date) -> int:
        """Cuántas veces se sentó alguien a jugar esa semana.

        Una tanda es una visita: la misma persona que entra el lunes y el jueves
        cuenta dos. Es la diferencia con «usuarios nuevos», que cuenta personas,
        y es lo que dice si la gente vuelve DENTRO de la semana.

        No hay tabla de pageviews —el juego registra lo que la persona HACE— así
        que la tanda se arma con toda huella fechada: el alta, un ejercicio
        servido, una respuesta, un cartel visto, y `last_seen_at`, que es lo
        único que deja quien volvió y no tocó nada. Es un piso, nunca un techo.
        """
        return sum(
            1 for tandas in tandas_de.values() for t in tandas
            if t and _in_week(t[0]["created_at"], w)
        )

    def altas(w: date) -> int:
        return len(nuevos(w))

    def registrados(w: date) -> float | None:
        ns = nuevos(w)
        return _pct(sum(1 for p in ns if p["user_id"]), len(ns))

    def instalaciones(w: date) -> float | None:
        """De los nuevos de la semana, cuántos abrieron la app YA INSTALADA.

        Es la única medida de si la diapo de la pantalla de inicio sirve. Se
        cuenta sobre los nuevos y no sobre todos por lo mismo que el registro:
        una cohorte se compara con otra, y el acumulado sube solo con el tiempo.

        Ojo con leerlo antes de tiempo: la señal llega cuando la persona ABRE la
        app instalada, que puede ser al día siguiente de haberla agregado. Una
        cohorte de esta semana todavía está sumando.
        """
        ns = nuevos(w)
        return _pct(sum(1 for p in ns if p["pwa_first_seen_at"]), len(ns))

    def retenidos(w: date) -> int:
        """Gente de OTRA semana que volvió a jugar en esta.

        Se mide por respuesta y no por visita: volver a abrir la página sin hacer
        nada no es retención, es un rebote con más pasos.
        """
        return len({
            a["player_id"] for a in answers
            if _in_week(a["created_at"], w)
            and (alta_de.get(a["player_id"]) or date.max) < w
        })

    def cafecitos(w: date) -> int:
        return sum(b["cafecitos"] for b in data["boosts"]
                   if _in_week(b["created_at"], w) and b["source"] == DONADO)

    def reclutas(w: date) -> int:
        return sum(1 for p in nuevos(w) if p["referred_by"])

    def viralidad(w: date) -> float | None:
        """Cuánta gente nueva trajo, en promedio, cada uno de los que ya estaban.

        El denominador son los que EXISTÍAN al empezar la semana, que son los
        únicos que podían repartir su `?r=`. Uno significa que el juego se sostiene
        solo; abajo de uno, cada camada trae menos que la anterior y el
        crecimiento sigue dependiendo de que difundamos.
        """
        base = sum(1 for p in players if (alta_de.get(p["id"]) or date.max) < w)
        return round(reclutas(w) / base, 2) if base else None

    def _tandas_jugadas(p: dict) -> list[list[dict]]:
        """Las tandas de RESPUESTAS de un jugador, que son las que se miden.

        Distintas de `tandas_de`, que incluye huellas sin actividad: para «cuánto
        aguanta una sentada» solo cuentan las que tuvieron respuestas.
        """
        return _sesiones(por_jugador.get(p["id"], []))

    def primera_sesion(w: date) -> float | None:
        """Mediana de derivadas resueltas en la primera tanda de cada uno.

        Sobre los nuevos de la semana —para quienes esa tanda ES la primera— y
        solo sobre los que llegaron a responder algo: quien abrió y se fue no
        tiene primera sesión que medir, y meterlo como cero convierte esto en otra
        medición de rebote, que ya hace el embudo.
        """
        valores = [
            float(_correctas_de_la_primera_sesion(por_jugador[p["id"]]))
            for p in nuevos(w) if por_jugador.get(p["id"])
        ]
        return _median(valores)

    def sesiones_siguientes(w: date) -> float | None:
        """Mediana de derivadas de la SEGUNDA tanda en adelante.

        Se mide una fila por tanda y no una por persona: alguien con cuatro
        vueltas aporta cuatro números, porque la pregunta es «cuánto rinde una
        vuelta», no «cuánto rinde alguien que vuelve».

        Es el contraste que le da sentido al número de al lado. Si la segunda
        sentada es más corta que la primera, el juego engancha y no retiene; si
        es más larga, quien vuelve viene decidido y el problema está en traerlo.
        """
        valores = [
            float(sum(1 for a in tanda if a["is_correct"]))
            for p in nuevos(w)
            for tanda in _tandas_jugadas(p)[1:]
        ]
        return _median(valores)

    def vuelven(w: date) -> float | None:
        """De los que jugaron su primera tanda, cuántos tuvieron una segunda.

        El número que gobierna el juego. La retención de la fila de arriba mira
        semanas; esta mira sentadas, que es la unidad real de este producto: se
        entra por un link, se juega hasta cansarse, y volver es una decisión
        aparte que la mayoría no toma.
        """
        con_tanda = [p for p in nuevos(w) if por_jugador.get(p["id"])]
        return _pct(
            sum(1 for p in con_tanda if len(_tandas_jugadas(p)) > 1),
            len(con_tanda),
        )

    def duracion_primera(w: date) -> float | None:
        """Cuántos minutos dura la primera sentada, en mediana.

        Va al lado de las derivadas de esa misma tanda a propósito: cinco
        derivadas en dos minutos y cinco en veinte son dos productos distintos.
        Sin este número no se puede saber si el techo lo pone el aburrimiento o
        la dificultad.
        """
        valores = [
            _minutos(_primera_sesion(por_jugador[p["id"]]))
            for p in nuevos(w) if por_jugador.get(p["id"])
        ]
        return _median(valores)

    def card(label: str, series: list, suffix: str, hint: str, dec: int = 1) -> dict:
        value = series[-1]
        prev = series[-2] if len(series) > 1 else None
        delta = round(value - prev, dec) if (value is not None and prev is not None) else None
        return {"label": label, "value": value, "suffix": suffix, "series": series,
                "delta": delta, "hint": hint, "dec": dec}

    return [
        # Fila 1 · quién entró, y cuántos cruzaron los umbrales que los vuelven
        # alcanzables después.
        card("Visitas totales", per_week(visitas), "",
             "Cuántas veces se sentó alguien a jugar. La misma persona que entra "
             "el lunes y el jueves cuenta dos."),
        card("Usuarios nuevos", per_week(altas), "",
             "Los que abrieron el juego por primera vez esa semana."),
        card("Instalan la app", per_week(instalaciones), "%",
             "De los nuevos de la semana, cuántos la abrieron ya instalada. La "
             "señal llega recién cuando la abren, así que la semana en curso "
             "todavía está sumando."),
        card("Se registran", per_week(registrados), "%",
             "De los nuevos de la semana, cuántos dejaron de ser invitados."),
        # Fila 2 · quién vuelve, quién trae gente y qué deja.
        card("Usuarios retenidos", per_week(retenidos), "",
             "Gente de otra semana que volvió a jugar en esta."),
        card("Reclutas", per_week(reclutas), "",
             "Nuevos que entraron por el link de otro jugador."),
        card("Coeficiente de viralidad", per_week(viralidad), "",
             "Cuánta gente trajo cada uno de los que ya estaban. Uno es el juego "
             "creciendo solo.", dec=2),
        card("Cafecitos", per_week(cafecitos), "",
             "Solo los donados de verdad: los grants a mano y los de aforo no cuentan."),
        # Fila 3 · la sentada, que es la unidad real de este juego.
        card("1ª sesión", per_week(primera_sesion), "",
             "Mediana de derivadas resueltas en la primera tanda, entre los que "
             "llegaron a responder."),
        card("2ª y siguientes", per_week(sesiones_siguientes), "",
             "Mediana por TANDA, no por persona: quien vuelve cuatro veces aporta "
             "cuatro números. Más corta que la 1ª significa que engancha y no "
             "retiene."),
        card("Vuelven a jugar", per_week(vuelven), "%",
             "De los que jugaron su primera tanda, cuántos tuvieron una segunda. "
             "Sentadas, no semanas: es la unidad real de este juego."),
        card("Duración 1ª sesión", per_week(duracion_primera), " min",
             "Mediana. Cinco derivadas en dos minutos y cinco en veinte son dos "
             "productos distintos."),
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
        # Tres y no cinco: es la derivada donde el juego frena y pide carrera y
        # universidad, así que el paso de al lado —«cargó universidad»— se lee
        # contra la gente que efectivamente llegó a que se lo preguntaran.
        (f"Llegó a {PEDIDO_PERFIL}",
         sum(1 for pid in ids if correct_by.get(pid, 0) >= PEDIDO_PERFIL), True),
        # Cada pedido va pegado al hito que lo dispara y no todos juntos al
        # final: la universidad se pide en la 3 y el registro en la 12, así que
        # leídos en ese lugar dicen cuánta de la gente que llegó a que se lo
        # preguntaran contestó. Al fondo de la lista no decían nada — parecían
        # dos pasos más de una cadena a la que no pertenecen.
        ("Cargó universidad", sum(1 for p in cohort if p["university"]), False),
        ("Llegó a 10", sum(1 for pid in ids if correct_by.get(pid, 0) >= 10), True),
        ("Se registró", sum(1 for p in cohort if p["user_id"]), False),
        ("Llegó a 25", sum(1 for pid in ids if correct_by.get(pid, 0) >= 25), True),
        ("Volvió otro día", sum(1 for pid in ids if len(dias_by.get(pid, ())) >= 2), False),
    ]

    out, prev = [], None
    for label, n, cadena in steps:
        out.append({"label": label, "n": n, "cadena": cadena, "pct_base": _pct(n, base),
                    "pct_prev": _pct(n, prev) if (cadena and prev) else None})
        if cadena:
            prev = n
    return {"base": base, "steps": out}


# ── 2 · Profundidad de partida ─────────────────────────────────────────────

# Los cortes con los que se puede partir la curva. `total` es una sola línea con
# todo el mundo; los otros tres la parten para poder comparar.
#
# Son los tres ejes por los que el juego puede ser distinto para dos personas:
# CUÁNDO llegaron (la difusión de esa semana no es la de la anterior), DE DÓNDE
# (cada universidad llega por su propio grupo y con su propia carrera) y CON QUÉ
# (el teclado matemático sobre una pantalla táctil es otro producto). Cualquier
# otra cosa —carrera, origen del link— se puede mirar en las secciones que ya
# están; estas tres cambian la forma de la curva, que es lo que se compara acá.
CORTES = ("total", "cohorte", "universidad", "aparato")

# Cuántas series como máximo. Tres cohortes porque es lo que pidió el uso —dos
# no es tendencia y cuatro ya no se distinguen— y cinco universidades porque a
# partir de ahí las líneas de abajo son de tres personas y ensucian el dibujo
# sin decir nada. Los aparatos son tres y no hace falta recortarlos.
MAX_COHORTES = 3
MAX_UNIVERSIDADES = 5

# Piso para que un grupo merezca su propia línea. Con menos de cinco partidas
# cerradas la curva es una escalera de a 20 puntos: dibuja el ruido de cuatro
# personas con la misma tinta que la tendencia de cuarenta.
MIN_BASE_SERIE = 5


def _curva_de(largos: list[int]) -> list[dict]:
    """La curva de supervivencia de una lista de largos de partida."""
    base = len(largos)
    out = []
    for k in range(1, DEPTH_MAX + 1):
        vivos = sum(1 for n in largos if n >= k)
        siguen = sum(1 for n in largos if n >= k + 1)
        out.append({
            "k": k,
            "vivos": vivos,
            "pct": _pct(vivos, base),
            # Riesgo: de los que llegaron a k, qué fracción NO llegó a k+1. Es
            # lo que localiza el escalón; la curva acumulada lo suaviza y lo
            # esconde.
            "abandono": _pct(vivos - siguen, vivos),
        })
    return out


def profundidad(data: dict, weeks: list[date], now: datetime | None = None,
                corte: str = "total") -> dict:
    """Cuántas derivadas aguanta la gente, y dónde exactamente se va.

    Es LA métrica del juego. El Elo, el ranking y el cafecito existen para mover
    esta curva, así que conviene mirarla antes que a ellos.

    **La cohorte es la de la semana elegida**, la misma que mide el embudo. Que
    las dos secciones hablen de la misma gente es lo que permite leerlas
    seguidas: el embudo dice cuántos de esa camada llegaron a la décima derivada
    y la curva dice dónde se fueron los que no.

    Antes esto tomaba a todos los que habían entrado desde el principio de la
    ventana visible y no cortaba por arriba, así que mirar una semana vieja
    devolvía una curva con gente que todavía no existía esa semana —una semana
    de agosto traía 29 partidas cuando la cohorte real eran 13—. Eso no es una
    cohorte: es «todo el mundo, ordenado por otra cosa».

    **La partida es la PRIMERA sesión**, no la vida entera del jugador, y está
    cerrada cuando esa tanda ya no puede crecer: pasaron más de
    `SESSION_GAP_MINUTES` desde su última respuesta.

    Antes se medía la vida entera y se esperaban 24 h de silencio para leerla.
    Los datos de producción dicen por qué eso no se arreglaba bajando la espera:
    los huecos entre derivadas son bimodales —el 97% dura menos de media hora y
    después no hay nada hasta el día siguiente—, así que entre 3 h y 12 h de
    espera se gana 0,2 puntos de cobertura. La única mejora real estaba en las
    24 h, que son justo las que dejaban la semana en curso vacía: 2 partidas
    legibles contra 62 abiertas.

    Medir la primera sesión cuesta poco y paga dos veces. Cuesta poco porque
    para el 85% de los jugadores esa tanda ES toda su vida en el juego, y cubre
    el 79% de las derivadas. Y paga dos veces: la cohorte de hoy se lee en media
    hora en vez de en un día, y la curva de una cohorte vieja **se congela** —con
    la vida entera, alguien de agosto que vuelve en octubre movía la mediana de
    agosto para siempre—.

    `corte` agrega líneas, y de dos maneras distintas:

      - `universidad` y `aparato` PARTEN la cohorte de la semana en montones,
        así que sus líneas suman exactamente la del total;
      - `cohorte` TRAE OTRAS cohortes —la elegida y las dos anteriores— para
        comparar camadas entre sí. Ahí las líneas no suman nada: son tres
        poblaciones distintas, y esa es justamente la comparación.
    """
    now = now or datetime.utcnow()
    corte = corte if corte in CORTES else "total"
    corte_reloj = now - timedelta(minutes=SESSION_GAP_MINUTES)
    semana = weeks[-1]

    # La primera tanda de cada uno: cuántas derivadas tiene y cuándo terminó.
    # Se arma una sola vez para todos los jugadores porque `cohorte` vuelve a
    # recorrer tres semanas y `universidad`/`aparato` reparten la misma.
    por_jugador: dict[int, list[dict]] = defaultdict(list)
    for a in data["_firsts"]:
        por_jugador[a["player_id"]].append(a)
    primera_de: dict[int, tuple[int, datetime]] = {}
    for pid, lista in por_jugador.items():
        tanda = _primera_sesion(lista)
        if tanda:
            primera_de[pid] = (len(tanda), tanda[-1]["created_at"])

    def largos_de(w: date) -> tuple[list[dict], list[int]]:
        """Las partidas cerradas de la cohorte de `w`, y su largo."""
        cohorte = [p for p in data["players"]
                   if _in_week(p["created_at"], w) and p["id"] in primera_de]
        cerrados = [p for p in cohorte if primera_de[p["id"]][1] < corte_reloj]
        return cerrados, [primera_de[p["id"]][0] for p in cerrados]

    cerrados, largos = largos_de(semana)
    abiertos = sum(1 for p in data["players"]
                   if _in_week(p["created_at"], semana) and p["id"] in primera_de
                   and primera_de[p["id"]][1] >= corte_reloj)
    base = len(largos)
    curva = _curva_de(largos)

    # El escalón más grande de los primeros 20, que es el tramo donde el
    # producto interviene. Se pide una base mínima: un abandono del 100% sobre 2
    # personas no es un escalón. Se calcula siempre sobre la cohorte de la
    # semana —con corte o sin corte— porque es el titular de la sección y no
    # puede moverse al cambiar de desglose.
    tramo = [c for c in curva if c["k"] <= 20 and c["vivos"] >= 5]
    peor = max(tramo, key=lambda c: c["abandono"] or 0) if tramo else None

    def serie(label: str, clave: str | None, valores: list[int]) -> dict:
        return {"label": label, "clave": clave, "base": len(valores),
                "curva": _curva_de(valores),
                "mediana": _median([float(n) for n in valores])}

    if corte == "total":
        series = [serie("Siguen jugando", None, largos)]
    elif corte == "cohorte":
        # La elegida y las dos anteriores, de la más vieja a la más nueva: el
        # orden del tiempo es el orden en que se lee la comparación.
        series = []
        for i in range(MAX_COHORTES - 1, -1, -1):
            w = semana - timedelta(weeks=i)
            if w < FIRST_WEEK:
                continue
            _, v = largos_de(w)
            if len(v) >= MIN_BASE_SERIE:
                series.append(serie(w.strftime("%d/%m"), w.isoformat(), v))
    else:
        grupos: dict = defaultdict(list)
        for p in cerrados:
            clave = p["university"] if corte == "universidad" else p["platform"]
            if clave:
                grupos[clave].append(primera_de[p["id"]][0])
        vivos = [(k, v) for k, v in grupos.items() if len(v) >= MIN_BASE_SERIE]
        if corte == "universidad":
            vivos.sort(key=lambda kv: -len(kv[1]))
            vivos = vivos[:MAX_UNIVERSIDADES]
        else:
            orden = {k: i for i, k in enumerate(PLATFORM_ORDER)}
            vivos.sort(key=lambda kv: orden.get(kv[0], 99))
        series = [
            serie(str(k) if corte == "universidad" else PLATFORM_LABEL[k], str(k), v)
            for k, v in vivos
        ]

    return {
        "corte": corte,
        "semana": semana,
        "base": base,
        "abiertos": abiertos,
        "curva": curva,
        "series": series,
        # Cuánta de la cohorte cubre el desglose. Solo tiene sentido para los
        # cortes que PARTEN la cohorte: en «por cohorte» las líneas son otras
        # camadas y no hay nada que cubrir.
        "cubiertos": (sum(x["base"] for x in series)
                      if corte in ("universidad", "aparato") else base),
        "mediana": _median([float(n) for n in largos]),
        "p90": _p([float(n) for n in largos], 0.90),
        "peor_escalon": peor,
    }


# ── 3 · Re-enganche: push ────────────────────────────────────────────

# Cuántos días después de un mail se sigue contando como que lo trajo de vuelta.
# El mismo número que usa el panel de Intervalo, para que las dos tasas de
# activación se puedan leer una al lado de la otra.
DIAS_DE_ACTIVACION = 3


def _con_avisos_prendidos(data: dict) -> set[int]:
    """Los jugadores que tienen los avisos prendidos.

    La preferencia vive en `users` cuando el jugador tiene cuenta y en
    `game_players` cuando es invitado (game/notifications.py :: titular_del_cupo),
    así que preguntarle a una sola de las dos tablas da la mitad de la respuesta.

    Es justo la comparación que hace útil el titular «con notificación activa»:
    si queda muy por debajo de las suscripciones, alguien se suscribió y la
    preferencia no se guardó.
    """
    usuarios_prendidos = {u["id"] for u in data["usuarios"] if u["notify_enabled"]}
    salida = set()
    for p in data["players"]:
        prendido = (p["user_id"] in usuarios_prendidos if p["user_id"]
                    else bool(p["notify_enabled"]))
        if prendido:
            salida.add(p["id"])
    return salida


def push(data: dict, weeks: list[date]) -> dict:
    """Los avisos del juego: cuántos salieron, de qué copy y cuántos se tocaron.

    El reparto REAL contra el NOMINAL es lo que esta tabla existe para mostrar.
    Las categorías programadas se sortean con los pesos de
    `game/notification_copy.py::PESOS`, pero solo entran al sorteo si el hecho
    que cuentan existe: si «social» pide cinco compañeros jugando hoy y casi
    nunca los hay, su peso nominal se reparte entre las otras y el copy que sale
    no es el que se configuró. Verlos separados es la única forma de enterarse.

    Las reactivas —cafecito, reclutas, ranking, universidad— no tienen nominal
    porque no se sortean: la variante la decide el hecho, y tienen cupo propio,
    así que tampoco compiten por el lugar del recordatorio del día.
    """
    lo, hi = weeks[0], weeks[-1] + timedelta(days=7)
    enviados = [a for a in data["avisos"]
                if a["sent_at"] is not None and lo <= local_date(a["sent_at"]) < hi]

    por_cat: dict[str, dict] = defaultdict(lambda: {"enviadas": 0, "abiertas": 0})
    for a in enviados:
        c = por_cat[a["category"]]
        c["enviadas"] += 1
        if a["opened_at"] is not None:
            c["abiertas"] += 1

    abiertas = sum(1 for a in enviados if a["opened_at"] is not None)
    prendidos = _con_avisos_prendidos(data)
    # Prender la preferencia no alcanza: hace falta además un navegador
    # suscripto. Y los dos números se separan solos por una razón que no es un
    # bug — un jugador registrado hereda la preferencia de Intervalo, donde la
    # prendió para OTRO producto, así que «con notificación activa» puede ser
    # nueve con cero suscripciones. Sin este segundo número, ese nueve se lee
    # como «nueve personas van a recibir avisos de dx», que es falso.
    suscriptos = {x["player_id"] for x in data["suscripciones"]}
    return {
        "subs": len(data["suscripciones"]),
        "activos": len(prendidos),
        "alcanzables": len(prendidos & suscriptos),
        "enviadas": len(enviados),
        "entregadas": sum(1 for a in enviados if a["delivery_status"] == "ok"),
        "abiertas": abiertas,
        "ctr": _pct(abiertas, len(enviados)),
        "por_categoria": sorted(
            [{"categoria": k, **v, "ctr": _pct(v["abiertas"], v["enviadas"])}
             for k, v in por_cat.items()],
            key=lambda r: -r["enviadas"]),
    }


# ── 4 · Re-enganche: mails ──────────────────────────────────────────

def mails(data: dict, weeks: list[date]) -> dict:
    """Los mails del juego: a cuántos les llegó y cuántos volvieron a jugar.

    **Activación** = respondió una derivada dentro de los `DIAS_DE_ACTIVACION`
    días posteriores al envío. Es lo más cerca de «el mail funcionó» que se
    puede medir sin aperturas —Resend las conoce pero no llegan a esta base— y
    es la pregunta que importa: un mail que se abre y no te trae de vuelta no
    sirve.

    Dos advertencias, las mismas que en el panel de Intervalo.
    `reclutas_semanal` NO se compara con el otro: va a quien tiene reclutas que
    rindieron esta semana, o sea gente que ya está activa, así que su tasa
    arranca alta por selección. Y no hay grupo de control: todo el que califica
    recibe el mail, así que esto es una tasa bruta y no un efecto causal.

    **Falta el del cafecito**, y no es un olvido: su marcador
    (`game_boosts.email_sent_at`) se escribe aunque el mail no salga, así que
    contarlo como enviado sería inventar envíos; y su destinatario se resuelve a
    través de `game_boost_intents`, que este panel no carga. Lo que hay de ese
    mail está en la sección Cafecito del panel de Intervalo.
    """
    lo, hi = weeks[0], weeks[-1] + timedelta(days=7)

    # Cuándo respondió cada jugador, para poder preguntar «¿volvió después del
    # mail?». `_answers` ya viene ordenada por (jugador, fecha).
    jugo: dict[int, list[datetime]] = defaultdict(list)
    for a in data["_answers"]:
        if a["created_at"] is not None:
            jugo[a["player_id"]].append(a["created_at"])

    def activacion(filas: list[tuple[int, datetime]]) -> tuple[int, int]:
        vueltas = 0
        for pid, cuando in filas:
            limite = cuando + timedelta(days=DIAS_DE_ACTIVACION)
            if any(cuando <= t <= limite for t in jugo.get(pid, ())):
                vueltas += 1
        return len(filas), vueltas

    tipos = []

    volve = [(p["id"], p["winback_email_sent_at"]) for p in data["players"]
             if p["winback_email_sent_at"] is not None
             and lo <= local_date(p["winback_email_sent_at"]) < hi]
    n, act = activacion(volve)
    tipos.append({"tipo": "winback_dx", "desc": "Derivó y hace 5+ días que no vuelve",
                  "enviados": n, "activados": act, "pct": _pct(act, n)})

    # `reclutas_email_sent_on` es una FECHA local y no un instante —es semanal y
    # se pisa en cada envío, así que solo sobrevive la del último— y vive en
    # `users`. Se lleva a medianoche local (UTC-3) para poder reusar
    # `activacion()` en vez de duplicar su lógica.
    def _dia(v):
        """La fecha del marcador semanal, venga como sea.

        `_rows` normaliza las columnas que terminan en `_at`, que es la
        convención del esquema para los instantes. `reclutas_email_sent_on`
        termina en `_on` porque es una FECHA, así que no pasa por ahí: Postgres
        la devuelve como `date` y SQLite como texto. Sin esto el panel anda en
        producción y explota en local, que es la peor forma de que ande.
        """
        if v is None or isinstance(v, date) and not isinstance(v, datetime):
            return v
        if isinstance(v, datetime):
            return v.date()
        try:
            return date.fromisoformat(str(v)[:10])
        except ValueError:
            return None

    jugador_de = {p["user_id"]: p["id"] for p in data["players"] if p["user_id"]}
    filas_reclutas = []
    for u in data["usuarios"]:
        dia = _dia(u["reclutas_email_sent_on"])
        if dia is None or u["id"] not in jugador_de or not (lo <= dia < hi):
            continue
        filas_reclutas.append(
            (jugador_de[u["id"]],
             datetime.combine(dia, datetime.min.time()) + timedelta(hours=3)))
    n, act = activacion(filas_reclutas)
    tipos.append({"tipo": "reclutas_semanal",
                  "desc": "Resumen semanal de lo que generaron sus reclutas",
                  "enviados": n, "activados": act, "pct": _pct(act, n)})

    total = sum(t["enviados"] for t in tipos)
    activados = sum(t["activados"] for t in tipos)
    return {
        "tipos": tipos,
        "enviados": total,
        "activados": activados,
        "pct": _pct(activados, total),
        "bajas": sum(1 for u in data["usuarios"] if u["email_unsubscribed"]),
        "alcanzables": len(data["usuarios"]),
        "ventana_dias": DIAS_DE_ACTIVACION,
    }


# ── 5 · Reclutas ──────────────────────────────────────────────────

def reclutas(data: dict, weeks: list[date]) -> dict:
    """Quién trae gente nueva por su link, y cuánto rinde.

    Delega en la del panel de Intervalo en vez de reescribirla: es la MISMA
    cuenta sobre las MISMAS filas —aquella sección ya lee `game_players`, que es
    donde vive todo esto— y dos copias de una definición de K terminarían dando
    dos números distintos para la misma pregunta. Lo único que cambia es de
    dónde salen las filas: acá ya vienen sin bots desde `load()`.
    """
    from .queries import reclutas as _reclutas_de_intervalo
    return _reclutas_de_intervalo({"game_players": data["players"]}, weeks)


# ── Entrada ──────────────────────────────────────────────────────────────────

def build(db: DBSession, week: date, weeks_shown: int = 4,
          corte: str = "total") -> dict:
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
        "profundidad": profundidad(data, weeks, corte=corte),
        "push": push(data, weeks),
        "mails": mails(data, weeks),
        "reclutas": reclutas(data, weeks),
    }
