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

Y el riesgo propio de `Template.safe_substitute`, que es el que se eligió para
que los marcadores del cliente (`{a}`, `{u0}`) sobrevivan: un `$campo` mal
escrito no explota, se imprime crudo. El §3 también lo atrapa.

Uso:
    python backend/scripts/check_game_events_copy.py

Sale con código 1 si algo falla.
"""

import sys
from pathlib import Path
from string import Template

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from game import elo, events, events_copy, templates  # noqa: E402

FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


# Todos los pools, con el nombre con el que se los nombra en el archivo. La
# lista es explícita a propósito: un pool nuevo que nadie agregue acá se queda
# sin ninguna de las verificaciones de abajo, y eso tiene que costar un renglón.
POOLS: dict[str, list[str]] = {
    "lead": events_copy._LEAD,
    "lead con desplazado": events_copy._LEAD_CON_DESPLAZADO,
    "top": events_copy._TOP,
    "top desde": events_copy._TOP_DESDE,
    "top 3": events_copy._TOP_3,
    "top 3 desde": events_copy._TOP_3_DESDE,
    "número 1 de la universidad": events_copy._UNI_1,
    "podio de la universidad": events_copy._UNI_3,
    "nivel": events_copy._NIVEL,
    "nivel tope": events_copy._NIVEL_TOPE,
    "racha genérica": events_copy._RACHA_GENERICA,
    "signup": events_copy._SIGNUP,
    "signup con universidad": events_copy._SIGNUP_CON_UNI,
    "recluta": events_copy._RECLUTA,
    "recluta con universidad": events_copy._RECLUTA_CON_UNI,
    "cafecito": events_copy._BOOST,
    "cafecito sin reloj": events_copy._BOOST_SIN_RELOJ,
    "cafecito global": events_copy._BOOST_GLOBAL,
    "aforo": events_copy._AFORO,
    "sobrepaso": events_copy._UNI_PASS,
    "disputa": events_copy._UNI_CLOSE,
    "disputa sin número": events_copy._UNI_CLOSE_SIN_NUMERO,
}
POOLS.update({f"racha de {n}": v for n, v in events_copy._RACHA.items()})

TODAS = [(nombre, frase) for nombre, pool in POOLS.items() for frase in pool]


print("1. EL TESTIGO: «le pasó a»")
# La frase que estuvo en producción: "La {u0} le pasó a la {u1} en experiencia."
# Se busca en TODOS los pools y no solo en el del sobrepaso, porque el error es
# de castellano y no de esa categoría — el aviso push tenía el mismo.
culpables = [f"{n}: {f}" for n, f in TODAS if "le pasó" in f or "le paso" in f]
check(not culpables, f"ninguna variante usa el dativo para un sobrepaso: {culpables}")

# Y el pool del sobrepaso sí dice lo que tiene que decir, con el verbo
# transitivo. Sin esto, borrar las cinco variantes también haría pasar el de
# arriba.
paso = [f for f in events_copy._UNI_PASS if "pasó" in f or "arriba" in f or "atrás" in f]
check(
    len(paso) == len(events_copy._UNI_PASS),
    f"y las {len(events_copy._UNI_PASS)} del sobrepaso cuentan un sobrepaso "
    f"({len(paso)} lo dicen)",
)

# El aviso push comparte el error de origen y por eso comparte el testigo.
from game import notification_copy  # noqa: E402

push = notification_copy._uni_paso(
    {"universidad": "UBA", "rival_universidad": "UNSAM"}
)[1]
check("le pasó" not in push, f"el aviso push tampoco: {push}")


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
    "lead": lambda s: events_copy.lead(s, desplazado=False),
    "lead con desplazado": lambda s: events_copy.lead(s, desplazado=True),
    "top desde": lambda s: events_copy.top(s, corte=50, desde=84),
    "top 3 desde": lambda s: events_copy.top(s, corte=3, desde=11),
    "racha de 10": lambda s: events_copy.streak(s, seguidas=10),
    "nivel": lambda s: events_copy.level(s, nivel=1),
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
    "n": "1.247",
    "desde": 84,
    "fam": "la regla del producto",
    "c": "un cafecito",
    "m": "×1,4",
    "reloj": "2 horas",
    "personas": 12,
}
SUFIJOS = ("u", "g", "p", "a", "r")

crudas: list[str] = []
contracciones: list[str] = []
sin_punto: list[str] = []
minuscula: list[str] = []
for nombre, frase in TODAS:
    for arts in (LA, EL):
        campos = dict(CAMPOS_SUELTOS)
        for suf in SUFIJOS:
            campos.update(events_copy._campos(suf, arts))
        texto = Template(frase).safe_substitute(**campos)
        if "$" in texto:
            crudas.append(f"{nombre}: {texto}")
        # Las dos contracciones que el castellano no perdona.
        if " de el " in texto or texto.startswith("De el ") or " a el " in texto:
            contracciones.append(f"{nombre}: {texto}")
        # El emoji del aforo va después del punto, así que se lo saca antes.
        if not texto.rstrip(" 🎉").endswith("."):
            sin_punto.append(f"{nombre}: {texto}")
        # Abre bien si arranca con mayúscula, con un número («10 seguidas
        # de…») o con un marcador que el cliente va a reemplazar por un @.
        if not (texto[:1].isupper() or texto[:1].isdigit() or texto.startswith("{")):
            minuscula.append(f"{nombre}: {texto}")

check(not crudas, f"ningún `$campo` queda sin sustituir: {crudas[:3]}")
check(not contracciones, f"ni «de el» ni «a el» en ninguna frase: {contracciones[:3]}")
check(not sin_punto, f"todas cierran con punto: {sin_punto[:3]}")
check(
    not minuscula,
    f"y todas abren en mayúscula, en número o en un marcador: "
    f"{minuscula[:3]}",
)

# Las que nombran a una persona tienen que tener dónde ponerla. `{b}` no: una
# variante puede elegir no nombrar al segundo aunque quien llama lo tenga.
DE_PERSONA = ("lead", "top", "racha", "nivel", "signup", "recluta")
sin_actor = [
    f"{n}: {f}"
    for n, f in TODAS
    if any(n.startswith(p) for p in DE_PERSONA) and "{a}" not in f and "{b}" not in f
]
check(not sin_actor, f"las frases de persona nombran a alguien: {sin_actor}")

DE_DOS_UNIS = ("sobrepaso", "disputa")
sin_par = [
    f"{n}: {f}"
    for n, f in TODAS
    if any(n.startswith(p) for p in DE_DOS_UNIS) and not ("{u0}" in f and "{u1}" in f)
]
check(not sin_par, f"las de dos universidades nombran a las dos: {sin_par}")


print("\n4. el nivel dice CUÁL derivada se desbloqueó, y es cierto")
# Era la línea más frecuente del feed —110 de 122 en una semana— y decía
# «desbloqueó derivadas más difíciles», idéntica para los tres niveles.
tiers_del_juego = {t.tier for t in templates.TEMPLATES}
faltan = sorted(tiers_del_juego - set(events_copy.FAMILIA_POR_TIER))
check(not faltan, f"todos los tiers que el juego sirve tienen nombre: faltan {faltan}")

familias = [events_copy.familia_de_nivel(n) for n in range(1, elo.NIVEL_MAX + 1)]
check(
    len(set(familias)) == len(familias),
    f"cada nivel desbloquea algo distinto: {familias}",
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
    "derivadas más difíciles" not in events_copy.familia_de_nivel(1),
    f"el nivel 1 —el 90% de los que salen— ya no es genérico: "
    f"«{events_copy.familia_de_nivel(1)}»",
)


print("\n5. el sorteo es estable entre procesos")
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


print("\n6. los números se escriben en castellano")
check(events_copy.miles(1247) == "1.247", "los miles con punto")
check(events_copy.miles(82296) == "82.296", "y con dos separadores también")
check(events_copy.mult(1.4) == "×1,4", "el multiplicador con coma")
check(events_copy.cuantos_cafecitos(1) == "un cafecito", "un cafecito, no «1 cafecito»")
check(events_copy.cuantos_cafecitos(3) == "3 cafecitos", "y tres son tres")


print("\n7. cada emisor de events.py tiene su pool")
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
# Y ninguna frase quedó escrita adentro de events.py.
#
# Se mira el ÁRBOL y no el texto: los comentarios de events.py citan las frases
# viejas para explicar por qué existe cada freno, así que buscar `"{a}` en las
# líneas daba positivos en la prosa. Un literal que ARRANCA con un marcador, en
# cambio, solo puede ser una oración del feed.
import ast  # noqa: E402

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
