"""Cómo se cuenta cada noticia del feed: el pool de frases y cuál le toca.

Vive afuera de `events.py` por el mismo motivo que `notification_copy.py` vive
afuera de `notifications.py`: una cosa es decidir QUÉ es noticia y otra cómo se
escribe. Mezcladas, cambiar una coma obliga a releer la lógica de umbrales. Acá
adentro no se decide nada sobre qué se publica — cuando se llama a cualquiera de
estas funciones, esa decisión ya está tomada.

**Por qué un pool y no una frase.** Medido en producción: 74 líneas en 48 horas,
escritas con DIEZ frases. La de subir de nivel salió idéntica dieciocho veces, y
las trece de racha se diferenciaban en un número. Un feed que se repite así deja
de leerse, que es la misma muerte que el ruido — por otro camino.

**Por qué el sorteo es determinístico y no `random`.** El texto se guarda ya
resuelto en la fila, así que un azar de verdad también funcionaría. La semilla
fija se elige por tres motivos, y el tercero es el que importa:

  · el mismo hecho re-emitido —a `emit` se le puede llegar dos veces en una
    carrera— no puede salir redactado de dos maneras distintas;
  · el check queda reproducible sin tener que sembrar el generador; y
  · `random` vuelve a sacar la variante anterior una de cada N veces, y lo que
    se busca NO es azar sino que dos líneas SEGUIDAS no se parezcan. Con la
    clave del hecho como semilla, dos hechos distintos caen en variantes
    distintas salvo colisión, que es exactamente la propiedad que se quiere.

`zlib.crc32` y no `hash()`: el hash de un `str` está aleatorizado por proceso
(PYTHONHASHSEED), así que la misma clave daría variantes distintas en cada
worker y el determinismo sería mentira.

**Los marcadores.** Las frases salen con `{a}`, `{b}`, `{u0}` y `{u1}` SIN
resolver; los pone el cliente (ver web/.../event-feed.tsx). Por eso la
sustitución va con `string.Template` y no con `str.format`: format se comería
esos marcadores creyendo que son campos suyos. Una variante puede no usar `{b}`
aunque quien llama tenga con qué — el cliente ignora lo que no está en el texto,
así que eso sale gratis.

**Tres reglas de redacción, y ninguna es de gusto:**

  · **Los artículos de universidad se piden armados** (ver `Articulos`). «Pasó a
    el ITBA» y «de el ITBA» no existen en castellano, y son el error que no se
    ve hasta el día que un instituto entra en la tabla.
  · **Nada de adjetivos ni pronombres que concuerden con la universidad.** «El
    ITBA venía tranquila» y «la pasó» se rompen solos, por lo mismo. Las
    universidades se nombran, no se pronominalizan.
  · **Nada de adjetivos que concuerden con la PERSONA.** Un alias no dice el
    género de nadie. «{a} quedó primero» está mal escrito para media tabla;
    «{a} es el número 1» concuerda con «número» y sirve para todo el mundo.
"""

from __future__ import annotations

import zlib
from dataclasses import dataclass
from string import Template

from universities import article_for

from . import elo

# Qué dificultad le empieza a servir el juego en cada tier, con el nombre que le
# da la materia. Es lo único de este archivo que puede MENTIR —el resto son
# maneras de decir un hecho que ya viene decidido—, y por eso el tier no se
# tabula contra el nivel: sale de `elo.tier_objetivo`, que lo deriva de los
# cortes de nivel y de las semillas de dificultad. Si mañana los cortes se
# mueven, la frase se mueve con ellos en vez de quedar mintiendo.
#
# Con el vocabulario de la práctica y no con el de la tabla de tiers: «las
# sumas» se lee como la suma de la primaria, que en un juego de derivadas es
# justo la confusión que no se puede permitir. «La regla de la suma», no.
#
# `check_game_events_copy.py` verifica que todos los tiers que existen en
# `templates.py` tengan nombre acá.
FAMILIA_POR_TIER: dict[int, str] = {
    0: "la derivada de una constante",
    1: "la regla de la potencia",
    2: "la regla de la suma",
    3: "la tabla de derivadas",
    4: "la regla del producto",
    5: "la regla del cociente",
}


