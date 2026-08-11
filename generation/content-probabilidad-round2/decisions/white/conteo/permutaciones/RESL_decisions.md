# Decisiones, RESL.json (topic: white/conteo/permutaciones)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| resl-simple | 7 | 1 | 6 | 7 |
| resl-con-repeticion | 6 | 1 | 5 | 6 |
| resl-comparacion | 2 | 1 | 1 | 2 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- **resl-simple**: ya había "podio de 4 finalistas de carrera". Nuevos: horario de entrevista de 2 candidatos, podio de 3 finalistas de un concurso, orden de llegada de 5 corredores, playlist de 6 canciones, fila para foto de 7 alumnos, orden de reparto de 4 paquetes. Cubre $n$ de 2 a 7, como pide la regla del topic ($n\leq7$).
- **resl-con-repeticion**: ya había anagrama NANA (N×2, A×2, 4 letras). Nuevos: anagramas ALAS (A×2, 4 letras), CARRO (R×2, 5 letras), AZADA (A×3, 5 letras), CUELLO (L×2, 6 letras), TERROR (R×3, 6 letras). Se eligieron a propósito las 5 combinaciones $(n,k)$ posibles dentro de $n\in\{4,5,6\}$, $k\in\{2,3\}$ (excluyendo $(4,3)$, sin palabra española natural disponible), para no repetir el mismo resultado numérico dos veces.
- **resl-comparacion**: ya había comparación ROMA (simple) vs. ANANA (con repetición). Nuevo: comparación entre dos permutaciones simples de $n$ distinto (carrera de 4 corredores vs. carrera de 6), para cubrir el otro caso que menciona la tabla del topic ("dos $n$ distintos").

Ningún contexto se repitió más del 30% dentro de una misma sub-familia.

## Decisiones de contenido

- **Palabras de anagrama con un solo grupo repetido (2 o 3 letras)**: ALAS, CARRO, AZADA, CUELLO, TERROR. Se evitó reusar NANA (ya usada, con dos grupos) y se armó el set para que los 5 resultados numéricos fueran distintos entre sí (12, 60, 20, 360, 120), evitando que dos ejercicios de la sub-familia tuvieran la misma respuesta correcta.
- **Ejercicio de $n=7$ (fila de 7 alumnos)**: la expansión completa del factorial ($7\times6\times5\times4\times3\times2\times1$) en un bloque `$$...$$` disparó el warning de regla 38 (bloque display largo sin `aligned`, conviene verticalizar). Se resolvió mostrando solo `$$P_7 = 7!$$` seguido de `$$7! = 5040$$`, sin la cadena de multiplicaciones intermedia (a diferencia de los ejercicios de $n\leq6$, donde la cadena completa entra cómoda).
- **Cierre de la explicación de `resl-comparacion` nuevo**: la redacción original usaba la frase "es un error común", que el validador marca como anuncio de diagnóstico prohibido (regla 34). Se reescribió en la familia "consecuencia directa" ("Subestimar cuánto crece el factorial hace pensar que sumar pocos corredores cambia poco el resultado, cuando en realidad lo multiplica varias veces").
- Distribución de `correct_index` planificada de entrada junto con `formula-simple`/`resl-con-repeticion` para no concentrar la respuesta en un solo índice: final `{0: 1, 1: 7, 2: 7}` sobre 15 (46,7% máximo, dentro del límite del 50%).

## Warnings que quedaron

Ninguno tras las dos correcciones anteriores. `validate_content.py --course probabilidad --topic white/conteo/permutaciones` corre en 0 ERRORS / 0 WARNINGS para los 3 ítems del topic.
