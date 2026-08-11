# Decisiones, RESL.json (topic: white/conteo/combinaciones)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| resl-directo | 7 | 1 | 6 | 7 |
| resl-comparacion-variacion | 3 | 1 | 2 | 3 |
| resl-simetria | 2 | 1 | 1 | 2 |
| resl-con-condicion | 3 | 1 | 2 | 3 |
| **Total** | **15** | **4** | **11** | **15** |

## Contextos usados

- `resl-directo` (6 nuevos, sobre apretones de manos con $n=6$ ya existente): mazo especial de 8 cartas (elegir 3), comité de 9 personas (elegir 4), sorteo de 10 números (elegir 2 ganadores), heladería de 7 sabores (elegir 3), delegación de 11 estudiantes (elegir 5), apretones de manos en una reunión de 9 personas (variante numérica del mismo contexto reservado a este topic, con $n$ distinto del ya existente). 6 contextos, con "apretones/saludos" repetido una sola vez respecto del ya existente (dentro del ~30% permitido para 7 ejercicios totales).
- `resl-comparacion-variacion` (2 nuevos, sobre $n=8,k=3$ ya existente): mismo formato abstracto de comparación $\binom{n}{k}$ vs. $V_{n,k}$ con $n=7,k=2$ y $n=10,k=4$, números distintos de los ya usados.
- `resl-simetria` (1 nuevo, sobre $n=12,k=9/3$ ya existente): mismo patrón con $n=9,k=2/7$, números distintos.
- `resl-con-condicion` (2 nuevos, sobre caso "incluir" con $n=9$ ya existente): caso "incluir" con $n=11,k=5$ (números distintos) y caso "excluir" con $n=10,k=4$, completando los dos casos de la tabla del topic-context.md.

## Decisiones de contenido

- Se mantuvo la cardinalidad de 4 opciones numéricas en todos los ejercicios nuevos, igual que los 4 ya existentes, cumpliendo el límite de ancho visual de la grilla 2×2 (todas las opciones son enteros cortos entre 1 y 6 dígitos).
- Para balancear `correct_index` (máx 50% en un mismo índice; antes del ajuste 14/15 estaban en índice 0), se reordenaron las opciones de 10 de los 11 ejercicios nuevos, manteniendo el valor numérico y el razonamiento de cada distractor, y moviendo el `feedback_incorrect` en paralelo. Distribución final: 4/4/4/3 entre los índices 0-3.
- Todos los valores numéricos de los ejercicios nuevos se verificaron por cálculo directo de $\binom{n}{k}$ (con Python) antes de escribirlos, incluidos los valores de los distractores que referencian binomios cercanos reales (ej. $\binom{9}{3}=84$, $\binom{9}{1}=9$ en el ejercicio de simetría con $n=9$).
- Sin desvíos de contenido matemático respecto del plan: todo $k<n$, los casos de condición usan $\binom{n-1}{k-1}$ (incluir) y $\binom{n-1}{k}$ (excluir) correctamente, y las explicaciones de `resl-comparacion-variacion` derivan primero la relación algebraica $V_{n,k}/\binom{n}{k}=k!$ antes de sustituir los valores numéricos concretos (regla de explicación en comparaciones).

## Warnings que quedaron

Ninguno. El validador corre con 0 ERRORS y 0 WARNINGS sobre el ítem completo (15/15 ejercicios) tras el rebalanceo de `correct_index`.
