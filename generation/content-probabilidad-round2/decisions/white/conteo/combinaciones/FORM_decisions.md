# Decisiones, FORM.json (topic: white/conteo/combinaciones)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| formula-directa | 7 | 1 | 6 | 7 |
| identificar-formula-correcta | 4 | 1 | 3 | 4 |
| propiedad-simetria | 2 | 1 | 1 | 2 |
| formula-con-condicion | 2 | 1 | 1 | 2 |
| **Total** | **15** | **4** | **11** | **15** |

## Contextos usados

- `formula-directa` (6 nuevos, sobre mazo de 40 cartas ya existente): plantel de fútbol (15 jugadores, elegir 4), rifa (30 boletos, elegir 2 números ganadores), biblioteca (20 libros, elegir 6 para donar), pizza (12 ingredientes, elegir 5), jurado (18 candidatos, elegir 3), mazo de cartas (48 cartas, elegir 4, distinto del mazo de 40 ya existente). 6 contextos, ninguno repetido dos veces.
- `identificar-formula-correcta` (3 nuevos, sobre ejercicio abstracto $n,k$ ya existente): armado de equipo (abstracto $n,k$, sin roles), rifa con premios idénticos (abstracto $n,k$), biblioteca con números concretos ($n=9,k=4$). Se varió deliberadamente el nivel de abstracción (2 abstractos con contexto distinto, 1 con números concretos) para no repetir la misma estructura 4 veces.
- `propiedad-simetria` (1 nuevo, sobre $n=10,k=3/7$ ya existente): mismo patrón abstracto de simetría con $n=14,k=5/9$, números distintos de los ya usados en el archivo (10, 3, 7).
- `formula-con-condicion` (1 nuevo, sobre caso "excluir" ya existente): caso "incluir obligatoriamente", completando los dos casos (incluir/excluir) que documenta la tabla del topic-context.md.

## Decisiones de contenido

- Se mantuvo la cardinalidad de 4 opciones en todos los ejercicios de FORM (incluidos los conceptuales de `identificar-formula-correcta`), igual que los 4 ejercicios ya existentes en el archivo, aunque el checklist del `topic-context.md` sugiere 3 opciones para "CLSF/FORM conceptual". Se priorizó el formato ya validado del propio archivo (regla de la sección 1 del ciclo: "los ejercicios ya existentes son referencia de formato exacto") por sobre esa línea del checklist, que aparenta ser una plantilla genérica no específica de este ítem: las expresiones combinatorias entran cómodas en la grilla 2×2 numérica/de expresión corta (regla de cardinalidad de `authoring-context.md`).
- Para balancear `correct_index` (máx 50% en un mismo índice; antes del ajuste 8/15 estaban en índice 0), se reordenaron las opciones de 9 de los 11 ejercicios nuevos (y de 2 no tocados en contenido, solo en posición), manteniendo el contenido matemático de cada opción y moviendo el `feedback_incorrect` en paralelo. Distribución final: 4/4/4/3 entre los índices 0-3.
- Dos explicaciones nuevas (`identificar-formula-correcta`, contexto rifa y contexto biblioteca) se reescribieron partiendo un tramo de prosa en dos párrafos con `\n\n` para bajar de 3-5 fragmentos LaTeX inline en el mismo tramo a 2 o menos (regla 21), sin cambiar el contenido matemático.
- Se acortó el enunciado del ejercicio de rifa de `formula-directa` (se sacó "en que salen") para cumplir el límite de ~130 caracteres de prosa del enunciado (regla 36).
- Sin desvíos de contenido matemático respecto del plan: toda fórmula nueva razona el denominador (regla crítica 25), y las de `formula-con-condicion` usan $\binom{n-1}{k-1}$ (incluir) y $\binom{n-1}{k}$ (excluir, ya existente) correctamente.

## Warnings que quedaron

Ninguno. El validador corre con 0 ERRORS y 0 WARNINGS sobre el ítem completo (15/15 ejercicios) tras el rebalanceo de `correct_index`, la partición de los dos tramos de prosa con demasiados fragmentos inline y el acortamiento del enunciado largo.
