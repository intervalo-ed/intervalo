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

import math
import statistics
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session as DBSession

# La banda objetivo se LEE de donde se decide, no se copia: es el número que
# el motor promete, y una copia vieja acá convertiría a la calibración en la
# medición que miente sobre justo lo que existe para vigilar.
from game import elo

from .queries import AR_OFFSET, _pct, _rows, local_date, week_start

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

# Las tres franjas del día, en hora de Argentina, y dónde empieza cada una.
#
# Los bordes salen de mirar la distribución real y no de la costumbre. Dos cosas
# la gobiernan: el 78% de las partidas arranca entre las 11 y las 16, y de la
# medianoche a las 7 hay tres personas en toda la historia del juego.
#
#   · **13 y no 12** para cerrar la mañana. Es la hora del almuerzo acá, y además
#     es la que reparte: con el corte en las 12, la mañana pierde un tercio de su
#     masa (47 partidas contra 71) porque las 12 sola son el 10% de todo. El pico
#     va de las 11 a las 16 y ningún borde puede partirlo por el medio sin quedar
#     arbitrario; las 13 lo parten donde la gente se levanta de la silla.
#   · **La madrugada va adentro de la noche.** Con tres partidas en toda la
#     historia, una cuarta línea sería ruido, y `MIN_BASE_SERIE` la escondería
#     igual. Que 00-06 cuente como noche es además como se vive: quien deriva a
#     la una de la mañana está terminando su noche, no empezando su día.
#
# **Qué NO es este corte.** El juego se difunde por WhatsApp en tandas, así que
# la hora de arranque es en buena parte la hora en que salió el mensaje. Eso lo
# acerca más a «por qué difusión llegaste» que a «a qué hora rendís mejor», y por
# eso la sección lo dice en voz alta en vez de dejar que se lea como lo segundo.
FRANJA_ORDER: tuple[str, ...] = ("manana", "tarde", "noche")
FRANJA_LABEL = {"manana": "Mañana", "tarde": "Tarde", "noche": "Noche"}
FRANJA_DESDE = {"manana": 6, "tarde": 13, "noche": 20}