def familia_de_nivel(nivel: int) -> str:
    """Qué se le abre a alguien que acaba de entrar al nivel `nivel`."""
    tier = elo.tier_objetivo(elo.theta_de_nivel(nivel))
    return FAMILIA_POR_TIER.get(tier, "las derivadas difíciles")


# ── Los artículos, armados ───────────────────────────────────────────────────

@dataclass(frozen=True)
class Articulos:
    """Las tres formas del artículo que una frase puede necesitar.

    «la UBA», «de la UBA» / «del ITBA», «a la UBA» / «al ITBA». Las dos
    contracciones viven acá y en ningún otro lado: son exactamente lo que el
    catálogo de universidades no tiene por qué saber, y una variante que escriba
    «de el ITBA» a mano no falla hasta el día que un instituto entra en la
    tabla — o sea, en producción y delante de todos.
    """

    art: str
    de: str
    a: str


def articulos_de(university: str | None) -> Articulos | None:
    """Los artículos de esa universidad, o None si la persona no cargó ninguna.

    `article_for` devuelve «la» para None —un default para que la oración no se
    rompa— y acá hace falta la distinción que ese default borra: «juega para la
    UBA» y «no sabemos dónde estudia» son dos frases distintas, no la misma con
    un artículo de más.
    """
    uni = (university or "").strip()
    if not uni:
        return None
    art = article_for(uni)
    return Articulos(
        art=art,
        de="del" if art == "el" else "de la",
        a="al" if art == "el" else "a la",
    )


def _campos(sufijo: str, arts: Articulos) -> dict[str, str]:
    """Las seis formas —tres, cada una con su mayúscula— con el sufijo puesto.

    El sufijo es quién es quién en la oración: `g`/`p` para quien gana y quien
    pierde un sobrepaso, `a`/`r` para quien persigue y quien va arriba, `u` para
    la única universidad de la frase.
    """
    return {
        f"art_{sufijo}": arts.art,
        f"Art_{sufijo}": arts.art.capitalize(),
        f"de_{sufijo}": arts.de,
        f"De_{sufijo}": arts.de.capitalize(),
        f"a_{sufijo}": arts.a,
        f"A_{sufijo}": arts.a.capitalize(),
    }


def _elegir(semilla: str, opciones: list[str]) -> str:
    """La variante que le toca a este hecho. Ver el encabezado."""
    return opciones[zlib.crc32(semilla.encode("utf-8")) % len(opciones)]


def _armar(semilla: str, opciones: list[str], **datos: object) -> str:
    return Template(_elegir(semilla, opciones)).safe_substitute(**datos)


def miles(n: int) -> str:
    """12345 se escribe «12.345»: punto para los miles, como en castellano."""
    return f"{int(n):,}".replace(",", ".")


def mult(valor: float) -> str:
    """1.4 se escribe «×1,4»: coma decimal."""
    return f"×{valor:.1f}".replace(".", ",")


def _reloj(horas: int) -> str:
    return "una hora" if horas == 1 else f"{horas} horas"


# ── Puntero nuevo ────────────────────────────────────────────────────────────
# La noticia más grande del juego, y la única en la que hay alguien a quien se le
# saca algo. Nombrar a esa persona es lo que la convierte en una escena.

_LEAD = [
    "{a} es el nuevo número 1.",
    "Puntero nuevo: {a}.",
    "{a} se quedó con el número 1 del juego.",
    "Hay número 1 nuevo, y es {a}.",
]

