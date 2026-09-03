"""Reclutas: quién trajo a quién, y el porcentaje que eso paga. En los dos productos.

Una sola relación, dos monedas. Quien entra por el link de alguien le paga un
10% de lo que gane, en la moneda que gane: si estudia en Intervalo clásico paga
XP de clásico, si deriva en el minijuego paga XP de juego. Las dos cuentas se
llevan por separado y nunca se cruzan — el ranking de derivadas no recibe XP de
estudio ni al revés.

Las tres decisiones que hacen que esto no se convierta en otra cosa vienen del
módulo del juego y siguen valiendo igual:

· **La XP se acuña, no se descuenta.** El recluta cobra exactamente lo mismo que
  cobraría sin reclutador. Si alguna vez se pudiera sospechar que entrar por el
  link de alguien te cuesta XP, la mecánica se muere en un solo mensaje.
· **Un solo nivel.** Los reclutas de tus reclutas no te pagan nada.
· **Se anota una vez y no se toca más** — pero ahora "una vez" es POR PERSONA y
  no por fila. Ver `anotar_usuario`.

Este módulo es el de arriba: vive en `backend/` y no en `backend/game/` porque lo
usan los dos motores. `game/referrals.py` importa de acá y re-exporta lo
compartido, así que sus llamadores no se enteran.

Lo que decía antes —que `session_store` "no debería importar del bounded context
del juego"— ya no describe el repo, y conviene decirlo bien: `session_store`
importa `xp_boost`, que importa `game.boosts`, en el camino caliente de cada
respuesta. Es una excepción deliberada y en un solo sentido, y está documentada
donde corresponde (`game/__init__.py`): `game_boosts` es tabla compartida, así
que el motor SM-2 LEE de ese paquete y nada de `game/` escribe del otro lado.
La razón por la que este módulo está acá arriba es la de la primera línea, que
sigue siendo cierta: la arista cuelga de `game_players` y el pago cae en `users`,
así que no le pertenece a ninguno de los dos paquetes.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

import handles
from models import GamePlayer, User

# Qué porcentaje del XP de un recluta cobra quien lo trajo. Va escrito con todas
# las letras en la diapo `¿Reclutas?`, así que cambiarlo acá es cambiar una
# promesa ya hecha: los reclutas viejos empiezan a pagar distinto.
SHARE_PERCENT = 10

# La contabilidad va en CENTÉSIMAS de XP y no en XP.
#
# El 10% de una respuesta de 25 XP son 2,5. Pagando enteros se pagan 2 y se
# pierde el resto en cada respuesta, que sobre el largo plazo es una quinta parte
# de lo prometido. Con centésimas la cuenta es exacta para cualquier porcentaje
# entero: `xp * SHARE_PERCENT` ES la deuda en centésimas, sin redondeo ninguno.
CENTESIMAS = 100


def resolver(db: Session, alias: str | None, *, salvo: int | None = None) -> int | None:
    """El id del JUGADOR dueño de ese @, o None.

    Una sola consulta contra el registro de nombres (backend/handles.py), que
    responde igual para un @ activo o retirado: un link no se puede morir porque
    quien lo mandó cambió de @, y ese es el camino normal —el juego ofrece
    reclutar antes de pedir el registro, y registrarse es cuando se elige el @
    definitivo—.

    `salvo` es el jugador que está por ser reclutado: reclutarse a uno mismo no
    es un caso raro sino el primero que alguien prueba.
    """
    if not alias:
        return None
    registro = handles.duenio(db, alias)
    if registro is None or registro.player_id is None:
        return None
    # La fila apuntada puede haberse borrado (una fusión encadenada) o ser un
    # sembrado: en los dos casos no hay a quién acreditarle nada.
    fila = (
        db.query(GamePlayer.id)
        .filter(GamePlayer.id == registro.player_id, GamePlayer.is_bot.is_(False))
        .first()
    )
    if fila is None or fila.id == salvo:
        return None
    return fila.id


def anotar_usuario(db: Session, user: User, alias: str | None) -> None:
    """Deja anotado quién trajo a esta persona a Intervalo clásico. No commitea.

    Set-once, igual que la atribución de primer contacto y por el mismo motivo:
    quien te trajo te trajo una vez.

    La guarda contra autoreclutarse NO puede ser solo el `salvo` de `resolver`,
    porque en el alta de clásico la mayoría de la gente todavía no tiene fila de
    jugador y ese parámetro sale en None. El camino completo, todo con código que
    ya existe: juego de invitado → comparto mi link → abro mi propio link (mismo
    origen, mismo localStorage) → me anoto en clásico → vuelvo al juego logueado
    y las dos filas se fusionan. Desde ahí cobraría 10% de mi propia XP para
    siempre. Por eso se compara también contra el jugador que YA es de este
    usuario, y por eso `acreditar_clasico` vuelve a chequearlo en runtime.
    """
    if user.referred_by_player_id is not None:
        return
    propio = db.query(GamePlayer.id).filter(GamePlayer.user_id == user.id).first()
    referente = resolver(db, alias, salvo=propio.id if propio else None)
    if referente is None:
        return
    # Segunda guarda: el @ puede ser de un jugador que TODAVÍA no está vinculado
    # a este usuario pero que lo va a estar (el invitado propio, antes de la
    # fusión). `resolver` no lo puede ver porque la fila aún no tiene user_id.
    duenio_del_alias = db.get(GamePlayer, referente)
    if duenio_del_alias is not None and duenio_del_alias.user_id == user.id:
        return
    user.referred_by_player_id = referente


def acreditar_clasico(db: Session, recluta: User, xp_ganada: int) -> int:
    """Le paga a quien trajo a este usuario su parte de la XP de CLÁSICO.

    Devuelve la XP entera acreditada (0 la mayoría de las veces que la parte no
    llega a un punto entero).

    Las dos filas que se tocan se protegen distinto, y cada una como puede:

    · La del RECLUTADOR se paga por SQL relativo (`SET total_xp = total_xp + n`).
      Es la fila de otra persona, que puede estar respondiendo en este mismo
      instante y de la que no tenemos candado, así que la suma la hace la base.
    · La del RECLUTA se relee con `FOR UPDATE`. Su contabilidad en centésimas
      necesita el pendiente actual para partirlo, o sea leer-calcular-escribir, y
      eso no se puede hacer relativo. Es el mismo candado que el minijuego toma
      en `/answer` (deps.lock_player) y por el mismo motivo.

    Si el reclutador todavía no tiene cuenta —es un invitado del juego— la deuda
    se acumula en `game_players.classic_xp_owed` y se salda al registrarse. No se
    pierde: perderla mataría justamente el caso viral.
    """
    if recluta.referred_by_player_id is None or xp_ganada <= 0:
        return 0

    reclutador = db.get(GamePlayer, recluta.referred_by_player_id)
    if reclutador is None:
        return 0
    # Tercera guarda, y la que de verdad cierra el agujero: no pagarse a uno
    # mismo. Cuesta cero consultas extra —el jugador ya está resuelto por PK— y
    # además desactiva las aristas autorreferentes que se hayan creado antes de
    # que existieran las otras dos guardas.
    if reclutador.user_id == recluta.id:
        return 0

    # La fila del RECLUTA se relee tomando su candado antes de tocar el resto en
    # centésimas. El pago al reclutador es SQL relativo y no lo necesita, pero
    # esta parte no se puede hacer así: `divmod` necesita el pendiente actual
    # para partirlo, o sea leer, calcular y escribir. Dos respuestas
    # concurrentes de la misma persona —doble toque, un retry de red sobre otro
    # slot— leían el mismo pendiente y una de las dos escrituras se perdía; el
    # guard de idempotencia por slot no lo cubre porque son slots distintos.
    #
    # En el minijuego esto es seguro porque `/answer` toma `deps.lock_player`;
    # en clásico no había nada equivalente, y el comentario de
    # `session_store.record_answer_db` lo dice con todas las letras. Es el mismo
    # `FOR UPDATE`, sobre la fila que hace falta y por el tiempo que hace falta.
    #
    # El flush va ANTES, y no es un detalle: la sesión tiene `autoflush=False`,
    # así que sin bajar primero lo escrito en esta transacción la relectura
    # traería el valor commiteado y pisaría el resto que dejó el pago anterior.
    # Con dos pagos en la misma transacción, el 10% se volvía 0%.
    db.flush()
    db.refresh(
        recluta,
        ["referral_pending", "referral_xp_given"],
        with_for_update=True,
    )

    debe = recluta.referral_pending + xp_ganada * SHARE_PERCENT
    entera, resto = divmod(debe, CENTESIMAS)
    recluta.referral_pending = resto
    if entera == 0:
        return 0

    recluta.referral_xp_given += entera
    if reclutador.user_id is not None:
        db.query(User).filter(User.id == reclutador.user_id).update(
            {
                User.total_xp: User.total_xp + entera,
                # En el mismo UPDATE, para que las dos no se puedan separar: es
                # lo que después permite preguntar cuánta de la XP de alguien
                # salió de estudiar y cuánta de reclutar (ver el filtro del
                # ranking en main.VISIBLE_EN_RANKING).
                User.referral_xp_earned: User.referral_xp_earned + entera,
            },
            synchronize_session=False,
        )
    else:
        db.query(GamePlayer).filter(GamePlayer.id == reclutador.id).update(
            {GamePlayer.classic_xp_owed: GamePlayer.classic_xp_owed + entera},
            synchronize_session=False,
        )
    return entera


def saldar_deuda_de_clasico(db: Session, player: GamePlayer, user_id: int) -> int:
    """Le paga al jugador la XP de clásico que se ganó antes de tener cuenta.

    Se llama en el momento exacto en que la fila adquiere `user_id`. Devuelve lo
    saldado.

    Se descuenta con un UPDATE RELATIVO en vez de poner el contador en cero: si
    entre la lectura y el saldo entró otro pago —y entra, porque llega como
    UPDATE crudo desde otra transacción— ponerlo en cero lo borraría sin dejar
    rastro. Descontando exactamente lo que se pagó, lo que entró en el medio
    queda pendiente para la próxima.
    """
    monto = player.classic_xp_owed or 0
    if monto <= 0:
        return 0
    db.query(User).filter(User.id == user_id).update(
        {
            User.total_xp: User.total_xp + monto,
            User.referral_xp_earned: User.referral_xp_earned + monto,
        },
        synchronize_session=False,
    )
    db.query(GamePlayer).filter(GamePlayer.id == player.id).update(
        {GamePlayer.classic_xp_owed: GamePlayer.classic_xp_owed - monto},
        synchronize_session=False,
    )
    return monto
