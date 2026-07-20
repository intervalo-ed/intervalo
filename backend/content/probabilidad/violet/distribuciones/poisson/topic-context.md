# Topic: Distribución de Poisson

Belt: `violet`, Unit: `distribuciones`, Topic: `poisson`

Skills en este topic: `CLSF`, `FORM`.

Concepto: cantidad de eventos independientes en un intervalo fijo de tiempo, longitud o área, a tasa promedio $\lambda$. $P(X=k)=\dfrac{e^{-\lambda}\lambda^k}{k!}$, $E[X]=\mathrm{Var}(X)=\lambda$.

**Frontera con el resto del topic:** distinguir de `binomial` (no hay un $n$ de ensayos discreto, sino una tasa continua de ocurrencia) y de `geometrica` (Poisson cuenta eventos en un intervalo, no espera hasta el primer evento).

---

## CLSF, 15 ítems

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer Poisson (conteo de eventos en un intervalo fijo con tasa promedio conocida) | 8 | `reconocer-poisson` |
| Distractor: en realidad binomial ($n$ ensayos discretos bien definidos, no una tasa continua) | 4 | `distractor-binomial` |
| Distractor: en realidad geométrica (espera hasta el próximo evento, no conteo en un intervalo) | 3 | `distractor-geometrica` |
| **Total** | **15** | |

---

## FORM, 15 ítems

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Fórmula $P(X=k)=\dfrac{e^{-\lambda}\lambda^k}{k!}$ | 7 | `formula-directa` |
| $E[X]=\mathrm{Var}(X)=\lambda$ | 4 | `formula-esperanza-varianza` |
| Ajustar $\lambda$ al cambiar la longitud del intervalo (ej. de "por hora" a "por 2 horas") | 4 | `ajuste-tasa-intervalo` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Poisson vs. binomial | Tratar como Poisson un problema con $n$ ensayos discretos y probabilidad fija por ensayo (eso es binomial) |
| Poisson vs. geométrica | Confundir "cuántos eventos ocurren en una hora" con "cuánto hay que esperar para el próximo evento" |
| Ajuste de tasa | No reescalar $\lambda$ al cambiar la longitud del intervalo (usar la tasa de una hora para un intervalo de 2 horas) |
| Fórmula | Olvidar el factorial $k!$ en el denominador |
| Esperanza/varianza | Usar $\mathrm{Var}(X)=\lambda^2$ en vez de $\lambda$ |

---

## Reglas específicas del topic

- **Contextos válidos**: llamadas por hora en un call center, clientes por minuto en una caja, errores tipográficos por página, autos por minuto en un semáforo.
- **$\lambda$ acotado** (≤15) para que $e^{-\lambda}$ no genere números que se descarten a ojo por magnitud.
- **Cada ítem reintroduce la fórmula** que usa (regla crítica 31).

## Checklist del topic

- [ ] Todo contexto especifica explícitamente la tasa promedio y el intervalo al que corresponde
- [ ] Los ítems de ajuste de tasa reescalan $\lambda$ correctamente y lo muestran como paso explícito
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; ítems numéricos → 4 opciones ≤35 caracteres
