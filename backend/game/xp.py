"""XP del minijuego — funciones puras, constantes propias.

Mecánica calcada de algorithm/xp.py (base por intento + multiplicador de
dificultad + combo) pero con números propios: este XP escribe SOLO
`game_players.xp`. Nunca tocar `users.total_xp` (desbloquearía emojis y
dispararía notificaciones del ranking de Intervalo).
"""

from __future__ import annotations

# ── Cuánto paga cada derivada ─────────────────────────────────────────────────
#
# La base ES el ítem. Antes la dificultad entraba SOLO por p̂ —la probabilidad de
# que ESTA persona acierte ESTA derivada, calculada al servirla— multiplicando un
# 25 fijo por `0.75 + 0.85·(1−p̂)`. Y como el selector apunta a una banda angosta
# (elo.TARGET_LOW..TARGET_HIGH, y en producción p̂ vive entre 0,75 y 0,90), ese
# factor terminaba viviendo en [0,835, 0,96]: **un 15% de rango**. Al lado, el
# combo sumaba +15 planos (+71% sobre una respuesta de 21) y el empuje de la
# universidad multiplica hasta ×3. El ruido era más grande que la señal.
#
# Medido sobre producción, 6.448 aciertos: la correlación entre la dificultad del
# ítem y la XP de una respuesta era **r = 0,24**, y `sen(x)/x` —n=602— pagaba
# entre 5 y 114 según hubiera cafecito. Un jugador lo reportó con estas palabras:
# «los puntajes me aparecieron aleatorios, no dependientes de la dificultad; una
# Sen(x)/x podía tener menos puntaje que 3^x». Tenía razón, y de hecho es peor:
# p̂ es RELATIVO al jugador, así que a alguien fuerte lo difícil le paga MENOS.
#
# Ahora paga el tier, que es lo que la persona ve. Rango 4,25× —más grande que el
# ×3 del cafecito, que es el punto: la dificultad tiene que mandar sobre el
# ruido—. `sen(x)/x` (T5) paga 34 contra los 20 de `3^x` (T3).
#
# El promedio NO se mueve: pesado por lo que realmente se sirve en producción da
# 23,1 contra los ~22 de antes. Por eso la XP ya acumulada puede quedarse quieta
# sin migración — las dos monedas valen lo mismo.
#
# Sale del `tier` escrito a mano (templates.py) y NO de la β aprendida: la β se
# mueve sola con cada respuesta, así que si pagara, la misma derivada pagaría
# distinto esta semana que la anterior — que es exactamente el problema del que
# se está saliendo. La β conserva su trabajo, que es ELEGIR; el tier PAGA.
#
# También fija el largo del festejo: el front reparte este número en pasos que
# suben el contador, uno por cada ~3 XP (XP_POR_PASO en xp-pasos.ts), con un piso
# de PASOS_MIN=4. O sea que T0 y T1 caen en ese piso — el festejo de la derivada
# de `x` es el más corto que el juego sabe hacer, y está bien: es UN ejercicio en
# la vida de cada jugador (los tres del arranque son t0_x, t1_pow y t1_kpow, ver
# generator.ONBOARDING) y a partir de la banda normal, T3, el número ya es el de
# antes. Quien juega hondo cobra MÁS que antes, no menos.
XP_POR_TIER = {0: 8, 1: 12, 2: 15, 3: 20, 4: 26, 5: 34}

_TIER_MIN = min(XP_POR_TIER)
_TIER_MAX = max(XP_POR_TIER)

# Todo lo demás son FRACCIONES de la base, no números fijos, o la inversión
# vuelve a entrar por la ventana: un +15 plano es +71% sobre una respuesta de 21
# y sería +188% sobre una de 8, así que la derivada fácil con combo pasaría a
# pagar más que la difícil sin él. Las tres fracciones son exactamente las
# proporciones de antes —8/25, 5/25 y 15/25— o sea que esto conserva la
# intención y solo la vuelve proporcional.
_FRACCION_SEGUNDO = 8 / 25
_FRACCION_INSISTIENDO = 5 / 25
_FRACCION_COMBO = 15 / 25

