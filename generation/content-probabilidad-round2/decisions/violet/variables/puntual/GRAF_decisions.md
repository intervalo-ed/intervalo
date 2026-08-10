# Decisiones, GRAF.json (topic: violet/variables/puntual)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| lectura-barra-faltante | 5 | 1 | 4 | 5 |
| lectura-puntual-directa | 5 | 1 | 4 | 5 |
| lectura-evento-compuesto | 5 | 1 | 4 | 5 |
| **Total** | **15** | 3 | 12 | **15** |

## Contextos usados
Gráficos de barras de variable discreta (clientes, dados, monedas, encuestas) rotados sin repetir el mismo escenario más del ~30% dentro de una sub-familia. Nota: `violet` no usa gráficos con imagen real (eso es exclusivo de `brown/distribuciones`); `graph_fn`/`graph_view`/`graph_shade` quedan `null` en todos los ejercicios, igual que en los preexistentes.

## Decisiones de contenido
Sin desvíos del plan.

## Warnings que quedaron
Ninguno tras corrección manual final: se corrigió un ejercicio con 3 fragmentos LaTeX inline en el mismo tramo del enunciado (regla 21), dividiendo el párrafo en dos. `python content/validate_content.py --course probabilidad --topic violet/variables/puntual` → 0 ERRORS, 0 WARNINGS.
