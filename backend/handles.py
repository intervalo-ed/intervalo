"""El único dueño de los nombres de usuario de Intervalo.

Antes había dos módulos decidiendo quién se llama cómo, y no se hablaban:
`usernames.py` validaba contra `users` y `game/aliases.py` contra
`game_players` ∪ `game_alias_history`. El mismo string podía terminar siendo de
dos personas distintas, una en cada producto — y con `?r=<@>` cruzando los dos,
eso significa pagarle los reclutas al que no fue.

Acá vive esa decisión, una sola vez. `models.Handle` es la autoridad;
`users.username` y `game_players.alias` quedan como caché desnormalizado para
que el ranking siga siendo una consulta de una sola tabla. **Nada fuera de este
módulo escribe esas dos columnas.**

Dos reglas que vienen de `game_alias_history` y que no se pueden aflojar, porque
son la razón por la que aquella tabla existía:

  · Soltar un @ NO lo libera. Sigue resolviendo los links `?r=` ya repartidos,
    así que entregárselo a otra persona sería darle también la gente que trajo
    la primera. Por eso se RETIRA y no se borra.
  · La fila retirada sigue apuntando a su dueño, así que el link viejo no muere:
    sigue llevando a quien lo repartió.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import or_
from sqlalchemy.orm import Session

from models import GamePlayer, Handle, User


def _now() -> datetime:
    # utcnow naive, igual que el resto del proyecto.
    return datetime.utcnow()


def duenio(db: Session, handle: str) -> Handle | None:
    """La fila de ese @, esté activa o retirada. `None` si nadie lo tuvo nunca.

    Una sola consulta contra la PK. Es lo que reemplaza la cascada de hasta tres
    SELECT de `game/aliases.py::alias_taken` + `referrals.resolver`.
    """
    if not handle:
        return None
    return db.get(Handle, handle)


def tomado(db: Session, handle: str) -> bool:
    """¿Este @ está tomado? Los retirados cuentan como tomados."""
    return duenio(db, handle) is not None


def activo_de_usuario(db: Session, user_id: int) -> Handle | None:
    return (
        db.query(Handle)
        .filter(Handle.user_id == user_id, Handle.status == "active")
        .first()
    )


def activo_de_jugador(db: Session, player_id: int) -> Handle | None:
    return (
        db.query(Handle)
        .filter(Handle.player_id == player_id, Handle.status == "active")
        .first()
    )


def reclamar(
    db: Session,
    handle: str,
    *,
    user_id: int | None = None,
    player_id: int | None = None,
) -> Handle:
    """Le da este @ a esta persona, retirando el que tuviera. No commitea.

    Levanta `HandleTomado` si el @ ya es de otro. Que la unicidad la garantice
    ADEMÁS un índice de base y no solo este chequeo es a propósito: entre el
    SELECT y el INSERT hay una ventana, y dos altas simultáneas con el mismo
    nombre la encuentran. El que llama tiene que capturar el IntegrityError y
    reintentar, igual que ya hacen `auth.get_or_create_user_from_clerk` y
    `deps.create_guest_player`.
    """
    if not handle:
        raise ValueError("handle vacío")
    if user_id is None and player_id is None:
        raise ValueError("un handle necesita dueño")

    ya = duenio(db, handle)
    if ya is not None:
        if not _es_de(ya, user_id=user_id, player_id=player_id):
            raise HandleTomado(handle)
        # Re-reclamar lo propio: lo único que puede hacer falta es despertar una
        # fila retirada (volver a un @ viejo) y completarle el dueño que le
        # faltaba (un invitado que se registra conserva su @ y suma su user_id).
        _retirar_los_otros(db, handle, user_id=user_id, player_id=player_id)
        ya.status = "active"
        ya.released_at = None
        if user_id is not None:
            ya.user_id = user_id
        if player_id is not None:
            ya.player_id = player_id
        _sincronizar_cache(db, ya)
        return ya

    _retirar_los_otros(db, handle, user_id=user_id, player_id=player_id)
    fila = Handle(
        handle=handle,
        user_id=user_id,
        player_id=player_id,
        status="active",
        claimed_at=_now(),
    )
    db.add(fila)
    db.flush()
    _sincronizar_cache(db, fila)
    return fila


def _es_de(fila: Handle, *, user_id: int | None, player_id: int | None) -> bool:
    if user_id is not None and fila.user_id == user_id:
        return True
    if player_id is not None and fila.player_id == player_id:
        return True
    return False


def _retirar_los_otros(
    db: Session, handle: str, *, user_id: int | None, player_id: int | None
) -> None:
    """Retira los @ activos de este dueño que no sean el que está reclamando.

    Es lo que sostiene el índice parcial de "un solo handle activo por dueño", y
    lo que hace que los @ viejos sigan resolviendo en vez de desaparecer.
    """
    condiciones = []
    if user_id is not None:
        condiciones.append(Handle.user_id == user_id)
    if player_id is not None:
        condiciones.append(Handle.player_id == player_id)
    if not condiciones:
        return
    viejos = (
        db.query(Handle)
        .filter(Handle.status == "active", Handle.handle != handle, or_(*condiciones))
        .all()
    )
    if not viejos:
        return
    for v in viejos:
        v.status = "retired"
        v.released_at = _now()
    # El flush va ACÁ y no al final, y no es una optimización: el índice parcial
    # de "un solo activo por dueño" se evalúa por sentencia, y SQLAlchemy manda
    # los UPDATE en un lote sin orden garantizado. Sin este flush, activar el @
    # nuevo antes de que el viejo quede retirado deja al dueño con dos activos
    # por un instante — y la base lo rebota. Se ve al volver a un @ propio ya
    # soltado, que es el camino normal de "me arrepentí del cambio".
    db.flush()


def _sincronizar_cache(db: Session, fila: Handle) -> None:
    """Baja el handle activo a las dos columnas desnormalizadas.

    `users.username` y `game_players.alias` son copias: existen para que el
    ranking no tenga que joinear con `handles` en cada request. Se escriben acá
    y en ningún otro lado.
    """
    if fila.user_id is not None:
        u = db.get(User, fila.user_id)
        if u is not None and u.username != fila.handle:
            u.username = fila.handle
    if fila.player_id is not None:
        p = db.get(GamePlayer, fila.player_id)
        if p is not None and p.alias != fila.handle:
            p.alias = fila.handle


def reservar_retirado(db: Session, handle: str, *, user_id: int) -> Handle | None:
    """Deja un @ RESERVADO para alguien, sin que sea el que usa. No commitea.

    Existe por un caso que `reclamar` no puede cubrir: un @ que esa persona tenía
    en uso pero que NUNCA entró al registro. Pasa con los usernames que el
    backfill de la migración saltea —el de quien ya tenía fila activa por su
    alias del juego— y que por lo tanto la reconciliación no puede retirar,
    porque retirar es cambiarle el estado a una fila que existe.

    Sin esto, unificar el @ de esas personas les LIBERA el username viejo, y
    cualquiera puede tomarlo. Que es exactamente lo que este registro existe para
    impedir: un @ soltado sigue resolviendo los links `?r=` repartidos.

    Devuelve None si el @ ya tenía dueño, que es el caso normal y no un error.
    """
    if not handle or duenio(db, handle) is not None:
        return None
    fila = Handle(
        handle=handle,
        user_id=user_id,
        status="retired",
        claimed_at=_now(),
        released_at=_now(),
    )
    db.add(fila)
    db.flush()
    return fila


def vincular(db: Session, *, user_id: int, player_id: int) -> None:
    """Une las dos caras de una persona: la de Intervalo y la del juego.

    Se llama cuando un invitado se registra o cuando un usuario estrena jugador.
    El @ que sobrevive es el del JUEGO, si tenía uno: es el que la persona vio en
    pantalla, compartió y bajo el que la conocen en el ranking. El username de
    clásico se retira, pero no se pierde — sigue siendo de esa persona y sus
    links siguen resolviendo.
    """
    del_jugador = activo_de_jugador(db, player_id)
    del_usuario = activo_de_usuario(db, user_id)

    if del_jugador is not None:
        # El username de clásico se retira, pero solo se puede retirar lo que
        # existe: si nunca entró al registro —el alta lo escribía derecho a
        # `users.username`— no hay fila que cambiarle el estado, y
        # `_sincronizar_cache` lo pisa con el alias del juego. Ahí el string
        # queda LIBRE, y con él los links `?r=` que esa persona repartió.
        #
        # Reservarlo es exactamente lo que `reservar_retirado` existe para
        # hacer, y va antes de reclamar: después, la caché ya se pisó y no
        # queda de dónde sacar el nombre viejo.
        if del_usuario is None:
            u = db.get(User, user_id)
            if u is not None and u.username:
                reservar_retirado(db, u.username, user_id=user_id)
        reclamar(db, del_jugador.handle, user_id=user_id, player_id=player_id)
        return
    if del_usuario is not None:
        reclamar(db, del_usuario.handle, user_id=user_id, player_id=player_id)


class HandleTomado(Exception):
    """Ese @ ya es de otra persona (activo o retirado: los dos cuentan)."""

    def __init__(self, handle: str) -> None:
        super().__init__(f"El @ '{handle}' ya está tomado.")
        self.handle = handle
