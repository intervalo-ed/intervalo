# Topic: Variaciones

Belt: `white`, Unit: `conteo`, Topic: `variaciones`

Skills en este topic: `CLSF`, `FORM`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `CLSF`, `FORM`, `RESL`.

Concepto: las **variaciones** cuentan las formas de elegir y ordenar $k$ elementos distintos de un total de $n$, sin repetición, donde el orden importa: $V_{n,k} = \dfrac{n!}{(n-k)!}$.

**Frontera con el resto de la unidad:** si $k = n$ (se usan todos los elementos), colapsa a `permutaciones` ($V_{n,n} = n!$); ese caso no se genera acá, queda reservado al topic anterior. Si el orden no importa, es `combinaciones`. La distinción central de `CLSF` en este topic es "¿importa el orden de los $k$ elegidos?" (variación) vs. "¿no importa?" (combinación), dado que ambas ya comparten el rasgo "se elige un subconjunto $k<n$".

---

## CLSF, 50 ejercicios

Reconocer la **técnica**, sin calcular.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer variación (elegir y ordenar $k<n$, el orden importa) | 20 | `reconocer-variacion` |
| Distractor: en realidad es combinación (orden no importa) | 16 | `distractor-combinacion` |
| Distractor: en realidad es permutación ($k=n$, se usan todos) | 8 | `distractor-permutacion` |
| Distractor: en realidad es regla del producto simple (los $k$ lugares no salen todos del mismo conjunto de $n$) | 6 | `distractor-regla-producto` |
| **Total** | **50** | |

---

## FORM, 50 ejercicios

Armar la **expresión**.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| $V_{n,k} = \dfrac{n!}{(n-k)!}$ directa | 24 | `formula-directa` |
| Identificar la fórmula incorrecta entre variantes parecidas (confundir con $\binom{n}{k}$ o con $n!$) | 14 | `identificar-formula-correcta` |
| Armar la expresión como producto directo de opciones decrecientes ($n \times (n-1) \times \cdots \times (n-k+1)$, sin pasar por el cociente de factoriales) | 12 | `producto-decreciente` |
| **Total** | **50** | |

---

## RESL, 50 ejercicios

Calcular el **resultado numérico**.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| $V_{n,k}$ con $n, k$ chicos ($n \leq 9$) | 26 | `resl-directo` |
| Comparación entre $V_{n,k}$ y $\binom{n}{k}$ del mismo $n,k$ (mismo par de datos, técnica distinta) | 12 | `resl-comparacion-combinacion` |
| $k$ dado como parte del contexto (ej. "elegir 2 cargos distintos de 8 personas") sin la notación $V_{n,k}$ explícita en el enunciado | 12 | `resl-desde-contexto` |
| **Total** | **50** | |

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
- **El distractor de combinación en `CLSF` no nombra $\binom{n}{k}$**: describe la situación ("se eligen 2 representantes sin diferenciar cuál es titular y cuál suplente").

## Checklist del topic

- [ ] Todo ejercicio tiene $k < n$ estrictamente (nunca $k=n$)
- [ ] Los distractores de "en realidad es combinación/permutación" describen la situación, no nombran la fórmula
- [ ] Los ejercicios de `resl-desde-contexto` no usan la notación $V_{n,k}$ en el enunciado, solo en la explicación
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
