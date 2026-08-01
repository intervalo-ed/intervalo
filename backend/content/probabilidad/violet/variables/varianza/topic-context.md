# Topic: Varianza

Belt: `violet`, Unit: `variables`, Topic: `varianza`

Skills en este topic: `FORM`, `RESL`.

Este topic tiene 2 ítems (uno por skill): `FORM`, `RESL`.

Concepto: la **varianza** $\mathrm{Var}(X)=E[(X-\mu)^2]=E[X^2]-(E[X])^2$ mide la dispersión respecto de la esperanza $\mu=E[X]$. La desviación estándar es $\sigma=\sqrt{\mathrm{Var}(X)}$. Propiedad: $\mathrm{Var}(aX+b)=a^2\,\mathrm{Var}(X)$.

**Cierre de la unidad `variables`**: reutiliza `esperanza` en cada cálculo ($E[X]$ y $E[X^2]$).

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Definición $\mathrm{Var}(X)=E[(X-\mu)^2]$ | 5 | `definicion-varianza` |
| Fórmula operativa $\mathrm{Var}(X)=E[X^2]-(E[X])^2$ | 5 | `formula-operativa` |
| Propiedad $\mathrm{Var}(aX+b)=a^2\,\mathrm{Var}(X)$ | 5 | `propiedad-escalado` |
| **Total** | **15** | |

---

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Calcular $\mathrm{Var}(X)$ discreta desde tabla $p(x)$, vía $E[X^2]-(E[X])^2$ | 5 | `resl-varianza-discreta` |
| Calcular la desviación estándar $\sigma=\sqrt{\mathrm{Var}(X)}$ | 4 | `resl-desviacion-estandar` |
| Calcular $\mathrm{Var}(aX+b)$ desde $\mathrm{Var}(X)$ conocido | 3 | `resl-varianza-escalada` |
| Interpretar qué representa $\mathrm{Var}(X)$ (o comparar dispersión entre dos variables), sin recalcular | 3 | `resl-interpretacion` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); `resl-interpretacion` es conceptual/textual → 3-4 opciones sin restricción de 35 caracteres, pero con paridad de longitud entre sí.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Fórmula operativa | Confundir $E[X^2]$ con $(E[X])^2$ (elevar al cuadrado el promedio en vez de promediar los cuadrados) |
| Desviación estándar | Olvidar la raíz cuadrada, confundiendo $\sigma$ con $\mathrm{Var}(X)$ |
| Propiedad de escalado | Olvidar elevar al cuadrado el coeficiente $a$ (usar $\mathrm{Var}(aX+b)=a\cdot\mathrm{Var}(X)$) |
| Propiedad de escalado | Incluir $b$ en el resultado (creer que el desplazamiento afecta la dispersión) |
| Cálculo discreto | Calcular $E[X]$ correctamente pero olvidar restar $(E[X])^2$ al final, dejando solo $E[X^2]$ |
| Interpretación de $\mathrm{Var}(X)$ | Confundir la varianza con la esperanza (creer que mide el promedio en vez de la dispersión) |
| Interpretación de $\mathrm{Var}(X)$ | Confundir mayor varianza con "más cantidad" o "mejor" en vez de "más disperso/menos consistente" |

---

## Reglas específicas del topic

- **Dominio discreto chico** (3-5 valores), consistente con `puntual`/`esperanza`.
- **Cada ejercicio reintroduce la fórmula operativa** $\mathrm{Var}(X)=E[X^2]-(E[X])^2$ cuando la usa (regla crítica 31), mostrando el cálculo de $E[X]$ y $E[X^2]$ como pasos separados en `\begin{aligned}` si el desarrollo lo amerita.
- **Toda `explanation` de este topic (`FORM` y `RESL`) incluye un párrafo breve de significado interpretativo**: qué representa $\mathrm{Var}(X)$ (o $\sigma$) en ese contexto, dispersión respecto de la esperanza, nunca una medida de "cantidad" ni una segunda esperanza. Ese párrafo va después del desarrollo matemático y antes del cierre sobre la confusión. En `resl-interpretacion` este párrafo es el centro de la pregunta, no un agregado; suele comparar dos escenarios con la misma esperanza y distinta varianza.
- **`RESL` sigue la regla 43 estándar**: contexto cotidiano concreto obligatorio en todas sus sub-familias, incluida `resl-interpretacion`. `FORM` queda abstracto (sin la excepción de `esperanza`).

## Checklist del topic

- [ ] Todo cálculo de varianza discreta desarrolla $E[X]$ y $E[X^2]$ como pasos separados antes de restar
- [ ] Ningún ejercicio confunde $\sigma$ con $\mathrm{Var}(X)$
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
- [ ] Toda `explanation` tiene un párrafo de significado interpretativo de $\mathrm{Var}(X)$; `resl-interpretacion` compara dispersión, no ubicación/promedio
