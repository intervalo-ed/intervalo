# Decisiones, GRAF.json (topic: violet/variables/acumulada)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| lectura-diferencia-acumulada | 6 | 1 | 5 | 6 |
| lectura-limites-acumulada | 5 | 1 | 4 | 5 |
| lectura-discreta-vs-continua | 4 | 1 | 3 | 4 |
| **Total** | **15** | 3 | 12 | **15** |

## Contextos usados
Contextos rotados (tiempos de espera, densidades uniformes, funciones de probabilidad puntual discretas) sin repetir el mismo escenario más del ~30%. `violet` no usa gráficos con imagen real; `graph_fn`/`graph_view`/`graph_shade` quedan `null`.

## Decisiones de contenido
El agente que generó este ítem se interrumpió antes de terminar el pulido del validador. El orquestador completó la corrección: se dividieron 2 párrafos con 3-4 fragmentos LaTeX inline (regla 21) en `explanation`, y se usó notación de conjunto (`$\{0,1,2\}$`) en vez de enumerar cada valor por separado (`$0$, $1$, $2$`) en 3 lugares, reduciendo la densidad de fragmentos sin perder precisión.

## Warnings que quedaron
Ninguno. `python content/validate_content.py --course probabilidad --topic violet/variables/acumulada` → 0 ERRORS, 0 WARNINGS en los 3 ítems del topic.