def _franja(dt: datetime) -> str:
    """En qué franja cae un instante UTC, leído en hora de Argentina."""
    h = (dt + AR_OFFSET).hour
    if FRANJA_DESDE["manana"] <= h < FRANJA_DESDE["tarde"]:
        return "manana"
    if FRANJA_DESDE["tarde"] <= h < FRANJA_DESDE["noche"]:
        return "tarde"
    return "noche"


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
                   pwa_first_seen_at, created_at, last_seen_at, variant,
                   first_group_id
            FROM game_players"""),
        # `p_hat` y `status` son para la calibración y la fricción; `peeked`
        # separa «resolvió» de «copió», que mezclados arruinan la tasa de
        # acierto. Siguen siendo pocas columnas sobre una tabla chica.
        "exercises": _rows(db, """
            SELECT id, player_id, created_at, p_hat, status, peeked, template_key
            FROM game_exercises"""),
        # `exercise_id` ata el intento al ejercicio que lo originó, y sin esa
        # atadura no hay forma de comparar el p̂ que el motor prometió con lo
        # que esa persona efectivamente contestó: la calibración se mide por
        # ejercicio, no por jugador.
        "attempts": _rows(db, """
            SELECT player_id, exercise_id, attempt_number, parse_ok, is_correct,
                   created_at
            FROM game_attempts"""),
        # `donor_name` y `university` son para la tabla de donadores. Vienen
        # de la plataforma de cafecito, así que el nombre puede estar vacío —
        # y de hecho lo está en la mayoría.
        "boosts": _rows(db, """
            SELECT cafecitos, source, created_at, donor_name, university
            FROM game_boosts"""),
        # El tracker de difusión, copiado por scripts/diag/sync_grupos.py. Es
        # el denominador del clickrate y lo único que no sale de esta base.
        "grupos": _rows(db, """
            SELECT id, universidad, cluster, materia, miembros, ultimo_envio,
                   ultima_campana, producto, synced_at
            FROM game_groups"""),
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
        # `cta` y `action` traen el CTR de cada cartel, que es el escalón que
        # gobierna los reclutas (`share`) y el cafecito y que hasta ahora el
        # panel no miraba.
        "cta": _rows(db, """
            SELECT player_id, cta, action, placement, solved, created_at
            FROM game_cta_events"""),
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


def headline(data: dict, weeks: list[date]) -> dict[str, list[dict]]:
    """Los doce números de la semana, repartidos entre las cuatro pestañas.

    **No hay sección de titulares**, y la clave de cada lista es la pestaña que
    encabeza. Doce números juntos arriba de todo son doce números que hay que
    memorizar: cada uno se lee contra un gráfico que estaba dos pestañas más
    allá, y esa pestaña arrancaba con un gráfico al que le faltaba justo su
    número.

    El reparto sigue la PREGUNTA que contesta cada uno, no la feature de la que
    sale:

      - **activacion** — quién llega (volumen) y quién trae gente (reclutas).
      - **retencion** — las cuatro cosas que cuestan algo: volver otro día,
        instalar, registrarse y poner plata.
      - **jugabilidad** — la sentada: qué tan honda es, cuánto dura, cuánto
        rinde la siguiente y si hay siguiente.

    Los dos primeros de activación son métricas de VOLUMEN y eso es deliberado:
    no deciden nada por sí solas —suben si se difunde más— pero sin ellas no se
    sabe si un porcentaje se calculó sobre treinta personas o sobre mil.
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

    def unicos(w: date) -> int:
        """Cuántas PERSONAS distintas se asomaron esa semana.

        Es la métrica de volumen del panel, y es deliberadamente vanidosa: no
        decide nada por sí sola —sube si se difunde más— pero sin ella no se
        sabe si un porcentaje se calculó sobre treinta personas o sobre mil.

        No confundir con visitas: la misma persona que entra el lunes y el
        jueves es UNA acá y DOS allá. Y es un piso, no un número exacto: se arma
        con toda huella fechada que deja una visita, así que quien vuelve a
        abrir la página y no toca nada solo aparece si `last_seen_at` cayó en
        esa semana.
        """
        return len(visto.get(w, ()))

    def activados(w: date) -> int:
        """De los nuevos de la semana, cuántos respondieron al menos una.

        Es el OMTM del producto. La fila del jugador se crea al CARGAR la
        página, así que «nuevo» incluye a quien se fue mirando la intro:
        activado es el que llegó a hacer algo.
        """
        return sum(1 for p in nuevos(w) if por_jugador.get(p["id"]))

    def pct_activacion(w: date) -> float | None:
        return _pct(activados(w), len(nuevos(w)))

    def reclutas_activados(w: date) -> int:
        """Reclutas de la semana que además llegaron a responder algo.

        Separado de los reclutas a secas porque son cosas muy distintas: el link
        de un amigo trae gente que activa PEOR que la difusión —33,6% contra
        41,0%, medido— así que contar reclutas sin mirar cuántos arrancaron
        cuenta clics, no jugadores.
        """
        return sum(1 for p in nuevos(w) if p["referred_by"] and por_jugador.get(p["id"]))

    def viralidad_activados(w: date) -> float | None:
        """El K que de verdad dice si el bucle se sostiene.

        **Por qué este y no el de al lado.** Un bucle viral se sostiene cuando
        cada unidad capaz de reproducirse produce al menos una unidad capaz de
        reproducirse. Acá la unidad capaz es el jugador ACTIVADO, y eso no es
        una definición elegida: de los 24 jugadores que alguna vez reclutaron a
        alguien, los 24 tenían 3 o más respuestas. Nadie sin activar reclutó
        nunca — el cartel de compartir aparece jugando.

        El K de al lado divide reclutas nuevos por TODOS los que ya estaban, o
        sea que mete en el denominador a gente que estructuralmente no puede
        producir nada, y en el numerador a gente que mayormente tampoco va a
        producir. No es una tasa de reproducción: es una razón entre dos cosas
        distintas.

        Hoy los dos dan parecido, y es una coincidencia que conviene no
        confundir con equivalencia: los reclutas activan 33,6% y la base activa
        ~40%, así que las dos correcciones casi se cancelan. En cuanto cualquiera
        de esas dos tasas se mueva —y moverlas es justo lo que el experimento de
        la puerta intenta— se separan.

        **Ojo con el tamaño.** Son 48 reclutas activados en toda la vida del
        producto. Semana a semana esto es de un dígito y tiembla entero con una
        persona: sirve para mirar la tendencia de varias semanas, no para
        comparar una contra la anterior.
        """
        base = sum(1 for p in players
                   if (alta_de.get(p["id"]) or date.max) < w and por_jugador.get(p["id"]))
        return round(reclutas_activados(w) / base, 2) if base else None

    def card(label: str, series: list, suffix: str, hint: str, dec: int = 1) -> dict:
        value = series[-1]
        prev = series[-2] if len(series) > 1 else None
        delta = round(value - prev, dec) if (value is not None and prev is not None) else None
        return {"label": label, "value": value, "suffix": suffix, "series": series,
                "delta": delta, "hint": hint, "dec": dec}

    return {
        # Activación · quién llega y quién trae gente. Los dos primeros son
        # métricas de volumen —vanidosas y a propósito: sirven para saber con
        # cuánta gente se está jugando, no para decidir— y los dos últimos son
        # el canal que no depende de que difundamos nosotros.
        "activacion": [
            card("Usuarios únicos", per_week(unicos), "",
                 "Cuántas personas distintas se asomaron al juego esa semana, nuevas "
                 "y viejas. La misma persona que entra el lunes y el jueves cuenta "
                 "UNA. Es un piso: quien vuelve a abrir y no toca nada solo deja "
                 "rastro por `last_seen_at`."),
            card("Usuarios nuevos", per_week(altas), "",
                 "Abrieron el link por primera vez esa semana, y son la cohorte del "
                 "embudo de abajo. La fila se crea al CARGAR la página, así que "
                 "incluye a quien se fue en la pantalla de intro sin ver una "
                 "derivada — que hoy es más de la mitad."),
            card("Usuarios activados", per_week(activados), "",
                 "De los nuevos de esa semana, cuántos llegaron a responder al menos "
                 "una derivada."),
            card("Activación", per_week(pct_activacion), "%",
                 "Activados sobre nuevos. Es el OMTM del producto: de cada 100 que "
                 "abren dx, cuántos hacen algo.", dec=1),
        ],
        # Retención · las cuatro cosas que alguien hace cuando el juego le
        # importó lo suficiente: volver otro día, instalarlo, registrarse y
        # poner plata. Ninguna es gratis para quien la hace, y por eso las
        # cuatro son señal.
        "retencion": [
            card("Usuarios retenidos", per_week(retenidos), "",
                 "Gente de otra semana que volvió a jugar en esta. Es la definición "
                 "de retención del panel: dos días distintos, no dos sentadas."),
            card("Instalan la app", per_week(instalaciones), "%",
                 "De los nuevos de la semana, cuántos la abrieron ya instalada. Ojo "
                 "con leerlo como tendencia: son 16 en toda la vida del producto, así "
                 "que la serie se mueve entera con una persona."),
            card("Se registran", per_week(registrados), "%",
                 "De los nuevos de la semana, cuántos dejaron de ser invitados."),
            card("Cafecitos", per_week(cafecitos), "",
                 "Solo los donados de verdad: los grants a mano y los de aforo no cuentan."),
        ],
        # Jugabilidad · la sentada, que es la unidad real de este juego: se entra
        # por un link, se juega hasta cansarse, y volver es una decisión aparte.
        # Reclutas · va adentro de su sección y no en la cabecera de la pestaña:
        # los cuatro hablan del mismo canal y leerlos lejos de su curva obliga a
        # subir y bajar.
        "reclutas": [
            card("Reclutas nuevos", per_week(reclutas), "",
                 "Entraron por el link de otro jugador."),
            card("Reclutas activados", per_week(reclutas_activados), "",
                 "De esos, cuántos llegaron a responder una derivada. El link de un "
                 "amigo trae gente que activa PEOR que la difusión —33,6% contra "
                 "41,0%— así que los reclutas a secas cuentan clics, no jugadores."),
            card("Viralidad general", per_week(viralidad), "",
                 "Reclutas nuevos sobre todos los que ya estaban. Es la versión de "
                 "tráfico, y está acá como auditoría de la de al lado: si esta sube y "
                 "la otra no, llegó gente que no se reproduce.", dec=2),
            card("Viralidad de activados", per_week(viralidad_activados), "",
                 "Reclutas ACTIVADOS sobre los activados que ya estaban. Es el K que "
                 "decide: los 24 jugadores que alguna vez reclutaron tenían todos 3+ "
                 "respuestas, así que la unidad que se reproduce es el activado. Uno "
                 "es el bucle sosteniéndose solo.", dec=2),
        ],
        "jugabilidad": [
            card("1ª sesión", per_week(primera_sesion), "",
                 "Mediana de derivadas resueltas en la primera tanda, entre los que "
                 "llegaron a responder. Es el número que resume la curva de abajo."),
            card("Duración 1ª sesión", per_week(duracion_primera), " min",
                 "Mediana. Va al lado de las derivadas de esa misma tanda: cinco en "
                 "dos minutos y cinco en veinte son dos productos distintos."),
            card("2ª y siguientes", per_week(sesiones_siguientes), "",
                 "Mediana por TANDA, no por persona: quien vuelve cuatro veces aporta "
                 "cuatro números. Más corta que la 1ª significa que engancha y no "
                 "retiene."),
            card("Vuelven a jugar", per_week(vuelven), "%",
                 "De los que jugaron su primera tanda, cuántos tuvieron una segunda. "
                 "Sentadas, no semanas — la retención por semanas está en su pestaña."),
        ],
    }


