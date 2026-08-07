# Decisiones, FORM.json (topic: blue/probabilidad/bayes)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| form-identificar-numerador | 8 | 1 | 7 | 8 |
| form-armar-teorema | 7 | 1 | 6 | 7 |
| **Total** | **15** | **2** | **13** | **15** |

## Contextos usados

- **form-identificar-numerador** (8, incluye 1 preexistente): test diagnóstico x2 (enfermedad ya existente + gripe), control de calidad x2 (máquinas $M_1$/$M_2$ + proveedores $R$/$S$), urnas/cajas x2 (urnas $A$/$B$ + tres cajas $C_1$/$C_2$/$C_3$), filtros de spam x2 (adjunto sospechoso + remitente desconocido). 2/8 = 25%.
- **form-armar-teorema** (7, incluye 1 preexistente): control de calidad x2 (líneas $A_1$/$A_2$ ya existente + turnos $T_1$/$T_2$), test diagnóstico x2 (grupo de riesgo $A_1$/$A_2$ + virus $B_1$/$B_2$), urnas/cajas x2 (urnas $U_1$/$U_2$ + cajas $C_1$/$C_2$/$C_3$), filtros de spam x1 (correos $S_1$/$S_2$). 2/7 ≈ 28,6%.

## Decisiones de contenido

- En `form-armar-teorema` se usaron hipótesis indexadas ($A_1/A_2$, $B_1/B_2$, $U_1/U_2$, $C_1/C_2/C_3$, $T_1/T_2$, $S_1/S_2$) en vez de nombres sueltos ($R$/$\overline{R}$), igual que el ejercicio preexistente, para poder mantener el denominador como `$\sum_i P(\dots\mid A_i)P(A_i)$` en las tres opciones (regla 40) y que solo el numerador varíe entre variantes, tal como exige la excepción de la regla 40 para `options`.
- El primer intento de `form-identificar-numerador #3` (proveedores $R$/$S$) usaba `\text{falla}` como nombre del evento; se cambió a la letra $F$ para acortar la opción correcta, pero igual quedó un warning de paridad de longitud (ver abajo) porque el denominador aislado ($P(F)$) es intrínsecamente corto frente al numerador con la cláusula condicional. Se dejó documentado en vez de forzar una redacción artificial.
- Se corrigieron dos warnings de paridad de longitud adicionales (F1 con "alérgico", cambiado a "gripe" para acortar la opción correcta) y tres párrafos de `question` de `form-armar-teorema` que superaban los 130 caracteres, partidos en `\n\n` sin perder información.
- No se tocó ningún ejercicio preexistente.
- Sin desvíos del plan de sub-familias/slugs del `topic-context.md`.

## Warnings que quedaron

- `options (regla 4)` en el ejercicio de proveedores $R$/$S$ (`form-identificar-numerador`): la opción correcta ($P(F\mid R)\cdot P(R)$) queda relativamente más larga que la opción de denominador aislado ($P(F)$), porque el numerador de Bayes siempre lleva una cláusula condicional adicional que el denominador solo no tiene. Es un efecto estructural del contenido (mismo patrón que el resto del archivo), no un error de redacción; se evaluó acortar aún más pero cualquier alternativa razonable rompía la claridad conceptual del distractor de denominador.
- `questions (regla 21)` en el ejercicio de las tres cajas $C_1$/$C_2$/$C_3$ (`form-armar-teorema`): el enunciado nombra las tres cajas juntas, lo que suma 3 fragmentos LaTeX inline en un mismo tramo de prosa. Es inherente a presentar una partición de 3 escenarios (a diferencia del resto de los ejercicios del archivo, que usan 2); separarlos en 3 oraciones distintas fragmentaría innecesariamente una enumeración corta y natural.
