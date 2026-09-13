"""Verifica cómo se escriben las líneas del feed del minijuego.

El gemelo de `check_game_events.py`, que verifica QUÉ sale. Acá se verifica cómo
está escrito, y son dos cosas distintas: aquel no se enteraría nunca de que el
feed salió dieciocho veces con la misma frase, ni de que una oración dice «de el
ITBA».

**El testigo.** «La UBA le pasó a la UNSAM» estuvo en producción. En castellano
rioplatense «a la UNSAM le pasó» se lee como que a la UNSAM le OCURRIÓ algo:
pasar a alguien es transitivo y va sin dativo. El §1 falla si vuelve.

**El otro testigo.** Las contracciones. Media docena de variantes recién
escritas decían «pasó a el ITBA» y «a 1.200 XP de el ITBA», y no se veían
probando con la UBA —que lleva «la»— sino solo el día que un instituto entrara
en la tabla. El §3 arma TODAS las frases con TODAS las combinaciones de artículo
justamente para no depender de qué universidades haya hoy.

**La forma** (§4) es la regla más dura y la que más frases costó: toda línea es
sujeto — verbo — objeto, una sola oración, sin remate. Las que se cayeron por
esto fueron las que opinaban sobre el hecho que acababan de contar («Alguien
avise si respira», «Ahora se complica») y las dadas vuelta («Puntero nuevo:
{a}», «Se picó: 1.200 XP entre A y B»). Es lo que hace que la columna se pueda
barrer con el ojo; la variedad vive en el verbo, que es donde no cuesta.

Y el riesgo propio de `Template.safe_substitute`, que es el que se eligió para
que los marcadores del cliente (`{a}`, `{u0}`) sobrevivan: un `$campo` mal
escrito no explota, se imprime crudo. El §3 también lo atrapa.

Uso:
    python backend/scripts/check_game_events_copy.py

Sale con código 1 si algo falla.
"""

import ast
import sys
from pathlib import Path
from string import Template

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from game import elo, events, events_copy, notification_copy, templates  # noqa: E402

FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


# Todos los pools, con el nombre con el que se los nombra en el archivo. La
# lista es explícita a propósito: un pool nuevo que nadie agregue acá se queda
# sin ninguna de las verificaciones de abajo, y eso tiene que costar un renglón.
#
# Los prefijos importan: `persona` y `universidad` deciden de quién tiene que ser
# el sujeto de la oración, y `carga` exenta del chequeo de dos puntos a las dos
# categorías donde lo que va después es el dato y no un comentario (cuánto
# multiplica el cafecito, por cuánto tiempo).
POOLS: dict[str, list[str]] = {
    "persona: lead": events_copy._LEAD,
    "persona: lead con desplazado": events_copy._LEAD_CON_DESPLAZADO,
    "persona: top": events_copy._TOP,
    "persona: top desde": events_copy._TOP_DESDE,
    "persona: número 1 de la universidad": events_copy._UNI_1,
    "persona: podio de la universidad": events_copy._UNI_3,
    "persona: racha": events_copy._RACHA,
    "persona: nivel": events_copy._NIVEL,
    "persona: signup": events_copy._SIGNUP,
    "persona: signup con universidad": events_copy._SIGNUP_CON_UNI,
    "persona: recluta": events_copy._RECLUTA,
    "persona: recluta con universidad": events_copy._RECLUTA_CON_UNI,
    "persona carga: cafecito": events_copy._BOOST,
    "persona carga: cafecito sin reloj": events_copy._BOOST_SIN_RELOJ,
    "persona carga: cafecito global": events_copy._BOOST_GLOBAL,
    "universidad carga: aforo": events_copy._AFORO,
    "universidad: sobrepaso": events_copy._UNI_PASS,
    "universidad: sobrepaso paliza": events_copy._UNI_PASS_PALIZA,
    "universidad: disputa": events_copy._UNI_CLOSE,
    "universidad: disputa sin número": events_copy._UNI_CLOSE_SIN_NUMERO,
}

