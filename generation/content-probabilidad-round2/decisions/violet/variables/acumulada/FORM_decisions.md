# Decisiones, FORM.json (topic: violet/variables/acumulada)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| definicion-acumulada | 5 | 1 | 4 | 5 |
| propiedad-diferencia | 5 | 1 | 4 | 5 |
| propiedades-generales | 5 | 1 | 4 | 5 |
| **Total** | **15** | 3 | 12 | **15** |

## Contextos usados
FORM se mantiene mayormente abstracto por diseño (regla 43 lo permite explícitamente), trabajando la fórmula $F(x)=P(X\leq x)$, la diferencia $F(b)-F(a)$ y las propiedades generales (monotonía, límites en $\pm\infty$, rango $[0,1]$) de forma genérica.

## Decisiones de contenido
El agente que generó este ítem se interrumpió antes de terminar el pulido del validador (17 warnings pendientes en este archivo). El orquestador completó la corrección directamente sobre el JSON ya generado, sin agregar/quitar ejercicios: se dividieron ~10 párrafos con 3+ fragmentos LaTeX inline (regla 21) en frases más cortas, se reescribió el cierre de `explanation` #9 que caía en la advertencia de diagnóstico prohibida por la regla 34 ("es una confusión común"), se sacó la fórmula repetida $F(b)-F(a)$ del enunciado de `question` #7 (regla 35), y se lengthened/rebalanced 3 sets de `options` (regla 4) agregando calificadores simétricos a los distractores más cortos.

## Warnings que quedaron
Ninguno. `python content/validate_content.py --course probabilidad --topic violet/variables/acumulada` → 0 ERRORS, 0 WARNINGS en los 3 ítems del topic.