_LEAD_CON_DESPLAZADO = [
    "{a} le sacó el número 1 a {b}.",
    "{b} tenía el número 1. Ahora lo tiene {a}.",
    "{a} destronó a {b}.",
    "Cambio de mando: {a} le ganó el número 1 a {b}.",
    "{a} le sacó el número 1 a {b}. Ahí quedó picando.",
]


def lead(semilla: str, *, desplazado: bool) -> str:
    return _elegir(semilla, _LEAD_CON_DESPLAZADO if desplazado else _LEAD)


# ── Entrada al top del juego ─────────────────────────────────────────────────
# `desde` es el puesto de donde venía, y sale gratis: el router ya lo calculó
# para armar la respuesta del endpoint. Es toda la diferencia entre «entró al top
# 50» y «entró al top 50 desde el puesto 84» — el mismo hecho, y además cuánto
# costó.

_TOP = [
    "{a} entró al top $n.",
    "{a} se metió en el top $n.",
]

_TOP_DESDE = [
    "{a} entró al top $n desde el puesto $desde.",
    "{a} se metió en el top $n. Venía ${desde}º.",
    "{a} saltó del puesto $desde al top $n.",
]

_TOP_3 = [
    "{a} entró al top 3 del juego.",
    "{a} se metió en el top 3. Arriba queda poco lugar.",
    "{a} está en el top 3 del juego entero.",
]

_TOP_3_DESDE = [
    "{a} entró al top 3 desde el puesto $desde.",
    "{a} saltó del puesto $desde al top 3 del juego.",
    "{a} se metió en el top 3. Venía ${desde}º.",
]

# El corte que se cuenta distinto: entrar al top 3 del juego entero no es un
# escalón más de la misma escalera.
CORTE_GRANDE = 3


def top(semilla: str, *, corte: int, desde: int | None) -> str:
    if corte <= CORTE_GRANDE:
        pool = _TOP_3_DESDE if desde else _TOP_3
    else:
        pool = _TOP_DESDE if desde else _TOP
    return _armar(semilla, pool, n=corte, desde=desde)


# ── Podio de la universidad ──────────────────────────────────────────────────

_UNI_1 = [
    "{a} es el número 1 $de_u {u0}.",
    "{a} se quedó con el número 1 $de_u {u0}.",
    "En $art_u {u0} ahora manda {a}.",
    "{a} encabeza $art_u {u0}.",
]

_UNI_3 = [
    "{a} entró al top 3 $de_u {u0}.",
    "{a} se metió en el podio $de_u {u0}.",
    "{a} está en el podio $de_u {u0}.",
]


def uni_top(semilla: str, *, corte: int, arts: Articulos) -> str:
    pool = _UNI_1 if corte == 1 else _UNI_3
    return _armar(semilla, pool, n=corte, **_campos("u", arts))


# ── Racha ────────────────────────────────────────────────────────────────────
# El pool cambia con el hito, y eso ES la personalización: diez seguidas y
# doscientas cincuenta seguidas no son la misma noticia dicha con otro número.

_RACHA: dict[int, list[str]] = {
    10: [
        "{a} lleva 10 seguidas sin errar.",
        "{a} va 10 al hilo.",
        "{a} encadenó 10 sin errar.",
        "10 seguidas de {a}, sin errar una.",
    ],
    25: [
        "{a} lleva 25 seguidas sin errar.",
        "{a} va 25 al hilo y sigue.",
        "25 seguidas de {a}.",
        "{a} encadenó 25 sin errar. Y sigue.",
    ],
    50: [
        "{a} lleva 50 seguidas sin errar.",
        "{a} va 50 al hilo. No está fallando una.",
        "50 seguidas de {a}. Cincuenta.",
    ],
    100: [
        "{a} lleva 100 seguidas sin errar. Cien.",
        "{a} encadenó 100 sin errar.",
        "{a} va 100 al hilo. Alguien avise si respira.",
    ],
    250: [
        "{a} lleva 250 seguidas sin errar.",
        "{a} va 250 al hilo. Doscientas cincuenta.",
        "{a} encadenó 250 sin errar. Alguien fíjese si está bien.",
    ],
}

