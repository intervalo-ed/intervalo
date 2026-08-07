# Decisiones, RESL.json (topic: violet/variables/varianza)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| resl-varianza-discreta | 5 | 2 | 3 | 5 |
| resl-desviacion-estandar | 4 | 1 | 3 | 4 |
| resl-varianza-escalada | 3 | 1 | 2 | 3 |
| resl-interpretacion | 3 | 0 | 3 | 3 |
| **Total** | **15** | 4 | 11 | **15** |

## Contextos usados
Contextos concretos rotados (goles recibidos, llamadas a una central, peso neto de un producto, puntaje de examen, tiempos de rutas de entrega, notas de grupos) sin repetir el mismo escenario más del ~30%, cumpliendo regla 43.

## Decisiones de contenido
El agente que generó este ítem se interrumpió antes de terminar el pulido del validador. El orquestador completó la corrección: se evitó repetir `$E[X^{2}]$` ya mostrado en un bloque display inmediatamente anterior (regla 35) en 2 explicaciones, se separaron 2 enunciados que mezclaban una fórmula/dato con la pregunta en el mismo tramo (regla 21), se acortaron 2 párrafos de enunciado que excedían el límite de 130 chars (regla 36), y se rebalancearon 2 sets de `options` (regla 4).

## Warnings que quedaron
Ninguno. `python content/validate_content.py --course probabilidad --topic violet/variables/varianza` → 0 ERRORS, 0 WARNINGS en los 2 ítems del topic.
