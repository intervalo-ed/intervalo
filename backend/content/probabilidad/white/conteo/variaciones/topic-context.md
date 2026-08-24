# Topic: Variaciones

Belt: `white`, Unit: `conteo`, Topic: `variaciones`

Skills en este topic: `CLSF`, `FORM`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `CLSF`, `FORM`, `RESL`.

Concepto: las **variaciones** cuentan las formas de elegir y ordenar $k$ elementos distintos de un total de $n$, sin repetición, donde el orden importa: $V_{n,k} = \dfrac{n!}{(n-k)!}$.

**Frontera con el resto de la unidad:** si $k = n$ (se usan todos los elementos), colapsa a `permutaciones` ($V_{n,n} = n!$); ese caso no se genera acá, queda reservado al topic anterior. Si el orden no importa, es `combinaciones`. La distinción central de `CLSF` en este topic es "¿importa el orden de los $k$ elegidos?" (variación) vs. "¿no importa?" (combinación), dado que ambas ya comparten el rasgo "se elige un subconjunto $k<n$".

> **La palabra «combinación» sí, la fórmula no.** `combinaciones` es el topic **siguiente** de la unidad. Acá se puede nombrar la idea —el alumno tiene que poder decir "si el orden no importara, sería otra cuenta"— pero **no se usa $\binom{n}{k}$ en ningún campo**, ni en opciones, ni en feedbacks, ni en explicaciones. Cuando haga falta escribir esa cantidad, va expandida en factoriales: $\dfrac{n!}{k!\,(n-k)!}$, que el alumno sabe leer desde `factoriales`. Ver el aviso de abajo.

---

## CLSF, 15 ejercicios

Reconocer la **técnica**, sin calcular.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer variación (elegir y ordenar $k<n$, el orden importa) | 6 | `reconocer-variacion` |
| Distractor: en realidad es combinación (orden no importa) | 5 | `distractor-combinacion` |
| Distractor: en realidad es permutación ($k=n$, se usan todos) | 2 | `distractor-permutacion` |
| Distractor: en realidad es regla del producto simple (los $k$ lugares no salen todos del mismo conjunto de $n$) | 2 | `distractor-regla-producto` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

Armar la **expresión**.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| $V_{n,k} = \dfrac{n!}{(n-k)!}$ directa | 7 | `formula-directa` |
| Identificar la fórmula incorrecta entre variantes parecidas (confundir con $\binom{n}{k}$ o con $n!$) | 4 | `identificar-formula-correcta` |
| Armar la expresión como producto directo de opciones decrecientes ($n \times (n-1) \times \cdots \times (n-k+1)$, sin pasar por el cociente de factoriales) | 4 | `producto-decreciente` |
| **Total** | **15** | |

---

## RESL, 15 ejercicios

Calcular el **resultado numérico**.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| $V_{n,k}$ con $n, k$ chicos ($n \leq 9$) | 8 | `resl-directo` |
| Comparación entre $V_{n,k}$ y una técnica **ya vista**: el arreglo con repetición ($n^k$, de `reglas`) o la permutación completa ($P_n$, del topic anterior) | 4 | `resl-comparacion` |
| $k$ dado como parte del contexto (ej. "elegir 2 cargos distintos de 8 personas") sin la notación $V_{n,k}$ explícita en el enunciado | 3 | `resl-desde-contexto` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Variación vs. combinación | Dividir de más por $k!$ cuando el enunciado sí distingue el orden de los elegidos (roles distintos) |
| Variación vs. combinación | No dividir por $(n-k)!$ y usar $n!$ completo, como si $k=n$ |
| Variación vs. permutación | Tratar el problema como permutación completa cuando en realidad sobran elementos sin usar |
| Fórmula $V_{n,k}$ | Invertir el cociente, calculando $\dfrac{(n-k)!}{n!}$ |
| Producto decreciente | Multiplicar $k+1$ factores en vez de $k$, o empezar en $n-1$ en vez de $n$ |
| Reconocimiento CLSF | Confundir "elegir 2 cargos distintos" (variación, importa cuál cargo) con "elegir 2 representantes sin distinguir roles" (combinación) |

---

## Reglas específicas del topic

- **Contextos válidos**: cargos distintos (director/subdirector, titular/suplente), podios parciales (1° y 2° puesto de un grupo más grande), franjas de bandera con colores distintos, códigos con posiciones distintas.
- **$k$ siempre estrictamente menor que $n$**: si un ejercicio necesita $k=n$, pertenece a `permutaciones`, no se genera acá.
- **El distractor de combinación no nombra $\binom{n}{k}$, en ninguna de las tres skills**: describe la situación ("se eligen 2 representantes sin diferenciar cuál es titular y cuál suplente"), o escribe la cantidad expandida en factoriales.
- **Techo aritmético en `RESL`: el resultado tiene a lo sumo 3 cifras.** $n \leq 9$ no alcanza como límite, porque deja pasar $V_{9,4}=9\times 8\times 7\times 6=3024$. La cuenta se hace de cabeza o el ítem mide paciencia en vez de conteo. Mismo criterio que `blue/laplace`.

> **Se sacó la notación binomial de todo el topic (ago-2026).** `FORM` estaba en 53 % de acierto al primer intento y `RESL` en 41 % —44 % y 45 % sin contar al owner—, las dos fuera de banda, mientras `CLSF` medía 76 % y estaba sana. La diferencia: **25 de los 30 ítems de `FORM` y `RESL` mencionaban $\binom{n}{k}$**, en opciones, feedbacks o explicaciones, y ese símbolo se introduce recién en el topic siguiente. `CLSF` era la única skill que no lo usaba ni una vez, y no por casualidad: la regla de arriba ya existía, pero estaba escrita solo para `CLSF`. Ahora vale para las tres.
>
> Lo peor no eran las opciones sino los `feedback_incorrect`: el alumno erraba y leía una corrección escrita con notación que nunca había visto.
>
> Los 4 ítems de la vieja sub-familia `resl-comparacion-combinacion` no se arreglaban expandiendo el símbolo, porque pedían **calcular** el valor de la combinación. Se reescribieron comparando contra dos técnicas que el alumno sí tiene: el arreglo con repetición ($n^k$, de `reglas`) y la permutación completa ($P_n$, del topic anterior). La comparación sobrevive y consolida hacia atrás en vez de adelantarse.
>
> No se pierde nada con eso: `combinaciones/RESL` ya tiene su propia sub-familia `resl-comparacion-variacion`, con 3 ítems que hacen exactamente esa comparación en el topic donde el alumno conoce las dos fórmulas. La versión de acá era la misma pregunta, un topic antes de tiempo.

## Checklist del topic

- [ ] Todo ejercicio tiene $k < n$ estrictamente (nunca $k=n$)
- [ ] **Cero apariciones de `\binom` / `\dbinom` en las tres skills**, en cualquier campo
- [ ] **`RESL`: ningún resultado pasa de 3 cifras**
- [ ] Los distractores de "en realidad es combinación/permutación" describen la situación, no nombran la fórmula
- [ ] Los ejercicios de `resl-desde-contexto` no usan la notación $V_{n,k}$ en el enunciado, solo en la explicación
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
- [ ] Toda vez que la `explanation` mencione (aunque sea como distractor) $V_{n,k}=\dfrac{n!}{(n-k)!}$ o $\binom{n}{k}$, razona intuitivamente el numerador y en especial el denominador (regla crítica 25 de `authoring-context.md`), no solo la declara
