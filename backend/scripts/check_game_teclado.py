"""Verifica que toda derivada del catálogo llegue con teclas para escribirla.

El teclado del juego no está completo nunca: el vocabulario dinámico se
desbloquea cuando una derivada lo pide (`keyboard.required_keys`) y, para quien
cayó en un brazo de `dx-rampa-1`, el bloque fijo también
(`keyboard.fijas_requeridas` más el calendario de `ESCALONES`). La promesa está
escrita en el docstring de `fijas_requeridas` — «la tecla que la respuesta
necesita aparece en el ejercicio que la necesita»— y es la que hace que la rampa
no pueda trabar a nadie.

**Lo que este chequeo hace es no creerle a esa promesa.** Recorre las 44
plantillas con el espacio de parámetros agotado, deriva como lo hace el
generador (`sympy.diff`, sin simplificar) y compara, para cada derivada, lo que
`unlock` devuelve contra lo que hace falta para TIPEAR la respuesta.

La única fija que `fijas_requeridas` no pide es el paréntesis, y hoy no traba a
nadie por una razón que no vive en `keyboard.py`: `elo.max_tier_de` le prohíbe
los tiers altos a los primeros ejercicios, que son exactamente aquellos en los
que el paréntesis todavía no salió. Son dos topes que no se nombran entre sí, y
el punto 3 es el que no los deja separarse en silencio.

Uso:
    python backend/scripts/check_game_teclado.py
"""

import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

import sympy  # noqa: E402
from sympy import cos, exp, log, sin, tan  # noqa: E402

from game import elo, keyboard as kb  # noqa: E402
from game.templates import TEMPLATES, latex_es  # noqa: E402

x = sympy.Symbol("x")

FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


# ── Lo que hace falta para TIPEAR la forma canónica ──────────────────────────
#
# Es el modelo del teclado real (web/src/app/derivadas/math-keyboard.tsx), y el
# único punto donde pide criterio es el paréntesis. MathLive escribe en CAJAS: el
# numerador y el denominador de `\frac`, el interior de `\sqrt` y el argumento de
# una función ya están delimitados, así que una suma adentro de una caja NO
# necesita paréntesis. La base de una potencia no es una caja —la tecla inserta
# `#@^{#?}`, que se come solo el token anterior— así que `(8x+7)³` sí los pide, y
# un Add como factor de un producto también.
#
# La multiplicación no aparece nunca: se escribe por yuxtaposición.
def teclas_para_escribir(expr) -> tuple[set[str], set[str]]:
    din: set[str] = set()
    fij: set[str] = set()

    def numero(n) -> None:
        for ch in str(abs(n)):
            if ch.isdigit():
                fij.add(f"f:{ch}")
        if n.is_negative:
            fij.add(kb.FIJA_MENOS)
        if n.is_Rational and not n.is_Integer:
            din.add(kb.KEY_FRAC)

    def ir(e, delimitado: bool = True) -> None:
        if e.is_Symbol:
            fij.add(kb.FIJA_X)
        elif e is sympy.E:
            din.add(kb.KEY_E)
        elif e.is_Number:
            numero(e)
        elif isinstance(e, sympy.Add):
            fij.add(kb.FIJA_MAS)
            if not delimitado:
                fij.add(kb.FIJA_PAR)
            for t in e.args:
                ir(t)
        elif isinstance(e, sympy.Mul):
            for f in e.args:
                ir(f, delimitado=False)
        elif isinstance(e, sympy.Pow):
            base, expo = e.as_base_exp()
            negativo = bool(expo.is_number and expo.is_negative)
            magnitud = -expo if negativo else expo
            if negativo:
                din.add(kb.KEY_FRAC)
            if base is sympy.E:
                din.add(kb.KEY_EXPX)
            elif magnitud == 1:
                pass
            elif magnitud == 2:
                din.add(kb.KEY_SQ)
            elif magnitud == sympy.Rational(1, 2):
                din.add(kb.KEY_SQRT)
            else:
                din.add(kb.KEY_POW)
            if base is not sympy.E:
                # `magnitud == 1` con exponente negativo es el denominador pelado
                # de una fracción, o sea una caja; la raíz también. Lo demás es
                # base de potencia, que no delimita nada.
                caja = magnitud == 1 or magnitud == sympy.Rational(1, 2)
                ir(base, delimitado=caja)
            if not magnitud.is_Integer or magnitud not in (1, 2):
                ir(magnitud)
        elif isinstance(e, exp):
            din.add(kb.KEY_EXPX)
            ir(e.args[0])
        elif isinstance(e, log):
            din.add(kb.KEY_LN)
            for a in e.args:
                ir(a)
        elif isinstance(e, sin):
            din.add(kb.KEY_SEN)
            ir(e.args[0])
        elif isinstance(e, cos):
            din.add(kb.KEY_COS)
            ir(e.args[0])
        elif isinstance(e, tan):
            din.add(kb.KEY_TG)
            ir(e.args[0])
        else:
            # Un nodo que el modelo no conoce es un agujero en el chequeo, no un
            # caso raro: significa que el catálogo produce una forma que nadie
            # sabe si se puede tipear.
            din.add(f"??{type(e).__name__}")

    ir(expr)
    return din, fij