TODAS = [(nombre, frase) for nombre, pool in POOLS.items() for frase in pool]


print("1. EL TESTIGO: «le pasó a»")
# La frase que estuvo en producción: "La {u0} le pasó a la {u1} en experiencia."
# Se busca en TODOS los pools y no solo en el del sobrepaso, porque el error es
# de castellano y no de esa categoría — el aviso push tenía el mismo.
culpables = [f"{n}: {f}" for n, f in TODAS if "le pasó" in f or "le paso" in f]
check(not culpables, f"ninguna variante usa el dativo para un sobrepaso: {culpables}")

# Y los pools del sobrepaso sí cuentan un sobrepaso, con un verbo que dice algo.
# «Pasó a» a secas no alcanza: era el verbo más pálido que había para el hecho
# más grande de la tabla. Sin esto, borrar las variantes también haría pasar el
# chequeo de arriba.
VERBOS = ("superó", "serruchó", "arriba", "atrás", "barrió", "desplazó", "sacó")
sobrepaso = events_copy._UNI_PASS + events_copy._UNI_PASS_PALIZA
mudas = [f for f in sobrepaso if not any(v in f for v in VERBOS)]
check(not mudas, f"las {len(sobrepaso)} del sobrepaso usan un verbo de verdad: {mudas}")

# «Barrió» es una AFIRMACIÓN, y un sobrepaso recién confirmado pasa el margen
# por poco. Decirla sobre un 2% es la clase de frase que hace que el feed deje
# de creerse.
apretado = events_copy.uni_pass(
    "x",
    gana=events_copy.articulos_de("UBA"),
    pierde=events_copy.articulos_de("UNSAM"),
    margen=0.021,
    diferencia=1700,
)
check(
    "barrió" not in apretado and "por arriba" not in apretado,
    f"un sobrepaso ajustado no se cuenta como paliza: {apretado}",
)
paliza = {
    events_copy.uni_pass(
        f"x{i}",
        gana=events_copy.articulos_de("UNC"),
        pierde=events_copy.articulos_de("UNSAM"),
        margen=0.22,
        diferencia=30020,
    )
    for i in range(200)
}
check(
    len(paliza) == len(events_copy._UNI_PASS_PALIZA)
    and all("30.020 XP" in f for f in paliza),
    f"y uno de 22% sí, con el número: {sorted(paliza)[0]}",
)

# El aviso push comparte el error de origen y por eso comparte el testigo.
push = notification_copy._uni_paso({"universidad": "UBA", "rival_universidad": "UNSAM"})[1]
check("le pasó" not in push and "superó" in push, f"el aviso push tampoco: {push}")

# Dos decisiones de vocabulario, que sin chequeo vuelven solas la próxima vez que
# alguien agregue una variante.
hilo = [f"{n}: {f}" for n, f in TODAS if "al hilo" in f]
check(not hilo, f"ninguna racha se cuenta «al hilo»: {hilo}")
check(
    any("pifiar" in f for f in events_copy._RACHA)
    and any("errar" in f for f in events_copy._RACHA),
    f"y las rachas alternan pifiar y errar "
    f"({sum('pifiar' in f for f in events_copy._RACHA)} y "
    f"{sum('errar' in f for f in events_copy._RACHA)} de {len(events_copy._RACHA)})",
)


print("\n2. hay variedad de verdad")
for nombre, pool in POOLS.items():
    if len(pool) < 2:
        check(False, f"«{nombre}» tiene una sola frase: no es un pool")
    elif len(set(pool)) != len(pool):
        check(False, f"«{nombre}» repite una frase adentro del mismo pool")
check(
    all(len(p) >= 2 and len(set(p)) == len(p) for p in POOLS.values()),
    f"los {len(POOLS)} pools tienen al menos dos frases y ninguna repetida "
    f"({len(TODAS)} frases en total)",
)

