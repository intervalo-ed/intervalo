# Topic: Correlación

Belt: `brown`, Unit: `vectores`, Topic: `correlacion`

Skills en este topic: `FORM`, `RESL`.

Este topic tiene 2 ítems (uno por skill): `FORM`, `RESL`.

Concepto: el coeficiente de correlación $\rho_{X,Y}=\dfrac{\mathrm{Cov}(X,Y)}{\sigma_X\sigma_Y}$, $-1\leq\rho\leq1$, estandariza la covarianza para medir la fuerza de la relación lineal entre $X$ e $Y$.

**Frontera con el resto de la unidad:** reutiliza directamente `covarianza`. Último topic antes de `independencia_vec`, que retoma la relación (y la limitación) entre covarianza cero e independencia.

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Fórmula $\rho_{X,Y}=\mathrm{Cov}(X,Y)/(\sigma_X\sigma_Y)$ | 6 | `formula-directa` |
| Rango $-1\leq\rho\leq1$ (propiedad) | 5 | `propiedad-rango` |
| Interpretación de $|\rho|$ (relación lineal fuerte, débil o ausente) | 4 | `interpretacion-magnitud` |
| **Total** | **15** | |

---

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Calcular $\rho$ desde $\mathrm{Cov}(X,Y)$, $\sigma_X$, $\sigma_Y$ ya dados | 8 | `resl-desde-datos` |
| Calcular $\sigma_X$, $\sigma_Y$ desde varianzas dadas y luego $\rho$ | 4 | `resl-desde-varianzas` |
| Interpretar el valor de $\rho$ calculado (fuerte/débil, directa/inversa) | 3 | `resl-interpretar-rho` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Fórmula | Dividir por $\sigma_X+\sigma_Y$ en vez de $\sigma_X\cdot\sigma_Y$ |
| Desde varianzas | Usar directamente $\mathrm{Var}(X)$ en vez de $\sigma_X=\sqrt{\mathrm{Var}(X)}$ en el denominador |
| Rango | Aceptar como válido un valor de $\rho$ fuera de $[-1,1]$ |
| Interpretación de magnitud | Confundir un $\rho$ cercano a $0$ con "las variables son independientes" (solo indica ausencia de relación **lineal**, puede haber una dependencia no lineal) |
| Signo | Confundir el signo de $\rho$ con su magnitud (un $\rho=-0{,}9$ indica relación lineal fuerte, no débil) |

---

## Reglas específicas del topic

- **Reutilizar los valores de covarianza** del topic anterior cuando aplique, para reforzar la conexión conceptual.
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).
- **La interpretación de $\rho\approx0$ nunca afirma independencia** sin matizar que solo descarta relación lineal (ver confusión de la tabla de arriba); este matiz se retoma formalmente en `independencia_vec`.

## Checklist del topic

- [ ] Ningún ejercicio acepta $\rho$ fuera de $[-1,1]$
- [ ] Ningún ejercicio afirma que $\rho\approx0$ implica independencia sin matizar "relación lineal"
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
