# Topic: Axiomas de Kolmogorov

Belt: `white`, Unit: `probabilidad`, Topic: `axiomas`

Skills en este topic: `LEXI`, `ESTR`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `ESTR`, `RESL`.

Concepto: los **axiomas de Kolmogorov** ($P(A) \geq 0$; $P(\Omega) = 1$; $P(A \cup B) = P(A) + P(B)$ si $A \cap B = \emptyset$) y las propiedades **derivadas**: $P(\emptyset) = 0$, $P(A^c) = 1 - P(A)$, la regla general de la unión $P(A \cup B) = P(A) + P(B) - P(A \cap B)$ (para eventos no necesariamente excluyentes), monotonía ($A \subseteq B \Rightarrow P(A) \leq P(B)$) y acotación $0 \leq P(A) \leq 1$.

**Frontera con el resto de la unidad:** primer topic donde aparece un número de probabilidad. No usa todavía `laplace` (conteo de casos favorables/posibles), `condicional` ni `independencia`; los valores de $P(A)$, $P(B)$, $P(A \cap B)$ siempre vienen dados en el enunciado, nunca se calculan por conteo.

---

## LEXI, 50 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer cuál de los 3 axiomas corresponde a una propiedad enunciada | 15 | `reconocer-axioma` |
| Distinguir un axioma de una propiedad derivada (ej. $P(\emptyset)=0$ no es axioma, se deduce) | 10 | `axioma-vs-derivada` |
| Nombre/definición del complemento de probabilidad $P(A^c) = 1-P(A)$ | 8 | `definicion-complemento-prob` |
| Nombre/definición de la regla general de la unión | 8 | `definicion-regla-union` |
| Rango de $P(A) \in [0,1]$ | 9 | `definicion-rango-probabilidad` |
| **Total** | **50** | |

---

## ESTR, 50 ejercicios

Elegir **qué propiedad conviene aplicar**, sin calcular.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Elegir suma simple para eventos mutuamente excluyentes | 12 | `elegir-suma-excluyentes` |
| Elegir la regla general de la unión (resta la intersección) para eventos no excluyentes | 12 | `elegir-regla-general-union` |
| Elegir el complemento cuando conviene calcular el evento contrario | 13 | `elegir-complemento` |
| Elegir monotonía/acotación para descartar un valor de probabilidad imposible | 13 | `elegir-acotacion` |
| **Total** | **50** | |

---

## RESL, 50 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| $P(A \cup B)$, eventos mutuamente excluyentes | 10 | `resl-union-excluyentes` |
| $P(A \cup B)$, regla general (con intersección) | 14 | `resl-union-general` |
| $P(A^c) = 1 - P(A)$ | 12 | `resl-complemento` |
| Despejar una incógnita ($P(A)$, $P(B)$ o $P(A \cap B)$) desde la fórmula general de la unión | 14 | `resl-despeje-union` |
| **Total** | **50** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Unión general | Sumar $P(A)+P(B)$ sin restar $P(A \cap B)$ cuando los eventos no son excluyentes |
| Unión de excluyentes | Restar una intersección que en realidad vale $0$, complicando innecesariamente el cálculo (o, peor, multiplicar en vez de sumar) |
| Complemento | Calcular $P(A)$ directo cuando la pregunta pide $P(A^c)$, olvidando $1-P(A)$ |
| Acotación | Aceptar como válido un valor de $P(A)$ fuera de $[0,1]$ (ej. $P(A)=1{,}2$) sin descartarlo por el axioma de acotación |
| Axioma vs. derivada | Creer que $P(\emptyset)=0$ es uno de los 3 axiomas originales, en vez de una consecuencia derivada de ellos |
| Despeje | Despejar mal el término que falta en $P(A \cup B)=P(A)+P(B)-P(A\cap B)$, invirtiendo un signo |

---

## Reglas específicas del topic

- **Los valores de probabilidad siempre vienen dados**, nunca se calculan por conteo de casos (eso es `laplace`). Contextos válidos: encuestas con proporciones dadas, resultados de estudios previos, datos de un enunciado ("se sabe que...").
- **Nunca invocar conteo, combinatoria ni condicional/independencia** para justificar un resultado en este topic; solo los axiomas y sus propiedades derivadas.
- **Decimales con coma** (`0,6`), siguiendo la convención transversal del curso.

## Checklist del topic

- [ ] Ningún valor de probabilidad se calcula por conteo (siempre viene dado en el enunciado)
- [ ] Ningún ejercicio usa condicional, independencia o Laplace para justificar el resultado
- [ ] Los ejercicios de "unión general" especifican que los eventos NO son mutuamente excluyentes (o dan $P(A\cap B) \neq 0$)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: LEXI/ESTR conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
