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

── LA FORMA ──────────────────────────────────────────────────────────────────

**Toda línea es sujeto — verbo — objeto, y se termina ahí.** Quién lo hizo, qué
hizo, a quién o a qué. Una sola oración, sin remate, sin comentario, sin una
segunda frase que opine sobre la primera.

No es una preferencia de estilo: es lo que hace que la columna se pueda barrer
con el ojo. Diez tipos de noticia intercalados con el chat, todos con la misma
estructura, se leen sin leerse. Un «Alguien avise si respira» detrás de la racha
obliga a procesar la línea entera para descubrir que no dice nada nuevo, y son
treinta y siete líneas por día.

De ahí salen tres consecuencias, y las tres las verifica el check:

  · **Nada de frases dadas vuelta.** «Puntero nuevo: {a}», «Se picó: 1.200 XP
    entre A y B», «Llegó {a}». Todas dicen lo mismo que su versión derecha y
    ninguna se lee más rápido.
  · **La variedad va en el VERBO, no en la estructura.** Superó, dejó atrás, le
    serruchó el piso. Es donde la variedad no cuesta legibilidad.
  · **Ni un punto en el medio.** Lo que no entra antes del punto final no entra.

── EL CASTELLANO ─────────────────────────────────────────────────────────────

  · **Los artículos se piden armados** (ver `Articulos`). «Superó a el ITBA» y
    «de el ITBA» no existen, y son el error que no se ve hasta el día que un
    instituto entra en la tabla.
  · **Nada de adjetivos ni pronombres que concuerden con la universidad.** «El
    ITBA venía tranquila» y «la superó» se rompen solos, por lo mismo. Las
    universidades se nombran, no se pronominalizan. El «le» de «le serruchó el
    piso» sí va: es objeto indirecto y es invariable en género.
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

# Qué dificultad le empieza a servir el juego en cada tier, con dos nombres: el
# corto y el de la regla. Los dos son ciertos y los dos se usan — son la única
# variedad que la línea del nivel se puede permitir sin romper la forma, porque
# el verbo ahí es siempre «desbloqueó».
#
# Es lo único de este archivo que puede MENTIR (el resto son maneras de decir un
# hecho que ya viene decidido), y por eso el tier no se tabula contra el nivel:
# sale de `elo.tier_objetivo`, que lo deriva de los cortes de nivel y de las
# semillas de dificultad. Si mañana los cortes se mueven, la frase se mueve con
# ellos en vez de quedar mintiendo.
#
# `check_game_events_copy.py` verifica que todos los tiers que existen en
# `templates.py` tengan nombre acá.
FAMILIA_POR_TIER: dict[int, tuple[str, str]] = {
    0: ("las constantes", "la derivada de una constante"),
    1: ("las potencias", "la regla de la potencia"),
    2: ("las sumas", "la regla de la suma"),
    3: ("la tabla", "la tabla de derivadas"),
    4: ("los productos", "la regla del producto"),
    5: ("los cocientes", "la regla del cociente"),
}

_FAMILIA_DESCONOCIDA = ("las difíciles", "las derivadas difíciles")


def familia_de_nivel(nivel: int) -> tuple[str, str]:
    """Qué se le abre a alguien que entra al nivel `nivel`: (corto, la regla)."""
    tier = elo.tier_objetivo(elo.theta_de_nivel(nivel))
    return FAMILIA_POR_TIER.get(tier, _FAMILIA_DESCONOCIDA)


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
    "{a} se quedó con el número 1.",
    "{a} tomó el número 1 del juego.",
    "{a} encabeza el ranking.",
]

_LEAD_CON_DESPLAZADO = [
    "{a} le sacó el número 1 a {b}.",
    "{a} destronó a {b}.",
    "{a} le ganó el número 1 a {b}.",
    "{a} desbancó a {b}.",
    "{a} le serruchó el piso a {b}.",
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
    "{a} llegó al top $n.",
]

# La primera va SIN el puesto de origen aunque lo tenga a mano: «entró al top 50
# desde el puesto 84» arranca con un verbo de llegada y lo termina con uno de
# partida, y se traba. Las otras tres nacen del verbo correcto para eso —saltó,
# subió, escaló— y ahí el puesto entra solo.
_TOP_DESDE = [
    "{a} entró al top $n.",
    "{a} saltó del puesto $desde al top $n.",
    "{a} subió del puesto $desde al top $n.",
    "{a} escaló del puesto $desde al top $n.",
]


def top(semilla: str, *, corte: int, desde: int | None) -> str:
    return _armar(semilla, _TOP_DESDE if desde else _TOP, n=corte, desde=desde)


# ── Podio de la universidad ──────────────────────────────────────────────────

_UNI_1 = [
    "{a} es el número 1 $de_u {u0}.",
    "{a} se quedó con el número 1 $de_u {u0}.",
    "{a} encabeza $art_u {u0}.",
    "{a} lidera $art_u {u0}.",
]

