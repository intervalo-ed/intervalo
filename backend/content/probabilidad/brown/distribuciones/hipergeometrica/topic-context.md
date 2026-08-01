# Topic: Distribución hipergeométrica

Belt: `brown`, Unit: `distribuciones`, Topic: `hipergeometrica`

Skills en este topic: `CLSF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `CLSF`, `FORM`.

Concepto: cantidad de éxitos al extraer una muestra **sin reposición** de tamaño $n$ de una población finita de $N$ individuos, de los cuales $K$ son éxitos. $P(X=k)=\dfrac{\binom{K}{k}\binom{N-K}{n-k}}{\binom{N}{n}}$. $E[X]=n\cdot\dfrac{K}{N}$.

**Frontera con el resto del topic:** distinguir de `binomial`: si la extracción fuera con reposición (o la población fuera enorme frente a la muestra, de modo que la proporción no cambia apreciablemente), sería binomial.

**Marco de la unidad:** ver la nota de marco compartido en `binomial/topic-context.md`. `CLSF` evalúa reconocer-propia / distractor-vecino / supuesto-violado; `FORM` evalúa identificar-parametros / formula-directa / esperanza-y-contraste-binomial.

---

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer hipergeométrica (extracción sin reposición, población finita con éxitos/fracasos) | 6 | `reconocer-hipergeometrica` |
| Distractor: la historia parece hipergeométrica pero en realidad es binomial (con reposición, o población tan grande que la proporción no cambia) o un conteo combinatorio puro (sin variable aleatoria, solo "cuántos grupos hay") | 5 | `distractor-vecino` |
| Supuesto violado: la población cambia de composición entre extracciones por un motivo distinto a "sacar y no devolver" (ej. se agregan nuevos elementos a mitad de la extracción) | 4 | `supuesto-violado` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Identificar $N$, $K$, $n$ desde un contexto dado | 4 | `identificar-parametros` |
| Fórmula $P(X=k)=\dfrac{\binom{K}{k}\binom{N-K}{n-k}}{\binom{N}{n}}$ | 6 | `formula-directa` |
| $E[X]=n\cdot K/N$ y contraste con la fórmula binomial para el mismo $n,p=K/N$, con lectura interpretativa | 5 | `esperanza-y-contraste-binomial` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## Contextos variados

- Urnas con dos colores de bochas extraídas sin reposición.
- Cartas de un mazo repartidas sin reponer al mazo.
- Control de calidad extrayendo piezas de un lote sin devolverlas para inspección destructiva.
- Sorteo de $n$ nombres de una lista fija de $N$ empleados, de los cuales $K$ pertenecen a un mismo equipo.
- Selección de $n$ jurados de un panel de $N$ candidatos, de los cuales $K$ tienen experiencia previa.
- Pesca de $n$ peces de un estanque cerrado de $N$ peces, de los cuales $K$ están marcados de una campaña anterior.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Hipergeométrica vs. binomial | Aplicar la fórmula binomial a una extracción sin reposición, ignorando que la proporción de éxitos cambia en cada extracción |
| Supuesto violado | Tratar como "sin reposición estándar" una población cuya composición cambia por otro motivo (se agregan elementos nuevos a mitad de la extracción) |
| Fórmula | Usar $\binom{N}{k}$ en el numerador en vez de $\binom{K}{k}\binom{N-K}{n-k}$ |
| Fórmula | Confundir el denominador $\binom{N}{n}$ con $\binom{N}{k}$ |
| Parámetros | Confundir $K$ (éxitos en la población total) con $k$ (éxitos buscados en la muestra) |
| Esperanza | Olvidar que $E[X]=n\cdot K/N$ coincide con la esperanza de una binomial con $p=K/N$, y confundir esa coincidencia con que ambas distribuciones son intercambiables en todo |

---

## Reglas específicas del topic

- **Contextos válidos**: ver tabla de arriba.
- **Población $N$ chica** (≤20) para que los coeficientes combinatorios no generen números que se descarten a ojo por magnitud.
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).
- **Toda `explanation` de este topic (`CLSF` y `FORM`) incluye un párrafo breve que interpreta intuitivamente el concepto central del ejercicio.** En `esperanza-y-contraste-binomial` esa interpretación explica que $E[X]=n\cdot K/N$ coincide en promedio con una binomial de igual proporción, pero que en cada extracción individual la hipergeométrica es más "predecible" (menor variabilidad) porque la población es finita y se va agotando, no porque el promedio cambie.
- **`supuesto-violado`**: la historia describe una población que cambia de composición entre extracciones por un motivo distinto a no reponer (ej. se agregan piezas nuevas al lote a mitad de la inspección); las opciones incluyen una que nombra esa razón explícitamente.

## Checklist del topic

- [ ] Todo contexto especifica explícitamente "sin reposición" o una acción equivalente (no devolver, no reponer) en `reconocer-hipergeometrica`
- [ ] $N\leq 20$ en todos los ejercicios
- [ ] `distractor-vecino` varía entre confundir con binomial y con conteo combinatorio puro
- [ ] `supuesto-violado` describe un cambio de composición distinto al de "sacar y no reponer" estándar
- [ ] Toda `explanation` tiene su párrafo de interpretación intuitiva
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