# ── El catálogo, enumerado exacto ───────────────────────────────
#
# Las plantillas piden sus parámetros a un `CyclingRandom`, y con semillas al
# azar el catálogo NO se agota: medido, 60 semillas dan 2.117 derivadas, 120 dan
# 2.676 y 480 dan 4.298, sin señal de meseta. Un chequeo que muestrea deja
# justamente los casos raros afuera, que son los únicos que importan acá.
#
# Así que en vez de sortear se recorre el árbol de decisiones completo: cada
# `randint`/`choice` es una rama, y se visitan todas. Sale exacto, sale siempre
# igual, y cubre las ramas condicionales —plantillas que piden un parámetro solo
# cuando otro cayó de cierta forma— porque el dominio se descubre recorriendo y
# no se declara de antemano.
class Barrido:
    """Un `CyclingRandom` que no sortea: sigue un camino y anota los dominios."""

    def __init__(self, camino: tuple) -> None:
        self._camino = camino
        self._i = 0
        self.ramas: list[list] = []

    def randint(self, slot: str, lo: int, hi: int):
        return self._tomar(list(range(lo, hi + 1)))

    def choice(self, slot: str, opciones):
        return self._tomar(list(opciones))

    def _tomar(self, dominio: list):
        self.ramas.append(dominio)
        valor = self._camino[self._i] if self._i < len(self._camino) else dominio[0]
        self._i += 1
        return valor


def instancias(plantilla, camino: tuple = ()):
    """Todas las funciones que esta plantilla puede generar."""
    barrido = Barrido(camino)
    generada = plantilla.build(barrido)
    if len(barrido.ramas) <= len(camino):
        yield generada.f
        return
    for valor in barrido.ramas[len(camino)]:
        yield from instancias(plantilla, camino + (valor,))


# El piso de cobertura. La enumeración es exhaustiva por construcción, así que
# esto no mide el muestreo sino el catálogo: si un día da mucho menos, alguien le
# recortó el dominio a una plantilla y el chequeo tiene que avisar en vez de
# pasar con menos casos. Hoy da 4.595.
MIN_DERIVADAS = 4000


print("1. toda derivada del catálogo se puede escribir con lo que desbloquea")

derivadas: list[tuple[str, int, sympy.Expr, sympy.Expr]] = []
for plantilla in TEMPLATES:
    for f in instancias(plantilla):
        derivadas.append((plantilla.key, plantilla.tier, f, sympy.diff(f, x)))

check(
    len(derivadas) >= MIN_DERIVADAS,
    f"el catálogo da {len(derivadas)} derivadas distintas (piso {MIN_DERIVADAS})",
)

raros = sorted(
    {
        t
        for _, _, _, d in derivadas
        for t in teclas_para_escribir(d)[0]
        if t.startswith("??")
    }
)
check(not raros, f"ninguna usa una forma que el modelo no conozca{f' ({raros})' if raros else ''}")

# El inventario arranca VACÍO a propósito: es el peor caso y es el de verdad para
# quien recién llega, que es justo quien no puede permitirse un ejercicio sin
# teclas.
sin_dinamica: list[str] = []
for clave, _, f, d in derivadas:
    nec_din, _ = teclas_para_escribir(d)
    nec_din = {t for t in nec_din if not t.startswith("??")}
    unlocked, _, _ = kb.unlock("", d)
    faltan = nec_din - kb.parse_unlocked(unlocked)
    if faltan:
        sin_dinamica.append(f"{clave}: {latex_es(d)} sin {sorted(faltan)}")
