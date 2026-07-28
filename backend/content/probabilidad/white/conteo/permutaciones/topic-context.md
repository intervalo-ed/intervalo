# Topic: Permutaciones

Belt: `white`, Unit: `conteo`, Topic: `permutaciones`

Skills en este topic: `CLSF`, `FORM`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `CLSF`, `FORM`, `RESL`.

Concepto: las **permutaciones** cuentan las formas de ordenar $n$ elementos distintos cuando el orden importa y se usan **todos** los elementos disponibles ($P_n = n!$). Con elementos repetidos, se divide por el factorial de cada grupo idéntico.

**Frontera con el resto de la unidad:** si el problema elige y ordena solo un **subconjunto** de $k < n$ elementos, es `variaciones`, no `permutaciones`. Si el orden no importa, es `combinaciones`. La distinción "¿se usan todos los elementos?" es la que separa `permutaciones` de `variaciones`, y es la fuente principal de distractores en `CLSF`.

---

## CLSF, 50 ejercicios

Reconocer la **técnica** que corresponde, sin calcular.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer permutación simple (ordenar todos los $n$ elementos distintos) | 16 | `reconocer-permutacion-simple` |
| Reconocer permutación con repetición (anagrama con elementos idénticos) | 10 | `reconocer-permutacion-repeticion` |
| Distractor: en realidad es variación (se elige y ordena un subconjunto $k<n$) | 12 | `distractor-variacion` |
| Distractor: en realidad es combinación (el orden no importa) | 8 | `distractor-combinacion` |
| Distractor: en realidad es regla del producto simple (elementos de conjuntos distintos entre sí, no un mismo conjunto a reordenar) | 4 | `distractor-regla-producto` |
| **Total** | **50** | |

---

## FORM, 50 ejercicios

Armar la **expresión**.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| $P_n = n!$ simple | 20 | `formula-simple` |
| Permutación con repetición $\dfrac{n!}{a! \, b! \cdots}$ | 22 | `formula-con-repeticion` |
| Identificar la fórmula incorrecta entre variantes parecidas (ej. confundir con $\binom{n}{k}$ o $\dfrac{n!}{(n-k)!}$) | 8 | `identificar-formula-correcta` |
| **Total** | **50** | |

---

## RESL, 50 ejercicios

Calcular el **resultado numérico**.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Permutación simple, $n \leq 7$ | 22 | `resl-simple` |
| Permutación con repetición | 22 | `resl-con-repeticion` |
| Comparación entre dos permutaciones (con y sin repetición del mismo conjunto, o dos $n$ distintos) | 6 | `resl-comparacion` |
| **Total** | **50** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Permutación vs. variación | Aplicar $P_n = n!$ cuando en realidad se elige un subconjunto $k<n$ (falta dividir por $(n-k)!$) |
| Permutación vs. combinación | Aplicar $n!$ sin notar que el orden no importa en el enunciado (falta dividir por $k!$) |
| Permutación con repetición | Olvidar dividir por el factorial de los elementos repetidos |
| Permutación con repetición | Dividir por el factorial del total de elementos repetidos entre todos los grupos, en vez de por el factorial de cada grupo por separado |
| Permutación simple | Sumar en vez de multiplicar las posiciones disponibles en cada lugar |
| Identificar fórmula | Confundir $P_n = n!$ con $V_{n,k} = \dfrac{n!}{(n-k)!}$ o con $\binom{n}{k}$ |

---

## Reglas específicas del topic

- **Contextos válidos**: podios/carreras, filas para foto, anagramas de una palabra, orden de canciones en una lista, orden de llegada.
- **Anagramas con repetición**: usar palabras con 4-6 letras y como máximo un grupo repetido de 2-3 letras idénticas, para que el cálculo quede acotado y no delate la respuesta por magnitud.
- **El distractor de variación/combinación en `CLSF` no nombra la fórmula**: describe la situación ("se eligen y ordenan solo 3 de los 8 corredores para el podio", "no importa qué lugar ocupó cada uno dentro del grupo elegido"), dejando que el alumno reconozca cuál técnica aplica.

## Checklist del topic

- [ ] Todo ejercicio de `CLSF`/`FORM`/`RESL` de permutación simple usa **todos** los elementos del conjunto, nunca un subconjunto (eso rompe la frontera con `variaciones`)
- [ ] Anagramas usan palabras de 4-6 letras con a lo sumo un grupo repetido
- [ ] Los distractores de "en realidad es variación/combinación" describen la situación, no nombran la fórmula
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
- [ ] Toda vez que la `explanation` mencione (aunque sea como distractor) una fórmula con fracción ($V_{n,k}=\dfrac{n!}{(n-k)!}$, $\binom{n}{k}$, permutación con repetición), razona intuitivamente el numerador y en especial el denominador (regla crítica 25 de `authoring-context.md`), no solo la declara