# Cuando se sabe a quién se le sacó. Es la misma escena que el puntero del juego
# entero, un piso más abajo, y es la que más tracción tiene: el número 1 global
# lo pelean siempre los mismos, pero el de una universidad se lo disputa gente
# que se conoce de cursada. Por eso además estas líneas son INTERNAS — ver
# `KINDS_INTERNOS` en events.py.
_UNI_1_CON_DESPLAZADO = [
    "{a} destronó a {b} en el ranking $de_u {u0}.",
    "{a} le sacó el número 1 $de_u {u0} a {b}.",
    "{a} desbancó a {b} en $art_u {u0}.",
    "{a} le ganó el número 1 $de_u {u0} a {b}.",
]

_UNI_3 = [
    "{a} entró al top 3 $de_u {u0}.",
    "{a} se metió en el podio $de_u {u0}.",
    "{a} llegó al podio $de_u {u0}.",
]


def uni_top(
    semilla: str, *, corte: int, arts: Articulos, desplazado: bool = False
) -> str:
    if corte != 1:
        pool = _UNI_3
    else:
        pool = _UNI_1_CON_DESPLAZADO if desplazado else _UNI_1
    return _armar(semilla, pool, n=corte, **_campos("u", arts))


# ── Racha ────────────────────────────────────────────────────────────────────
# Un pool solo, con el número adentro: diez seguidas y doscientas cincuenta
# seguidas son la misma oración, y lo que las distingue es el número, que ya
# está ahí. Los pools por hito existieron mientras cada uno tenía su remate
# —«Cien.», «Alguien avise si respira.»—; sin remate eran la misma frase seis
# veces.
#
# «Pifiar» y «errar» se alternan a propósito: son la misma idea con dos
# registros, y tener los dos es el doble de frases sin agregar ninguna. «Al
# hilo» no se usa.
_RACHA = [
    "{a} lleva $n seguidas sin errar.",
    "{a} lleva $n seguidas sin pifiar.",
    "{a} encadenó $n sin pifiar.",
    "{a} clavó $n seguidas sin errar.",
    "{a} enganchó $n sin pifiar.",
    "{a} acumuló $n seguidas sin errar.",
]


def streak(semilla: str, *, seguidas: int) -> str:
    return _armar(semilla, _RACHA, n=seguidas)


# ── Subir de nivel ───────────────────────────────────────────────────────────
# La línea más frecuente del feed —110 de 122 en una semana fueron al nivel 1— y
# la que menos decía: «desbloqueó derivadas más difíciles», idéntica para los
# tres niveles. Ahora dice CUÁLES, que es el único dato que la persona todavía
# no tenía, y en tres palabras.
#
# El verbo es siempre «desbloqueó» y la variedad está en cómo se nombra lo
# desbloqueado: el nombre corto o el de la regla. Es la categoría donde menos
# margen hay, y está bien que así sea — el ícono 🎨 y el nombre ya pintado del
# color nuevo cuentan la otra mitad de la noticia.
_NIVEL = [
    "{a} desbloqueó $fam.",
    "{a} desbloqueó $regla.",
]


def level(semilla: str, *, nivel: int) -> str:
    corta, regla = familia_de_nivel(nivel)
    return _armar(semilla, _NIVEL, fam=corta, regla=regla)


# ── El saludo a quien recién llega ───────────────────────────────────────────
# Sale con la PRIMERA derivada resuelta, no al entrar: hasta ahí el alias es el
# generado al azar y siete de cada quince se van sin resolver una sola, así que
# saludaríamos a gente que no llegó a estar.
#
# Es a propósito un saludo y no un logro. Resolver la primera no es una hazaña
# —la primera derivada es `x`, fijada trivial por el generador— y anunciarla como
# tal es de donde venía el problema que esto reemplaza. Lo que se cuenta es que
# hay alguien nuevo.
#
# Ojo con la cercanía a `_SIGNUP`, acá abajo: aquel anuncia el REGISTRO, que es
# otra cosa y sale 5 veces por día contra 80 de este. Por eso estas tres hablan
# de EMPEZAR a jugar y aquellas de sumarse al juego — si alguna vez se tocan,
# conviene moverlas juntas y no que terminen diciendo lo mismo.
_BIENVENIDA = [
    "{a} arrancó a derivar.",
    "{a} empezó a jugar.",
    "{a} acaba de llegar.",
]


def bienvenida(semilla: str) -> str:
    return _armar(semilla, _BIENVENIDA)


# ── Llegadas ─────────────────────────────────────────────────────────────────

_SIGNUP = [
    "{a} se sumó al juego.",
    "{a} entró a derivar.",
    "{a} llegó al juego.",
]

_SIGNUP_CON_UNI = [
    "{a} se sumó $a_u {u0}.",
    "{a} entró a derivar para $art_u {u0}.",
    "{a} se sumó al juego por $art_u {u0}.",
    "{a} empezó a derivar para $art_u {u0}.",
]

