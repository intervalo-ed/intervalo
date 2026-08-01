# Topic: Axiomas de Kolmogorov

Belt: `blue`, Unit: `probabilidad`, Topic: `axiomas`

Skills en este topic: `LEXI`, `ESTR`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `ESTR`, `RESL`.

Concepto: los **axiomas de Kolmogorov** ($P(A) \geq 0$; $P(\Omega) = 1$; $P(A \cup B) = P(A) + P(B)$ si $A \cap B = \emptyset$) y las propiedades **derivadas**: $P(\emptyset) = 0$, $P(A^c) = 1 - P(A)$, la regla general de la unión $P(A \cup B) = P(A) + P(B) - P(A \cap B)$ (para eventos no necesariamente excluyentes), monotonía ($A \subseteq B \Rightarrow P(A) \leq P(B)$) y acotación $0 \leq P(A) \leq 1$.

**Frontera con el resto de la unidad:** primer topic donde aparece un número de probabilidad. No usa todavía `laplace` (conteo de casos favorables/posibles), `condicional` ni `independencia`; los valores de $P(A)$, $P(B)$, $P(A \cap B)$ siempre vienen dados en el enunciado, nunca se calculan por conteo.

**No se evalúa "reconocer el axioma" ni "axioma vs. propiedad derivada" como sub-familias propias.** Nombrar cuál de los 3 axiomas originales corresponde a una propiedad, o distinguirlo de una derivada, no aporta una confusión operativa: lo que importa para el alumno es aplicar la propiedad correcta (complemento, unión general, acotación), no clasificar su origen axiomático. Se sacan de la taxonomía completa (ni LEXI, ni como distractor de otra sub-familia).

**Contextos variados.** Alternar encuestas, resultados de estudios previos, datos de control de calidad, mazo de cartas de truco con proporciones dadas, urnas. Ningún experimento debe superar ~30% de los ítems de una misma sub-familia.

---

## LEXI, 50 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Nombre/definición del complemento de probabilidad $P(A^c) = 1-P(A)$ | 16 | `definicion-complemento-prob` |
| Nombre/definición de la regla general de la unión | 16 | `definicion-regla-union` |
| Rango de $P(A) \in [0,1]$ | 18 | `definicion-rango-probabilidad` |
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
| Acotación | Aceptar como válido un valor de $P(A)$ fuera de $[0,1]$ sin descartarlo por el axioma de acotación |
| Despeje | Despejar mal el término que falta en $P(A \cup B)=P(A)+P(B)-P(A\cap B)$, invirtiendo un signo |

---

## Reglas específicas del topic

- **Los valores de probabilidad siempre vienen dados**, nunca se calculan por conteo de casos (eso es `laplace`). Contextos válidos: encuestas con proporciones dadas, resultados de estudios previos, datos de un enunciado ("se sabe que...").
- **Nunca invocar conteo, combinatoria ni condicional/independencia** para justificar un resultado en este topic; solo los axiomas y sus propiedades derivadas.
- **Decimales con coma** (`0,6`), siguiendo la convención transversal del curso.
- **Contextos variados** (ver arriba): no concentrar todos los ítems de una sub-familia en el mismo experimento.
- **Despeje: fórmula base antes del resultado (regla 43):** en `resl-despeje-union`, la `explanation` reintroduce primero la fórmula general de la unión $P(A\cup B)=P(A)+P(B)-P(A\cap B)$ y recién después muestra el despeje de la incógnita, nunca solo el resultado del despeje.
- **Párrafo de intuición (regla 44):** en ESTR (elegir qué propiedad conviene aplicar), la `explanation` no se queda en "se aplica la regla general de la unión"; agrega una oración de por qué esa propiedad es la que corresponde al caso (por qué hay que restar la intersección, por qué el complemento simplifica el cálculo, etc.).
- **Sin aclaraciones entre paréntesis en ningún campo del ejercicio** (regla crítica del `authoring-context.md`): toda aclaración va como oración propia en la prosa.

## Checklist del topic

- [ ] Ningún valor de probabilidad se calcula por conteo (siempre viene dado en el enunciado)
- [ ] Ningún ejercicio usa condicional, independencia o Laplace para justificar el resultado
- [ ] Ningún ítem evalúa "reconocer el axioma" ni "axioma vs. derivada" como término dedicado
- [ ] Los ejercicios de "unión general" especifican que los eventos NO son mutuamente excluyentes (o dan $P(A\cap B) \neq 0$)
- [ ] `resl-despeje-union` reintroduce la fórmula general antes del despeje
- [ ] Contextos variados dentro de cada sub-familia (no más de ~30% del mismo experimento)
- [ ] Ningún campo usa paréntesis para aclaraciones (`question`, `options`, `feedback_correct`, `feedback_incorrect`, `explanation`)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: LEXI/ESTR conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
