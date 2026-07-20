# Topic: Independencia de variables aleatorias

Belt: `brown`, Unit: `vectores`, Topic: `independencia_vec`

Skills en este topic: `CLSF`, `FORM`, `RESL`.

Concepto: $X$ e $Y$ son **independientes** cuando la conjunta factoriza en el producto de las marginales: $p(x,y)=p_X(x)\cdot p_Y(y)$ (o $f(x,y)=f_X(x)f_Y(y)$ en el caso continuo). La independencia implica $\mathrm{Cov}(X,Y)=0$, pero la recíproca **no** es cierta en general. Cierra el curso.

**Frontera con el resto de la unidad:** retoma `conjunta`/`marginales` (factorización) y `covarianza`/`correlacion` (covarianza cero como consecuencia necesaria, no suficiente).

---

## CLSF, 15 ítems

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer independencia verificando que la conjunta factoriza en el producto de las marginales | 6 | `reconocer-independencia` |
| Reconocer dependencia (la conjunta no factoriza) | 5 | `reconocer-dependencia` |
| Distractor: confundir covarianza/correlación cero con independencia (la recíproca no vale en general) | 4 | `distractor-covarianza-cero` |
| **Total** | **15** | |

---

## FORM, 15 ítems

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Condición de factorización $f(x,y)=f_X(x)f_Y(y)$ (necesaria y suficiente) | 6 | `condicion-factorizacion` |
| Si son independientes, $\mathrm{Cov}(X,Y)=0$ (condición necesaria, no suficiente) | 5 | `condicion-covarianza-cero` |
| $\mathrm{Var}(X+Y)=\mathrm{Var}(X)+\mathrm{Var}(Y)$ si son independientes | 4 | `propiedad-varianza-suma` |
| **Total** | **15** | |

---

## RESL, 15 ítems

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Calcular $\mathrm{Var}(X+Y)$ para variables independientes | 6 | `resl-varianza-suma` |
| Verificar independencia comparando $f(x,y)$ contra $f_X(x)\cdot f_Y(y)$ en una tabla | 5 | `resl-verificar-factorizacion` |
| Calcular $\mathrm{Cov}(X,Y)$ en un caso independiente y confirmar que da $0$ (chequeo necesario, no prueba suficiente) | 4 | `resl-covarianza-nula` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Covarianza cero vs. independencia | Creer que $\mathrm{Cov}(X,Y)=0$ implica independencia (es condición necesaria, no suficiente; puede haber dependencia no lineal con covarianza nula) |
| Verificación de factorización | Verificar la factorización en un solo par $(x,y)$ y no en todos, cuando alcanza un contraejemplo para descartar independencia |
| Varianza de la suma | Aplicar $\mathrm{Var}(X+Y)=\mathrm{Var}(X)+\mathrm{Var}(Y)$ sin que el enunciado establezca independencia |
| Varianza de la suma | Sumar las varianzas cuando en realidad las variables son dependientes y falta el término $2\mathrm{Cov}(X,Y)$ |
| Reconocimiento CLSF | Confundir "mutuamente excluyentes" (concepto de eventos, `white/probabilidad`) con "independientes" (concepto de variables aleatorias) |

---

## Reglas específicas del topic

- **Reutilizar el mismo tipo de tabla** de `conjunta`/`marginales` para los ítems que verifican factorización.
- **El distractor de covarianza cero es central en este topic**: cada vez que se calcula covarianza en el contexto de independencia, la `explanation` aclara explícitamente que covarianza $0$ no prueba independencia por sí sola (regla crítica 25, justificar el porqué).
- **Cada ítem reintroduce la condición de factorización o la propiedad de varianza** que usa (regla crítica 31).

## Checklist del topic

- [ ] Ningún ítem afirma que covarianza cero implica independencia sin la aclaración de que es solo condición necesaria
- [ ] Los ítems de `Var(X+Y)` especifican explícitamente si las variables son independientes o no
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
