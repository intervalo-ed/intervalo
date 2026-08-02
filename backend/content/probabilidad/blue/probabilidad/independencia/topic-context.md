# Topic: Independencia de eventos

Belt: `blue`, Unit: `probabilidad`, Topic: `independencia`

Skills en este topic: `CLSF`, `FORM`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `CLSF`, `FORM`, `RESL`.

Concepto: dos eventos $A$ y $B$ son **independientes** cuando $P(A \cap B) = P(A) \cdot P(B)$, equivalente a $P(A\mid B) = P(A)$ (la ocurrencia de uno no cambia la probabilidad del otro).

**Frontera con el resto de la unidad:** distingue explícitamente independencia de "mutuamente excluyentes" (`espacios`): dos eventos mutuamente excluyentes casi nunca son independientes (salvo el caso trivial de probabilidad $0$), y es la confusión más común del topic. Reutiliza la fórmula de `condicional` como forma alternativa de verificar independencia. **No se usan** fórmulas de distribuciones (Binomial, Geométrica) aunque haya cadenas de eventos independientes repetidos, ya que esos modelos pertenecen a cinturones posteriores; todo se resuelve por producto puro, nunca por combinatoria. Tampoco se usa el teorema de Bayes.

**Contextos variados.** Alternar dados/monedas distintos lanzados juntos, extracciones con y sin reposición, piezas de fábricas distintas, encuestas. Ningún experimento debe superar ~30% de los ítems de una misma sub-familia.

---

## CLSF, 15 ejercicios

Reconocer si dos eventos son **independientes o dependientes**, sin calcular.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer independencia desde el contexto (experimentos físicamente separados: dados distintos, monedas distintas, con reposición) | 6 | `reconocer-independencia` |
| Reconocer dependencia (mismo experimento, extracción sin reposición, o un evento que afecta al otro) | 5 | `reconocer-dependencia` |
| Distractor: confundir independencia con mutuamente excluyentes | 4 | `distractor-mutuamente-excluyentes` |
| **Total** | **15** | |

**Cardinalidad**: conceptual → 3 opciones.

---

## FORM, 15 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| $P(A\cap B) = P(A)\cdot P(B)$ directa, 2 eventos | 6 | `formula-directa` |
| Verificar independencia comparando $P(A\cap B)$ contra $P(A)\cdot P(B)$ | 5 | `formula-verificacion` |
| Extensión a 3 eventos independientes en un orden exacto, producto de las 3 probabilidades | 4 | `formula-tres-eventos` |
| **Total** | **15** | |

**Cardinalidad**: conceptual → 3 opciones.

---

## RESL, 15 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Calcular $P(A\cap B)$ para eventos independientes dados | 5 | `resl-interseccion` |
| Verificar si dos eventos son independientes con datos numéricos (calcular ambos lados de la igualdad) | 5 | `resl-verificacion` |
| Calcular la probabilidad de una secuencia exacta y ordenada de un experimento independiente repetido (2-4 repeticiones) | 5 | `resl-repeticion` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Independencia vs. mutuamente excluyentes | Creer que $A\cap B=\emptyset$ implica independencia (en realidad implica dependencia total, salvo caso trivial de probabilidad $0$) |
| Independencia vs. mutuamente excluyentes | Creer que dos eventos independientes deben ser mutuamente excluyentes |
| Fórmula de independencia | Sumar $P(A)+P(B)$ en vez de multiplicar para $P(A\cap B)$ |
| Con vs. sin reposición | Tratar una extracción sin reposición (dependiente) como independiente porque "es al azar" |
| Verificación de independencia | Aceptar cualquier valor de $P(A\cap B)$ como prueba de independencia, sin comparar contra $P(A)\cdot P(B)$ |
| Secuencia/repetición independiente | Sumar las probabilidades de cada repetición en vez de multiplicarlas, o aplicar un coeficiente combinatorio (trampa de Binomial) cuando se pidió una secuencia exacta y ordenada |

---

## Reglas específicas del topic

- **Contextos de independencia**: dados/monedas distintos lanzados a la vez, extracciones **con reposición**, eventos de experimentos físicamente separados.
- **Contextos de dependencia**: extracciones **sin reposición** del mismo conjunto, un evento que altera físicamente las condiciones del otro (ej. una pieza defectuosa que afecta el conteo restante).
- **El distractor de mutuamente excluyentes describe la situación**, sin repetir literalmente la definición de `espacios` palabra por palabra; puede nombrar el término "mutuamente excluyentes" (ya definido en ese topic previo) porque acá el objetivo es distinguirlo de independencia, no evitarlo.
- **Sin combinatoria en FORM/RESL:** al plantear secuencias o repeticiones de eventos independientes ("éxito, falla, éxito"), pedir explícitamente el orden exacto para que la respuesta sea un producto simple ($p \cdot q \cdot p$). Evitar pedir "dos éxitos en tres intentos" (sin orden fijo), eso pertenece a la distribución Binomial de un cinturón posterior.
- **Cadena de 3+ factores, verticalizar (regla 41):** en `formula-tres-eventos` (FORM) y `resl-repeticion` (RESL), cuando la `explanation` muestra el producto de 3+ probabilidades ($P(C_1)\cdot P(C_2)\cdot P(C_3)$), partirlo en 2 líneas ($$P(C_1\cap C_2\cap C_3)$$ seguido de $$= P(C_1)\cdot P(C_2)\cdot P(C_3)$$) en vez de una sola línea larga, aunque el ancho total no llegue al límite de la regla 38 — es un problema de cuántos factores procesar de un vistazo, no solo de ancho.
- **Sin aclaraciones entre paréntesis en ningún campo del ejercicio** (regla crítica del `authoring-context.md`): toda aclaración va como oración propia en la prosa.

## Checklist del topic

- [ ] Los contextos de independencia especifican reposición o separación física entre experimentos
- [ ] Los contextos de dependencia especifican extracción sin reposición o afectación directa entre eventos
- [ ] El distractor de mutuamente excluyentes aparece explícitamente en `CLSF` en la proporción de la tabla
- [ ] Ningún ejercicio de secuencia/repetición pide una cantidad de éxitos sin orden fijo (eso exigiría combinatoria)
- [ ] Ningún campo usa paréntesis para aclaraciones (`question`, `options`, `feedback_correct`, `feedback_incorrect`, `explanation`)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
- [ ] Las cadenas de 3+ factores multiplicados en `explanation` van verticalizadas, no en una sola línea
