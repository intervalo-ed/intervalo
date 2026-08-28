"""Tope de pedidos del minijuego.

El juego no tenía ninguno, y tiene dos puertas abiertas de par en par: crear un
jugador invitado no pide credenciales de ningún tipo, y responder hace trabajar a
sympy. Un bucle contra cualquiera de las dos llena la tabla de jugadores o come
el CPU de la única instancia — y el peor momento para que eso pase es justo el
mejor: cuando el link se está compartiendo.

**Por qué no una biblioteca.** slowapi y limits querrían Redis para servir de
algo con varios procesos, y acá no hay Redis. Este tope vive en memoria del
proceso, así que con N workers el techo real es N veces el declarado. Eso está
bien para lo que hace falta: no es una cuota de facturación, es un freno para que
un bucle no voltee el servicio. Un factor de tres o cuatro no cambia esa función.

**Por qué se cuenta por JUGADOR y no por IP donde se puede.** El público objetivo
entra desde el wifi de la universidad y desde datos móviles, o sea detrás de NAT:
por una misma IP pueden salir un aula entera o media ciudad. Contar por IP ahí
sería castigar a quien estudia acompañado. Donde ya hay identidad —responder,
pedir otra derivada, saltear— se cuenta por jugador, que es una persona. La IP
queda solo para el alta, que es el único lugar donde todavía no hay a quién
contarle.
"""

from __future__ import annotations

import time
from collections import deque

from fastapi import Depends, HTTPException, Request

from models import GamePlayer

from .deps import get_current_player

# Cuántas claves distintas se recuerdan. Es un diccionario en memoria y nadie lo
# limpia salvo esto: sin tope, una andanada desde IPs distintas lo haría crecer
# hasta quedarse sin memoria, que es el mismo problema que vino a resolver.
_MAX_CLAVES = 20_000

_VENTANA_SEGUNDOS = 60.0

_marcas: dict[str, deque[float]] = {}


def _permitir(clave: str, por_minuto: int, ahora: float) -> bool:
    marcas = _marcas.get(clave)
    if marcas is None:
        if len(_marcas) >= _MAX_CLAVES:
            # Se desaloja la más vieja. `dict` conserva el orden de inserción, y
            # como acá solo se insertan claves nuevas, la primera es la que hace
            # más tiempo que no aparece.
            _marcas.pop(next(iter(_marcas)), None)
        marcas = _marcas[clave] = deque()

    limite = ahora - _VENTANA_SEGUNDOS
    while marcas and marcas[0] < limite:
        marcas.popleft()
    if len(marcas) >= por_minuto:
        return False
    marcas.append(ahora)
    return True


def _ip(request: Request) -> str:
    """La IP del cliente, mirando el proxy.

    Railway termina TLS adelante, así que `request.client.host` es siempre la del
    proxy: sin leer `X-Forwarded-For`, todo el tráfico compartiría una sola clave
    y el tope se dispararía para todos a la vez. Se toma el PRIMER valor de la
    cadena, que es el que agregó el proxy de más afuera.
    """
    reenviada = request.headers.get("x-forwarded-for")
    if reenviada:
        return reenviada.split(",")[0].strip()
    return request.client.host if request.client else "desconocido"


def _rechazar():
    # 429 con Retry-After: es lo que un cliente bien portado necesita para saber
    # que no es un error suyo y que puede volver.
    raise HTTPException(
        status_code=429,
        detail="Muchos pedidos seguidos. Esperá unos segundos.",
        headers={"Retry-After": "30"},
    )


def por_ip(por_minuto: int):
    """Tope por IP, para lo que todavía no tiene jugador."""

    def dependencia(request: Request) -> None:
        if not _permitir(f"ip:{_ip(request)}", por_minuto, time.monotonic()):
            _rechazar()

    return dependencia


def por_jugador(por_minuto: int):
    """Tope por jugador, para lo que ya tiene identidad."""

    def dependencia(player: GamePlayer = Depends(get_current_player)) -> None:
        if not _permitir(f"jugador:{player.id}", por_minuto, time.monotonic()):
            _rechazar()

    return dependencia


def olvidar_todo() -> None:
    """Para los chequeos, que hacen muchos pedidos seguidos a propósito."""
    _marcas.clear()
