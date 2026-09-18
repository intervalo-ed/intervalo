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

from .queries import (A_ORDER, AR_OFFSET, P1_BAND, _pct, _rows, local_date,
                      week_start)

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


# ── El reloj del día ─────────────────────────────────────────────────────────
#
# Los bins del gráfico de horarios. Dos decisiones, las dos medidas:
#
#   · **Bins de dos horas y no de una.** Las sesiones que NO son la primera son
#     unas trescientas en toda la vida del producto: repartidas en 24 canastas
#     quedan a doce por hora y la curva tiembla con una persona. A doce bins la
#     forma se lee y el ruido no.
#   · **El día arranca a las 6, no a las 0.** Así la madrugada cae al final del
#     eje, pegada a la noche, en vez de partirse entre las dos puntas. Es el
#     mismo argumento que ya gobierna `FRANJA_DESDE`: quien deriva a la una de
#     la mañana está terminando su noche, no empezando su día, y un eje que lo
#     manda al extremo izquierdo lo dibuja como si madrugara.
BIN_HORAS = 2
BIN_DESDE = 6
_N_BINS = 24 // BIN_HORAS


def _hora_del_bin(i: int) -> int:
    return (BIN_DESDE + i * BIN_HORAS) % 24


BIN_LABEL: tuple[str, ...] = tuple(
    f"{_hora_del_bin(i):02d}–{(_hora_del_bin(i) + BIN_HORAS) % 24:02d}"
    for i in range(_N_BINS))

# Los bins que caen en la noche, con el MISMO borde que la franja (20 a 6). Se
# calculan y no se escriben a mano: si `BIN_HORAS` cambiara, una lista fija
# seguiría apuntando a los índices viejos y el porcentaje de noche pasaría a
# medir otra cosa sin avisar.
BINS_NOCHE: tuple[int, ...] = tuple(
    i for i in range(_N_BINS)
    if _hora_del_bin(i) >= FRANJA_DESDE["noche"] or _hora_del_bin(i) < FRANJA_DESDE["manana"])

# Base mínima para que una columna del reparto se dibuje. A 15 sesiones una
# persona mueve la barra 6,7 puntos; abajo de eso el reparto es la anécdota de
# quien estaba despierto.
MIN_BASE_BIN = 15


def _bin_de(dt: datetime) -> int:
    """En qué bin del reloj cae un instante UTC, leído en hora de Argentina."""
    return (((dt + AR_OFFSET).hour - BIN_DESDE) % 24) // BIN_HORAS


# El origen de un empuje que cuenta como ingreso: `cafecito` es el que entró por
# el oyente del stream (game/cafecito_stream.py). Los otros dos —`manual`, que
# insertamos nosotros para probar, y `aforo`, que regala el propio juego— no son
# plata y no pueden sumar al titular. Pasó: el primer día de producción 20 de 35
# cafecitos eran grants a mano.
DONADO = "cafecito"