_RECLUTA = [
    "{a} reclutó a {b}.",
    "{a} trajo a {b} al juego.",
    "{a} sumó a {b} al juego.",
]

_RECLUTA_CON_UNI = [
    "{a} reclutó a {b} para $art_u {u0}.",
    "{a} sumó a {b} a las filas $de_u {u0}.",
    "{a} trajo a {b} $a_u {u0}.",
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
# Las horas son el mismo arreglo que el cartel del cafecito hizo del otro lado
# (ver web/.../impacto-del-cafecito.ts): un multiplicador suelto no dice nada
# cuando la universidad ya está en el techo, porque ahí lo que la donación
# compra es TIEMPO. Van después de los dos puntos, que son la carga de la
# noticia y no un comentario sobre ella.

_BOOST = [
    "{a} invitó $c para $art_u {u0}: $m por $reloj.",
    "{a} bancó $a_u {u0} con $c: $m por $reloj.",
    "{a} dejó $c para $art_u {u0}: $m por $reloj.",
    "{a} le puso $c $a_u {u0}: $m por $reloj.",
]

# Sin horas: lo que sale cuando quien llama no las sabe.
_BOOST_SIN_RELOJ = [
    "{a} invitó $c para $art_u {u0}: $m.",
    "{a} bancó $a_u {u0} con $c: $m.",
]

_BOOST_GLOBAL = [
    "{a} invitó $c para todo el juego: $m por $reloj.",
    "{a} regaló $c a todo el juego: $m por $reloj.",
]

_AFORO = [
    "$Art_u {u0} llegó a $personas personas nuevas hoy: $m por $reloj.",
    "$Art_u {u0} sumó $personas personas nuevas hoy: $m por $reloj.",
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
# UNSAM le pasó» se lee como que a la UNSAM le OCURRIÓ algo. Pero «pasó a» a
# secas tampoco alcanza —el verbo más pálido que hay para el hecho más grande de
# la tabla—, así que el pool usa verbos que dicen algo.
#
# Sufijos: `g` gana y `p` pierde el sobrepaso; `a` persigue y `r` va arriba en la
# disputa. Y ni una contracción escrita a mano: «superó $a_p {u1}» sale «superó a
# la UNSAM» o «superó al ITBA» según corresponda, que es lo que `Articulos`
# existe para garantizar.

_UNI_PASS = [
    "$Art_g {u0} superó $a_p {u1} en experiencia.",
    "$Art_g {u0} le serruchó el piso $a_p {u1}.",
    "$Art_g {u0} dejó atrás $a_p {u1}.",
    "$Art_g {u0} desplazó $a_p {u1}.",
    "$Art_g {u0} se puso arriba $de_p {u1}.",
]

# Cuando no estuvo cerca. Un sobrepaso recién confirmado pasa el margen por
# poco, así que estas frases casi nunca salen — y cuando salen es porque el par
# venía empatado hace rato y se resolvió de golpe. Le pasó a la UNC contra la
# UNSAM: se fue de 76k a 106k y quedó 22% arriba.
#
# Existe el pool separado porque «barrió» es una AFIRMACIÓN. Dicha sobre un 2%
# de diferencia es exactamente la clase de frase que hace que el feed deje de
# creerse, que es lo que este módulo entero trata de evitar.
_UNI_PASS_PALIZA = [
    "$Art_g {u0} barrió $a_p {u1} por $n XP.",
    "$Art_g {u0} pasó por arriba $de_p {u1} por $n XP.",
    "$Art_g {u0} le sacó $n XP $a_p {u1}.",
    "$Art_g {u0} superó $a_p {u1} por $n XP.",
]

# A partir de cuánta ventaja el sobrepaso se cuenta como paliza. No es un umbral
# de los que deciden qué sale —el sobrepaso ya se anunció— sino de los que
# deciden cómo se dice.
MARGEN_DE_PALIZA = 0.10

_UNI_CLOSE = [
    "$Art_a {u0} está a $n XP $de_r {u1}.",
    "$Art_a {u0} persigue $a_r {u1} a $n XP.",
    "$Art_r {u1} le lleva $n XP $a_a {u0}.",
    "$Art_a {u0} le respira en la nuca $a_r {u1}.",
]

_UNI_CLOSE_SIN_NUMERO = [
    "$Art_a {u0} está a nada de superar $a_r {u1}.",
    "$Art_a {u0} le respira en la nuca $a_r {u1}.",
]


def uni_pass(
    semilla: str,
    *,
    gana: Articulos,
    pierde: Articulos,
    margen: float = 0.0,
    diferencia: int | None = None,
) -> str:
    paliza = margen >= MARGEN_DE_PALIZA and diferencia
    return _armar(
        semilla,
        _UNI_PASS_PALIZA if paliza else _UNI_PASS,
        n=miles(diferencia) if diferencia else None,
        **_campos("g", gana),
        **_campos("p", pierde),
    )


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
