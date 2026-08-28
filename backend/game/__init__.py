"""Minijuego de derivadas (/derivadas, API en /game/derivemos).

El prefijo de la API todavía dice "derivemos", de cuando el juego se llamó así
un rato. No se renombró junto con la marca a propósito: cambiarlo obliga a
desplegar backend y front en el mismo movimiento, y no lo ve ningún usuario.

Bounded context separado del motor SM-2: generación procedural de derivadas,
Elo propio (jugador × plantilla), XP y ranking propios. No toca `users.total_xp`
ni escribe en `sessions`/`answers`.
"""
