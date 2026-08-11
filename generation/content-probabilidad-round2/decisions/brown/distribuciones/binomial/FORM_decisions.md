# Decisiones, FORM.json (topic: brown/distribuciones/binomial)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| identificar-parametros | 4 | 1 | 3 | 4 |
| formula-directa | 6 | 1 | 5 | 6 |
| esperanza-varianza | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- **identificar-parametros** (4): fábrica de bombitas (ya existía, $n=25$, $p=0{,}04$), encuestas (30 personas, $p=0{,}6$), tiros libres (15 tiros, $p=0{,}85$), envíos de correo (20 paquetes, $p=0{,}9$).
- **formula-directa** (6): examen de verdadero/falso (ya existía, $n=5$, $p=0{,}5$, $k=3$), encuestas ($n=6$, $p=0{,}5$, $k=4$), tiros libres ($n=5$, $p=0{,}4$, $k=2$), control de calidad ($n=6$, $p=0{,}5$, $k=1$), ruleta ($n=6$, $p=0{,}6$, $k=4$), vacunación ($n=5$, $p=0{,}2$, $k=2$). Se alternó entre ejercicios con $p=0{,}5$ (foco en el distractor "olvidar el coeficiente binomial", donde la simetría de $p$ hace que "invertir exponentes" no genere un distractor distinto) y ejercicios con $p$ asimétrico (foco en el distractor "invertir los exponentes").
- **esperanza-varianza** (5): plataforma de streaming (ya existía, $n=40$, $p=0{,}1$), control de calidad ($n=50$, $p=0{,}02$, cálculo numérico), tiros libres ($n=20$, $p=0{,}75$, pregunta interpretativa sobre qué significa $E[X]=15$), envíos de correo ($n=60$, $p=0{,}95$, cálculo numérico), vacunación/hospital ($n=200$, $p=0{,}03$, pregunta interpretativa sobre qué implica una $\mathrm{Var}(X)$ mayor con el mismo $E[X]$). 2 de los 4 nuevos son puramente numéricos (mismo formato que el ejercicio preexistente) y 2 son interpretativos con opciones conceptuales (3 opciones), para cumplir la nota del `topic-context.md` de que el párrafo interpretativo en esta sub-familia es central, no solo el mecanismo de cálculo.

## Decisiones de contenido

- En `formula-directa`, los distractores de tipo "invertir los exponentes" ($p^{n-k}(1-p)^k$ en vez de $p^k(1-p)^{n-k}$) solo tienen sentido como confusión genuina cuando $p\neq 0{,}5$ y $k\neq n-k$; con $p=0{,}5$ ese distractor colapsaría al mismo valor que la opción correcta. Por eso los ejercicios con $p=0{,}5$ (encuesta, control de calidad) usan en su lugar distractores de "coeficiente binomial equivocado" ($\binom{n}{k\pm1}$), y los ejercicios con $p$ asimétrico (tiros libres, ruleta, vacunación) sí incluyen el distractor de exponentes invertidos.
- Las opciones interpretativas de `esperanza-varianza` (2 ejercicios, 3 opciones conceptuales cada uno) siguen la cardinalidad de "respuesta conceptual" (3 opciones) en vez de la cardinalidad numérica (4), porque la respuesta no es un valor calculado sino la interpretación correcta de $E[X]$/$\mathrm{Var}(X)$ ya dados en el enunciado.
- Todos los `correct_index` se redistribuyeron (incluidos los 3 ejercicios preexistentes, que originalmente tenían los 3 en índice 0) reordenando `options` y `feedback_incorrect` en paralelo. Para los ítems de 4 opciones quedó: índice 0 en 7/15, índice 1 en 3/15, índice 2 en 3/15, índice 3 en 2/15 (los 2 ítems de 3 opciones cuentan sobre el mismo eje 0/1/2). Ningún índice supera el 50% del total.
- Algunos párrafos de `explanation` con 3+ fórmulas LaTeX inline en el mismo tramo de prosa (regla 21) se reescribieron evitando repetir la fórmula del bloque display en prosa (ej. describir "la probabilidad de acierto al cuadrado por la de fallar al cubo" en vez de repetir `$(0{,}4)^{2}(0{,}6)^{3}$` tejido inline), en vez de simplemente partir el párrafo, porque la fórmula ya estaba mostrada en el bloque `$$...$$` inmediatamente anterior.
- Sin otros desvíos del plan.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/binomial` corre en 0 ERRORS / 0 WARNINGS sobre ambos archivos del topic tras las correcciones de párrafo, de fórmulas repetidas inline y de balance de `correct_index`.
