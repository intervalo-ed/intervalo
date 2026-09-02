"""Números que se ciclan en vez de repetirse antes de tiempo.

`random.Random.randint`/`.choice` puros pueden servir el mismo coeficiente
tres veces seguidas — no está mal matemáticamente, pero se siente repetitivo.
`CyclingRandom` envuelve un `random.Random` real (sigue haciendo falta para
barajar) y agrega memoria por "ranura": cada nombre agota su dominio completo
antes de volver a barajar y repetir un valor.

La memoria es externa (`state`, un dict mutado in-place) para que quien llama
decida qué persistir y dónde — acá no hay nada de jugadores ni de base de
datos, ver game/generator.py::serve_exercise.
"""

from __future__ import annotations

import random
from typing import Any, Sequence


class CyclingRandom:
    def __init__(self, rng: random.Random, state: dict[str, list]) -> None:
        self._rng = rng
        self._state = state

    def randint(self, slot: str, lo: int, hi: int) -> int:
        return self._draw(slot, list(range(lo, hi + 1)))

    def choice(self, slot: str, options: Sequence[Any]) -> Any:
        # Se conserva la lista tal cual la pasa el template, duplicados
        # incluidos: si `options` repite un valor para pesarlo más
        # (`[1, 1, 2, 3]`), acá ese valor tarda el doble en agotarse en vez de
        # perder el sesgo.
        return self._draw(slot, list(options))

    def _draw(self, slot: str, domain: list) -> Any:
        remaining = self._state.get(slot) or []
        if not remaining:
            remaining = domain[:]
            self._rng.shuffle(remaining)
        value = remaining.pop()
        self._state[slot] = remaining
        return value


class ForcedRandom:
    """Ignora el dominio y devuelve un valor fijo por ranura — para servir una
    instancia EXACTA (ver game/generator.py::ONBOARDING). No participa del
    ciclado: no toca ningún estado persistido."""

    def __init__(self, values: dict[str, Any]) -> None:
        self._values = values

    def randint(self, slot: str, lo: int, hi: int) -> int:
        return self._values[slot]

    def choice(self, slot: str, options: Sequence[Any]) -> Any:
        return self._values[slot]
