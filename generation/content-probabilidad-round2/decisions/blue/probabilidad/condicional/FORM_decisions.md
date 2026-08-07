# Decisiones, FORM.json (topic: blue/probabilidad/condicional)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `formula-directa` | 6 | 1 | 5 | 6 |
| `despejar-interseccion` | 5 | 1 | 4 | 5 |
| `identificar-formula-correcta` | 4 | 1 | 3 | 4 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

Este ítem trabaja la fórmula en abstracto ("Se sabe que $P(A\cap B)=\dots$"), sin escenario cotidiano, siguiendo el mismo estilo que ya tenían los 3 ejercicios preexistentes del archivo. El propio `topic-context.md` define el ítem como "trabajar la fórmula en sí (no el planteo textual, eso es `ESTR`)", lo que encuadra en la excepción de la regla 43 de `authoring-context.md` (LEXI/FORM pueden quedar en abstracto por diseño). No se forzó contexto cotidiano en los 12 ejercicios nuevos; se varió únicamente los valores numéricos de $P(A\cap B)$/$P(B)$ y $P(A\mid B)$/$P(B)$, sin repetir ningún par usado en los ejercicios preexistentes ni entre los nuevos.

## Decisiones de contenido

- `formula-directa`: 5 pares nuevos de $(P(A\cap B), P(B))$, todos con cociente de una cifra decimal (0,4 / 0,5 / 0,2 / 0,6 / 0,1), ninguno coincide con el par preexistente (0,12 / 0,4).
- `despejar-interseccion`: siguiendo la regla del topic ("fórmula base antes del resultado"), las 4 explicaciones nuevas muestran primero $P(A\mid B)=P(A\cap B)/P(B)$ y recién después el despeje a $P(A\cap B)=P(A\mid B)\cdot P(B)$, igual que el ejercicio preexistente.
- `identificar-formula-correcta`: los 3 distractores nuevos varían el tipo de error (dividir por $P(A)$ en vez de $P(B)$, invertir el cociente, sumar en vez de dividir, omitir la intersección) para no repetir siempre la misma confusión de opción a opción.
- Se corrigió un warning detectado por el validador antes de la entrega final: en el tercer ejercicio de `identificar-formula-correcta`, el cierre de la explicación acumulaba 3 fragmentos LaTeX inline en el mismo párrafo y repetía la fórmula completa $P(A\mid B)$ ya mostrada en el bloque display (reglas 21 y 35); se reescribió el cierre para no repetir la fórmula tejida inline, quedando solo 2 fragmentos inline ($P(A)$, $P(B)$).
- Sin otros desvíos del plan.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic blue/probabilidad/condicional` corre con 0 ERRORS y 0 WARNINGS sobre los 3 ítems del topic (incluido este archivo).