# Cada cuántas correctas al primer intento seguidas cae el bonus de racha.
COMBO_INTERVAL = 5

# Acertó después de abrir el «¿Por qué?». La explicación termina con la derivada
# escrita, así que esto no premia haberla resuelto: premia haberla leído, que
# también vale algo pero no lo mismo. Gana sobre cualquier otra regla, incluido
# el segundo intento, porque cuál fue el intento deja de decir nada cuando la
# respuesta estaba a la vista.
XP_EXPLICADO = 3

# Con la tabla a la vista la derivada deja de ser una pregunta, así que la XP es
# simbólica: alcanza para que el festejo exista y no para escalar mirando.
#
# Estos dos son la ÚNICA excepción a «la dificultad paga», y a propósito: copiar
# de la tabla no puede pagar por dificultad, porque la dificultad la resolvió la
# tabla y no la persona. Un `ln(x)/x` copiado no vale más que un `x²` copiado.
XP_PEEKED = 5


def xp_base_de(tier: int) -> int:
    """La XP de un acierto limpio al primer intento, por tier.

    El tier se acota en vez de tener un default: una plantilla nueva que caiga
    fuera de la tabla es más difícil que las de acá (los tiers 6-8 están
    reservados para la regla de la cadena, ver elo.BETA_SEED), y subpagar lo
    difícil es justo el error que esto viene a arreglar. `check_game_xp.py`
    comprueba que ninguna plantilla del catálogo necesite el clamp.
    """
    return XP_POR_TIER[min(max(tier, _TIER_MIN), _TIER_MAX)]


def xp_for_answer(
    attempt_number: int,
    correct: bool,
    tier: int,
    combo_after: int,
    *,
    peeked: bool = False,
    explained: bool = False,
) -> tuple[int, int]:
    """Devuelve (xp_total, combo_bonus) por esta respuesta.

    El orden de las reglas es el orden en que se pisan unas a otras:

      1. `explained` gana sobre todo. Leído el ¿Por qué?, la respuesta estaba
         escrita, y con qué intento se la copió no cambia nada.
      2. `peeked` va después, por lo mismo pero un escalón más arriba: la tabla
         da la fila, no la derivada de este ejercicio.
      3. Y recién ahí el intento, todos como fracción de la base del tier: la
         entera al primero, `_FRACCION_SEGUNDO` al segundo, `_FRACCION_INSISTIENDO`
         de ahí en adelante.

    Los intentos son ilimitados —se responde hasta acertar o saltear, ver
    TOPE_DE_INTENTOS en router.py— así que hace falta un número para el resto de
    la cola, y no puede ser cero: insistir hasta sacarla es la conducta que el
    juego quiere, y un acierto que no paga nada apaga el festejo entero (el
    conteo no corre con 0 de XP). De ahí el piso de 1.

    El bonus de combo es solo del primer intento y solo si no hubo ayuda: el
    segundo intento ya vio el color, y una racha que se completa mirando no es
    una racha.

    El multiplicador de la universidad NO está acá: lo aplica `_otorgar_xp` en
    router.py sobre lo que esta función devuelva, porque depende de la base y no
    de la respuesta.
    """
    if not correct:
        return 0, 0
    if explained:
        return XP_EXPLICADO, 0
    if peeked:
        return XP_PEEKED, 0

    base = xp_base_de(tier)
    if attempt_number == 1:
        bonus = (
            max(1, round(base * _FRACCION_COMBO))
            if combo_after > 0 and combo_after % COMBO_INTERVAL == 0
            else 0
        )
        return base + bonus, bonus
    fraccion = _FRACCION_SEGUNDO if attempt_number == 2 else _FRACCION_INSISTIENDO
    return max(1, round(base * fraccion)), 0
