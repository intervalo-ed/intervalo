# Decisiones, CLSF.json (topic: white/conteo/permutaciones)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| reconocer-permutacion-simple | 5 | 1 | 4 | 5 |
| reconocer-permutacion-repeticion | 3 | 1 | 2 | 3 |
| distractor-variacion | 4 | 1 | 3 | 4 |
| distractor-combinacion | 2 | 1 | 1 | 2 |
| distractor-regla-producto | 1 | 1 | 0 | 1 |
| **Total** | **15** | **5** | **10** | **15** |

## Contextos usados

- **reconocer-permutacion-simple**: ya había "fila para foto" (equipo de fútbol). Nuevos: orden de llegada de una carrera (5 corredores), playlist (4 canciones), podio de un concurso de talentos (3 finalistas), anagrama de una palabra sin repetición (MESA, 4 letras).
- **reconocer-permutacion-repeticion**: ya había anagrama ANANA. Nuevos: anagrama CARRO (R×2, 5 letras), anagrama SILLA (L×2, 5 letras).
- **distractor-variacion**: ya había "elegir 3 de 8 empleados para podio". Nuevos: orden de llegada (elegir 4 de 10 corredores), fila para foto (elegir 4 de 12 alumnos), playlist (elegir y ordenar 5 de 15 canciones).
- **distractor-combinacion**: ya había fila para foto (6 personas). Nuevo: orden de llegada de un podio (4 corredores).
- **distractor-regla-producto**: sin cambios, ya estaba completo con el contexto de examen de opción múltiple.

Ningún contexto se repitió más del 30% dentro de una misma sub-familia (máximo 1 repetición real, la de "orden de llegada"/podio entre `reconocer-permutacion-simple` y `distractor-combinacion`, que son sub-familias distintas).

## Decisiones de contenido

- **Palabras de anagrama nuevas, con un solo grupo repetido (2-3 letras) por palabra**, siguiendo la regla dura del topic ("como máximo un grupo repetido de 2-3 letras idénticas"): CARRO (R×2), SILLA (L×2), MESA (sin repetición, usada como ejemplo de permutación simple). Se evitó reusar `ANANA`/`CASA` (ya usadas en los ejercicios existentes) y se evitaron palabras con dos grupos repetidos (ej. `BANANA`, `MAMÁ`) para no volver a introducir el problema que ya tiene `ANANA` (ver más abajo).
- **Rebalanceo de `correct_index`**: los 5 ejercicios preexistentes del archivo ya tenían `correct_index=0` los cinco. Al completar a 15 ejercicios el validador exigió que ningún índice supere el 50% del total. Para resolverlo sin tocar el contenido de los 5 ejercicios existentes, se reordenó el array `options` (y el array paralelo `feedback_incorrect`) de 8 de los 10 ejercicios nuevos, moviendo la opción correcta a índices 1 o 2 (o al índice 1 en los binarios). El *contenido* de las opciones y de los textos de feedback no cambió, solo su posición. Distribución final: `{0: 7, 1: 6, 2: 2}` sobre 15 (46,7% máximo).
- **Ejercicio "MESA" (permutación simple sin repetición)**: se dividió el enunciado en 3 párrafos cortos (nombre de la palabra, aclaración de que las letras son distintas, pregunta) en vez de una sola oración larga, porque la versión original superaba el límite de 130 caracteres de prosa por párrafo (regla 36).
- **Opción "No, porque el orden de llegada sí importa" del ejercicio de podio (distractor-combinacion nuevo)**: se alargó a "No, porque el orden de llegada entre los corredores sí importa" para igualar mejor la longitud con la otra opción del par binario (regla 15, paridad de longitud en ambos sentidos).
- Los distractores de "variación"/"combinación" describen la situación (nunca nombran la fórmula), siguiendo la regla específica del topic.

## Warnings que quedaron

Ninguno. `validate_content.py --course probabilidad --topic white/conteo/permutaciones` corre en 0 ERRORS / 0 WARNINGS para los 3 ítems del topic tras las correcciones.

**Nota fuera del validador (no bloqueante, no se tocó por no ser un problema real de estos ejercicios nuevos)**: el ejercicio preexistente de `reconocer-permutacion-repeticion` (anagrama **ANANA**, A×3 y N×2) tiene *dos* grupos repetidos, lo que excede la regla del topic de "como máximo un grupo repetido de 2-3 letras idénticas". Es un ejercicio ya existente y matemáticamente correcto (la fórmula y el resultado que muestra son válidos), así que no se editó según la instrucción de no tocar ejercicios existentes salvo problema real; se deja anotado acá para una futura revisión editorial si se decide homogeneizar la regla también hacia atrás.