# Para un hito que se agregue a `STREAK_MILESTONES` y todavía no tenga pool. Sin
# esto, agregar un número allá revienta con KeyError en el camino caliente.
_RACHA_GENERICA = [
    "{a} lleva $n seguidas sin errar.",
    "{a} va $n al hilo.",
    "{a} encadenó $n sin errar.",
]


def streak(semilla: str, *, seguidas: int) -> str:
    return _armar(semilla, _RACHA.get(seguidas, _RACHA_GENERICA), n=seguidas)


# ── Subir de nivel ───────────────────────────────────────────────────────────
# La línea más frecuente del feed —110 de 122 en una semana fueron al nivel 1— y
# la que menos decía: «desbloqueó derivadas más difíciles», idéntica para los
# tres niveles. Ahora dice CUÁL se desbloqueó, que es el único dato que la
# persona todavía no tenía.

_NIVEL = [
    "{a} llegó a $fam.",
    "A {a} ahora le toca $fam.",
    "{a} desbloqueó $fam.",
    "El juego le subió la apuesta a {a}: ahora $fam.",
]

_NIVEL_TOPE = [
    "{a} llegó a $fam, que es lo más difícil que hay acá.",
    "{a} desbloqueó $fam. El último escalón.",
    "A {a} ahora le toca $fam. De acá no se sube más.",
]


def level(semilla: str, *, nivel: int) -> str:
    pool = _NIVEL_TOPE if nivel >= elo.NIVEL_MAX else _NIVEL
    return _armar(semilla, pool, fam=familia_de_nivel(nivel))


# ── Llegadas ─────────────────────────────────────────────────────────────────

_SIGNUP = [
    "{a} se sumó al juego.",
    "Llegó {a}.",
    "{a} entró a derivar.",
]

_SIGNUP_CON_UNI = [
    "{a} se sumó al juego y deriva para $art_u {u0}.",
    "{a} se sumó. Juega para $art_u {u0}.",
    "$Art_u {u0} tiene un jugador más: {a}.",
    "{a} entró a derivar para $art_u {u0}.",
]

_RECLUTA = [
    "{a} reclutó a {b}.",
    "{a} trajo a {b} al juego.",
    "{b} llegó por {a}.",
]

_RECLUTA_CON_UNI = [
    "{a} reclutó a {b} para $art_u {u0}.",
    "{a} trajo a {b}. Los dos derivan para $art_u {u0}.",
    "{a} sumó a {b} $a_u {u0}.",
]


def signup(semilla: str, *, arts: Articulos | None) -> str:
    if arts is None:
        return _elegir(semilla, _SIGNUP)
    return _armar(semilla, _SIGNUP_CON_UNI, **_campos("u", arts))


def referral(semilla: str, *, arts: Articulos | None) -> str:
    if arts is None:
        return _elegir(semilla, _RECLUTA)
    return _armar(semilla, _RECLUTA_CON_UNI, **_campos("u", arts))


# ── Cafecito ─────────────────────────────────────────────────────────────────
# Las horas son nuevas, y son el mismo arreglo que el cartel del cafecito acaba
# de hacer del otro lado (ver web/.../impacto-del-cafecito.ts): un multiplicador
# suelto no dice nada cuando la universidad ya está en el techo, porque ahí lo
# que la donación compra es TIEMPO. El feed ahora dice las dos cosas.

_BOOST = [
    "{a} invitó $c para $art_u {u0}: $m por $reloj.",
    "{a} bancó $a_u {u0} con $c: $m por $reloj.",
    "{a} puso $c para $art_u {u0}. $m por $reloj.",
    "{a} dejó $c para $art_u {u0}: $m por $reloj.",
]

