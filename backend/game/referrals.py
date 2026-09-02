"""Reclutas: quién trajo a quién, y el porcentaje que eso paga.

El link que reparte el botón de WhatsApp lleva el @ de quien comparte
(`intervalo.xyz/derivadas?r=<alias>`). Cuando alguien entra por ahí y se crea su
jugador, ese @ queda anotado en `game_players.referred_by`, y a partir de ese
momento cada derivada que resuelva le paga un porcentaje a quien lo trajo.

Tres decisiones que hacen que esto no se convierta en otra cosa:

· **La XP se acuña, no se descuenta.** El recluta cobra exactamente lo mismo que
  cobraría sin reclutador. Si alguna vez se pudiera sospechar que entrar por el
  link de alguien te cuesta XP, la mecánica se muere en un solo mensaje de
  WhatsApp — y con razón, porque el que la comparte estaría cobrando a costa de
  quien le hizo caso.

· **Un solo nivel.** Los reclutas de tus reclutas no te pagan nada. Con dos
  niveles esto es una pirámide, y además es donde el número explota: el de más
  arriba cobra por el trabajo de gente que nunca vio.

· **Se anota al crear la fila y no se toca más.** Ver el comentario de
  `GamePlayer.referred_by`.

Lo que NO está defendido, y conviene saberlo: nada impide que alguien se cree
jugadores invitados con su propio link desde el mismo teléfono. Se bloquea el
caso obvio —reclutarse a uno mismo— pero no hay huella de dispositivo, así que
el fraude a mano existe. Es barato de detectar mirando los datos (un reclutador
con muchos reclutas de una sola derivada) y caro de prevenir sin pedirle algo a
todo el mundo, así que por ahora se mira y no se atranca.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

import referrals as compartido
from models import GamePlayer

# Qué porcentaje del XP de un recluta cobra quien lo trajo. Va en la diapo
# `¿Reclutas?` escrito con todas las letras, así que cambiarlo acá es cambiar una
# promesa que ya se hizo: los reclutas viejos empiezan a pagar distinto.
SHARE_PERCENT = compartido.SHARE_PERCENT

# La contabilidad va en CENTÉSIMAS de XP y no en XP.
#
# El 10% de una derivada de 25 XP son 2,5. Pagando enteros se pagan 2 y se pierde
# el resto en cada respuesta, que sobre el largo plazo es una quinta parte de lo
# prometido. Con centésimas la cuenta es exacta para cualquier porcentaje entero:
# `xp * SHARE_PERCENT` ES la deuda en centésimas, sin redondeo ninguno.
_CENTESIMAS = compartido.CENTESIMAS


# `resolver` vive en el módulo compartido (backend/referrals.py): resuelve un @
# contra el registro de nombres, que es el mismo para los dos productos. Se
# re-exporta para no tocar a sus llamadores.
resolver = compartido.resolver


def anotar(db: Session, recluta: GamePlayer, alias: str | None) -> None:
    """Deja anotado quién trajo a este jugador, si es que lo trajo alguien.

    No commitea: lo hace quien la llama, junto con el resto del alta.

    Set-once: si la fila ya tiene reclutador, este llamado no hace nada. Es la
    misma guarda que la atribución de primer contacto, y por el mismo motivo —
    quien te trajo te trajo una vez.
    """
    if recluta.referred_by is not None:
        return
    referente = resolver(db, alias, salvo=recluta.id)
    if referente is not None:
        recluta.referred_by = referente


def acreditar(db: Session, recluta: GamePlayer, xp_ganada: int) -> int:
    """Le paga a quien trajo a este jugador su parte de lo que acaba de ganar.

    Devuelve la XP entera acreditada en este llamado (0 la mayoría de las veces
    que la parte no llega a un punto entero).

    El incremento del reclutador va por SQL (`SET xp = xp + n`) y no leyendo y
    escribiendo en Python: es la fila de OTRO jugador, que puede estar
    respondiendo en este mismo instante y de la que no tenemos el candado. Es el
    mismo motivo por el que `simulation.bump_version` se escribe así.
    """
    if recluta.referred_by is None or xp_ganada <= 0:
        return 0

    debe = recluta.referral_pending + xp_ganada * SHARE_PERCENT
    entera, resto = divmod(debe, _CENTESIMAS)
    recluta.referral_pending = resto
    if entera == 0:
        return 0

    recluta.referral_xp_given += entera
    db.query(GamePlayer).filter(GamePlayer.id == recluta.referred_by).update(
        {GamePlayer.xp: GamePlayer.xp + entera}, synchronize_session=False
    )
    return entera
