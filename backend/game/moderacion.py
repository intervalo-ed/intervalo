"""Reportar y bloquear en el chat (Apple 1.2).

Lo mínimo que se pide a una app con texto de usuarios: poder reportar un mensaje,
poder bloquear a quien lo escribió, y que alguien se entere de los reportes.

· Reportar: una persona, un mensaje, un reporte. Con `UMBRAL_REPORTES` personas
  distintas el mensaje se baja solo (`hidden`) — con uno solo, cualquiera podría
  borrar lo que no le gusta. Al que reporta el mensaje le desaparece enseguida.
· Bloquear: es de quien mira. Lo del bloqueado deja de llegarle, pasado y futuro;
  a él no se le avisa.
· Cada reporte nuevo manda un mail (`MODERACION_EMAIL`), para poder responder en
  el día y bajar a mano lo que haga falta. Sin `RESEND_API_KEY` (desarrollo) solo
  queda en el log.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
from html import escape

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import GameBlock, GameMessage, GameMessageReport, GamePlayer

log = logging.getLogger("intervalo.moderacion")

# Cuántas personas distintas tienen que reportar un mensaje para que se baje solo.
UMBRAL_REPORTES = 3

_MODERACION_EMAIL_DEFECTO = "hola@intervalo.xyz"


class MensajeNoExiste(Exception):
    pass


class EsTuyo(Exception):
    """Reportar o bloquearse a uno mismo."""


def _mensaje(db: Session, mensaje_id: int) -> GameMessage:
    m = db.get(GameMessage, mensaje_id)
    if m is None:
        raise MensajeNoExiste()
    return m


def reportar(db: Session, lector: GamePlayer, mensaje_id: int) -> tuple[GameMessage, int] | None:
    """Registra el reporte. Devuelve `(mensaje, total)` si es nuevo y `None` si
    esa persona ya lo había reportado. Commitea."""
    m = _mensaje(db, mensaje_id)
    if m.player_id == lector.id:
        raise EsTuyo()
    db.add(GameMessageReport(message_id=m.id, reporter_id=lector.id, created_at=datetime.utcnow()))
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        return None
    total = (
        db.query(func.count(GameMessageReport.id))
        .filter(GameMessageReport.message_id == m.id)
        .scalar()
    )
    if total >= UMBRAL_REPORTES:
        m.hidden = True
    db.commit()
    return m, total


def bloquear(db: Session, lector: GamePlayer, mensaje_id: int) -> None:
    """Bloquea al autor del mensaje. Idempotente. Commitea."""
    m = _mensaje(db, mensaje_id)
    if m.player_id == lector.id:
        raise EsTuyo()
    db.add(GameBlock(blocker_id=lector.id, blocked_id=m.player_id, created_at=datetime.utcnow()))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()


def avisar_del_reporte(
    *, mensaje_id: int, autor_id: int, alias: str, texto: str, total: int, quien: str
) -> None:
    """Mail al responsable. Corre fuera del pedido (BackgroundTasks): un Resend
    lento no tiene que hacer esperar a quien reportó. Nunca levanta. Recibe
    valores sueltos y no las filas: cuando corre, la sesión del pedido ya se cerró."""
    destino = os.environ.get("MODERACION_EMAIL", _MODERACION_EMAIL_DEFECTO)
    bajado = "sí, ya se bajó solo" if total >= UMBRAL_REPORTES else "no"
    asunto = f"Reporte en el chat: @{alias} ({total})"
    texto = (
        f"Reportaron un mensaje del chat.\n\n"
        f"Autor: @{alias} (jugador {autor_id})\n"
        f"Mensaje #{mensaje_id}: {texto}\n"
        f"Reportado por: @{quien}\n"
        f"Reportes: {total} (se baja solo con {UMBRAL_REPORTES}). ¿Bajado? {bajado}.\n\n"
        f"Para bajarlo a mano: UPDATE game_messages SET hidden = true WHERE id = {mensaje_id};"
    )
    log.warning("reporte de chat: %s", texto.replace("\n", " | "))
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        return
    try:
        import resend

        resend.api_key = api_key
        resend.Emails.send(
            {
                "from": os.environ.get("LIFECYCLE_FROM_EMAIL", "Intervalo <hola@comms.intervalo.xyz>"),
                "to": destino,
                "subject": asunto,
                "text": texto,
                "html": "<pre style=\"font-family:inherit;white-space:pre-wrap\">" + escape(texto) + "</pre>",
            }
        )
    except Exception:
        log.exception("No se pudo mandar el mail del reporte a %s", destino)
