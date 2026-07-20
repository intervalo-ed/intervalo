# Topic: Independencia de eventos

Belt: `white`, Unit: `probabilidad`, Topic: `independencia`

Skills en este topic: `CLSF`, `FORM`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `CLSF`, `FORM`, `RESL`.

Concepto: dos eventos $A$ y $B$ son **independientes** cuando $P(A \cap B) = P(A) \cdot P(B)$, equivalente a $P(A\mid B) = P(A)$ (la ocurrencia de uno no cambia la probabilidad del otro).

**Frontera con el resto de la unidad:** distingue explícitamente independencia de "mutuamente excluyentes" (`espacios`): dos eventos mutuamente excluyentes casi nunca son independientes (salvo el caso trivial de probabilidad $0$), y es la confusión más común del topic. Reutiliza la fórmula de `condicional` como forma alternativa de verificar independencia.

---

## CLSF, 50 ejercicios

Reconocer si dos eventos son **independientes o dependientes**, sin calcular.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer independencia desde el contexto (experimentos físicamente separados: dados distintos, monedas distintas, con reposición) | 18 | `reconocer-independencia` |
| Reconocer dependencia (mismo experimento, extracción sin reposición, o un evento que afecta al otro) | 18 | `reconocer-dependencia` |
| Distractor: confundir independencia con mutuamente excluyentes | 14 | `distractor-mutuamente-excluyentes` |
| **Total** | **50** | |

---

## FORM, 50 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| $P(A\cap B) = P(A)\cdot P(B)$ directa, 2 eventos | 20 | `formula-directa` |
| Verificar independencia comparando $P(A\cap B)$ contra $P(A)\cdot P(B)$ | 15 | `formula-verificacion` |
| Extensión a 3 eventos independientes, producto de las 3 probabilidades | 15 | `formula-tres-eventos` |
| **Total** | **50** | |

---

## RESL, 50 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Calcular $P(A\cap B)$ para eventos independientes dados | 16 | `resl-interseccion` |
| Verificar si dos eventos son independientes con datos numéricos (calcular ambos lados de la igualdad) | 16 | `resl-verificacion` |
| Calcular la probabilidad de repetir un experimento independiente varias veces (2-4 repeticiones) | 18 | `resl-repeticion` |
| **Total** | **50** | |

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
| Repetición de experimento independiente | Sumar las probabilidades de cada repetición en vez de multiplicarlas |

---

## Reglas específicas del topic

- **Contextos de independencia**: dados/monedas distintos lanzados a la vez, extracciones **con reposición**, eventos de experimentos físicamente separados.
- **Contextos de dependencia**: extracciones **sin reposición** del mismo conjunto, un evento que altera físicamente las condiciones del otro (ej. una pieza defectuosa que afecta el conteo restante).
- **El distractor de mutuamente excluyentes describe la situación**, sin repetir literalmente la definición de `espacios` palabra por palabra; puede nombrar el término "mutuamente excluyentes" (ya definido en ese topic previo) porque acá el objetivo es distinguirlo de independencia, no evitarlo.

## Checklist del topic

- [ ] Los contextos de independencia especifican reposición o separación física entre experimentos
- [ ] Los contextos de dependencia especifican extracción sin reposición o afectación directa entre eventos
- [ ] El distractor de mutuamente excluyentes aparece explícitamente en `CLSF` en la proporción de la tabla
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
