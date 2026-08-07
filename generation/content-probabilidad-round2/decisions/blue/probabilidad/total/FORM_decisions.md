# Decisiones, FORM.json (topic: blue/probabilidad/total)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| formula-dos-escenarios | 5 | 1 | 4 | 5 |
| formula-tres-o-mas-escenarios | 5 | 1 | 4 | 5 |
| identificar-formula-correcta | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

Se mantuvo abstracto (`Sean $A_1, A_2$ una partición...`), siguiendo el patrón exacto de los 3 ejercicios preexistentes del archivo (ninguno usaba un contexto cotidiano). FORM en este topic pregunta por el reconocimiento de la expresión algebraica del teorema, no por su aplicación a un caso, así que se trató como diseño abstracto por defecto (mismo criterio que la excepción de LEXI/FORM de la regla crítica 43 de `authoring-context.md`), variando únicamente las letras de los escenarios/evento entre ejercicios ($A_i$/$B$, $C_i$/$E$, $H_i$/$G$, etc.) para no repetir la misma notación en todo el archivo.

## Decisiones de contenido

- Se balanceó `correct_index`: quedó exactamente 5/5/5 entre los índices 0/1/2 de las 15 opciones del archivo, reordenando manualmente 2 ejercicios que habían quedado con la correcta en el mismo índice que varios otros.
- **`formula-tres-o-mas-escenarios`** combina un ejercicio con 3 escenarios nombrados explícitamente (para practicar el caso concreto de 3+ términos) con ejercicios en notación `\sum_i` general (n, 4 y 5 escenarios), evitando que las 5 instancias caigan todas en la misma variante de la fórmula.
- Tras seedear y validar se corrigieron: relleno en un párrafo de `explanation` con 3 fragmentos LaTeX inline sueltos (regla 21, reescrito sin nombrar $A_1,A_2,A_3$ inline), un bloque display de 2 términos que convenía verticalizar (regla 38), un `question` de 131 caracteres (regla 36, recortado), y se acortó la fórmula `$\sum_i P(F\mid A_i) \cdot P(A_i)$` quitando el `\cdot` sobrante para acercarla al resto de las opciones.
- No se tocó ningún ejercicio preexistente.

## Warnings que quedaron

- **Regla 39 (opción LaTeX pura > ~35 caracteres de render), 2 ejercicios** (`formula-tres-o-mas-escenarios` con 3 escenarios explícitos, e `identificar-formula-correcta` con 3 escenarios): las opciones que suman 3 términos completos `$P(X\mid A_i)P(A_i)$` superan el límite de ancho. El diseño de estas dos instancias existe justamente para que el alumno vea la suma con 3 ramas nombradas explícitamente en vez de la notación abstracta `\sum_i` (que ya cubren las otras instancias de la misma sub-familia); reducir a 2 escenarios contradice el propósito puntual de esas dos filas del plan. Se prefirió aceptar el warning de ancho antes que perder esa variante.
- **Regla 4 (paridad de longitud), 2 ejercicios** (los mismos casos de 3 términos, más un caso de `\sum_i` con `\cdot`): consecuencia directa del punto anterior, la opción correcta con 3 ramas es inevitablemente más larga que distractores más cortos por diseño (suma incompleta, producto, etc.).
- **Regla 40 (fórmula de partición con ramas nombradas en `explanation`), 4 ejercicios nuevos + 1 preexistente** (todos de `identificar-formula-correcta`): esta sub-familia existe para que el alumno compare variantes concretas con $A_1$/$A_2$ nombrados, así que la `explanation` reafirma la fórmula correcta concreta (no la abstracta en `\sum_i`) antes de contrastarla con las variantes incorrectas. El ejercicio preexistente del archivo (índice 2, ya validado en una ronda anterior) sigue exactamente el mismo patrón, así que se mantuvo consistencia en vez de reescribirlo distinto al resto de la sub-familia.