# Y todas se USAN. Un pool del que el sorteo nunca saca la cuarta es un pool de
# tres con una frase muerta adentro.
DATOS_DE_PRUEBA = {
    "persona: lead": lambda s: events_copy.lead(s, desplazado=False),
    "persona: lead con desplazado": lambda s: events_copy.lead(s, desplazado=True),
    "persona: top desde": lambda s: events_copy.top(s, corte=50, desde=84),
    "persona: top": lambda s: events_copy.top(s, corte=50, desde=None),
    "persona: racha": lambda s: events_copy.streak(s, seguidas=25),
    "persona: nivel": lambda s: events_copy.level(s, nivel=1),
}
for nombre, fabricar in DATOS_DE_PRUEBA.items():
    vistas = {fabricar(f"semilla:{i}") for i in range(400)}
    check(
        len(vistas) == len(POOLS[nombre]),
        f"«{nombre}»: el sorteo llega a las {len(POOLS[nombre])} frases "
        f"(salieron {len(vistas)})",
    )

# Dos hechos distintos casi nunca caen en la misma frase, que es la propiedad
# por la que la semilla es el hecho y no un `random`.
seguidas = [events_copy.streak(f"streak:{i}:10", seguidas=10) for i in range(40)]
repetidas = sum(1 for a, b in zip(seguidas, seguidas[1:]) if a == b)
check(
    repetidas <= len(seguidas) // 3,
    f"cuarenta rachas seguidas de gente distinta repiten frase {repetidas} veces, "
    f"no cuarenta",
)


print("\n3. las frases se arman enteras, con cualquier artículo")
# Se renderiza CADA frase de CADA pool con TODAS las combinaciones de artículo,
# y se exige que no quede ni un `$campo` sin sustituir ni una contracción a
# mano. Es lo que atrapa «pasó a el ITBA» sin depender de que hoy haya un
# instituto en la tabla.
LA = events_copy.articulos_de("UBA")
EL = events_copy.articulos_de("ITBA")
check(LA is not None and LA.a == "a la" and LA.de == "de la", "«a la UBA», «de la UBA»")
check(EL is not None and EL.a == "al" and EL.de == "del", "«al ITBA», «del ITBA»")
check(events_copy.articulos_de(None) is None, "y sin universidad no hay artículo")
check(events_copy.articulos_de("  ") is None, "ni con la sigla en blanco")

CAMPOS_SUELTOS = {
    "n": "30.020",
    "desde": 84,
    "fam": "los productos",
    "regla": "la regla del producto",
    "c": "10 cafecitos",
    "m": "×3,0",
    "reloj": "6 horas",
    "personas": 12,
}
SUFIJOS = ("u", "g", "p", "a", "r")
# El alias más largo que hay hoy en producción, para medir el peor caso.
ALIAS = "@gabycostillaunc"


def armar(frase: str, arts) -> str:
    campos = dict(CAMPOS_SUELTOS)
    for suf in SUFIJOS:
        campos.update(events_copy._campos(suf, arts))
    return (
        Template(frase)
        .safe_substitute(**campos)
        .replace("{a}", ALIAS)
        .replace("{b}", "@matedecero")
        .replace("{u0}", "UNSAM")
        .replace("{u1}", "UNLaM")
    )


RENDERIZADAS = [
    (nombre, frase, armar(frase, arts))
    for nombre, frase in TODAS
    for arts in (LA, EL)
]

crudas = [f"{n}: {t}" for n, _f, t in RENDERIZADAS if "$" in t]
check(not crudas, f"ningún `$campo` queda sin sustituir: {crudas[:3]}")

contracciones = [
    f"{n}: {t}"
    for n, _f, t in RENDERIZADAS
    if " de el " in t or t.startswith("De el ") or " a el " in t
]
check(not contracciones, f"ni «de el» ni «a el» en ninguna frase: {contracciones[:3]}")


print("\n4. LA FORMA: sujeto, verbo, objeto — y se termina ahí")
# Una sola oración. Lo que no entra antes del punto final no entra: el remate que
# opina sobre el hecho obliga a leer la línea entera para descubrir que no dice
# nada nuevo, y son treinta y siete por día.
dos_frases = [f"{n}: {t}" for n, _f, t in RENDERIZADAS if ". " in t]
check(not dos_frases, f"ninguna tiene un punto en el medio: {dos_frases[:3]}")

