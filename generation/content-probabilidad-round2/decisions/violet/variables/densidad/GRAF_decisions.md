# Decisiones, GRAF.json (topic: violet/variables/densidad)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| lectura-altura-uniforme | 6 | 1 | 5 | 6 |
| lectura-area-probabilidad | 6 | 1 | 5 | 6 |
| comparacion-forma | 3 | 1 | 2 | 3 |
| **Total** | **15** | 3 | 12 | **15** |

## Contextos usados
Densidades uniformes en contextos rotados (tiempos de espera, llamadas, mediciones) sin repetir el mismo escenario más del ~30%. `violet` no usa gráficos con imagen real; `graph_fn`/`graph_view`/`graph_shade` quedan `null` en todos, igual que en los preexistentes.

## Decisiones de contenido
El agente que generó este ítem se interrumpió antes de terminar el pulido del validador, dejando un ERROR estructural (`correct_index=1` en 9/15 ítems, sobre el 50% permitido). El orquestador corrigió reordenando `options`+`feedback_incorrect` (contenido sin cambios, solo posición) en 2 ejercicios para rebalancear a 7/15, y acortó un párrafo de enunciado que excedía por 1 char el límite de 130 (regla 36).

## Warnings que quedaron
Ninguno. `python content/validate_content.py --course probabilidad --topic violet/variables/densidad` → 0 ERRORS, 0 WARNINGS en los 3 ítems del topic.
