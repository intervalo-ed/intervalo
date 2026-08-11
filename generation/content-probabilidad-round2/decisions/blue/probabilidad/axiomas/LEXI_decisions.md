# Decisiones, LEXI.json (topic: blue/probabilidad/axiomas)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `definicion-complemento-prob` | 5 | 1 | 4 | 5 |
| `definicion-regla-union` | 5 | 1 | 4 | 5 |
| `definicion-rango-probabilidad` | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- `definicion-complemento-prob`: control de calidad (ya había) → encuesta (café), estudio previo (tratamiento), mazo de truco (espada), urna (bolita roja). 5 contextos distintos, ninguno repetido.
- `definicion-regla-union`: encuesta (ya había) → control de calidad, estudio previo (síntomas), mazo de truco, urna. 5 contextos distintos.
- `definicion-rango-probabilidad`: estudio deportivo (ya había) → encuesta (recomendación), control de calidad (rechazo de lote), mazo de truco (ganar la mano), urna (bolita clara). 5 contextos distintos.

Ningún contexto se repite dentro de una misma sub-familia (0% de repetición, muy por debajo del tope de ~30%).

## Decisiones de contenido

- En `definicion-rango-probabilidad`, siguiendo la nota de dificultad de `authoring-context.md` (camuflar el valor fuera de rango con una operación mínima), los 4 ejercicios nuevos presentan el valor inválido como la suma de dos datos parciales de un mismo contexto (dos sucursales, dos muestras, dos rondas, dos lotes), nunca como un número aislado fuera de `[0,1]`.
- Primera vuelta de generación produjo 2 warnings de regla 21 (4 y 3 fragmentos LaTeX inline en el mismo párrafo, ítems `definicion-complemento-prob` #2 y #3) y 2 warnings de regla 36 (párrafos de `question` de 154 y 152 caracteres en `definicion-rango-probabilidad` #2 y #3). Se corrigieron partiendo los párrafos afectados con `\n\n` adicionales antes de la entrega final; el validador quedó en 0 warnings.
- Sin otros desvíos del plan.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic blue/probabilidad/axiomas` corre con 0 ERRORS y 0 WARNINGS sobre los 3 ítems del topic (incluido este archivo).