sin_punto = [f"{n}: {t}" for n, _f, t in RENDERIZADAS if not t.endswith(".")]
check(not sin_punto, f"y todas cierran con uno: {sin_punto[:3]}")

# El sujeto va PRIMERO, que es la mitad de la regla. Las de persona abren con el
# marcador del protagonista; las de universidad, con el artículo en mayúscula.
# Esto es lo que descarta «Puntero nuevo: {a}» y «Se picó: 1.200 XP entre A y B»,
# que dicen lo mismo y no se leen más rápido.
mal_sujeto = [
    f"{n}: {f}"
    for n, f in TODAS
    if not (f.startswith("{a}") if n.startswith("persona") else f.startswith("$Art_"))
]
check(not mal_sujeto, f"todas abren con su sujeto: {mal_sujeto[:3]}")

# Dos puntos solo donde son la CARGA de la noticia y no un comentario sobre
# ella: cuánto multiplica el cafecito y por cuánto tiempo.
puntuadas = [f"{n}: {f}" for n, f in TODAS if ":" in f and "carga" not in n]
check(not puntuadas, f"y los dos puntos solo llevan datos: {puntuadas[:3]}")

# Cortas. El tope está medido contra el alias más largo de producción; las que
# llevan carga son las únicas que se le acercan, porque arrastran el
# multiplicador y el reloj.
LARGO_MAXIMO = 80
largas = [(len(t), f"{n}: {t}") for n, _f, t in RENDERIZADAS if len(t) > LARGO_MAXIMO]
check(
    not largas,
    f"ninguna pasa los {LARGO_MAXIMO} caracteres con «{ALIAS}» adentro "
    f"(la más larga: {max(len(t) for _n, _f, t in RENDERIZADAS)}): "
    f"{sorted(largas, reverse=True)[:2]}",
)

# Las que nombran a una persona tienen que tener dónde ponerla. `{b}` no: una
# variante puede elegir no nombrar al segundo aunque quien llama lo tenga.
sin_actor = [f"{n}: {f}" for n, f in TODAS if n.startswith("persona") and "{a}" not in f]
check(not sin_actor, f"las frases de persona nombran a alguien: {sin_actor}")

sin_par = [
    f"{n}: {f}"
    for n, f in TODAS
    if n.startswith("universidad:") and not ("{u0}" in f and "{u1}" in f)
]
check(not sin_par, f"las de dos universidades nombran a las dos: {sin_par}")


print("\n5. el nivel dice CUÁL derivada se desbloqueó, y es cierto")
# Era la línea más frecuente del feed —110 de 122 en una semana— y decía
# «desbloqueó derivadas más difíciles», idéntica para los tres niveles.
tiers_del_juego = {t.tier for t in templates.TEMPLATES}
faltan = sorted(tiers_del_juego - set(events_copy.FAMILIA_POR_TIER))
check(not faltan, f"todos los tiers que el juego sirve tienen nombre: faltan {faltan}")

