# Decisiones, CLSF.json (topic: white/conteo/combinaciones)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| reconocer-combinacion | 6 | 1 | 5 | 6 |
| distractor-variacion | 5 | 1 | 4 | 5 |
| distractor-regla-basica | 2 | 1 | 1 | 2 |
| combinacion-con-condicion | 2 | 1 | 1 | 2 |
| **Total** | **15** | **4** | **11** | **15** |

## Contextos usados

- `reconocer-combinacion` (6 ejercicios): comité de oficina (ya existente), mano de póker (mazo de 52), urna con 20 bolitas numeradas (sorteo), pote de helado (10 sabores, productos de lista), delegación de un curso (25 estudiantes, comité), pareja de dobles de tenis (15 personas, apretones/pares). Nota: con solo 5 categorías de "Contextos válidos" documentadas en el topic-context.md y 6 ejercicios en esta sub-familia, una categoría (comité/delegación) se repite 2/6 (33%), apenas por encima del tope orientativo del ~30%; se documenta como desvío menor, no hay una sexta categoría distinta disponible en la lista del topic.
- `distractor-variacion` (5 ejercicios): capitán/vicecapitán de un equipo (ya existente), podio de 3 medallas entre corredores, presidente/secretario de una comisión, orden de libros en una vidriera, capitán de equipo A vs. capitán de equipo B. 5 escenarios distintos, sin repetición.
- `distractor-regla-basica` (2 ejercicios): menú con entrada + postre (ya existente), carta de restaurante con plato principal + bebida. Mismo patrón conceptual (regla del producto entre dos conjuntos distintos), contextos distintos.
- `combinacion-con-condicion` (2 ejercicios): comité que incluye obligatoriamente a una persona (ya existente), comisión que excluye obligatoriamente a una persona (nuevo, cubre el otro caso mencionado en la tabla del topic).

## Decisiones de contenido

- Los ejercicios de `reconocer-combinacion` y `combinacion-con-condicion` usan 3 opciones (conceptual); los de `distractor-variacion` y `distractor-regla-basica` usan 2 opciones binarias ("¿corresponde tratar esto como combinación?" Sí/No), replicando exactamente el patrón ya validado en los 4 ejercicios existentes del archivo.
- Para balancear `correct_index` (regla de estructura: máx 50% en un mismo índice), se reordenaron las opciones de varios ejercicios nuevos (y del orden de presentación Sí/No en algunos binarios), sin alterar el contenido matemático ni las opciones en sí, solo su posición y el `feedback_incorrect` en paralelo.
- En el ejercicio de distractor-variación de capitanes de equipo A/B se acortó el texto de la opción correcta ("No, porque capitán de A y capitán de B son roles distintos entre sí") para no ser notablemente más larga que la opción "Sí" (regla crítica 4/15 de paridad de longitud).
- Varios enunciados se acortaron o se les quitó una cláusula redundante ("de forma independiente", explicaciones de más) para cumplir el límite de ~130 caracteres de prosa del enunciado (regla 36).
- Sin desvíos de contenido matemático respecto del plan original: todos los `k < n` estrictos, el distractor de variación nunca nombra $V_{n,k}$ explícitamente (describe roles/posiciones), y los casos de condición usan $\binom{n-1}{k-1}$/$\binom{n-1}{k}$ según corresponda (incluir/excluir).

## Warnings que quedaron

Ninguno. El validador corre con 0 ERRORS y 0 WARNINGS sobre el ítem completo (15/15 ejercicios) tras el rebalanceo de `correct_index`, el ajuste de longitud de opciones y el acortamiento de enunciados largos.
