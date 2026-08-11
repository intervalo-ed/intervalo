# Decisiones, RESL.json (topic: blue/probabilidad/condicional)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `resl-desde-datos` | 6 | 1 | 5 | 6 |
| `resl-conteo-directo` | 5 | 1 | 4 | 5 |
| `resl-despejar-interseccion` | 4 | 1 | 3 | 4 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- `resl-desde-datos`: sin contexto nombrado, abstracto (ya había, y en los 5 nuevos), siguiendo el mismo criterio que `FORM/formula-directa`: esta sub-familia trabaja "probabilidades ya dadas" directamente, distinta de `resl-conteo-directo` que sí ancla en un escenario concreto. Solo se varió $P(A\cap B)$/$P(B)$, todos con cociente de una cifra decimal (0,1 / 0,2 / 0,4 / 0,8 / 0,7), sin repetir el par preexistente (0,3 / 0,6).
- `resl-conteo-directo`: tabla de contingencia transporte/horario (ya había) → dado (par/mayor a 4), moneda (tres tiradas, exactamente dos caras), cartas (mazo reducido, rojas/figuras), tabla de contingencia distinta (clientes/compra en oferta). 4 nuevos, cubriendo dado, moneda, cartas y una segunda tabla de contingencia con escenario distinto al preexistente.
- `resl-despejar-interseccion`: sin contexto nombrado, abstracto (ya había, y en los 3 nuevos), mismo criterio que `FORM/despejar-interseccion`. 3 pares nuevos de $(P(A\mid B), P(B))$, ninguno coincide con el preexistente (0,7 / 0,5).

## Decisiones de contenido

- Siguiendo la nota de diseño del topic ("decimales simples en RESL"), los 5 cocientes nuevos de `resl-desde-datos` dan siempre un decimal de una cifra calculable a simple vista (0,1; 0,2; 0,4; 0,8; 0,7), nunca un cociente de dos decimales no intuitivo.
- Siguiendo la regla del topic ("fracciones sin simplificar en `resl-conteo-directo`"), las fracciones que salen de un conteo se dejaron sin simplificar cuando correspondía (ej. $21/36$ en vez de $7/12$), cuidando que las 4 opciones mantengan longitud pareja entre sí.
- En el ejercicio de las tres monedas (`resl-conteo-directo`), el espacio muestral se enumeró explícitamente en la `explanation` (las tres combinaciones con exactamente dos caras) para que la restricción del conteo condicional quede visible, sin invocar independencia entre tiradas en ningún momento.
- Sin otros desvíos del plan.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic blue/probabilidad/condicional` corre con 0 ERRORS y 0 WARNINGS sobre los 3 ítems del topic (incluido este archivo).
