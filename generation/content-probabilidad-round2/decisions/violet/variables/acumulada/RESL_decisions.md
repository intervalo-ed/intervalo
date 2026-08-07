# Decisiones, RESL.json (topic: violet/variables/acumulada)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| resl-acumulada-desde-densidad | 6 | 1 | 5 | 6 |
| resl-diferencia-acumulada | 6 | 1 | 5 | 6 |
| resl-acumulada-desde-puntual | 3 | 1 | 2 | 3 |
| **Total** | **15** | 3 | 12 | **15** |

## Contextos usados
Contextos concretos rotados (densidades uniformes, dados especiales de probabilidad puntual dada) sin repetir el mismo escenario más del ~30%, cumpliendo regla 43.

## Decisiones de contenido
El agente que generó este ítem se interrumpió antes de terminar el pulido del validador. El orquestador completó la corrección: se recortó una repetición innecesaria de "$x=6$" en `explanation` #4 (regla 21), y se usó notación de conjunto (`$\{1,2,3\}$`) en vez de enumerar las 3 caras del dado por separado en `question` #13 (regla 21).

## Warnings que quedaron
Ninguno. `python content/validate_content.py --course probabilidad --topic violet/variables/acumulada` → 0 ERRORS, 0 WARNINGS en los 3 ítems del topic.