familias = [events_copy.familia_de_nivel(n) for n in range(1, elo.NIVEL_MAX + 1)]
check(
    len({f[0] for f in familias}) == len(familias),
    f"cada nivel desbloquea algo distinto: {[f[0] for f in familias]}",
)
# No se fija el nombre exacto —es copy y puede cambiar— sino que el nivel más
# alto sea el tier más difícil que el juego tiene. Eso sí es un hecho.
check(
    elo.tier_objetivo(elo.theta_de_nivel(elo.NIVEL_MAX)) == max(tiers_del_juego),
    f"el último nivel es la dificultad más alta que existe "
    f"(tier {elo.tier_objetivo(elo.theta_de_nivel(elo.NIVEL_MAX))} de "
    f"{max(tiers_del_juego)})",
)
tiers_por_nivel = [
    elo.tier_objetivo(elo.theta_de_nivel(n)) for n in range(elo.NIVEL_MAX + 1)
]
check(
    tiers_por_nivel == sorted(tiers_por_nivel),
    f"y subir de nivel nunca desbloquea algo más fácil: {tiers_por_nivel}",
)
check(
    "derivadas más difíciles" not in events_copy.familia_de_nivel(1)[0],
    f"el nivel 1 —el 90% de los que salen— ya no es genérico: "
    f"«{events_copy.familia_de_nivel(1)[0]}»",
)
# El verbo siempre el mismo: es la línea que más se repite y la que más conviene
# que se lea de reojo, y con el verbo fijo la cabeza va derecho a qué se
# desbloqueó. La variedad ahí está en cómo se nombra lo desbloqueado.
check(
    all("desbloqueó" in f for f in events_copy._NIVEL),
    "todas las de nivel usan el mismo verbo",
)
niveles = {events_copy.level(f"s{i}", nivel=1) for i in range(200)}
base = min(niveles, key=len).replace("{a} ", "")
check(len(base.split()) <= 3, f"y la más corta son tres palabras: «{base}»")


print("\n6. el sorteo es estable entre procesos")
# `hash()` de un str está aleatorizado por PYTHONHASHSEED: con él, dos workers
# escribirían el mismo hecho de dos maneras distintas y el determinismo sería
# mentira. Se fija el valor concreto, que es lo único que prueba que la semilla
# no viene de ahí.
check(
    events_copy._elegir("la misma semilla", ["a", "b", "c", "d", "e", "f", "g"]) == "c",
    "la misma semilla cae siempre en la misma frase, corra donde corra",
)
check(
    events_copy.streak("streak:7:25", seguidas=25)
    == events_copy.streak("streak:7:25", seguidas=25),
    "y llamar dos veces al mismo hecho da el mismo texto",
)


print("\n7. los números se escriben en castellano")
check(events_copy.miles(1247) == "1.247", "los miles con punto")
check(events_copy.miles(82296) == "82.296", "y con dos separadores también")
check(events_copy.mult(1.4) == "×1,4", "el multiplicador con coma")
check(events_copy.cuantos_cafecitos(1) == "un cafecito", "un cafecito, no «1 cafecito»")
check(events_copy.cuantos_cafecitos(3) == "3 cafecitos", "y tres son tres")


print("\n8. cada emisor de events.py tiene su pool")
# Que un `kind` nuevo se agregue allá y su frase quede escrita a mano acá al lado
# es exactamente lo que este archivo existe para impedir.
kinds_con_copy = {
    "lead", "top", "uni_top", "streak", "level",
    "signup", "referral", "boost", "uni_pass", "uni_close",
}
check(
    set(events.EMOJI) == kinds_con_copy,
    f"los kinds del feed y los que tienen pool son los mismos: "
    f"sobran {set(events.EMOJI) - kinds_con_copy}, faltan "
    f"{kinds_con_copy - set(events.EMOJI)}",
)

# Los diez íconos se distinguen entre sí: son una columna sola, y dos líneas con
# el mismo emoji se leen como el mismo tipo de noticia.
check(
    len(set(events.EMOJI.values())) == len(events.EMOJI),
    f"los {len(events.EMOJI)} tipos tienen íconos distintos: "
    f"{' '.join(events.EMOJI.values())}",
)

# Y ninguna frase quedó escrita adentro de events.py.
#
# Se mira el ÁRBOL y no el texto: los comentarios de events.py citan las frases
# viejas para explicar por qué existe cada freno, así que buscar `"{a}` en las
# líneas daba positivos en la prosa. Un literal que ARRANCA con un marcador, en
# cambio, solo puede ser una oración del feed.
arbol = ast.parse((BACKEND / "game/events.py").read_text(encoding="utf-8"))
sueltas = [
    nodo.value
    for nodo in ast.walk(arbol)
    if isinstance(nodo, ast.Constant)
    and isinstance(nodo.value, str)
    and nodo.value.startswith(("{a}", "{b}", "{u0}", "{u1}"))
]
check(not sueltas, f"events.py no escribe frases, las pide: {sueltas[:3]}")


print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
