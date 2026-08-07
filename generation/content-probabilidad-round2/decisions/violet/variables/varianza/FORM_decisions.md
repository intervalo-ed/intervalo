# Decisiones, FORM.json (topic: violet/variables/varianza)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| definicion-varianza | 5 | 1 | 4 | 5 |
| formula-operativa | 5 | 1 | 4 | 5 |
| propiedad-escalado | 5 | 1 | 4 | 5 |
| **Total** | **15** | 3 | 12 | **15** |

## Contextos usados
FORM se mantiene mayormente abstracto por diseño (regla 43), trabajando la definición $Var(X)=E[(X-\mu)^2]$, la fórmula operativa $E[X^2]-(E[X])^2$ y la propiedad de escalado $Var(aX+b)=a^2Var(X)$ de forma genérica.

## Decisiones de contenido
El agente que generó este ítem se interrumpió antes de terminar el pulido del validador (17 warnings pendientes). El orquestador completó la corrección directamente sobre el JSON ya generado, sin agregar/quitar ejercicios: se separó la pregunta "¿...?" a su propio párrafo en 6 enunciados que la traían pegada al planteo (regla 36), se dividieron varios párrafos con 3+ fragmentos LaTeX inline (regla 21), se evitó repetir literalmente términos como `$E[X^{2}]$`/`$(E[X])^{2}$` ya mostrados en un bloque display inmediatamente anterior (regla 35), se rebalancearon 3 sets de `options` (regla 4), y se reescribieron 3 `feedback_correct` que encadenaban 3+ igualdades para dejarlos más cortos.

## Warnings que quedaron
Ninguno. `python content/validate_content.py --course probabilidad --topic violet/variables/varianza` → 0 ERRORS, 0 WARNINGS en los 2 ítems del topic.
