# Topic: Covarianza

Belt: `brown`, Unit: `vectores`, Topic: `covarianza`

Skills en este topic: `FORM`, `RESL`.

Concepto: $\mathrm{Cov}(X,Y)=E[XY]-E[X]\cdot E[Y]$ cuantifica la tendencia de $X$ e $Y$ a variar juntas. Signo positivo: se mueven en la misma dirección; negativo: en direcciones opuestas.

---

## FORM, 15 ítems

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Fórmula $\mathrm{Cov}(X,Y)=E[XY]-E[X]E[Y]$ | 6 | `formula-directa` |
| Propiedades: $\mathrm{Cov}(X,X)=\mathrm{Var}(X)$, $\mathrm{Cov}(X,Y)=\mathrm{Cov}(Y,X)$ | 5 | `propiedades-covarianza` |
| Interpretación del signo de la covarianza | 4 | `interpretacion-signo` |
| **Total** | **15** | |

---

## RESL, 15 ítems

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Calcular $\mathrm{Cov}(X,Y)$ desde $E[X]$, $E[Y]$, $E[XY]$ ya dados | 8 | `resl-desde-momentos` |
| Calcular $\mathrm{Cov}(X,Y)$ desde una tabla conjunta discreta chica (calculando $E[XY]$ primero) | 4 | `resl-desde-tabla` |
| Interpretar el signo del resultado calculado | 3 | `resl-interpretar-signo` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Fórmula | Confundir $E[XY]$ con $E[X]\cdot E[Y]$ (tratarlos como si fueran siempre iguales) |
| Fórmula | Sumar en vez de restar, usando $E[XY]+E[X]E[Y]$ |
| Desde tabla | Calcular $E[XY]$ sumando $x\cdot y$ sin ponderar por $p(x,y)$ |
| Interpretación de signo | Confundir covarianza negativa con "no hay relación" (una covarianza negativa indica relación inversa, no ausencia de relación) |
| Propiedad $\mathrm{Cov}(X,X)$ | Olvidar que $\mathrm{Cov}(X,X)=\mathrm{Var}(X)$, tratándola como si fuera siempre $0$ |

---

## Reglas específicas del topic

- **Reutilizar el mismo tipo de tabla** de `conjunta`/`marginales` cuando se calcula desde una tabla.
- **Cada ítem reintroduce la fórmula** que usa (regla crítica 31).

## Checklist del topic

- [ ] Los ítems desde tabla desarrollan $E[XY]$, $E[X]$ y $E[Y]$ como pasos separados antes de combinar
- [ ] Ningún ítem confunde covarianza con correlación (esa relación es del topic siguiente)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
