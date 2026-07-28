# Topic: Combinaciones

Belt: `white`, Unit: `conteo`, Topic: `combinaciones`

Skills en este topic: `CLSF`, `FORM`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `CLSF`, `FORM`, `RESL`.

Concepto: las **combinaciones** cuentan las formas de elegir $k$ elementos de un total de $n$ cuando el orden **no** importa: $\binom{n}{k} = \dfrac{n!}{k!\,(n-k)!}$. Cierra la unidad `conteo`: es la técnica que más se reutiliza en `white/probabilidad` (Laplace, espacios muestrales con casos favorables/posibles).

**Frontera con el resto de la unidad:** si el orden de los $k$ elegidos importa, es `variaciones`, no `combinaciones`. La distinción "¿importa el orden entre los elegidos?" ya se trabajó como distractor en `variaciones`; acá se invierte el rol (la respuesta correcta es combinación, el distractor es variación).

---

## CLSF, 50 ejercicios

Reconocer la **técnica**, sin calcular.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer combinación (elegir $k<n$, el orden no importa, sin roles distintos entre los elegidos) | 20 | `reconocer-combinacion` |
| Distractor: en realidad es variación (los elegidos sí tienen roles/posiciones distintas) | 16 | `distractor-variacion` |
| Distractor: en realidad es regla de la suma o del producto (no se está seleccionando un subconjunto de un mismo total) | 8 | `distractor-regla-basica` |
| Combinación con condición adicional (ej. "el comité debe incluir a una persona en particular", "excluir a alguien") reconocida como combinación igual, ajustando el conteo | 6 | `combinacion-con-condicion` |
| **Total** | **50** | |

---

## FORM, 50 ejercicios

Armar la **expresión**.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| $\binom{n}{k} = \dfrac{n!}{k!\,(n-k)!}$ directa | 22 | `formula-directa` |
| Identificar la fórmula incorrecta entre variantes parecidas (confundir con $V_{n,k}$ o con $n!$) | 12 | `identificar-formula-correcta` |
| Propiedad $\binom{n}{k} = \binom{n}{n-k}$ (simetría) | 8 | `propiedad-simetria` |
| Combinación con condición adicional (elegir el resto del grupo tras fijar a alguien: $\binom{n-1}{k-1}$) | 8 | `formula-con-condicion` |
| **Total** | **50** | |

---

## RESL, 50 ejercicios

Calcular el **resultado numérico**.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| $\binom{n}{k}$ con $n,k$ chicos ($n \leq 12$) | 22 | `resl-directo` |
| Comparación entre $\binom{n}{k}$ y $V_{n,k}$ del mismo $n,k$ | 10 | `resl-comparacion-variacion` |
| Aplicación de la simetría $\binom{n}{k} = \binom{n}{n-k}$ para simplificar el cálculo | 8 | `resl-simetria` |
| Combinación con condición (persona fija/excluida) | 10 | `resl-con-condicion` |
| **Total** | **50** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Combinación vs. variación | No dividir por $k!$, dejando el resultado de $V_{n,k}$ como si el orden importara |
| Fórmula $\binom{n}{k}$ | Olvidar el factor $(n-k)!$ en el denominador, dividiendo solo por $k!$ |
| Simetría $\binom{n}{k}=\binom{n}{n-k}$ | Creer que $\binom{n}{k}$ y $\binom{n}{n-k}$ dan resultados distintos y elegir el que "se ve más fácil de calcular" |
| Combinación con condición (persona fija) | Volver a contar a la persona fija dentro de las $k$ elecciones, en vez de reducir a $\binom{n-1}{k-1}$ |
| Combinación con condición (persona excluida) | Restar de $n$ pero olvidar ajustar también $k$ si corresponde |
| Reconocimiento CLSF | Tratar un problema con roles distintos entre los elegidos (ej. capitán y suplente) como combinación en vez de variación |

---

## Reglas específicas del topic

- **Contextos válidos**: comités/delegaciones sin roles internos, manos de cartas, apretones de manos, elegir productos de una lista, sorteos donde no importa el orden de extracción.
- **$k$ siempre estrictamente menor que $n$**: análogo a `variaciones`.
- **El distractor de variación en `CLSF` no nombra $V_{n,k}$**: describe la situación con roles distintos entre los elegidos (capitán/vicecapitán, primer y segundo premio).
- **Apretones de manos / saludos**: contexto reservado a este topic (combinación de a pares, $\binom{n}{2}$), no reutilizar en otros topics de la unidad.

## Checklist del topic

- [ ] Todo ejercicio tiene $k < n$ estrictamente
- [ ] El distractor de "en realidad es variación" describe roles/posiciones distintas entre los elegidos, sin nombrar $V_{n,k}$
- [ ] Los ejercicios con condición (persona fija/excluida) usan $\binom{n-1}{k-1}$ o $\binom{n-1}{k}$ correctamente según el caso
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
- [ ] Toda vez que la `explanation` mencione (aunque sea como distractor) $\binom{n}{k}=\dfrac{n!}{k!(n-k)!}$ o $V_{n,k}$, razona intuitivamente el numerador y en especial el denominador (regla crítica 25 de `authoring-context.md`), no solo la declara
