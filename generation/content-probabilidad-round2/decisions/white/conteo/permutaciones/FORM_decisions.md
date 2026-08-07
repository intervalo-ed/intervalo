# Decisiones, FORM.json (topic: white/conteo/permutaciones)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| formula-simple | 6 | 1 | 5 | 6 |
| formula-con-repeticion | 7 | 1 | 6 | 7 |
| identificar-formula-correcta | 2 | 1 | 1 | 2 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- **formula-simple**: ya había "equipo de 6 en fila". Nuevos: orden de llegada de 5 corredores, playlist de 7 canciones, ranking interno de 4 candidatos, fila para foto grupal de 8 personas, 3 libros distintos en una estantería.
- **formula-con-repeticion**: ya había anagrama CASA (A×2, 4 letras). Nuevos: anagramas TOMATE (T×2, 6 letras), TERROR (R×3, 6 letras), CUELLO (L×2, 6 letras), ARROZ (R×2, 5 letras), ELLOS (L×2, 5 letras), BURRO (R×2, 5 letras).
- **identificar-formula-correcta**: ya había una versión abstracta (identificar $n!$ entre $n!$, $\dfrac{n!}{(n-k)!}$, $\binom{n}{k}$, $n^n$). Nuevo: la misma idea concretada con un caso numérico (jurado de 5 integrantes), para variar el registro sin duplicar el ejercicio existente.

Ningún contexto se repitió más del 30% dentro de una misma sub-familia (todos los contextos de `formula-simple` son distintos entre sí; todas las palabras de `formula-con-repeticion` son distintas entre sí).

## Decisiones de contenido

- **Palabras de anagrama con un solo grupo repetido (2 o 3 letras)**, siguiendo la regla dura del topic: TOMATE, TERROR, CUELLO, ARROZ, ELLOS, BURRO. Se evitó reusar CASA (ya usada) y se evitaron palabras con dos grupos repetidos.
- **Rebalanceo de `correct_index` desde el diseño inicial**: en vez de reordenar después, se planificó de entrada la posición de la opción correcta en cada uno de los 12 ejercicios nuevos para que, sumado a los 3 existentes (`{0: 2, 1: 1}`), la distribución final quedara pareja: `{0: 4, 1: 4, 2: 4, 3: 3}` sobre 15. No hizo falta ninguna corrección posterior; el validador corrió en 0 errores en el primer intento para este ítem.
- El ejercicio nuevo de `identificar-formula-correcta` reutiliza el mismo conjunto de fórmulas rivales ($n!$, $\dfrac{n!}{2!}$, $n^n$, $\binom{n}{2}$) que la regla del topic pide para esta sub-familia (confundir con variación/combinación), pero con $n=5$ concreto para diferenciarlo del ejercicio abstracto existente.

## Warnings que quedaron

Ninguno. `validate_content.py --course probabilidad --topic white/conteo/permutaciones` corre en 0 ERRORS / 0 WARNINGS para los 3 ítems del topic.
