"""Verifica la pantalla de arranque: las tres ramas, la ventana y lo que no se repite.

Toda sesión del juego empieza en esta pantalla, así que un error acá lo ve el
100% de la gente el 100% de las veces. Lo que se cuida:

  - **la rama la decide `correct_today`, no un reloj**. Es lo que garantiza que
    «hoy ya resolviste N» nunca pueda decir cero. Con un umbral de horas, quien
    jugó ayer a las 23 y vuelve a las 8 lleva nueve horas afuera y cero
    derivadas hoy, y el renglón sale roto;

  - **la ventana NO es `last_seen_at`**. Esa se pisa durante la sesión —la tocan
    `/next`, `/answer`, `/skip` y el generador—, así que para cuando la pantalla
    se dibuja ya vale «ahora» y el digest saldría vacío siempre. El síntoma
    sería «la pantalla no cuenta nada», que se ve idéntico a «no pasó nada» y
    por eso nadie lo reporta. El chequeo arma justo ese caso: `last_seen_at` al
    día y `digest_seen_at` viejo;

  - **lo contado no se cuenta dos veces**. El renglón de reclutas sale una vez y
    a la vuelta siguiente ya no, porque `referral_xp_digest_seen` avanzó. Es el
    invariante que separa una novedad de un recordatorio;

  - **y se marca DESPUÉS de construir**. Al revés, el digest se contaría a sí
    mismo y el renglón de reclutas no aparecería nunca;

  - **los conteos dicen su período**, y es el más corto en el que el número
    llega al mínimo: hoy, si no la semana, si no el mes. Es lo que evita el «hoy
    llegó 1 estudiante» — peor que el silencio;

  - **la universidad sale del `?g=`** para quien no la cargó. Es el 77% de los
    que llegan, y es de quién habla el renglón del puesto en el ranking.

Uso:
    python backend/scripts/check_game_bienvenida.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
import datetime as _dt
from datetime import datetime, timedelta
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_bienvenida.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GameAttempt, GameGroup, GamePlayer  # noqa: E402

Base.metadata.create_all(bind=database.engine)

from fastapi.testclient import TestClient  # noqa: E402
from game import bienvenida  # noqa: E402
import main  # noqa: E402

db = database.SessionLocal()
FAILURES: list[str] = []
AHORA = datetime.utcnow()
INICIO_DEL_DIA = AHORA.replace(hour=0, minute=0, second=0, microsecond=0)
API = "/game/derivemos"
client = TestClient(main.app, raise_server_exceptions=True)


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


def jugador(alias, **kw):
    p = GamePlayer(alias=alias, xp=kw.pop("xp", 0), theta=kw.pop("theta", 0.0),
                   n_updates=kw.pop("n_updates", 0),
                   exercises_correct=kw.pop("correctas", 0),
                   exercises_attempted=0, is_bot=kw.pop("is_bot", False), **kw)
    db.add(p)
    db.commit()
    return p


def construir(p, correct_today=0, ahora=None):
    return bienvenida.construir(db, p, correct_today, INICIO_DEL_DIA, ahora or AHORA)


def claves(b):
    return [n.clave for n in b.novedades]


# ── El mundo ─────────────────────────────────────────────────────────────────
# **Gente y no sembrados.** Cada renglón de esta pantalla es una afirmación
# sobre PERSONAS («hoy llegaron 40 estudiantes»), así que el módulo filtra
# `is_bot` en todas sus cuentas. Un fixture de bots mediría lo contrario de lo
# que producción va a medir — y hoy en producción hay 0 sembrados, así que no
# hay divergencia posible con el ranking, que sí los contaría.
for i in range(40):
    jugador(f"pobla_uba_{i}", university="UBA", correctas=5, theta=1.3, n_updates=9)
for i in range(25):
    jugador(f"pobla_utn_{i}", university="UTN", correctas=5, theta=1.1, n_updates=9)
db.commit()


print("1. la rama la decide correct_today, no un reloj")

vuelve = jugador("elqueVuelve", university="UBA", correctas=30,
                 guest_token="tok-vuelve")
b = construir(vuelve, correct_today=0)
check(b.modo == "vuelve", f"sin derivadas hoy, vuelve (dio {b.modo})")
check(b.titulo == "Mientras no estabas", f"con su encabezado (dio {b.titulo})")
check("{a}" in b.saludo, f"y el saludo lleva el @ (dio {b.saludo})")

b = construir(vuelve, correct_today=8)
check(b.modo == "sigue", f"con 8 hoy, sigue (dio {b.modo})")
check(len(b.novedades) == 1, f"una sola línea (dio {len(b.novedades)})")
check(b.titulo is None, "sin encabezado")
check("8 derivadas" in b.novedades[0].texto,
      f"y dice cuántas (dio «{b.novedades[0].texto}»)")

# El caso que la rama por contador existe para hacer imposible. Con borde de
# palabra: «10 derivadas» contiene «0 derivadas» y sin `\b` este chequeo se
# acusaba a sí mismo.
import re  # noqa: E402

for n in range(1, 40):
    t = construir(vuelve, correct_today=n).novedades[0].texto
    if re.search(r"\b0\s+derivada", t):
        check(False, f"con correct_today={n} el texto dijo cero: «{t}»")
        break
else:
    check(True, "y en ningún valor el renglón puede decir «0 derivadas»")

check(construir(vuelve, correct_today=1).novedades[0].texto.count("derivadas") == 0,
      "con una sola dice «1 derivada», no «1 derivadas»")


# El renglón que habla de la persona. Es el único de `vuelve` que no habla del
# mundo, y la rama existió dos días sin él.
b = construir(vuelve, correct_today=0)
check("mio" in claves(b), f"vuelve trae el renglón propio (dio {claves(b)})")
linea = next((n for n in b.novedades if n.clave == "mio"), None)
check(linea is not None and "30 derivadas resueltas" in linea.texto,
      f"con lo que lleva resuelto (dio «{linea and linea.texto}»)")
check(claves(b)[0] == "mio" or claves(b)[0] == "reclutas",
      f"y arriba de todo lo que habla del mundo (dio {claves(b)})")

unaSola = jugador("elDeUna", university="UBA", correctas=1)
linea = next(n for n in construir(unaSola).novedades if n.clave == "mio")
check("1 derivada resuelta." in linea.texto,
      f"con una sola, singular en los dos lados (dio «{linea.texto}»)")

check("mio" not in claves(construir(vuelve, correct_today=8)),
      "y en `sigue` no sale: ahí el renglón propio es el de hoy")


print("2. quien nunca resolvió nada es primera vez")

nuevo = jugador("elNuevo", guest_token="tok-nuevo")
b = construir(nuevo)
check(b.modo == "primera", f"modo primera (dio {b.modo})")
check("{a}" not in b.saludo, f"el saludo va sin @ (dio {b.saludo})")
check(b.titulo == "Lo que está pasando", f"otro encabezado (dio {b.titulo})")
check(len(b.novedades) <= bienvenida.MAX_NOVEDADES,
      f"como mucho {bienvenida.MAX_NOVEDADES} renglones (dio {len(b.novedades)})")
check("reclutas" not in claves(b), "y nunca habla de reclutas: no tiene")
check("mio" not in claves(b), "ni de lo que lleva resuelto: no lleva nada")


print("3. la universidad sale del ?g= cuando no la cargó")

db.add(GameGroup(id="uba262", universidad="UBA", cluster="Exactas",
                 materia="Análisis Matemático II", miembros=180))
db.commit()
delink = jugador("porElLink", first_group_id="uba262", guest_token="tok-link")
check(bienvenida.universidad_del_link(db, delink) == "UBA",
      "el grupo dice de qué universidad es")
b = construir(delink)
# La sigla la lleva SOLO el renglón del puesto. El de llegadas cuenta el juego
# entero: con la sigla no entraba en un renglón y repetía a la universidad.
check(all(not n.universities for n in b.novedades if n.clave.startswith("altas")),
      f"y el renglón de llegadas va sin sigla (dio {claves(b)})")
# Un ranking de una sola universidad no es un ranking: «va 1ª de 1» es una tabla
# de una fila con un podio encima. Con dos universidades en el fixture todavía
# no llega al mínimo, así que el renglón del puesto no puede salir.
check("uni_puesto" not in claves(b),
      f"y no le dice el puesto en una tabla de menos de {bienvenida.MIN_TABLA} (dio {claves(b)})")

sinlink = jugador("sinNada", guest_token="tok-sinlink")
check(bienvenida.universidad_del_link(db, sinlink) is None, "sin ?g= no se inventa")
b = construir(sinlink)
check(all(not n.universities for n in b.novedades),
      f"y no le habla de una universidad que no sabemos (dio {claves(b)})")
check(len(b.novedades) >= 1, "pero igual tiene qué decirle: los fallbacks")

# La cargada gana sobre la del link: si dijo que estudia en otra, es esa.
mudado = jugador("seMudo", university="UTN", first_group_id="uba262",
                 guest_token="tok-mudado")
check(bienvenida.universidad_del_link(db, mudado) == "UTN",
      "la que cargó a mano le gana a la del link")


print("4. la ventana es digest_seen_at y NO last_seen_at")

# El caso exacto del bug: la sesión pisó `last_seen_at` hace un segundo, pero el
# digest no se muestra desde hace tres días. La ventana tiene que ser de tres
# días y no de un segundo.
p = jugador("ventanero", university="UBA", correctas=12, guest_token="tok-vent")
p.last_seen_at = AHORA
p.digest_seen_at = AHORA - timedelta(days=3)
db.commit()
check(bienvenida._ventana(p, AHORA) == AHORA - timedelta(days=3),
      "con las dos puestas manda digest_seen_at")

p.digest_seen_at = None
db.commit()
check(bienvenida._ventana(p, AHORA) == AHORA,
      "sin digest_seen_at cae a last_seen_at, que para el primero es honesto")

p.last_seen_at = AHORA - timedelta(days=90)
db.commit()
check(bienvenida._ventana(p, AHORA) == AHORA - bienvenida.VENTANA_MAXIMA,
      f"y nunca más atrás de {bienvenida.VENTANA_MAXIMA.days} días")


print("5. los conteos dicen su período, y es el más corto que alcanza")

PERIODOS = bienvenida._periodos(INICIO_DEL_DIA, AHORA)
HACE_3_DIAS = AHORA - timedelta(days=3)
HACE_20_DIAS = AHORA - timedelta(days=20)


def del_juego():
    """El renglón de llegadas tal como lo pide la pantalla: sin universidad."""
    return bienvenida._n_altas(db, None, INICIO_DEL_DIA, AHORA, 70)


# ── 5a · el camino que usa la pantalla: todo el juego, sin sigla ─────────────
# Todo lo que existe hasta acá se manda a hace 40 días: fuera de los tres
# períodos. Es lo que deja armar cada escalón sin que el fixture de arriba —que
# nació «hoy»— lo tape.
db.query(GamePlayer).update(
    {GamePlayer.created_at: AHORA - timedelta(days=40)}, synchronize_session=False)
db.commit()
check(del_juego() is None, "sin llegadas en el mes no hay renglón")

for i in range(bienvenida.MIN_CONTEO + 1):
    jugador(f"mes_{i}").created_at = HACE_20_DIAS
db.commit()
n = del_juego()
check(n is not None and n.clave == "altas_mes"
      and n.texto == f"Este mes llegaron {bienvenida.MIN_CONTEO + 1} estudiantes.",
      f"con llegadas solo en el mes dice el mes (dio «{n and n.texto}»)")
check(n is not None and not n.universities and "{u0}" not in n.texto,
      "y sin sigla: cuenta el juego entero")

for i in range(bienvenida.MIN_CONTEO):
    jugador(f"semana_{i}").created_at = HACE_3_DIAS
db.commit()
n = del_juego()
check(n is not None and n.clave == "altas_semana"
      and n.texto == f"Esta semana llegaron {bienvenida.MIN_CONTEO} estudiantes.",
      f"con suficientes en la semana dice la semana (dio «{n and n.texto}»)")

# Cuatro de hoy: no llega al mínimo, sigue hablando de la semana (que ahora
# los incluye).
hoy = [jugador(f"hoy_{i}") for i in range(bienvenida.MIN_CONTEO - 1)]
for j in hoy:
    j.created_at = AHORA
db.commit()
n = del_juego()
check(n is not None and n.clave == "altas_semana",
      f"con {bienvenida.MIN_CONTEO - 1} de hoy todavía es la semana (dio {n and n.clave})")

for i in range(2):
    j = jugador(f"hoy_mas_{i}")
    j.created_at = AHORA
    hoy.append(j)
db.commit()
n = del_juego()
check(n is not None and n.clave == "altas_hoy"
      and n.texto == f"Hoy llegaron {len(hoy)} estudiantes.",
      f"y con suficientes hoy dice hoy (dio «{n and n.texto}»)")

# **Quien lee no se cuenta a sí mismo**, y eso tiene que llegar desde
# `construir`, que es quien sabe quién lee. `hoy[0]` nunca resolvió nada, así
# que cae en `primera`, y es uno de los que llegaron hoy.
b = construir(hoy[0])
linea = next((x for x in b.novedades if x.clave.startswith("altas")), None)
check(linea is not None and linea.texto == f"Hoy llegaron {len(hoy) - 1} estudiantes.",
      f"la pantalla no cuenta a quien la lee (dio «{linea and linea.texto}»)")
check(linea is not None and linea.emoji == "🎓", "con el birrete y no el saludo")

# ── 5b · las derivadas, con la misma escalera ────────────────────────────────


# `game_attempts` tiene un único por (ejercicio, intento): cada intento del
# fixture va contra un ejercicio distinto. El ejercicio no existe —SQLite no
# exige la clave foránea— y no hace falta: lo que se cuenta son los intentos.
_ejercicio = iter(range(1, 10_000))


def resolver(p, cuantas, cuando, bien=True):
    for k in range(cuantas):
        db.add(GameAttempt(
            exercise_id=next(_ejercicio), player_id=p.id, attempt_number=1, answer_latex="x",
            answer_parsed="x", parse_ok=True, is_correct=bien, xp_awarded=0,
            created_at=cuando))
    db.commit()


def derivadas():
    return bienvenida._n_derivadas(db, INICIO_DEL_DIA, AHORA)


check(derivadas() is None, "sin derivadas resueltas no hay renglón")
alguien = db.query(GamePlayer).filter(GamePlayer.alias == "mes_0").one()
resolver(alguien, 7, HACE_20_DIAS)
resolver(alguien, 9, HACE_20_DIAS, bien=False)
n = derivadas()
check(n is not None and n.texto == "Se resolvieron 7 derivadas este mes.",
      f"cuenta solo las correctas, y dice el mes (dio «{n and n.texto}»)")
resolver(alguien, 6, HACE_3_DIAS)
n = derivadas()
check(n is not None and n.texto == "Se resolvieron 6 derivadas esta semana.",
      f"con suficientes en la semana dice la semana (dio «{n and n.texto}»)")
resolver(alguien, 5, AHORA)
n = derivadas()
check(n is not None and n.texto == "Se resolvieron 5 derivadas hoy.",
      f"y con suficientes hoy dice hoy (dio «{n and n.texto}»)")
sembrado = jugador("unBot", is_bot=True)
resolver(sembrado, 50, AHORA)
n = derivadas()
check(n is not None and n.texto == "Se resolvieron 5 derivadas hoy.",
      f"las de un sembrado no cuentan (dio «{n and n.texto}»)")

# Una sola pasada por tabla, que es por lo que las cuentas salen juntas.
cuentas = bienvenida._derivadas(db, PERIODOS)
check(cuentas == {"hoy": 5, "semana": 11, "mes": 18},
      f"los tres períodos salen de una consulta, y cada uno incluye al anterior (dio {cuentas})")

# ── 5c · el camino con universidad: hoy no lo llama nadie, pero existe ───────


def altas(uni):
    return bienvenida._n_altas(db, uni, INICIO_DEL_DIA, AHORA, 70)


for i in range(bienvenida.MIN_CONTEO + 2):
    jugador(f"unq_semana_{i}", university="UNQ").created_at = HACE_3_DIAS
db.commit()
n = altas("UNQ")
check(n is not None and n.clave == "altas_semana" and n.universities == ["UNQ"]
      and "{u0}" in n.texto,
      f"con universidad lleva el hueco de la sigla (dio «{n and n.texto}»)")
n = altas("UNDESIERTA")
check(n is not None and not n.universities and "{u0}" not in n.texto,
      f"y sin llegadas propias habla del juego entero (dio «{n and n.texto}»)")

# ── 5d · el puesto en el ranking, que es lo único que nombra a la universidad ─
# Hace falta una tabla de al menos MIN_TABLA universidades con gente fuera de la
# rampa; arriba hay dos (UBA y UTN), así que se arma la tercera.
for i in range(6):
    jugador(f"pobla_unc_{i}", university="UNC", correctas=5, theta=0.2, n_updates=9)
db.commit()
delgrupo = jugador("porElLinkConTabla", first_group_id="uba262", guest_token="tok-tabla")
b = construir(delgrupo)
linea = next((x for x in b.novedades if x.clave == "uni_puesto"), None)
check(linea is not None and linea.universities == ["UBA"],
      f"quien llega por el link de un grupo ve el puesto de su universidad (dio {claves(b)})")
check(linea is not None and linea.texto == "La {u0} va 1ª en el ranking.",
      f"sin el tamaño de la tabla (dio «{linea and linea.texto}»)")
check(all(not x.universities for x in b.novedades if x.clave.startswith("altas")),
      "y el renglón de llegadas sigue sin sigla: no se repite la universidad")


print("6. lo que se contó no se vuelve a contar")

rec = jugador("elReclutador", university="UBA", correctas=40, guest_token="tok-rec")
for i in range(3):
    h = jugador(f"recluta_{i}", university="UBA", correctas=4)
    h.referred_by = rec.id
    h.referral_xp_given = 500
db.commit()

b = construir(rec)
check("reclutas" in claves(b), f"la primera vez sale el renglón (dio {claves(b)})")
linea = next(n for n in b.novedades if n.clave == "reclutas")
check("1.500" in linea.texto, f"con la XP acumulada (dio «{linea.texto}»)")
check(linea.emoji == "🪖", f"y el emoji del feed para reclutas (dio {linea.emoji})")

bienvenida.marcar_mostrado(db, rec, AHORA)
db.commit()
b = construir(rec)
check("reclutas" not in claves(b),
      f"y a la vuelta siguiente ya no, que es todo el punto (dio {claves(b)})")

# Pero lo NUEVO sí vuelve a salir.
otro = jugador("recluta_nuevo", university="UBA", correctas=4)
otro.referred_by = rec.id
otro.referral_xp_given = 800
db.commit()
b = construir(rec)
linea = next((n for n in b.novedades if n.clave == "reclutas"), None)
check(linea is not None and "800" in linea.texto,
      f"y lo que llegó después sí (dio «{linea and linea.texto}»)")


print("7. el orden, el tope y la forma de la oración")

b = construir(rec)
puntajes = [n.puntaje for n in
            sorted(b.novedades, key=lambda x: -x.puntaje)]
check([n.puntaje for n in b.novedades] == puntajes, "vienen ordenadas por puntaje")
check(len(b.novedades) <= bienvenida.MAX_NOVEDADES,
      f"y nunca más de {bienvenida.MAX_NOVEDADES}")
for n in b.novedades:
    check(n.texto.rstrip().endswith((".", "?", "!")),
          f"«{n.texto}» termina en punto")
    check(n.emoji != "", f"«{n.clave}» trae emoji")
check(len({n.clave for n in b.novedades}) == len(b.novedades),
      "y no se repite un hecho dos veces")


print("7b. lo que solo aparece con datos de verdad")

# **Nadie recibe el renglón de «La última persona se sumó hace N minutos».** Se
# sacó el 02/10. Lo que queda fijado es que su clave no vuelva por descuido: era
# el único renglón que podía hablarle a alguien de sí mismo —para quien acaba de
# llegar, la fila más nueva de `game_players` es la suya—.
recien = jugador("elRecienLlegado", guest_token="tok-recien")
b = construir(recien)
check(all(n.clave != "ultima_alta" for n in b.novedades),
      "la pantalla no cuenta hace cuánto llegó el último")

# **No quedan totales acumulados.** «Ya hay N personas de la UTN jugando» y «Ya
# somos N en M universidades» se sacaron el 02/10: los conteos hablan de un
# período. Y cada renglón de conteo lo nombra.
check(not ({"uni_gente", "universo"} & set(claves(b))),
      f"ni totales sin período (dio {claves(b)})")
conteos = [x for x in b.novedades if x.clave.startswith("altas") or x.clave == "derivadas"]
check(len(conteos) >= 1 and all(
          x.texto.startswith(("Hoy ", "Esta semana ", "Este mes "))
          or x.texto.endswith((" hoy.", " esta semana.", " este mes."))
          for x in conteos),
      f"y todo conteo dice su período (dio {[x.texto for x in conteos]})")


print("7c. el cuarto brazo de dx-rampa-1")

from game import rampa  # noqa: E402

# **A los veteranos no se les desinstala.** La bienvenida salió al 100% el 27/09
# y el experimento la vuelve variable el 28. Quien ya la tiene puesta la
# conserva, venga el brazo que venga: sacársela para medir a OTRA gente sería
# cobrarle el experimento a quien no está en él.
viejo = jugador("veteranoConPantalla", university="UBA", correctas=30)
viejo.created_at = rampa.NACIDO_DESPUES_DE - timedelta(days=5)
db.commit()
check(rampa.muestra_digest(viejo),
      "el veterano la conserva aunque su hash caiga en cualquier brazo")

# Y entre los que entran, solo el cuarto escalón.
#
# Con un doble de una línea y no con filas: `muestra_digest` mira `id` y
# `created_at` y nada más, y forzar el `id` de una fila real para caer en el
# brazo que se quiere probar choca contra el UNIQUE de la tabla. El doble deja
# barrer LOS CUATRO brazos, que es lo que hace falta.
class _Doble:
    def __init__(self, pid, nacio):
        self.id, self.created_at = pid, nacio


DENTRO = rampa.NACIDO_DESPUES_DE + timedelta(hours=3)
porbrazo = {}
for i in range(1, 400):
    porbrazo.setdefault(rampa.brazo_de(i), i)
check(len(porbrazo) == len(rampa.BRAZOS),
      f"el fixture tiene uno de cada brazo ({sorted(porbrazo)})")
for brazo, pid in sorted(porbrazo.items()):
    esperado = brazo == "bienvenida"
    check(rampa.muestra_digest(_Doble(pid, DENTRO)) == esperado,
          f"brazo «{brazo}»: {'la ve' if esperado else 'NO la ve'}")

# Justo en el borde: un segundo antes del corte todavía es veterano.
check(rampa.muestra_digest(
        _Doble(porbrazo["control"], rampa.NACIDO_DESPUES_DE - timedelta(seconds=1))),
      "un segundo antes del corte todavía la conserva")

# Con el experimento apagado vuelve a ser de todos: RAMPA_ENABLED=0 tiene que
# devolver el producto a como estaba, y como estaba era de todos.
import os as _os  # noqa: E402

_os.environ["RAMPA_ENABLED"] = "0"
check(rampa.muestra_digest(_Doble(porbrazo["control"], DENTRO)),
      "con el experimento apagado la ve todo el mundo")
_os.environ.pop("RAMPA_ENABLED", None)


print("8. el endpoint, y que marque")

# **El jugador de prueba se hace VETERANO a mano, y sin esto el check es una
# bomba de tiempo de calendario.** `jugador()` lo crea con `created_at = ahora`,
# asi que mientras "ahora" fue anterior al `desde` de `dx-rampa-1` (28/09) caia
# en el caso 2 de `rampa.muestra_digest` —nacio antes del arranque, la ve— y el
# endpoint devolvia un modo real. Desde el 28/09 entra al experimento, le toca
# el brazo que le toque, y si no es el cuarto el endpoint contesta
# `modo="control"` con las novedades vacias: correcto para produccion, y una
# falla en un check que no habla del sorteo.
#
# Se fija la fecha en vez de apagar el experimento porque esta seccion prueba el
# camino en que el digest SI se arma; el sorteo ya tiene su propia seccion 7.
rec.created_at = _dt.datetime(2026, 9, 1)
db.commit()

H = {"X-Game-Token": "tok-rec"}
r = client.get(f"{API}/bienvenida", headers=H)
check(r.status_code == 200, f"contesta 200 (dio {r.status_code})")
j = r.json()
check(j["modo"] in ("sigue", "vuelve", "primera"), f"modo válido (dio {j['modo']})")
check(isinstance(j["novedades"], list), "trae la lista de novedades")

db.expire_all()
rec2 = db.query(GamePlayer).filter(GamePlayer.alias == "elReclutador").one()
check(rec2.digest_seen_at is not None, "y dejó marcado que se mostró")
antes = rec2.referral_xp_digest_seen
check(antes == 2300, f"con el canal de reclutas al día (dio {antes})")

r2 = client.get(f"{API}/bienvenida", headers=H)
check("reclutas" not in [n["clave"] for n in r2.json()["novedades"]],
      "así que el segundo pedido ya no repite los reclutas")

# Un jugador sin token no debería reventar el endpoint.
r3 = client.get(f"{API}/bienvenida")
check(r3.status_code in (200, 401, 403), f"sin token no revienta (dio {r3.status_code})")


print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