# Primera camada oficial de dx: la semana del 07/09/2026.
#
# Las dos anteriores —24/08 y 31/08, 136 jugadores entre las dos— fueron pruebas
# de humo: se mandó a un puñado de grupos para ver si el juego aguantaba, con el
# producto todavía cambiando abajo. Mezclarlas con la primera camada de verdad
# no es conservador, es peor: son 136 personas contra 968, con un producto
# distinto, y arrastran todos los promedios sin aportar una sola decisión.
#
# **Y acá el piso NO es solo del panel: es de los datos.** Antes cortaba qué
# semanas se ofrecían y las consultas contaban igual las filas viejas, así que
# los acumulados «de siempre» —el top de reclutadores, los carteles, el embudo
# del cafecito— seguían mezclando la prueba de humo con el lanzamiento. Ahora
# `load` no las trae: el corte se aplica una vez, en un solo lugar, como el de
# los bots.
#
# El corte es limpio, medido antes de aplicarlo: de los 142 reclutas de la
# camada oficial, CERO fueron traídos por alguien anterior al corte, así que no
# queda ningún `referred_by` colgando. Y solo 5 jugadores viejos respondieron
# algo después del corte.
FIRST_WEEK = date(2026, 9, 7)


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
        "boosts": _rows(db, "SELECT cafecitos, source, created_at FROM game_boosts"),
        # El tracker de difusión, copiado por scripts/diag/sync_grupos.py. Es
        # el denominador del clickrate y lo único que no sale de esta base.
        "grupos": _rows(db, """
            SELECT id, universidad, cluster, materia, miembros, ultimo_envio,
                   ultima_campana, producto, cluster_dx, synced_at
            FROM game_groups"""),
        # Los avisos push del juego y los navegadores suscriptos. Las dos tablas
        # son chicas por construcción —una fila por envío y una por navegador—
        # y sin ellas la sección de re-enganche no tiene nada que contar.
        "avisos": _rows(db, """
            SELECT player_id, category, variant_key, sent_at, delivery_status,
                   opened_at
            FROM game_notification_sends"""),
        "suscripciones": _rows(db, "SELECT player_id FROM game_push_subscriptions"),
        # Las intenciones CONSUMIDAS del cafecito. Son la única pata que el
        # juego tiene para saber quién pagó: Cafecito no devuelve al pagador
        # —sus campos son todos opcionales y no se pueden marcar obligatorios—
        # así que lo único que queda es el «voy a donar», que sí sabe quién lo
        # tocó (ver `game/boosts.py:donante_unico`).
        #
        # NO se cortan por camada ni por la ventana visible, y es a propósito:
        # lo que se pregunta acá es «cuántas personas distintas tocaron el botón
        # alrededor de esta donación», y sacar a una de la lista convertiría una
        # donación ambigua en una atribuida a la persona equivocada.
        "intents": _rows(db, """
            SELECT player_id, consumed_at FROM game_boost_intents
            WHERE consumed_at IS NOT NULL"""),
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
        # La encuesta de dificultad. Trae los agregados congelados de la ventana
        # —`ventana`, `aciertos`, `p_hat_medio`— y no se recalculan desde
        # `exercises`: son lo que el motor creía cuando la persona votó, y β y θ
        # se movieron desde entonces.
        "votes": _rows(db, """
            SELECT player_id, voto, shown_at, answered_at, theta_at_vote,
                   ventana, aciertos, p_hat_medio, delta_theta
            FROM game_difficulty_votes"""),
    }

    # Los bots se sacan UNA vez, acá, y no en cada bloque: filtrar en diez
    # lugares es la forma segura de olvidarse en el undécimo.
    # Fuera en UN lugar y no en cada bloque, por lo mismo que los bots: filtrar
    # en diez lugares es la forma segura de olvidarse en el undécimo. Se van los
    # bots y se va todo lo anterior a la primera camada oficial (ver FIRST_WEEK).
    crudos = data["players"]
    fuera = {p["id"] for p in crudos
             if p["is_bot"] or (local_date(p["created_at"]) or date.max) < FIRST_WEEK}
    bots = {p["id"] for p in data["players"] if p["is_bot"]}
    data["players"] = [p for p in data["players"] if p["id"] not in fuera]
    data["exercises"] = [e for e in data["exercises"] if e["player_id"] not in fuera]
    data["attempts"] = [a for a in data["attempts"] if a["player_id"] not in fuera]
    data["cta"] = [c for c in data["cta"] if c["player_id"] not in fuera]
    data["votes"] = [v for v in data["votes"] if v["player_id"] not in fuera]
    data["avisos"] = [a for a in data["avisos"] if a["player_id"] not in fuera]
    data["suscripciones"] = [x for x in data["suscripciones"] if x["player_id"] not in fuera]
    # Los cafecitos no tienen jugador —`game_boosts` guarda nombre, universidad y
    # monto, y nada más— así que se cortan por fecha. Es el mismo corte: la plata
    # que entró durante la prueba de humo no es plata del lanzamiento.
    data["boosts"] = [b for b in data["boosts"]
                      if (local_date(b["created_at"]) or date.min) >= FIRST_WEEK]
    data["_bots"] = len(bots)
    data["_previos"] = len(fuera) - len(bots)
    # Quién tiene cuenta, de TODOS los jugadores y no solo de los que quedaron.
    # Lo usa el embudo del agradecimiento: alguien de antes del corte puede
    # haber donado después, y con el mapa recortado se lo contaría como «donó
    # sin cuenta», que es una afirmación distinta y falsa.
    data["_usuario_de"] = {p["id"]: p["user_id"] for p in crudos}

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

    Corta en `FIRST_WEEK`: antes de la primera camada oficial el juego estaba en
    prueba de humo, y esas semanas no son una caída sino otro producto."""
    ws = [week - timedelta(weeks=i) for i in range(n - 1, -1, -1)]
    return [w for w in ws if w >= FIRST_WEEK] or [week]


def _in_week(dt: datetime | None, week: date) -> bool:
    d = local_date(dt)
    return d is not None and week <= d <= week + timedelta(days=6)


def _fecha_de(v) -> date | None:
    """Una columna DATE, venga como venga del driver.

    Postgres devuelve `date` y SQLite devuelve el string ISO, porque `_rows`
    ejecuta SQL crudo y no pasa por el tipado del modelo. Comparar sin
    normalizar rompe en local y anda en producción, que es la forma más cara de
    tener un bug.
    """
    if v is None or isinstance(v, date) and not isinstance(v, datetime):
        return v
    if isinstance(v, datetime):
        return v.date()
    try:
        return date.fromisoformat(str(v)[:10])
    except ValueError:
        return None


def _semanas_hasta(week: date) -> list[date]:
    """Todas las semanas del panel hasta la elegida, no las últimas cuatro.

    Lo piden las tres curvas que miran camadas —activación, retención,
    viralidad— y siempre por el mismo motivo: con cuatro puntos una tendencia no
    se distingue de un rebote, y las tres tienen numeradores chicos.
    """
    semanas: list[date] = []
    w = FIRST_WEEK
    while w <= week:
        semanas.append(w)
        w += timedelta(weeks=1)
    return semanas or [week]


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

    por_jugador: dict[int, list[dict]] = defaultdict(list)
    for a in answers:
        por_jugador[a["player_id"]].append(a)

    def nuevos(w: date) -> list[dict]:
        return [p for p in players if _in_week(p["created_at"], w)]

    # Las camadas salen de `_camadas` y no de cuatro cuentas escritas acá
    # adentro: el gráfico y la tabla de la sección de reclutas leen la MISMA
    # función, y dos definiciones de K terminan dando dos números distintos
    # para la misma pregunta. Ya pasó con el K semanal.
    cam = _camadas(data, weeks)
    ret = _camadas_retencion(data, weeks)

    def per_week(fn) -> list:
        return [fn(w) for w in weeks]

    def altas(w: date) -> int:
        return len(nuevos(w))

    def cafecitos(w: date) -> int:
        return sum(b["cafecitos"] for b in data["boosts"]
                   if _in_week(b["created_at"], w) and b["source"] == DONADO)

    def donaciones(w: date) -> int:
        """Cuántas VECES alguien puso plata, no cuántos cafecitos entraron.

        Va al lado del total porque los dos juntos dicen algo que ninguno solo:
        139 cafecitos en 20 donaciones —lo medido hasta el 13/09— es un producto
        con unos pocos mecenas, y los mismos 139 en 139 donaciones sería otro
        producto. Con este volumen, esa diferencia decide qué se puede esperar
        de la ola siguiente.
        """
        return sum(1 for b in data["boosts"]
                   if _in_week(b["created_at"], w) and b["source"] == DONADO)

    # Los lugares del cartel del cafecito que anotan CLICK y nunca IMPRESIÓN.
    # `settings-panel.tsx` dispara los dos de ajustes sin montar el contador de
    # impresiones, así que esos clicks —21 de 365 en toda la vida del producto—
    # existen y son reales pero no tienen denominador. Quedan FUERA de las dos
    # tasas de acá abajo, porque un numerador sin su denominador las infla, y
    # entran igual en la tabla de la sección con el CTR vacío: ahí la ausencia
    # es justamente lo que hay que ver.
    _lugares_medibles = {
        e["placement"] for e in data["cta"]
        if e["cta"] == "cafecito" and e["action"] == "impression"
    }

    def _pedido(w: date, action: str) -> int:
        return sum(1 for e in data["cta"]
                   if e["cta"] == "cafecito" and e["action"] == action
                   and e["placement"] in _lugares_medibles
                   and _in_week(e["created_at"], w))

    def tocan_el_cartel(w: date) -> float | None:
        """De los que vieron el pedido de cafecito, cuántos lo tocaron."""
        return _pct(_pedido(w, "click"), _pedido(w, "impression"))

    def del_click_a_la_plata(w: date) -> float | None:
        """De los que tocaron el pedido, cuántos terminaron donando.

        **No es una conversión persona a persona y no puede serlo:**
        `game_boosts` no guarda `player_id` —la donación llega por el oyente del
        stream de Cafecito, que solo trae nombre, universidad y monto— así que
        esto es una razón entre dos agregados de la misma semana. Alguien puede
        donar sin haber tocado el cartel (el link circula suelto) y alguien
        puede tocarlo el domingo y pagar el lunes.

        Sirve igual, y es el único número que cierra el embudo: si el cartel se
        toca mucho y no entra plata, el problema está del otro lado del click y
        no en el copy.
        """
        return _pct(donaciones(w), _pedido(w, "click"))

    def _tandas_jugadas(p: dict) -> list[list[dict]]:
        """Las tandas de RESPUESTAS de un jugador, que son las que se miden.

        Sobre RESPUESTAS y no sobre toda huella: para «cuánto aguanta una
        sentada» solo cuentan las que tuvieron actividad, porque abrir la página
        y mirar no es jugar.
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

    def activados(w: date) -> int:
        """De los nuevos de la semana, cuántos respondieron al menos una.

        Es el OMTM del producto. La fila del jugador se crea al CARGAR la
        página, así que «nuevo» incluye a quien se fue mirando la intro:
        activado es el que llegó a hacer algo.
        """
        return sum(1 for p in nuevos(w) if por_jugador.get(p["id"]))

    def pct_activacion(w: date) -> float | None:
        return _pct(activados(w), len(nuevos(w)))

    def card(label: str, series: list, suffix: str, hint: str, dec: int = 1) -> dict:
        value = series[-1]
        prev = series[-2] if len(series) > 1 else None
        delta = round(value - prev, dec) if (value is not None and prev is not None) else None
        return {"label": label, "value": value, "suffix": suffix, "series": series,
                "delta": delta, "hint": hint, "dec": dec}

    return {
        # Activación · quién llega y qué fracción arranca. Tres y no cuatro:
        # «usuarios únicos» —personas distintas que se asomaron, nuevas y
        # viejas— salió del panel. Contra el corte de la primera camada
        # oficial casi no tiene gente vieja que agregar, así que daba 977
        # contra 968 nuevos: nueve personas de diferencia y una tarjeta entera
        # para decirlas. El primero es volumen, deliberadamente vanidoso —no
        # decide nada solo, pero sin él no se sabe si un porcentaje salió de
        # treinta personas o de mil— y el último es el OMTM.
        "activacion": [
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
        # Retención · los cuatro sobre los ACTIVADOS de la camada, que es el
        # cambio que los vuelve legibles. Medidos sobre las altas, los tres
        # porcentajes se caían con cada ola de difusión sin que nadie hubiera
        # retenido peor: una ola trae mucha gente que no llega a jugar, y
        # alguien que nunca jugó no puede volver, ni registrarse, ni instalar
        # nada. Eso es activación, y ya tiene su pestaña.
        "retencion": [
            card("Activados de la camada", per_week(lambda w: ret[w]["activados"]), "",
                 "Los de la camada de esa semana que llegaron a responder al menos "
                 "una derivada. Es el denominador de los otros tres: acá solo "
                 "entra gente que ya jugó."),
            card("Vuelven otro día", per_week(lambda w: ret[w]["vuelven"]), "%",
                 "De esos, cuántos respondieron algo en un segundo día distinto. "
                 "Días y no sentadas —eso está en Jugabilidad— y por respuesta y "
                 "no por visita: volver a abrir la página sin tocar nada es un "
                 "rebote con más pasos. La camada en curso lo tiene incompleto: "
                 "el 76% de las vueltas llega al día siguiente, pero la más "
                 "tardía de las 50 medidas tardó 8 días.", dec=1),
            card("Se registran", per_week(lambda w: ret[w]["registran"]), "%",
                 "De los activados, cuántos dejaron de ser invitados. Casi todos "
                 "al toque —mediana 15 minutos— pero la cola llega a 7,8 días, "
                 "así que la camada en curso todavía suma.", dec=1),
            card("Instalan la app", per_week(lambda w: ret[w]["instalan"]), "%",
                 "De los activados, cuántos la abrieron ya instalada. Es la única "
                 "medida de si la diapo de la pantalla de inicio sirve. La más "
                 "lenta de las tres en cerrar: mediana 10 horas pero cola de 13,4 "
                 "días. Y son 16 instalaciones en toda la vida del producto, así "
                 "que una persona mueve el número entero.", dec=1),
        ],
        # Monetización · el pedido de cafecito de punta a punta, en el orden en
        # que ocurre al revés: primero la plata que entró y después las dos
        # tasas que la explican. Tres es lo que quedó en Retención y no es un
        # descuido: «volver, instalar, registrarse» son las tres cosas que
        # alguien hace cuando el juego le importó, y el cafecito es una cuarta
        # de otra naturaleza —cuesta plata, no tiempo— que además tiene su
        # propio embudo para mirar al lado.
        "monetizacion": [
            card("Cafecitos", per_week(cafecitos), "",
                 "Solo los donados de verdad: los grants a mano y los de aforo no "
                 "cuentan. Es el número de volumen de la pestaña — dice cuánto "
                 "entró, no si el pedido funciona."),
            card("Donaciones", per_week(donaciones), "",
                 "Cuántas veces alguien puso plata. Al lado del total dice algo que "
                 "ninguno de los dos solo: 139 cafecitos en 20 donaciones es un "
                 "producto con mecenas, y en 139 donaciones sería otro."),
            card("Tocan el cartel", per_week(tocan_el_cartel), "%",
                 "De los que vieron el pedido de cafecito, cuántos lo tocaron. La "
                 "impresión se cuenta UNA por partida y no por render, así que el "
                 "denominador es «tuvo el cafecito adelante».", dec=1),
            card("Del click a la plata", per_week(del_click_a_la_plata), "%",
                 "De los que lo tocaron, cuántos terminaron donando. No es persona a "
                 "persona —`game_boosts` no guarda quién donó— sino una razón entre "
                 "dos agregados de la semana, así que PUEDE pasar el 100%: se dona sin "
                 "tocar el cartel porque el link de Cafecito circula suelto. Es igual "
                 "el único número que cierra el embudo.", dec=1),
        ],
        # Jugabilidad · la sentada, que es la unidad real de este juego: se entra
        # por un link, se juega hasta cansarse, y volver es una decisión aparte.
        # Reclutas · va adentro de su sección y no en la cabecera de la pestaña:
        # los cuatro hablan del mismo canal y leerlos lejos de su curva obliga a
        # subir y bajar.
        # Reclutas · los cuatro son de la CAMADA de esa semana: cuánta gente
        # trajo la gente que entró, no cuánta gente entró por un link. Los dos
        # últimos son exactamente los dos primeros divididos por el tamaño de
        # la camada, y esa es toda la definición de K — por eso van juntos y
        # en este orden.
        "reclutas": [
            card("Reclutas traídos", per_week(lambda w: cam[w]["reclutas"]), "",
                 "Cuánta gente trajo por su link la camada que entró esa semana, a "
                 "lo largo de toda su vida. Un recluta tarda 4,5 h en llegar en "
                 "mediana y ninguno de los 144 medidos tardó más de 3,6 días, así "
                 "que la cuenta se cierra sola a los pocos días."),
            card("De esos, arrancaron", per_week(lambda w: cam[w]["reclutas_act"]), "",
                 "Cuántos de esos reclutas llegaron a responder una derivada. El "
                 "link de un amigo trae gente que activa PEOR que la difusión "
                 "—33,6% contra 41,0%—, así que los reclutas a secas cuentan clics "
                 "y no jugadores."),
            card("K de la camada", per_week(lambda w: cam[w]["k"]), "",
                 "Los reclutas traídos, divididos por el tamaño de la camada. "
                 "Cuánta gente trae cada persona que entra. Es la cuenta completa: "
                 "arriba el numerador, acá la división.", dec=2),
            card("K de activados", per_week(lambda w: cam[w]["k_act"]), "",
                 "Reclutas que arrancaron, divididos por los de la camada que "
                 "arrancaron. Es el que decide si el bucle se sostiene, porque la "
                 "unidad que se produce —un jugador activado— es la misma que "
                 "produce. Uno significa que cada activado deja otro activado "
                 "atrás.", dec=2),
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

def reclutas(data: dict, weeks: list[date]) -> dict:
    """Quién trae gente nueva por su link, y cuánto rinde.

    Delega en la del panel de Intervalo en vez de reescribirla: es la MISMA
    cuenta sobre las MISMAS filas, y dos copias de una definición terminarían
    dando dos números distintos para la misma pregunta.

    Lo único que se agrega —y que allá no puede estar, porque esa función solo
    recibe `game_players`— es **cuántos de los reclutas de cada uno llegaron a
    jugar**. La tasa de reproducción vive aparte, en `camadas`.
    """
    from .queries import reclutas as _reclutas_de_intervalo

    base = _reclutas_de_intervalo({"game_players": data["players"]}, weeks)

    # El top de reclutadores, con una columna que el del panel de Intervalo no
    # puede tener: cuántos de sus reclutas llegaron a jugar. Traer diez personas
    # y que ninguna arranque no es reclutar, es repartir un link — y sin esta
    # columna las dos cosas se ven igual.
    activos = {a["player_id"] for a in data["_answers"]}
    act_por_reclutador: dict[int, int] = defaultdict(int)
    for p in data["players"]:
        if p["referred_by"] is not None and p["id"] in activos:
            act_por_reclutador[p["referred_by"]] += 1
    por_alias = {p["alias"]: p["id"] for p in data["players"]}
    for fila in base["top"]:
        rid = por_alias.get(fila["alias"])
        fila["activados"] = act_por_reclutador.get(rid, 0)
    return base

# ── 5-bis · Camadas: el K que sí es una tasa de reproducción ────────────────

# Cuánto tarda una camada en terminar de reclutar. Medido en producción el
# 13/09 sobre los 144 reclutas con reclutador conocido, contando desde el alta
# de quien los trajo: mediana 4,5 h · el 78,5% dentro del día · el 97,2% dentro
# de los tres días · y el ÚLTIMO de los 144 a las 87,5 h, o sea 3,6 días.
# Ninguno tardó más de una semana.
#
# Eso es lo que hace legible a esta métrica: una camada cierra el domingo y
# cuatro días después ya no le entra nada, así que no hay que esperar meses para
# saber cuánto se reprodujo. El número redondea 3,6 para arriba.
#
# Si el juego alguna vez empuja a compartir MÁS TARDE —un cartel en la derivada
# 50, un mail a la semana— este número deja de valer y hay que volver a medirlo:
# marcaría camadas como maduras cuando todavía les falta.
MADURACION_DIAS = 4


def _camadas(data: dict, semanas: list[date]) -> dict[date, dict]:
    """Cuánta gente trajo cada camada a lo largo de su vida.

    **Esta es una tasa de reproducción y la que estaba antes no lo era.** El K
    semanal dividía los reclutas que LLEGARON esa semana por toda la base que
    ya existía, y ese denominador lo mueve la difusión: una ola lo multiplica de
    golpe, así que con la misma gente compartiendo igual el número se desploma
    la semana siguiente. Servía para «reclutas por persona-semana», que es una
    medida de tráfico, no de reproducción.

    Acá el numerador y el denominador son la MISMA gente: los reclutas que trajo
    una camada, sobre el tamaño de esa camada. Es indiferente a cuánto se
    difunda, porque cada camada se mide contra sí misma. Uno significa que una
    camada se reemplaza entera; abajo de uno, el link ayuda pero no alcanza como
    único canal y el crecimiento sigue dependiendo de que difundamos.

    **El recluta se le cuenta a la camada de su reclutador, no a la suya.** Si
    alguien entra un sábado y trae a un amigo el martes, ese amigo suma para la
    camada del sábado aunque su propia alta caiga en la semana siguiente. Es la
    diferencia con «reclutas nuevos», que contaba altas.

    Dos K y no uno, porque son preguntas distintas:

    - `k` = reclutas traídos ÷ tamaño de la camada. Cuánta gente trae cada
      persona que entra, active o no.
    - `k_act` = reclutas ACTIVADOS traídos por los ACTIVADOS de la camada ÷
      activados de la camada. Es el que decide si el bucle se sostiene: un
      proceso de ramificación crece cuando la unidad que se produce es la misma
      que produce, y acá esa unidad es el activado. No es una definición
      elegida a gusto —de los 24 jugadores que alguna vez reclutaron a alguien,
      los 24 tenían 3 o más respuestas: nadie sin activar reclutó nunca, porque
      el cartel de compartir aparece jugando.

    Exigir que el reclutador también esté activado hoy no saca a nadie, por lo
    de arriba. Se escribe igual: es lo que hace que el número siga significando
    lo mismo el día que el juego empiece a ofrecer el link antes de jugar.
    """
    activos = {a["player_id"] for a in data["_answers"]}
    jugadores = data["players"]
    alta_de = {p["id"]: _week_of(p["created_at"]) for p in jugadores}

    traidos_por: dict[int, list[dict]] = defaultdict(list)
    for p in jugadores:
        if p["referred_by"] is not None:
            traidos_por[p["referred_by"]].append(p)

    por_camada: dict[date, list[dict]] = defaultdict(list)
    for p in jugadores:
        w = alta_de.get(p["id"])
        if w is not None:
            por_camada[w].append(p)

    # La madurez se mide contra HOY y no contra la semana elegida en el panel:
    # lo que limita a una camada es cuánto tiempo real pasó desde que entró, no
    # qué semana se esté mirando.
    hoy = local_date(datetime.utcnow())
    filas: dict[date, dict] = {}
    for w in semanas:
        miembros = por_camada.get(w, [])
        activados = [p for p in miembros if p["id"] in activos]
        reclutas = sum(len(traidos_por.get(p["id"], ())) for p in miembros)
        reclutas_act = sum(
            1 for p in activados for r in traidos_por.get(p["id"], ())
            if r["id"] in activos)
        filas[w] = {
            "label": w.strftime("%d/%m"),
            "week": w.isoformat(),
            "n": len(miembros),
            "n_act": len(activados),
            "reclutas": reclutas,
            "reclutas_act": reclutas_act,
            "k": round(reclutas / len(miembros), 2) if miembros else None,
            "k_act": round(reclutas_act / len(activados), 2) if activados else None,
            # La camada cierra siete días después de abrirse, y a partir de ahí
            # le quedan `MADURACION_DIAS` para terminar de reclutar.
            "madura": hoy >= w + timedelta(days=7 + MADURACION_DIAS),
        }
    return filas


def camadas(data: dict, week: date) -> dict:
    """Las camadas desde la primera del panel hasta la elegida.

    Todas y no las últimas cuatro, por lo mismo que la curva de activación: con
    cuatro puntos una tendencia no se distingue de un rebote, y el numerador de
    esto es de un dígito por camada.
    """
    semanas = _semanas_hasta(week)
    filas = _camadas(data, semanas)
    return {
        "filas": [filas[w] for w in semanas],
        "maduracion_dias": MADURACION_DIAS,
    }


# Debajo de esto una universidad es una fila de ruido: con dos jugadores, un
# solo recluta manda el K a 0,5 y la pone arriba de UBA. Las que no llegan se
# juntan en «Otras» en vez de desaparecer — el total tiene que cerrar.
MIN_JUGADORES_UNI = 5


def reclutas_por_universidad(data: dict) -> list[dict]:
    """Quién trae gente, abierto por dónde estudia.

    **La universidad se pregunta a las 3 correctas** (`HITO_PERFIL` en
    `web/src/app/derivadas/hitos-del-juego.ts`), así que tenerla cargada IMPLICA
    haber jugado. Eso gobierna toda la lectura de esta tabla y conviene tenerlo
    presente antes que cualquier número:

    - el denominador no es «cuánta gente de esa universidad abrió el juego» sino
      «cuánta llegó a decir dónde estudia», que es un subconjunto bastante más
      chico y bastante más enganchado — medido el 13/09, 307 de 968;
    - por lo mismo, casi todos los que tienen universidad están activados (66 de
      67 en UNC, 46 de 47 en UNLP), así que acá las dos K se parecen mucho más
      entre sí que en la tabla de camadas, donde el denominador sí incluía a los
      que no arrancaron;
    - y los que NO tienen universidad no reclutan nunca. No es una casualidad:
      el cartel de compartir aparece jugando, o sea del otro lado del mismo
      hito.

    **`reclutadores` es la columna que hace que esta tabla no mienta.** El
    reclutamiento está brutalmente concentrado —medido: 23 personas en todo el
    producto, y en cada universidad la primera trae cerca de la mitad de las de
    su casa— así que un K alto puede ser una cultura o puede ser una persona, y
    sin esta columna las dos se ven igual. UBA es el caso extremo: sus 7
    reclutas salieron de UN jugador.
    """
    activos = {a["player_id"] for a in data["_answers"]}
    jugadores = data["players"]

    trajo: dict[int, list[dict]] = defaultdict(list)
    for p in jugadores:
        if p["referred_by"] is not None:
            trajo[p["referred_by"]].append(p)

    por_uni: dict[str | None, list[dict]] = defaultdict(list)
    for p in jugadores:
        por_uni[p["university"] or None].append(p)

    def fila(clave: str, gente: list[dict], chip: bool) -> dict:
        act = [p for p in gente if p["id"] in activos]
        reclutas = sum(len(trajo.get(p["id"], ())) for p in gente)
        act_traidos = sum(1 for p in act for r in trajo.get(p["id"], ())
                          if r["id"] in activos)
        cuentas = sorted((len(trajo[p["id"]]) for p in gente if trajo.get(p["id"])),
                         reverse=True)
        return {
            "clave": clave,
            "chip": chip,
            "jugadores": len(gente),
            "activados": len(act),
            "reclutas": reclutas,
            "reclutas_act": act_traidos,
            "reclutadores": len(cuentas),
            # Qué porción del reclutamiento de esa casa hizo su primer
            # reclutador. Es lo que separa «acá se comparte» de «acá hay
            # alguien que comparte».
            "top_pct": _pct(cuentas[0], reclutas) if cuentas and reclutas else None,
            "k": round(reclutas / len(gente), 2) if gente else None,
            "k_act": round(act_traidos / len(act), 2) if act else None,
        }

    grandes = [u for u, g in por_uni.items()
               if u is not None and len(g) >= MIN_JUGADORES_UNI]
    chicas = [u for u, g in por_uni.items()
              if u is not None and len(g) < MIN_JUGADORES_UNI]

    filas = [fila(u, por_uni[u], True) for u in grandes]
    filas.sort(key=lambda f: (-f["reclutas"], -f["jugadores"]))
    if chicas:
        f = fila(f"Otras ({len(chicas)})", [p for u in chicas for p in por_uni[u]], False)
        filas.append(f)
    if None in por_uni:
        filas.append(fila("Sin universidad", por_uni[None], False))
    return filas


# ── 5-ter · Retención por camada ─────────────────────────────────────────────

# Cuánto tarda una camada en terminar de retener, y no es lo mismo para las
# tres cosas que se miden. Medido en producción el 13/09, contando desde el alta
# de cada persona:
#
#   · volver otro día (n=50) — el 76% vuelve al día siguiente, el 94% dentro de
#     dos días, y la vuelta más tardía de las cincuenta cayó a los 8 días.
#   · registrarse (n=60) — mediana 15 minutos, el 86,7% dentro del día, la más
#     tardía a los 7,8 días.
#   · instalar la app (n=16) — mediana 10 horas, pero la cola es larga: la más
#     tardía cayó a los 13,4 días.
#
# **La cola está censurada por la edad del producto.** dx tiene 16 días, así que
# nadie PUDO volver a los treinta: estos techos son un piso del techo real y hay
# que volver a medirlos cuando haya camadas de dos meses. Mientras tanto sirven
# para lo único que se usan acá, que es marcar qué punto de la curva todavía
# está sumando y no se puede leer como una caída.
def _camadas_retencion(data: dict, semanas: list[date]) -> dict[date, dict]:
    """Qué hizo cada camada después de arrancar, sobre los que arrancaron.

    **El denominador son los ACTIVADOS de la camada y no sus altas.** Ese es
    todo el cambio respecto de lo que había antes, y es el que vuelve legibles a
    los tres porcentajes: medidos sobre las altas se caían con cada ola de
    difusión sin que nadie hubiera retenido peor. Una ola trae mucha gente que
    no llega a jugar, y quien nunca jugó no puede volver, ni registrarse, ni
    instalar nada — eso es activación, que ya tiene su propia pestaña y su
    propia curva.

    Con el denominador corregido, las dos preguntas quedan separadas: cuánta
    gente llega a jugar se mira en Activación, y qué hace la que jugó se mira
    acá.

    **Vuelve otro día = dos DÍAS distintos con respuesta.** Días y no sentadas
    —esa es la de Jugabilidad, que mide la vuelta dentro del mismo rato— y por
    respuesta y no por visita, porque volver a abrir la página sin tocar nada es
    un rebote con más pasos.

    Las tres se le cuentan a la camada de la persona, así que un registro del
    martes suma para la camada del sábado anterior. Son cohortes: cada una se
    mide contra sí misma, y por eso se pueden comparar entre semanas.
    """
    activos = {a["player_id"] for a in data["_answers"]}

    # Los días distintos con respuesta de cada jugador. Se arma una vez: es lo
    # único caro de esta función y lo piden todas las camadas.
    dias_de: dict[int, set[date]] = defaultdict(set)
    for a in data["_answers"]:
        d = local_date(a["created_at"])
        if d is not None:
            dias_de[a["player_id"]].add(d)

    por_camada: dict[date, list[dict]] = defaultdict(list)
    for p in data["players"]:
        w = _week_of(p["created_at"])
        if w is not None and p["id"] in activos:
            por_camada[w].append(p)

    filas: dict[date, dict] = {}
    for w in semanas:
        act = por_camada.get(w, [])
        n = len(act)
        vuelven = sum(1 for p in act if len(dias_de.get(p["id"], ())) > 1)
        registran = sum(1 for p in act if p["user_id"])
        instalan = sum(1 for p in act if p["pwa_first_seen_at"])
        filas[w] = {
            "label": w.strftime("%d/%m"),
            "week": w.isoformat(),
            "activados": n,
            "n_vuelven": vuelven,
            "n_registran": registran,
            "n_instalan": instalan,
            "vuelven": _pct(vuelven, n),
            "registran": _pct(registran, n),
            "instalan": _pct(instalan, n),
        }
    return filas



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

    # Los grupos que recibieron dx **dentro de la ventana del panel**, y no
    # todos los que alguna vez lo recibieron.
    #
    # El `producto == "dx"` solo no alcanza desde que el panel arranca en la
    # primera camada oficial (ver FIRST_WEEK): un grupo al que se le mandó en
    # agosto sigue marcado como dx y sigue aportando sus miembros al
    # denominador, pero sus jugadores son todos anteriores al corte y ya no se
    # cargan. Son miembros sin ninguna posibilidad de tener numerador, y hunden
    # el clickrate por un motivo que no tiene nada que ver con la difusión.
    tocados = [g for g, d in grupos.items()
               if d["producto"] == "dx" and (d["miembros"] or 0) > 0
               and (_fecha_de(d["ultimo_envio"]) or date.min) >= FIRST_WEEK]

    # Las dos copias con las que salió la ola: los grupos donde las derivadas
    # están en el temario y los demás. La etiqueta la escribe el sync desde los
    # planes de hermes y no se infiere acá — ver `GameGroup.cluster_dx`, que
    # tiene medido por qué adivinarla por la materia no alcanza.
    #
    # Los que no la tienen NO se reparten a ojo ni se esconden: van a su propia
    # fila. Son sobre todo los de las primeras tandas, mandados antes de que la
    # ola se partiera en dos, y decir «no sabemos con cuál» es información —
    # meterlos en cualquiera de los dos cubos sería inventarla.
    def copia(clave: str) -> dict:
        return tasa([g for g in tocados if grupos[g]["cluster_dx"] == clave])

    sin_copia = tasa([g for g in tocados if not grupos[g]["cluster_dx"]])

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
        "analisis": copia("analisis"),
        "generico": copia("generico"),
        "sin_copia": sin_copia,
        "desde": FIRST_WEEK,
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


# ── 7-bis · El reloj: cuándo se entra y cuándo se vuelve ─────────────────────

def horarios(data: dict) -> dict:
    """A qué hora del día arranca el PRIMER uso y a qué hora los siguientes.

    **Qué contesta.** El primer uso lo empuja el link que salió por WhatsApp; el
    segundo y los que siguen no los empuja nadie. Separarlos convierte una sola
    pregunta —«a qué hora juega la gente»— en las dos que de verdad hay:

      - **primer uso** = a qué hora llega alguien a quien acabamos de invitar.
        Medido el 14/09 contra los checkpoints de Hermes de esta camada, la
        curva calca el cronograma de envío: r = 0,82 hora por hora, incluido el
        rebote de las 15-16, que es la tanda de las 15. O sea que NO es una
        preferencia de nadie — es nuestra agenda dibujada.
      - **uso posterior** = a qué hora alguien decide volver solo. Contra el
        mismo cronograma da r = 0,17: es lo único de las dos curvas que mide
        una preferencia.

    **La unidad es la SESIÓN, no la persona.** Alguien que jugó cinco veces
    aporta una primera y cuatro posteriores, que es exactamente lo que se quiere
    contar: la pregunta es cuándo ocurren los usos, no cuándo existen las
    personas. Las tandas salen de `_sesiones()`, el único lugar donde este panel
    decide dónde termina una sesión.

    **Acumulado desde la primera camada, no por semana.** La hora del día es un
    hecho estructural y no un indicador semanal; partido en semanas, el brazo de
    las vueltas se queda con veinte sesiones repartidas en doce bins y deja de
    leerse. Mismo alcance que la sección de difusión, que está al lado.

    **El control interno.** Partir el primer uso por cómo se invitó a esa
    persona es lo que cierra el argumento sin salir de la base: al de grupo lo
    trae una tanda de WhatsApp y al recluta lo trae una persona. Si el pico de
    la mañana fuera «los que recién llegan prefieren la mañana», los dos
    tendrían la misma forma. No la tienen.
    """
    por_jugador: dict[int, list[dict]] = defaultdict(list)
    for a in data["_answers"]:
        por_jugador[a["player_id"]].append(a)

    # `directo` es quien no trae ni grupo ni reclutador: entró por el link
    # pelado. No es una tercera vía de difusión, es la ausencia de atribución.
    origen = {p["id"]: ("grupo" if p["first_group_id"] else
                        "recluta" if p["referred_by"] else "directo")
              for p in data["players"]}

    primera = [0] * _N_BINS
    posterior = [0] * _N_BINS
    mismo_dia = [0] * _N_BINS
    otro_dia = [0] * _N_BINS
    por_origen = {k: [0] * _N_BINS for k in ("grupo", "recluta", "directo")}

    for pid, eventos in por_jugador.items():
        tandas = _sesiones(eventos)
        if not tandas:
            continue
        arranque = tandas[0][0]["created_at"]
        b0 = _bin_de(arranque)
        primera[b0] += 1
        por_origen[origen.get(pid, "directo")][b0] += 1
        # «Mismo día» se mide contra el día de la PRIMERA sesión y no contra la
        # anterior: lo que separa el arrastre de la vuelta es el día en que a
        # esa persona la invitamos, no cuándo jugó por última vez.
        dia_cero = local_date(arranque)
        for tanda in tandas[1:]:
            t = tanda[0]["created_at"]
            b = _bin_de(t)
            posterior[b] += 1
            if local_date(t) == dia_cero:
                mismo_dia[b] += 1
            else:
                otro_dia[b] += 1

    def perfil(cuenta: list[int]) -> dict:
        """El reparto de una serie por bin, más las dos cifras que la resumen."""
        n = sum(cuenta)
        if not n:
            return {"n": 0, "pct": [None] * _N_BINS, "pico": None,
                    "pct_pico": None, "top3": None, "noche": None}
        pct = [round(100 * c / n, 1) for c in cuenta]
        i_pico = max(range(_N_BINS), key=lambda i: cuenta[i])
        top3 = sum(sorted(cuenta, reverse=True)[:3])
        return {
            "n": n,
            "pct": pct,
            "pico": BIN_LABEL[i_pico],
            "pct_pico": pct[i_pico],
            # Los tres bins más cargados: seis horas del día. Es la medida de
            # concentración que se lee sin explicar —«en seis horas entra tanto
            # por ciento»— y la que separa un pico de una meseta.
            "top3": round(100 * top3 / n, 1),
            "noche": round(100 * sum(cuenta[i] for i in BINS_NOCHE) / n, 1),
        }

    return {
        "bins": list(BIN_LABEL),
        "primera": primera,
        "posterior": posterior,
        "mismo_dia": mismo_dia,
        "otro_dia": otro_dia,
        "n_mismo_dia": sum(mismo_dia),
        "n_otro_dia": sum(otro_dia),
        "perfil_primera": perfil(primera),
        "perfil_posterior": perfil(posterior),
        "perfil_otro_dia": perfil(otro_dia),
        "por_origen": {k: perfil(v) for k, v in por_origen.items()},
        "min_base": MIN_BASE_BIN,
        "desde": FIRST_WEEK,
    }


# ── 7b · Experimentos por GRUPO (no por jugador) ─────────────────────────────
#
# `experimentos()` de arriba compara proporciones entre JUGADORES —cada uno cae
# solo en un brazo (`variant`)—. Acá el sorteo es por GRUPO de WhatsApp: todos
# sus miembros ven el mismo mensaje, así que la observación es el grupo y el
# dato de cada observación es su clickrate. Comparar dos proporciones sobre
# 11.000 jugadores en vez de una diferencia de medias sobre ~90 grupos cree
# tener diez veces más muestra de la que tiene de verdad — ver
# docs/reports/reporte-ab-imagen-ranking-2026-09-14.pdf, sección 4.

# Igual que EXPERIMENTOS: declarado ANTES de ver los datos. `mde_pp` y el
# resto salen de la sección 5 del documento. Cada brazo es el `id` de un plan
# de Hermes (`game_groups.ultima_campana`) — dos ids distintos es lo que
# separa las dos ramas sin una columna nueva.
#
# `sigma_pp` = 5,66, el desvío RESIDUAL dentro de universidad (documento,
# sección 4/5 — corregida el 14/09 tras revisión cruzada con Lean). Vale
# porque `experimento_grupos()`, más abajo, analiza por el mismo estrato que
# sortea: compara RESIDUOS (clickrate de cada grupo menos el promedio de su
# universidad), no el clickrate crudo. Usar el 6,07 sin estratificar acá
# pediría 101 grupos por brazo en vez de 88 — 26 grupos de más, el 10% del
# pool elegible entero (253), por no aprovechar un descuento de varianza que
# el sorteo por bloques ya paga solo.
EXPERIMENTOS_GRUPOS: tuple[dict, ...] = (
    {
        "clave": "dx-ab-imagen",
        "titulo": "La imagen del ranking",
        "hipotesis": (
            "Los seis mensajes de siempre, salvo que el último —el que apela a la "
            "universidad— viaja como el pie de una foto del top 5 en vez de como "
            "texto suelto. Ver la propia universidad en el ranking, mostrada y no "
            "solo afirmada, sube el clickrate del grupo."
        ),
        "desde": date(2026, 9, 15),
        "brazos": (("dx-ab-imagen-control", "Control (texto)"),
                   ("dx-ab-imagen-tratamiento", "Tratamiento (imagen)")),
        "sigma_pp": 5.66,
        "mde_pp": 2.40,
        "alpha": 0.05,
        "potencia": 0.80,
        "prediccion": (
            "Análisis por residuos dentro de universidad (mismo estrato que el "
            "sorteo): 88 grupos por brazo, 176 en total — contra 202 si se "
            "comparara el clickrate crudo. Comprometido de antemano, se lee una "
            "sola vez."
        ),
    },
)


def n_comprometido_medias(exp: dict) -> int:
    """Grupos por brazo para poder leer una diferencia de MEDIAS.

    Misma lógica que `n_comprometido` (dos proporciones) pero escrita para la
    fórmula de dos medias del documento, sección 5: n ≥ 2·((z_{1-α/2}+z_{1-β})·σ/mde)².
    """
    za = _z_de(1 - exp["alpha"] / 2)
    zb = _z_de(exp["potencia"])
    return int(2 * ((za + zb) * exp["sigma_pp"] / exp["mde_pp"]) ** 2) + 1


def _sigma_corregido(residuos: list[float], n_total_bloque: int, n_universidades: int) -> float | None:
    """Desvío de los residuos, con la corrección de grados de libertad.

    Detectado por Lean el 14/09 con una simulación de 40.000 corridas bajo H0
    sobre los estratos reales de esta ola: sin esto, el alfa declarado en 5%
    sale 5,78% de verdad —16% más falsos positivos de los prometidos—, por
    dos motivos que se corrigen acá:

      1. `stdev` (÷ n−1), no `pstdev` (÷ n): el residuo de un BRAZO es una
         muestra, no la población entera de ese brazo.
      2. Cada media de universidad que se restó para armar el residuo
         (`media_uni` en `experimento_grupos`) le saca un grado de libertad
         de más — `n_universidades` de ellos—, y `sqrt(n/(n-U))` es lo que
         se lo devuelve al σ.

    El `n` del factor del punto 2 es el **total del bloque, los dos brazos
    juntos** (`n_total_bloque`) — NO el `len(residuos)` de este brazo. Las
    medias por universidad se estiman una sola vez con las observaciones de
    los dos brazos, así que los `n_universidades` grados de libertad se
    consumen una sola vez sobre el total, no una vez por brazo. Usar el n del
    brazo (primera versión, detectada por Lean el 14/09 con otra simulación)
    descuenta el mismo grado de libertad dos veces y gasta alfa de más: da
    4,62% en vez de 5% —conservador, no roto, pero corrige potencia gratis—.
    Con el n total la simulación de Lean da 4,99% ≈ el 5,00% nominal.

    Potencia (60.000 corridas/celda, mismos estratos, σ_w=5,66), la razón por
    la que se eligió esta versión y no la conservadora — con `n_total_bloque`
    el diseño entrega EXACTAMENTE el 80% que declaró para el MDE de 2,40 pp:

        efecto     n_brazo−U    N_total−U (esta versión)
        1,50 pp      40,9%         42,1%
        2,00 pp      63,6%         64,7%
        2,40 pp      79,2%         80,0%
        3,00 pp      93,5%         93,8%

    La conservadora sigue siendo un test válido (no infla falsos positivos)
    y solo cuesta 0,8 puntos de potencia en el MDE — la diferencia real es
    que con ella el panel ya no mide el experimento que el documento describe
    (sección 5): declarar 80%/5% y entregar 79,2%/4,62% es un test distinto
    del prometido, aunque más estricto.
    """
    n = len(residuos)
    if n < 2:
        return None
    base = statistics.stdev(residuos)
    if n_total_bloque <= n_universidades:
        return base
    return base * math.sqrt(n_total_bloque / (n_total_bloque - n_universidades))


def experimento_grupos(data: dict) -> list[dict]:
    """Un bloque por experimento de grupos: clickrate por grupo, no por jugador.

    **El análisis está ESTRATIFICADO por universidad, igual que el sorteo**
    (ver `docs/experimentos/2026-09-14-ab-imagen-asignacion.csv` y la sección 5
    del documento, corregida el 14/09 tras revisión cruzada con Lean). Sortear
    por bloques y analizar crudo tira el beneficio que ya se pagó: el residuo
    —el clickrate de cada grupo menos el promedio de SU universidad, contando
    los dos brazos— saca la parte de la varianza que es "de qué casa es" y dejа
    un σ más chico, que es lo que permite 88 grupos por brazo en vez de 101.

    Solo por universidad, no por los tres estratos del sorteo (universidad ×
    tamaño × contacto previo): con ~60 grupos con datos, un residuo de tres
    factores tiene más celdas que observaciones y el σ que sale está
    artificialmente achicado — un experimento subdimensionado por un σ
    inventado es peor que uno caro. El tamaño y el contacto previo se
    estratifican en el SORTEO, que no cuesta nada; se analiza con el único
    factor que se puede estimar de verdad.

    Los guardarraíles (activación, activados por grupo, volvió otro día) se
    calculan siempre, como en `experimentos()` — sirven para VETAR un resultado
    bueno, nunca para rescatar uno malo, y no esperan al n comprometido.
    """
    grupos = {g["id"]: g for g in data["grupos"]}
    jugadores_de: dict[str, list[dict]] = defaultdict(list)
    for p in data["players"]:
        if p["first_group_id"]:
            jugadores_de[p["first_group_id"]].append(p)
    con_ejercicio = {e["player_id"] for e in data["exercises"]}
    fechas_por_jugador: dict[int, set] = defaultdict(set)
    for e in data["exercises"]:
        d = local_date(e["created_at"])
        if d:
            fechas_por_jugador[e["player_id"]].add(d)

    def clickrate_de(g: str) -> float:
        return 100 * len(jugadores_de.get(g, ())) / (grupos[g]["miembros"] or 1)

    salida = []
    for exp in EXPERIMENTOS_GRUPOS:
        n_pedido = n_comprometido_medias(exp)

        # Los grupos de LOS DOS BRAZOS, para el promedio por universidad — el
        # bloque de un diseño estratificado son los grupos de esa universidad
        # sin importar a qué brazo tocaron, no solo los de un brazo.
        ids_por_plan = {
            plan_id: [g for g, d in grupos.items()
                      if d["ultima_campana"] == plan_id
                      and (d["miembros"] or 0) >= MIN_MIEMBROS_FILA
                      and d["universidad"]]
            for plan_id, _ in exp["brazos"]
        }
        todos_los_ids = [g for ids in ids_por_plan.values() for g in ids]
        clickrate_uni: dict[str, list[float]] = defaultdict(list)
        for g in todos_los_ids:
            clickrate_uni[grupos[g]["universidad"]].append(clickrate_de(g))
        media_uni = {u: statistics.mean(cs) for u, cs in clickrate_uni.items()}

        brazos = []
        for plan_id, nombre in exp["brazos"]:
            ids_grupo = ids_por_plan[plan_id]
            clickrates = []
            residuos = []
            activados_por_grupo = []
            vuelven_ids = []
            servidos_totales = 0
            jugadores_totales = 0
            for g in ids_grupo:
                cr = clickrate_de(g)
                clickrates.append(cr)
                residuos.append(cr - media_uni[grupos[g]["universidad"]])
                gente = jugadores_de.get(g, [])
                activados = [j for j in gente if j["id"] in con_ejercicio]
                activados_por_grupo.append(len(activados))
                servidos_totales += len(activados)
                jugadores_totales += len(gente)
                vuelven_ids.extend(j["id"] for j in activados
                                    if len(fechas_por_jugador.get(j["id"], ())) >= 2)
            n = len(ids_grupo)
            n_uni = len({grupos[g]["universidad"] for g in ids_grupo})
            brazos.append({
                "clave": plan_id,
                "label": nombre,
                "n": n,
                "clickrate_medio": round(statistics.mean(clickrates), 2) if clickrates else None,
                # El desvío que se muestra y el que entra al z-test son el
                # MISMO —sobre los residuos, no sobre el clickrate crudo,
                # y con la corrección de grados de libertad de
                # `_sigma_corregido`—: es el que de verdad gobierna si el
                # experimento está listo, y mostrar el crudo al lado hubiera
                # sido otro número sin uso.
                "desvio_pp": (round(sig, 2)
                              if (sig := _sigma_corregido(residuos, len(todos_los_ids), n_uni)) is not None
                              else None),
                "pct_activado": _pct(servidos_totales, jugadores_totales),
                "activados_por_grupo": (round(statistics.mean(activados_por_grupo), 1)
                                        if activados_por_grupo else None),
                "pct_vuelven": _pct(len(vuelven_ids), servidos_totales),
                "falta": max(0, n_pedido - n),
                "_residuos": residuos,
                "_n_uni": n_uni,
            })

        listo = all(b["n"] >= n_pedido for b in brazos)
        lectura = None
        if listo and len(brazos) == 2 and all(b["desvio_pp"] is not None for b in brazos):
            control, test = brazos[0], brazos[1]
            nc, nt = control["n"], test["n"]
            n_total_bloque = len(todos_los_ids)
            sc = _sigma_corregido(control["_residuos"], n_total_bloque, control["_n_uni"])
            st = _sigma_corregido(test["_residuos"], n_total_bloque, test["_n_uni"])
            # La diferencia de medias de RESIDUOS es el efecto ajustado por
            # universidad. Con los brazos balanceados adentro de cada estrato
            # (el sampler lo garantiza a lo sumo un grupo de diferencia), esto
            # queda prácticamente igual a la diferencia de medias crudas —lo
            # que cambia es el error estándar, más chico.
            xc = statistics.mean(control["_residuos"])
            xt = statistics.mean(test["_residuos"])
            se = math.sqrt((sc ** 2) / nc + (st ** 2) / nt)
            z = (xt - xc) / se if se else 0.0
            za = _z_de(1 - exp["alpha"] / 2)
            lectura = {
                "delta_pp": round(xt - xc, 2),
                "z": round(z, 2),
                "p_valor": 2 * (1 - _phi(abs(z))),
                "ic_pp": (round(xt - xc - za * se, 2), round(xt - xc + za * se, 2)),
                "rechaza": (abs(z) > za) if se else False,
            }

        for b in brazos:
            del b["_residuos"]
            del b["_n_uni"]

        salida.append({
            "clave": exp["clave"],
            "titulo": exp["titulo"],
            "hipotesis": exp["hipotesis"],
            "prediccion": exp["prediccion"],
            "desde": exp["desde"],
            "mde_pp": exp["mde_pp"],
            "alpha": exp["alpha"],
            "potencia": exp["potencia"],
            "n_pedido": n_pedido,
            "brazos": brazos,
            "listo": listo,
            "lectura": lectura,
            "sin_arrancar": sum(b["n"] for b in brazos) == 0,
        })
    return salida


# ── 8 · Carteles ─────────────────────────────────────────────────────────────

# Qué es cada cartel, para que la tabla se lea sin abrir el código.
# Los tres carteles que el juego SÍ emite. Hubo un cuarto, `register`, que el
# panel prometía en su tabla y nunca existió: cero eventos en toda la vida del
# producto (`game-telemetry.ts` lo tiene en el tipo, pero nadie lo dispara). Una
# fila que no puede aparecer nunca se lee como «acá no pasó nada» y no como «esto
# no está instrumentado», que son cosas muy distintas.
CARTELES = {
    "share": "Reclutar: compartir el link",
    "cafecito": "Invitar un cafecito",
    "boost_offer": "Oferta de multiplicador",
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


# ── 8-bis · Monetización ─────────────────────────────────────────────────────

# Dónde sale el cartel del cafecito, con el nombre que manda el front como clave.
# El orden de este diccionario no importa: la tabla ordena por impresiones.
LUGARES_CAFECITO = {
    "header_mobile": "La barra, en el teléfono",
    "header_desktop": "La barra, en escritorio",
    "milestone": "Un hito, cada tantas derivadas",
    "pedido": "Cuando lo piden",
    "record": "Al batir un récord",
    "big_climb": "Después de una subida grande",
    "clasico_config": "Armando un clásico",
    "settings": "Ajustes",
    "settings_reclamo": "Ajustes · reclamar un cafecito",
}


def monetizacion(data: dict) -> dict:
    """El cartel del cafecito, abierto por dónde sale.

    **Es lo que reemplaza a la tabla de carteles, y el motivo es que aquella
    tapaba justo lo que había que ver.** El cafecito salía como UNA fila con un
    CTR de 16,8%, y ese promedio junta un botón que vive permanentemente en la
    barra con una interrupción que aparece al cruzar un hito. Medido el 13/09:
    la barra en escritorio convierte 41,5% y el hito 8,4% — cinco veces, dentro
    de la misma fila.

    Lo que se mostraba al lado tampoco servía:

    - **`boost_offer` daba 1,2% y no significaba nada.** Su impresión es «se
      mostró la diapo del cafecito» (954 veces) y su click es «alguien tocó
      *Elegir mi universidad*» (11), que es un botón que solo aparece si todavía
      no elegiste una. Dividir uno por otro no es un CTR: es una acción de nicho
      sobre un denominador global, y el 1,2% se leía como un desastre cuando lo
      único que dice es que casi todos ya tienen universidad.
    - **`share` es reclutamiento y no plata**, así que se fue a su sección, con
      la curva de K que explica.
    - **`register` nunca existió** (ver `CARTELES`).

    Los lugares que anotan click y nunca impresión se listan igual, con el CTR
    vacío: son 21 clicks reales sin denominador —`settings-panel.tsx` dispara el
    click sin montar el contador— y esconderlos haría que el bug siguiera sin
    verse otro mes.
    """
    conteo: dict[str, dict[str, int]] = defaultdict(lambda: {"imp": 0, "clk": 0})
    for e in data["cta"]:
        if e["cta"] != "cafecito":
            continue
        c = conteo[e["placement"] or "—"]
        if e["action"] == "impression":
            c["imp"] += 1
        elif e["action"] == "click":
            c["clk"] += 1
    filas = [{
        "lugar": k,
        "desc": LUGARES_CAFECITO.get(k, k),
        "impresiones": v["imp"],
        "clicks": v["clk"],
        "ctr": _pct(v["clk"], v["imp"]),
    } for k, v in conteo.items()]
    # Los que no tienen impresiones van al final: su CTR es vacío, así que
    # ordenarlos entre los demás los pondría en un lugar que no significa nada.
    filas.sort(key=lambda f: (f["impresiones"] == 0, -f["impresiones"]))
    return {
        "lugares": filas,
        "sin_denominador": sum(f["clicks"] for f in filas if not f["impresiones"]),
        "gracias": agradecimiento(data),
    }


# La ventana con la que una donación se cruza contra los «voy a donar». Es la
# misma que usa `lifecycle_emails.py` para el mail de agradecimiento, y tiene
# que seguir siéndolo: si las dos se separan, el panel dice que se agradeció a
# alguien a quien el mail no le llegó.
VENTANA_DONANTE_SEG = 5


def agradecimiento(data: dict) -> dict:
    """De cada donación, si se pudo saber quién la hizo.

    **Es el embudo que dice cuánta plata entra sin que sepamos de quién.**
    Cafecito no devuelve al pagador, así que la única pata es el «voy a donar»:
    cuando alguien toca ese botón el juego sí sabe quién es, y la donación se
    cruza contra las intenciones consumidas en ±5 segundos. Con una sola persona
    distinta en esa ventana se puede afirmar quién pagó; con dos o más, no —solo
    una pagó y las otras cobran el empuje igual, así que nombrar a cualquiera
    sería afirmar algo que no sabemos (`game/boosts.py:donante_unico`).

    Medido el 13/09 sobre las 13 donaciones desde la primera camada oficial: 8
    con donante único, 5 ambiguas, y de los 8 uno donó sin cuenta. Se agradeció
    a 7 de 13. **La pérdida es casi toda ambigüedad**, y eso tiene arreglo del
    lado del producto —una ventana más angosta, o cruzar por monto— mientras que
    «donó sin cuenta» no lo tiene.

    Solo `source == cafecito`: los grants a mano y los del aforo no los donó
    nadie, así que no hay a quién agradecerle y meterlos en el denominador
    inventaría un problema que no existe. Pasó al medirlo la primera vez: con
    los 7 grants adentro, 9 donaciones parecían «pagadas sin tocar el botón».
    """
    donaciones = [b for b in data["boosts"] if b["source"] == DONADO]
    intents = [i for i in data["intents"] if i["consumed_at"] is not None]
    usuario_de = data.get("_usuario_de", {})
    desuscriptos = {u["id"] for u in data["usuarios"] if u["email_unsubscribed"]}

    ventana = timedelta(seconds=VENTANA_DONANTE_SEG)
    unico = ambiguas = sin_botón = con_cuenta = agradecidos = 0
    for b in donaciones:
        cuando = b["created_at"]
        if cuando is None:
            sin_botón += 1
            continue
        personas = {i["player_id"] for i in intents
                    if i["consumed_at"] is not None
                    and cuando - ventana <= i["consumed_at"] <= cuando + ventana}
        if not personas:
            sin_botón += 1
        elif len(personas) > 1:
            ambiguas += 1
        else:
            unico += 1
            uid = usuario_de.get(personas.pop())
            if uid is not None:
                con_cuenta += 1
                if uid not in desuscriptos:
                    agradecidos += 1

    n = len(donaciones)
    return {
        "donaciones": n,
        "unico": unico,
        "ambiguas": ambiguas,
        "sin_boton": sin_botón,
        "con_cuenta": con_cuenta,
        "agradecidos": agradecidos,
        "pct_unico": _pct(unico, n),
        "pct_agradecidos": _pct(agradecidos, n),
    }


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


# ── 10 · La opinión de la gente ──────────────────────────────────────────────

def opinion(data: dict) -> dict:
    """Lo que el motor prometía contra lo que dijo la persona.

    La sección anterior —`calibracion`— compara la promesa del motor con el
    REGISTRO. Esta la compara con la PERSONA, que es la única fuente de
    información que el juego no tenía: θ y β salen de los aciertos, y los
    aciertos no saben si alguien se está aburriendo.

    **El número que hay que mirar es la fila de «justo»**: si el motor estuviera
    bien calibrado y la banda estuviera bien puesta, quien dice que está justo
    tendría que venir acertando cerca de `elo.TARGET_MID` (75%). En el clásico
    ese mismo voto se emite acertando el 61% (`queries.P1_BAND`). Si acá cae en
    90, lo que hay que mover no es el θ de nadie: es la banda.

    Todo se lee de la fila del voto y no se recalcula desde `game_exercises`: la
    fila congeló lo que el motor creía en ese momento, y β y θ se mueven todo el
    tiempo (ver el docstring de `models.GameDifficultyVote`).
    """
    votos = data["votes"]
    mostradas = len(votos)
    contestadas = [v for v in votos if v["answered_at"] is not None and v["voto"]]

    filas = []
    for valor in A_ORDER:
        suyos = [v for v in contestadas if v["voto"] == valor]
        if not suyos:
            continue
        con_ventana = [v for v in suyos if (v["ventana"] or 0) > 0]
        # El prometido y el real se pesan por respuestas y no por persona: una
        # ventana de 20 dice más que una de 8, y promediando promedios las dos
        # pesarían igual.
        n_resp = sum(v["ventana"] for v in con_ventana)
        prometido = (sum((v["p_hat_medio"] or 0) * v["ventana"] for v in con_ventana) / n_resp
                     if n_resp else None)
        real = (sum(v["aciertos"] for v in con_ventana) / n_resp) if n_resp else None
        movidos = [v for v in suyos if v["delta_theta"]]
        subieron = sum(
            1 for v in movidos
            if elo.level_of((v["theta_at_vote"] or 0) + v["delta_theta"])
            > elo.level_of(v["theta_at_vote"] or 0)
        )
        filas.append({
            "voto": valor,
            "n": len(suyos),
            "prometido": round(100 * prometido, 1) if prometido is not None else None,
            "real": round(100 * real, 1) if real is not None else None,
            "delta_medio": (round(sum(v["delta_theta"] for v in movidos) / len(movidos), 2)
                            if movidos else None),
            "movidos": len(movidos),
            "cambiaron_nivel": subieron,
        })

    # A qué tasa de acierto la gente se siente cómoda. Es el titular de la
    # sección, y se saca solo de «justo»: los otros dos votos dicen dónde NO
    # quiere estar.
    justo = next((f for f in filas if f["voto"] == "justo"), None)
    movido_total = sum(v["delta_theta"] for v in contestadas)

    return {
        "filas": filas,
        "mostradas": mostradas,
        "contestadas": len(contestadas),
        "pct_respuesta": _pct(len(contestadas), mostradas),
        "comodo_en": justo["real"] if justo else None,
        "objetivo": round(100 * elo.TARGET_MID),
        # La banda del clásico, que sale de cruzar ESTOS MISMOS tres votos
        # contra el comportamiento medido: por encima de su tope el ítem está
        # blando y por debajo del piso está duro (`queries.P1_BAND`). Va como
        # referencia y no como objetivo — allá se mide sobre el ítem y acá sobre
        # la persona, así que no son el mismo número, son la misma pregunta.
        "banda_clasico": list(P1_BAND),
        "theta_movido": round(movido_total, 1),
        "jugadores": len({v["player_id"] for v in contestadas}),
    }

# ── 11 · Fricción ────────────────────────────────────────────────────────────

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
        "profundidad": profundidad(data, weeks, corte=corte),
        "push": push(data, weeks),
        "mails": mails(data, weeks),
        "reclutas": reclutas(data, weeks),
        "camadas": camadas(data, week),
        "reclutas_uni": reclutas_por_universidad(data),
        "experimentos": experimentos(data),
        "experimentos_grupos": experimento_grupos(data),
        "difusion": difusion(data),
        "horarios": horarios(data),
        "carteles": carteles(data),
        "monetizacion": monetizacion(data),
        "calibracion": calibracion(data),
        "opinion": opinion(data),
        "friccion": friccion(data),
    }