# Sin horas: lo que sale cuando quien llama no las sabe.
_BOOST_SIN_RELOJ = [
    "{a} invitó $c para $art_u {u0}: $m para toda la universidad.",
    "{a} bancó $a_u {u0} con $c: $m para toda la universidad.",
]

_BOOST_GLOBAL = [
    "{a} invitó $c para TODOS: $m para todo el juego.",
    "{a} invitó $c y lo cobra todo el mundo: $m para todo el juego.",
]

_AFORO = [
    "$Art_u {u0} llegó a $personas personas nuevas hoy: $m por $reloj. 🎉",
    "$Art_u {u0} sumó $personas personas nuevas hoy y se ganó $m por $reloj. 🎉",
]


def cuantos_cafecitos(n: int) -> str:
    return "un cafecito" if n == 1 else f"{n} cafecitos"


def boost(
    semilla: str,
    *,
    cafecitos: int,
    multiplier: float,
    horas: int | None,
    arts: Articulos | None,
) -> str:
    datos: dict[str, object] = {
        "c": cuantos_cafecitos(cafecitos),
        "m": mult(multiplier),
        "reloj": _reloj(horas) if horas else None,
    }
    if arts is None:
        return _armar(semilla, _BOOST_GLOBAL, **datos)
    return _armar(
        semilla,
        _BOOST if horas else _BOOST_SIN_RELOJ,
        **datos,
        **_campos("u", arts),
    )


def aforo(
    semilla: str, *, personas: int, multiplier: float, horas: int, arts: Articulos
) -> str:
    return _armar(
        semilla,
        _AFORO,
        personas=personas,
        m=mult(multiplier),
        reloj=_reloj(horas),
        **_campos("u", arts),
    )


# ── Universidades ────────────────────────────────────────────────────────────
# «Le pasó a» era el bug que abrió todo esto: en castellano rioplatense «a la
# UNSAM le pasó» se lee como que a la UNSAM le OCURRIÓ algo. Pasar a alguien es
# transitivo y va sin dativo — la UBA pasó a la UNSAM.
#
# Sufijos: `g` gana y `p` pierde el sobrepaso; `a` persigue y `r` va arriba en la
# disputa. Y ni una contracción escrita a mano: «pasó $a_p {u1}» sale «pasó a la
# UNSAM» o «pasó al ITBA» según corresponda, que es lo que `Articulos` existe
# para garantizar.

_UNI_PASS = [
    "$Art_g {u0} pasó $a_p {u1} en experiencia.",
    "$Art_g {u0} se puso arriba $de_p {u1}.",
    "$Art_p {u1} perdió el puesto: ahora va arriba $art_g {u0}.",
    "Cambio de orden: $art_g {u0} pasó $a_p {u1} en experiencia.",
    "$Art_g {u0} dejó atrás $a_p {u1}.",
]

_UNI_CLOSE = [
    "$Art_a {u0} está a $n XP $de_r {u1}.",
    "$Art_a {u0} le respira en la nuca $a_r {u1}: $n XP.",
    "Se picó: $n XP entre $art_a {u0} y $art_r {u1}.",
    "$Art_r {u1} le lleva $n XP $a_a {u0}. Nada más.",
]

_UNI_CLOSE_SIN_NUMERO = [
    "$Art_a {u0} está a nada de pasar $a_r {u1} en experiencia.",
    "$Art_a {u0} le respira en la nuca $a_r {u1}.",
]


def uni_pass(semilla: str, *, gana: Articulos, pierde: Articulos) -> str:
    return _armar(semilla, _UNI_PASS, **_campos("g", gana), **_campos("p", pierde))


def uni_close(
    semilla: str, *, abajo: Articulos, arriba: Articulos, diferencia: int | None
) -> str:
    return _armar(
        semilla,
        _UNI_CLOSE if diferencia else _UNI_CLOSE_SIN_NUMERO,
        n=miles(diferencia) if diferencia else None,
        **_campos("a", abajo),
        **_campos("r", arriba),
    )
