"""Minijuego de derivadas (/derivadas, API en /game/derivemos).

El prefijo de la API todavía dice "derivemos", de cuando el juego se llamó así
un rato. No se renombró junto con la marca a propósito: cambiarlo obliga a
desplegar backend y front en el mismo movimiento, y no lo ve ningún usuario.

Bounded context separado del motor SM-2: generación procedural de derivadas,
Elo propio (jugador × plantilla), XP y ranking propios. No toca `users.total_xp`
ni escribe en `sessions`/`answers`.

Con UNA excepción, y va en un solo sentido: `game_boosts` es tabla compartida.
Un cafecito invitado acá multiplica también el XP de estudio de esa universidad
en Intervalo clásico, así que el motor SM-2 LEE de este paquete
(backend/xp_boost.py → game.boosts). Nada de game/ escribe del otro lado: la
ingesta de donaciones, el socket y el mail siguen viviendo enteros acá.
"""