# ── 2 · Profundidad de partida ─────────────────────────────────────────────

# Los cortes con los que se puede partir la curva. `total` es una sola línea con
# todo el mundo; los otros tres la parten para poder comparar.
#
# Cuatro son ejes de la PERSONA: CUÁNDO llegó (la difusión de esa semana no es
# la de la anterior), DE DÓNDE (cada universidad llega por su propio grupo y con
# su propia carrera), CON QUÉ (el teclado matemático sobre una pantalla táctil es
# otro producto) y A QUÉ HORA (no es lo mismo el hueco entre dos cursadas que la
# cama a la una de la mañana). Cualquier otro dato de la persona —carrera, origen
# del link— se puede mirar en las secciones que ya están; estos cuatro cambian la
# forma de la curva, que es lo que se compara acá.
#
# `sesion` no es un eje de la persona sino de la VUELTA: la misma gente, mirada
# en su primera sentada y en las que vinieron después. Va segundo porque es el
# pariente más cercano de «Todos» —su primera línea ES la curva de «Todos»— y
# porque contesta la pregunta que la sección deja abierta: si el que vuelve
# aguanta más que el que recién llega.
CORTES = ("total", "sesion", "cohorte", "universidad", "aparato", "horario")

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
    `SESSION_GAP_MINUTES` desde su última respuesta. La excepción es el corte
    `sesion`, que es justamente el que va a buscar las otras tandas.

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

    `corte` agrega líneas, y de tres maneras distintas:

      - `universidad`, `aparato` y `horario` PARTEN la cohorte de la semana en
        montones, así que sus líneas suman exactamente la del total;
      - `cohorte` TRAE OTRAS cohortes —la elegida y las dos anteriores— para
        comparar camadas entre sí. Ahí las líneas no suman nada: son tres
        poblaciones distintas, y esa es justamente la comparación;
      - `sesion` TRAE OTRAS TANDAS de la misma cohorte: la primera de cada uno
        contra la segunda en adelante. Tampoco suman, y encima cambian de
        unidad — la primera línea cuenta personas y la segunda cuenta tandas.

    Ese cambio de unidad es a propósito y es el mismo criterio del número «2ª y
    siguientes» de arriba: quien volvió cuatro veces aporta una partida a la
    primera línea y tres a la segunda, porque la pregunta es cuánto rinde una
    vuelta y no cuánto rinde alguien que vuelve.

    Y trae una advertencia que no se ve en el gráfico: si la segunda línea
    aguanta más que la primera, eso NO es que el juego se vuelva más fácil la
    segunda vez. Es que a la segunda vuelta solo llega el que se enganchó, así
    que la población está filtrada por lo mismo que se está midiendo.
    """
    now = now or datetime.utcnow()
    corte = corte if corte in CORTES else "total"
    corte_reloj = now - timedelta(minutes=SESSION_GAP_MINUTES)
    semana = weeks[-1]

    # La primera tanda de cada uno: cuántas derivadas tiene, cuándo terminó y
    # cuándo arrancó. Se arma una sola vez para todos los jugadores porque
    # `cohorte` vuelve a recorrer tres semanas y los otros tres reparten la misma.
    #
    # El arranque es el de la TANDA y no el `created_at` del jugador, que es
    # cuando cargó la página. Para esta población son casi el mismo instante
    # —quien responde, responde enseguida— pero la curva dibuja primeras
    # sesiones, así que el ancla honesto es cuándo empezó la sesión que se está
    # midiendo y no cuándo apareció la fila.
    por_jugador: dict[int, list[dict]] = defaultdict(list)
    for a in data["_firsts"]:
        por_jugador[a["player_id"]].append(a)
    # Se guardan TODAS las tandas y no solo la primera: el corte `sesion` necesita
    # las de la segunda vuelta en adelante, y partirlas dos veces sería recorrer
    # el mismo historial dos veces para llegar a la misma lista.
    tandas_de: dict[int, list[list[dict]]] = {}
    primera_de: dict[int, tuple[int, datetime, datetime]] = {}
    for pid, lista in por_jugador.items():
        tandas = _sesiones(lista)
        if not tandas:
            continue
        tandas_de[pid] = tandas
        primera = tandas[0]
        primera_de[pid] = (len(primera), primera[-1]["created_at"],
                           primera[0]["created_at"])

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
    elif corte == "sesion":
        # La segunda línea se cierra tanda por tanda y no jugador por jugador.
        # En la práctica solo la ÚLTIMA de alguien puede estar abierta —que
        # exista una tanda posterior ya prueba que la anterior se cerró— pero
        # escribirlo así deja la regla en un solo lugar en vez de depender de esa
        # deducción.
        siguientes = [
            len(t) for p in cerrados for t in tandas_de[p["id"]][1:]
            if t[-1]["created_at"] < corte_reloj
        ]
        # La primera línea va SIEMPRE, aunque no llegue al piso: es la misma
        # curva que «Todos», o sea la referencia contra la que se mira la otra, y
        # un desglose donde falta la referencia no se puede leer. El piso lo paga
        # la segunda, que es la que puede tener cuatro tandas y dibujar una
        # escalera de a 25 puntos.
        series = [serie("1ª sesión", "1", largos)]
        if len(siguientes) >= MIN_BASE_SERIE:
            series.append(serie("2ª y siguientes", "2+", siguientes))
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
        def clave_de(p: dict) -> str | None:
            if corte == "universidad":
                return p["university"]
            if corte == "aparato":
                return p["platform"]
            # `horario` sale de la tanda y no de la fila del jugador: es la hora
            # a la que arrancó a jugar, leída en Argentina.
            return _franja(primera_de[p["id"]][2])

        grupos: dict = defaultdict(list)
        for p in cerrados:
            clave = clave_de(p)
            if clave:
                grupos[clave].append(primera_de[p["id"]][0])
        vivos = [(k, v) for k, v in grupos.items() if len(v) >= MIN_BASE_SERIE]
        if corte == "universidad":
            vivos.sort(key=lambda kv: -len(kv[1]))
            vivos = vivos[:MAX_UNIVERSIDADES]
        else:
            # Las franjas y los aparatos tienen un orden propio —el del día y el
            # del peso de cada plataforma— y ordenarlos por tamaño los mezclaría
            # de una semana a la otra.
            orden_fijo = PLATFORM_ORDER if corte == "aparato" else FRANJA_ORDER
            orden = {k: i for i, k in enumerate(orden_fijo)}
            vivos.sort(key=lambda kv: orden.get(kv[0], 99))

        def etiqueta(k) -> str:
            if corte == "universidad":
                return str(k)
            return (PLATFORM_LABEL if corte == "aparato" else FRANJA_LABEL)[k]

        series = [serie(etiqueta(k), str(k), v) for k, v in vivos]

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
                      if corte in ("universidad", "aparato", "horario") else base),
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

def reclutas(data: dict, weeks: list[date], week: date | None = None) -> dict:
    """Quién trae gente nueva por su link, y cuánto rinde.

    Delega la parte común en la del panel de Intervalo en vez de reescribirla:
    es la MISMA cuenta sobre las MISMAS filas, y dos copias de una definición de
    K terminarían dando dos números distintos para la misma pregunta.

    Lo que se agrega acá y allá no puede estar es **la serie de K de
    activados**. Necesita saber quién respondió algo, y la del panel de
    Intervalo solo recibe `game_players`. Es también la que se dibuja: el K
    general quedó como número en la fila de arriba, para poder auditar, pero la
    curva muestra la que decide (ver `viralidad_activados` en `headline`).

    **La serie va desde la primera semana del panel hasta la elegida**, no las
    últimas cuatro. Con cuatro puntos una tendencia no se distingue de un
    rebote, y esta es justamente la métrica que hay que leer a lo largo de
    varias semanas porque su numerador es de un dígito.
    """
    from .queries import reclutas as _reclutas_de_intervalo

    base = _reclutas_de_intervalo({"game_players": data["players"]}, weeks)

    # La historia completa hasta la semana elegida.
    fin = week or weeks[-1]
    todas: list[date] = []
    w = FIRST_WEEK
    while w <= fin:
        todas.append(w)
        w += timedelta(weeks=1)
    if not todas:
        todas = [fin]

    activos = {a["player_id"] for a in data["_answers"]}
    jugadores = data["players"]
    por_semana: dict[date, list[dict]] = defaultdict(list)
    for p in jugadores:
        sem = _week_of(p["created_at"])
        if sem is not None:
            por_semana[sem].append(p)

    serie = []
    # La base arranca con los activados anteriores a la primera semana, que es
    # cero por construcción: antes de FIRST_WEEK no había producto.
    base_act = sum(1 for p in jugadores
                   if (_week_of(p["created_at"]) or date.max) < todas[0]
                   and p["id"] in activos)
    for w in todas:
        nuevos = por_semana.get(w, [])
        rec_act = sum(1 for p in nuevos
                      if p["referred_by"] is not None and p["id"] in activos)
        serie.append({
            "label": w.strftime("%d/%m"),
            "week": w.isoformat(),
            "k_act": round(rec_act / base_act, 2) if base_act else None,
            "reclutas_act": rec_act,
            "base_act": base_act,
        })
        base_act += sum(1 for p in nuevos if p["id"] in activos)

    base["serie_activados"] = serie
    base["donadores"] = _donadores(data)
    return base


def _donadores(data: dict) -> dict:
    """Quién puso plata, de siempre.

    **Los anónimos NO compiten por el primer puesto.** `donor_name` viene vacío
    en la mayoría de las donaciones, y agruparlos a todos bajo «Anónimo» pondría
    esa fila arriba de todo con la suma de mucha gente distinta — que es
    exactamente la lectura falsa que la tabla invitaría a hacer. Van aparte, como
    un total, y la tabla lista solo a los que dejaron nombre.

    Solo `source == cafecito`: los grants a mano y los del aforo no son plata de
    nadie, y mezclarlos convertiría a quien administra el juego en el mayor
    donante de su propio juego.
    """
    donados = [b for b in data["boosts"] if b["source"] == DONADO]
    con_nombre: dict[str, dict] = defaultdict(
        lambda: {"cafecitos": 0, "veces": 0, "universidad": None, "ultima": None})
    anon_cafecitos = anon_veces = 0
    for b in donados:
        nombre = (b.get("donor_name") or "").strip()
        if not nombre:
            anon_cafecitos += b["cafecitos"] or 0
            anon_veces += 1
            continue
        d = con_nombre[nombre]
        d["cafecitos"] += b["cafecitos"] or 0
        d["veces"] += 1
        d["universidad"] = d["universidad"] or b["university"]
        cuando = local_date(b["created_at"])
        if cuando and (d["ultima"] is None or cuando > d["ultima"]):
            d["ultima"] = cuando
    filas = sorted(
        ({"nombre": n, **d} for n, d in con_nombre.items()),
        key=lambda f: -f["cafecitos"])
    return {
        "top": filas[:8],
        "anon_cafecitos": anon_cafecitos,
        "anon_veces": anon_veces,
        "total": sum(b["cafecitos"] or 0 for b in donados),
        "donaciones": len(donados),
    }

# ── 6 · Experimentos ─────────────────────────────────────────────────────────

# Los experimentos que el panel sabe leer. Viven acá y no en un JSON aparte
# porque lo que hace falta para leerlos —el efecto mínimo declarado y la base
# esperada— es lo que fija el n, y ese n tiene que estar escrito ANTES de ver los
# datos. Puesto en el código, cambiarlo deja rastro en el `git log`; puesto en
# una tabla de configuración, se puede correr el arco a mitad del partido y nadie
# se entera.
#
# `base` y `mde` son los que se declararon al arrancar, no los que se observaron.
# Si mañana la base real resulta otra, el n comprometido NO se recalcula: se
# terminó de juntar el que se prometió y recién ahí se lee.
EXPERIMENTOS: tuple[dict, ...] = (
    {
        "clave": "dx-puerta-1",
        "titulo": "La puerta",
        "hipotesis": (
            "Entre aterrizar y ver una derivada hay tres peajes —la presentación del "
            "logo, cuatro párrafos de reglas y el pedido de apodo— y nadie los pidió. "
            "Si el producto se explica solo, sacarlos sube la entrada."
        ),
        "desde": date(2026, 9, 13),
        "brazos": (("control", "Control"), ("derivada-primero", "Derivada primero")),
        "base": 0.56,
        "mde": 0.10,
        "alpha": 0.05,
        "potencia": 0.80,
        # La predicción, escrita antes de ver el resultado. El panel la muestra al
        # lado del desglose por plataforma para que no se pueda inventar después.
        "prediccion": (
            "Mobile debería moverse más que escritorio: escritorio ya está en 64% y "
            "tiene poco recorrido."
        ),
    },
)


def _phi(z: float) -> float:
    """Normal estándar acumulada. Sin scipy, que no está en el backend."""
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))


def _z_de(p: float) -> float:
    """El cuantil de la normal estándar, por bisección.

    Se usa tres veces por carga del panel y el rango es fijo, así que doscientas
    iteraciones de bisección son más baratas —y mucho más fáciles de leer— que
    traerse una aproximación racional de tablas.
    """
    lo, hi = -10.0, 10.0
    for _ in range(200):
        m = (lo + hi) / 2
        if _phi(m) < p:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


def n_comprometido(exp: dict) -> int:
    """Cuántos por brazo hacen falta para poder leer el experimento.

    Es la fórmula de dos proporciones con proporción combinada bajo H0. El n va
    con el INVERSO DEL CUADRADO del efecto, y de ahí sale la restricción que
    gobierna todo el programa: pasar de detectar 10 puntos a detectar 5 no
    duplica la muestra, la cuadruplica.
    """
    pc = exp["base"]
    pt = pc + exp["mde"]
    pb = (pc + pt) / 2
    za = _z_de(1 - exp["alpha"] / 2)
    zb = _z_de(exp["potencia"])
    t1 = za * math.sqrt(2 * pb * (1 - pb))
    t2 = zb * math.sqrt(pc * (1 - pc) + pt * (1 - pt))
    return int((t1 + t2) ** 2 / exp["mde"] ** 2) + 1


def experimentos(data: dict) -> list[dict]:
    """Un bloque por experimento: los brazos, sus números y si YA SE PUEDE LEER.

    **Lo que esta sección hace y ninguna otra del panel hace: negarse a
    contestar.** Mientras falte gente para el n comprometido no se calcula el
    p-valor ni se dibuja un ganador — solo cuánto falta. Mirar un A/B todos los
    días y parar en cuanto cruza 0,05 no es leer el experimento: es repetir el
    sorteo hasta que salga, y sube el error de tipo I muy por encima del alfa que
    se declaró.

    Los guardarraíles se calculan SIEMPRE, incluso antes de tiempo, y eso no es
    una contradicción: sirven para frenar un experimento que está haciendo daño,
    no para declararlo ganado. Un brazo que hunde la profundidad se apaga sin
    esperar al n.
    """
    por_jugador: dict[int, list[dict]] = defaultdict(list)
    for a in data["_firsts"]:
        por_jugador[a["player_id"]].append(a)
    con_ejercicio = {e["player_id"] for e in data["exercises"]}
    con_intento = set(por_jugador)

    salida = []
    for exp in EXPERIMENTOS:
        n_pedido = n_comprometido(exp)
        etiquetas = {f'{exp["clave"]}:{c}': nombre for c, nombre in exp["brazos"]}
        # Los jugadores del experimento, y solo ellos: la variante se escribe al
        # crear la fila, así que quien entró antes de empezar no tiene ninguna y
        # queda afuera solo.
        inscriptos = [p for p in data["players"]
                      if not p["is_bot"] and p.get("variant") in etiquetas]

        brazos = []
        for clave, nombre in exp["brazos"]:
            marca = f'{exp["clave"]}:{clave}'
            gente = [p for p in inscriptos if p["variant"] == marca]
            ids = {p["id"] for p in gente}
            n = len(gente)
            servida = sum(1 for i in ids if i in con_ejercicio)
            activado = sum(1 for i in ids if i in con_intento)
            largos = [float(len(_primera_sesion(por_jugador[i])))
                      for i in ids if i in por_jugador]
            vuelven = sum(
                1 for i in ids
                if len({local_date(a["created_at"]) for a in por_jugador.get(i, ())}) >= 2)
            # El desglose declarado de antemano, y el único: cortar por lo que
            # sea hasta que algo dé significativo es la otra forma de inflar el
            # error de tipo I (ver la nota de la sección en game_render.py).
            plataformas = {}
            for plat in PLATFORM_ORDER:
                de_esa = [p for p in gente if p["platform"] == plat]
                if de_esa:
                    plataformas[plat] = {
                        "n": len(de_esa),
                        "pct": _pct(sum(1 for p in de_esa if p["id"] in con_ejercicio),
                                    len(de_esa)),
                    }
            brazos.append({
                "clave": clave,
                "label": nombre,
                "n": n,
                "servida": servida,
                "pct_servida": _pct(servida, n),
                "activado": activado,
                "pct_activado": _pct(activado, n),
                "mediana": _median(largos),
                "pct_vuelven": _pct(vuelven, len(ids & con_intento)),
                "plataformas": plataformas,
                "falta": max(0, n_pedido - n),
            })

        listo = all(b["n"] >= n_pedido for b in brazos)
        lectura = None
        if listo and len(brazos) == 2:
            control, test = brazos[0], brazos[1]
            nc, nt = control["n"], test["n"]
            xc, xt = control["servida"], test["servida"]
            pc, pt = xc / nc, xt / nt
            pool = (xc + xt) / (nc + nt)
            se0 = math.sqrt(pool * (1 - pool) * (1 / nc + 1 / nt))
            z = (pt - pc) / se0 if se0 else 0.0
            # El error estándar del INTERVALO no usa la proporción combinada: esa
            # vale bajo H0, que es el mundo donde las dos proporciones son
            # iguales, y el intervalo no supone eso. Son dos cuentas distintas a
            # propósito y mezclarlas es el error clásico de este cálculo.
            se = math.sqrt(pc * (1 - pc) / nc + pt * (1 - pt) / nt)
            za = _z_de(1 - exp["alpha"] / 2)
            lectura = {
                "delta_pp": round(100 * (pt - pc), 1),
                "z": round(z, 2),
                "p_valor": 2 * (1 - _phi(abs(z))),
                "ic_pp": (round(100 * (pt - pc - za * se), 1),
                          round(100 * (pt - pc + za * se), 1)),
                "rechaza": abs(z) > za,
            }

        salida.append({
            "clave": exp["clave"],
            "titulo": exp["titulo"],
            "hipotesis": exp["hipotesis"],
            "prediccion": exp["prediccion"],
            "desde": exp["desde"],
            "mde_pp": round(100 * exp["mde"], 0),
            "alpha": exp["alpha"],
            "potencia": exp["potencia"],
            "n_pedido": n_pedido,
            "brazos": brazos,
            "listo": listo,
            "lectura": lectura,
            "sin_arrancar": sum(b["n"] for b in brazos) == 0,
        })
    return salida


# ── 7 · Difusión: a cuánta gente se llegó y cuánta entró ─────────────────────

# Piso para que un grupo, una universidad o una campaña merezcan su propia fila.
# Con menos de esto el clickrate es una fracción de números chicos: un grupo de
# 20 miembros con 1 jugador da 5% y con 2 da 10%, y esa diferencia no es una
# señal, es una persona.
MIN_MIEMBROS_FILA = 40


def difusion(data: dict) -> dict:
    """El clickrate de la difusión: de cuánta gente alcanzada, cuánta entró.

    **Es la única métrica del panel que necesita un dato de afuera.** El
    numerador —cuántos jugadores trajo cada grupo— sale de
    `game_players.first_group_id`; el denominador —cuánta gente hay en ese
    grupo— vive en un Google Sheet y llega por `scripts/diag/sync_grupos.py`.
    Hasta que esa tabla existió, el cruce se hacía a mano y quedaba escrito como
    constantes en un `.py`.

    **Lo que el clickrate NO es.** El denominador son los miembros del grupo, no
    los que vieron el mensaje: WhatsApp no dice eso y nadie lo sabe. Así que
    todas las tasas de acá son COTAS INFERIORES. Sirven para comparar un grupo
    contra otro —el sesgo es parejo— y no para afirmar «tal porcentaje de la
    gente hizo clic».

    La cobertura se reporta siempre. Un jugador cuyo grupo no está en la copia
    del tracker no se puede dividir, y si esos son un tercio, un clickrate
    global que los ignore está midiendo otra cosa.
    """
    grupos = {g["id"]: g for g in data["grupos"]}
    jugadores: dict[str, int] = defaultdict(int)
    for p in data["players"]:
        if p["first_group_id"]:
            jugadores[p["first_group_id"]] += 1

    atribuidos = sum(jugadores.values())
    cubiertos = sum(n for g, n in jugadores.items() if g in grupos)
    sin_fila = sorted(
        ((g, n) for g, n in jugadores.items() if g not in grupos),
        key=lambda kv: -kv[1])

    def tasa(claves) -> dict:
        miembros = sum(grupos[g]["miembros"] or 0 for g in claves)
        gente = sum(jugadores.get(g, 0) for g in claves)
        return {"grupos": len(claves), "miembros": miembros, "jugadores": gente,
                "pct": _pct(gente, miembros)}

    # Solo los grupos que YA recibieron dx: a los otros nunca se les mandó nada,
    # y meterlos al denominador diluiría el clickrate con gente que no tuvo
    # oportunidad de convertir.
    tocados = [g for g, d in grupos.items()
               if d["producto"] == "dx" and (d["miembros"] or 0) > 0]

    def agrupar(campo: str) -> list[dict]:
        cubos: dict[str, list[str]] = defaultdict(list)
        for g in tocados:
            clave = grupos[g][campo]
            if clave:
                cubos[clave].append(g)
        filas = []
        for clave, gs in cubos.items():
            t = tasa(gs)
            if t["miembros"] >= MIN_MIEMBROS_FILA:
                filas.append({"clave": str(clave), **t})
        return sorted(filas, key=lambda f: -(f["pct"] or 0))

    detalle = []
    for g in tocados:
        d = grupos[g]
        t = tasa([g])
        if t["miembros"] >= MIN_MIEMBROS_FILA and t["jugadores"]:
            detalle.append({"id": g, "universidad": d["universidad"],
                            "materia": d["materia"] or d["cluster"], **t})
    detalle.sort(key=lambda f: -(f["pct"] or 0))

    sincro = max((g["synced_at"] for g in data["grupos"] if g["synced_at"]),
                 default=None)
    return {
        "global": tasa(tocados),
        "por_universidad": agrupar("universidad"),
        "por_campana": agrupar("ultima_campana"),
        "top": detalle[:8],
        "atribuidos": atribuidos,
        "cubiertos": cubiertos,
        "pct_cobertura": _pct(cubiertos, atribuidos),
        "sin_fila": sin_fila[:5],
        "n_sin_fila": len(sin_fila),
        "sincronizado": sincro,
        "vacio": not data["grupos"],
    }


# ── 8 · Carteles ─────────────────────────────────────────────────────────────

# Qué es cada cartel, para que la tabla se lea sin abrir el código.
CARTELES = {
    "share": "Reclutar: compartir el link",
    "cafecito": "Invitar un cafecito",
    "boost_offer": "Oferta de multiplicador",
    "register": "Registrarse para elegir el @",
}


def carteles(data: dict) -> list[dict]:
    """Impresiones y clicks de cada llamado a la acción.

    Es el escalón que gobierna los reclutas y el cafecito, y el panel no lo
    miraba: se veía el resultado —cuántos reclutas hubo— sin ver la puerta por
    la que hay que pasar para llegar ahí. Un CTR que se desploma explica una
    caída de reclutas sin necesidad de mirar nada más.
    """
    conteo: dict[str, dict[str, int]] = defaultdict(lambda: {"imp": 0, "clk": 0})
    momento: dict[str, list[float]] = defaultdict(list)
    for e in data["cta"]:
        c = conteo[e["cta"]]
        if e["action"] == "impression":
            c["imp"] += 1
            if e["solved"] is not None:
                momento[e["cta"]].append(float(e["solved"]))
        elif e["action"] == "click":
            c["clk"] += 1
    salida = [{
        "cta": k,
        "desc": CARTELES.get(k, k),
        "impresiones": v["imp"],
        "clicks": v["clk"],
        "ctr": _pct(v["clk"], v["imp"]),
        # En qué derivada se muestra, en mediana. Un cartel con CTR bajo puede
        # estar mal escrito o puede estar saliendo demasiado temprano, y sin
        # este número las dos explicaciones son igual de plausibles.
        "mediana_solved": _median(momento.get(k, [])),
    } for k, v in conteo.items()]
    return sorted(salida, key=lambda f: -f["impresiones"])


# ── 9 · Calibración del motor ────────────────────────────────────────────────

# Los cubos de p̂ con los que se compara lo prometido contra lo entregado. Son
# anchos a propósito: con cubos finos cada uno queda con pocas respuestas y la
# curva tiembla por muestreo en vez de por descalibración.
_CUBOS_PHAT = ((0.0, 0.5), (0.5, 0.65), (0.65, 0.75), (0.75, 0.85), (0.85, 1.01))


def calibracion(data: dict) -> dict:
    """Lo que el motor PROMETE contra lo que la gente ENTREGA.

    El motor sirve lo que estima que se va a acertar 3 de cada 4 veces
    (`elo.TARGET_LOW`–`TARGET_HIGH`). Si eso fuera cierto, en el cubo de p̂ 0,75
    la tasa real de acierto sería 75%. La distancia entre las dos columnas es el
    error de calibración, y ya se midió descalibrado una vez: prometía 85% y
    entregaba 90%.

    **Se mide sobre PRIMEROS intentos y sin tabla.** Un acierto al tercer intento
    no es lo que p̂ predice, y uno copiado de la tabla tampoco: mezclarlos infla
    la tasa real y hace parecer calibrado un motor que no lo está.
    """
    phat = {e["id"]: e["p_hat"] for e in data["exercises"]
            if e["p_hat"] is not None and not e["peeked"]}
    primeros = {}
    for a in data["_firsts"]:
        eid = a.get("exercise_id")
        if eid is not None and eid not in primeros:
            primeros[eid] = a

    filas = []
    for lo, hi in _CUBOS_PHAT:
        respondidos = [eid for eid, ph in phat.items()
                       if lo <= ph < hi and eid in primeros]
        if not respondidos:
            continue
        aciertos = sum(1 for eid in respondidos if primeros[eid]["is_correct"])
        prometido = sum(phat[eid] for eid in respondidos)
        filas.append({
            "rango": ("%.2f–%.2f" % (lo, hi)).replace(".", ","),
            "n": len(respondidos),
            "prometido": round(100 * prometido / len(respondidos), 1),
            "real": round(100 * aciertos / len(respondidos), 1),
        })
    brecha = None
    if filas:
        peso = sum(f["n"] for f in filas)
        brecha = round(sum(f["n"] * (f["real"] - f["prometido"]) for f in filas) / peso, 1)
    return {"filas": filas, "brecha": brecha,
            "banda": (round(100 * elo.TARGET_LOW), round(100 * elo.TARGET_HIGH))}


# ── 10 · Fricción ────────────────────────────────────────────────────────────

def friccion(data: dict) -> dict:
    """Dónde la persona pelea con el juego en vez de con la derivada.

    Tres cosas distintas que se confunden si se miran juntas: saltear es «esta no
    la sé», mirar la tabla es «la busco», y que el parser rechace una respuesta
    correcta es «la sé y el juego no me deja». Solo la tercera es un bug, y es la
    que más caro sale: la persona hizo todo bien y el juego le dijo que no.
    """
    total = len(data["exercises"])
    salteados = sum(1 for e in data["exercises"] if e["status"] == "skipped")
    con_tabla = sum(1 for e in data["exercises"] if e["peeked"])
    firsts = data["_firsts"]
    parse_ok = sum(1 for a in firsts if a["parse_ok"])
    # Intentos hasta acertar, entre los que acertaron. La mediana dice si el
    # juego se gana de una o a fuerza de insistir.
    por_ej: dict = defaultdict(list)
    for a in data["_answers"]:
        por_ej[a.get("exercise_id")].append(a)
    hasta_acertar = [
        float(min(a["attempt_number"] for a in intentos if a["is_correct"]))
        for intentos in por_ej.values()
        if any(a["is_correct"] for a in intentos)
    ]
    return {
        "servidos": total,
        "pct_salteados": _pct(salteados, total),
        "pct_con_tabla": _pct(con_tabla, total),
        "pct_parse_ok": _pct(parse_ok, len(firsts)),
        "fallos_parseo": len(firsts) - parse_ok,
        "mediana_intentos": _median(hasta_acertar),
    }


# ── 11 · Evolución semanal de los números de activación ──────────────────────

# Las cuatro curvas que se pueden mirar, con su etiqueta y su unidad. El orden es
# el de la fila de arriba, y el que viene marcado es el último: los tres primeros
# son volumen —suben si se difunde más— y el cuarto es el único que dice si el
# producto mejoró.
METRICAS: tuple[tuple[str, str, str], ...] = (
    ("unicos", "Usuarios únicos", ""),
    ("nuevos", "Usuarios nuevos", ""),
    ("activados", "Usuarios activados", ""),
    ("activacion", "Activación", "%"),
)
METRICA_POR_DEFECTO = "activacion"


def _vistos_por_semana(data: dict) -> dict:
    """Qué jugadores dejaron alguna huella en cada semana.

    Se arma con toda huella fechada —el alta, `last_seen_at`, un ejercicio, una
    respuesta, un cartel— porque el juego no registra pageviews: registra lo que
    la persona HACE. Es un piso, nunca un techo.

    Vive acá afuera porque lo usan dos lugares —los titulares y la curva— y dos
    copias de esta definición darían dos números distintos para «cuánta gente
    distinta se asomó».
    """
    visto: dict[date, set[int]] = defaultdict(set)

    def marcar(pid, cuando) -> None:
        w = _week_of(cuando)
        if w is not None:
            visto[w].add(pid)

    for p in data["players"]:
        marcar(p["id"], p["created_at"])
        marcar(p["id"], p["last_seen_at"])
    for e in data["exercises"]:
        marcar(e["player_id"], e["created_at"])
    for a in data["attempts"]:
        marcar(a["player_id"], a["created_at"])
    for c in data["cta"]:
        marcar(c["player_id"], c["created_at"])
    return visto


def evolucion(data: dict, week: date, metrica: str = METRICA_POR_DEFECTO) -> dict:
    """Los cuatro números de activación, semana a semana, desde el principio.

    **Desde la primera semana del panel hasta la elegida, no las últimas
    cuatro.** Es la misma razón que la curva de viralidad: con cuatro puntos una
    tendencia no se distingue de un rebote, y la pregunta que esta sección
    contesta —«¿esto está mejorando?»— no se puede contestar con cuatro.

    Se dibuja una por vez y no las cuatro juntas: tres son conteos que llegan a
    los cientos y la cuarta es un porcentaje. En el mismo eje, el porcentaje
    quedaría pegado al piso y no se vería moverse — que es justamente el único
    de los cuatro que dice si el producto mejoró.
    """
    metrica = metrica if metrica in {m for m, _, _ in METRICAS} else METRICA_POR_DEFECTO
    visto = _vistos_por_semana(data)
    activos = {a["player_id"] for a in data["_answers"]}

    por_semana: dict[date, list[dict]] = defaultdict(list)
    for p in data["players"]:
        w = _week_of(p["created_at"])
        if w is not None:
            por_semana[w].append(p)

    semanas: list[date] = []
    w = FIRST_WEEK
    while w <= week:
        semanas.append(w)
        w += timedelta(weeks=1)
    if not semanas:
        semanas = [week]

    filas = []
    for w in semanas:
        nuevos = por_semana.get(w, [])
        act = sum(1 for p in nuevos if p["id"] in activos)
        filas.append({
            "label": w.strftime("%d/%m"),
            "week": w.isoformat(),
            "unicos": len(visto.get(w, ())),
            "nuevos": len(nuevos),
            "activados": act,
            "activacion": _pct(act, len(nuevos)),
        })
    etiqueta, sufijo = next((e, s) for m, e, s in METRICAS if m == metrica)
    return {"metrica": metrica, "etiqueta": etiqueta, "suffix": sufijo,
            "filas": filas}


# ── Entrada ──────────────────────────────────────────────────────────────────

def build(db: DBSession, week: date, weeks_shown: int = 4,
          corte: str = "total", metrica: str = METRICA_POR_DEFECTO) -> dict:
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
        "profundidad": profundidad(data, weeks, corte=corte),
        "push": push(data, weeks),
        "mails": mails(data, weeks),
        "reclutas": reclutas(data, weeks, week),
        "experimentos": experimentos(data),
        "evolucion": evolucion(data, week, metrica),
        "difusion": difusion(data),
        "carteles": carteles(data),
        "calibracion": calibracion(data),
        "friccion": friccion(data),
    }