check(
    not sin_dinamica,
    f"las {len(derivadas)} traen su vocabulario dinámico"
    + (f" (falla {sin_dinamica[0]}, {len(sin_dinamica)} casos)" if sin_dinamica else ""),
)


print("\n2. en la rampa, además, el bloque fijo alcanza")

# Con rampa el bloque fijo también crece, y lo que se desbloquea depende del
# NÚMERO de ejercicio: `fijas_requeridas` más `fijas_del_escalon`. Se recorre
# cada derivada en cada número de ejercicio en el que el motor podría servirla —
# el tope de `elo.max_tier_de` decide cuáles— porque la promesa es por ejercicio
# servido y no en promedio.
def servible_en(tier: int, n_servidos: int) -> bool:
    """¿El motor puede servir este tier como ejercicio número `n_servidos`?

    `max_tier_de` cuenta RESPUESTAS, que al servir el k-ésimo son k−1
    (game/router.py :: `n_servidos = player.exercises_attempted + 1`).
    """
    tope = elo.max_tier_de(n_servidos - 1)
    return tope is None or tier <= tope


HASTA = kb.RAMPA_COMPLETA_EN  # de acá en adelante está todo desbloqueado
sin_fija: list[str] = []
combinaciones = 0
for clave, tier, f, d in derivadas:
    nec_din, nec_fij = teclas_para_escribir(d)
    for n in range(1, HASTA + 1):
        if not servible_en(tier, n):
            continue
        combinaciones += 1
        unlocked, _, _ = kb.unlock("", d, rampa=True, n_servidos=n)
        faltan = nec_fij - kb.parse_fijas(unlocked)
        if faltan:
            sin_fija.append(f"{clave} en el ejercicio {n}: {latex_es(d)} sin {sorted(faltan)}")

check(
    not sin_fija,
    f"{combinaciones} pares (derivada, número de ejercicio) y en todos alcanza"
    + (f" (falla {sin_fija[0]}, {len(sin_fija)} casos)" if sin_fija else ""),
)

# Y el techo, que es lo que vuelve rampa a esto y no jaula.
check(
    kb.fijas_del_escalon(HASTA) == set(kb.FIJAS_ORDER),
    f"a la derivada {HASTA} se desbloquea todo el bloque fijo, haya salido o no",
)


print("\n3. el paréntesis: el hueco que tapa el tope de tier")

# `fijas_requeridas` solo pide paréntesis para las funciones (`exp`, `log`,
# `sen`, `cos`, `tan`), no para una suma adentro de una potencia ni para una que
# multiplica. O sea que (8x+7)⁴ → 32(8x+7)³ los necesita y no los pide.
#
# No traba a nadie porque el calendario los suelta en la derivada 6 y, antes de
# esa, `elo.max_tier_de` no deja pasar de tier 4. Las plantillas que los piden
# son de tier 5 para arriba. Las dos mitades de esa frase son lo que se fija acá:
# si alguna se mueve, el chequeo cae y hay que decidir a propósito.
piden_parentesis = sorted(
    {
        (clave, tier)
        for clave, tier, _, d in derivadas
        if kb.FIJA_PAR in teclas_para_escribir(d)[1]
        and kb.FIJA_PAR not in kb.fijas_requeridas(d)
    }
)
print(f"     plantillas que lo piden sin requerirlo: {[c for c, _ in piden_parentesis]}")

sin_parentesis = [n for n in range(1, HASTA + 1) if kb.FIJA_PAR not in kb.fijas_del_escalon(n)]
check(
    bool(sin_parentesis),
    f"el paréntesis todavía no salió en los ejercicios {sin_parentesis}",
)
expuestas = [
    (clave, tier, n)
    for clave, tier in piden_parentesis
    for n in sin_parentesis
    if servible_en(tier, n)
]
check(
    not expuestas,
    "y en ninguno de esos el motor puede servir una plantilla que lo necesite"
    + (f" (falla {expuestas[0]})" if expuestas else ""),
)
check(
    all(tier >= 5 for _, tier in piden_parentesis),
    f"las que lo necesitan son de tier 5 para arriba ({sorted({t for _, t in piden_parentesis})})",
)


print()
if FAILURES:
    print(f"{len(FAILURES)} chequeo(s) fallaron")
    sys.exit(1)
print("todos los chequeos pasaron")
