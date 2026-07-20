# Topic: Distribución hipergeométrica

Belt: `violet`, Unit: `distribuciones`, Topic: `hipergeometrica`

Skills en este topic: `CLSF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `CLSF`, `FORM`.

Concepto: cantidad de éxitos al extraer una muestra **sin reposición** de tamaño $n$ de una población finita de $N$ individuos, de los cuales $K$ son éxitos. $P(X=k)=\dfrac{\binom{K}{k}\binom{N-K}{n-k}}{\binom{N}{n}}$.

**Frontera con el resto del topic:** distinguir de `binomial`: si la extracción fuera con reposición (o la población fuera enorme frente a la muestra, de modo que la proporción no cambia apreciablemente), sería binomial.

---

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer hipergeométrica (extracción sin reposición, población finita con éxitos/fracasos) | 8 | `reconocer-hipergeometrica` |
| Distractor: en realidad binomial (con reposición, o población tan grande que la proporción no cambia) | 5 | `distractor-binomial` |
| Distractor: es un conteo combinatorio puro, sin variable aleatoria de por medio (pregunta solo "cuántos grupos hay", no una probabilidad) | 2 | `distractor-conteo-puro` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Fórmula $P(X=k)=\dfrac{\binom{K}{k}\binom{N-K}{n-k}}{\binom{N}{n}}$ | 8 | `formula-directa` |
| Identificar $N$, $K$, $n$ desde un contexto dado | 4 | `identificar-parametros` |
| Contraste con la fórmula binomial para el mismo contexto (mismo $n,p=K/N$, técnica distinta) | 3 | `contraste-binomial` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Hipergeométrica vs. binomial | Aplicar la fórmula binomial a una extracción sin reposición, ignorando que la proporción de éxitos cambia en cada extracción |
| Fórmula | Usar $\binom{N}{k}$ en el numerador en vez de $\binom{K}{k}\binom{N-K}{n-k}$ |
| Fórmula | Confundir el denominador $\binom{N}{n}$ con $\binom{N}{k}$ |
| Parámetros | Confundir $K$ (éxitos en la población total) con $k$ (éxitos buscados en la muestra) |
| Reconocimiento | Tratar una extracción "sin reposición" de una población muy chica igual que una binomial, sin notar que cambia la probabilidad ejercicio a ejercicio |

---

## Reglas específicas del topic

- **Contextos válidos**: urnas con dos colores extraídas sin reposición, cartas de un mazo sin reponer, control de calidad extrayendo piezas de un lote sin devolverlas.
- **Población $N$ chica** (≤20) para que los coeficientes combinatorios no generen números que se descarten a ojo por magnitud.
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).

## Checklist del topic

- [ ] Todo contexto especifica explícitamente "sin reposición" o una acción equivalente (no devolver, no reponer)
- [ ] $N\leq 20$ en todos los ejercicios
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
