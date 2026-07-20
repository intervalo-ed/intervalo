# Topic: Distribución conjunta

Belt: `brown`, Unit: `vectores`, Topic: `conjunta`

Skills en este topic: `CLSF`, `FORM`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `CLSF`, `FORM`, `RESL`.

Concepto: la **distribución conjunta** describe el comportamiento simultáneo de dos variables aleatorias. Discreta: $p(x,y)=P(X=x,Y=y)$, $\sum_{x,y}p(x,y)=1$. Continua: $f(x,y)$, $\iint f(x,y)\,dx\,dy=1$.

**Frontera con el resto de la unidad:** primer topic de `vectores`, base de `marginales`, `covarianza`, `correlacion` e `independencia_vec`. Solo tablas discretas chicas en `RESL` (nunca densidades continuas con integral doble no trivial, ver nota de dependencia en `course-context.md`).

---

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer qué representa $p(x,y)$/$f(x,y)$ (probabilidad o densidad conjunta) | 6 | `reconocer-conjunta` |
| Clasificar si una tabla dada es una conjunta discreta válida (la suma da $1$) o no | 5 | `validar-conjunta` |
| Distinguir vector discreto vs. continuo desde el contexto | 4 | `discreta-vs-continua` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Condición de normalización, discreta $\sum p(x,y)=1$ o continua $\iint f=1$ | 6 | `condicion-normalizacion` |
| Expresar $P(\text{evento compuesto})$ como suma de $p(x,y)$ sobre la región del evento | 5 | `formula-evento-compuesto` |
| Propiedad $f(x,y)\geq 0$ / $p(x,y)\geq 0$ | 4 | `propiedad-no-negatividad` |
| **Total** | **15** | |

---

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Calcular $P(\text{evento})$ sumando entradas de una tabla conjunta discreta | 7 | `resl-evento-desde-tabla` |
| Verificar si una tabla conjunta es válida (la suma da $1$) | 4 | `resl-verificar-validez` |
| Calcular la probabilidad de un evento definido por combinación de $X,Y$ (ej. $X+Y=k$) | 4 | `resl-evento-combinado` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Evento desde tabla | Sumar solo una entrada de la tabla cuando el evento agrupa 2 o más pares $(x,y)$ |
| Validez de la conjunta | Aceptar como válida una tabla cuya suma no da $1$ |
| Evento combinado | Confundir $X+Y=k$ con $X=k$ o $Y=k$ por separado, olvidando recorrer todos los pares que suman $k$ |
| Normalización | Confundir la condición de normalización de la conjunta con la de una marginal |
| Reconocimiento | Confundir $p(x,y)$ (probabilidad de que ambas variables tomen esos valores a la vez) con $p(x)+p(y)$ o algún otro combinado incorrecto |

---

## Reglas específicas del topic

- **Tablas discretas con dominio $2\times2$ a $3\times3$**, siempre con la suma total dada o verificable a mano.
- **Nunca una densidad continua que requiera integral doble no trivial** en `RESL`; si se necesita, usar valores ya integrados o una región rectangular simple.
- **Cada ejercicio reintroduce la condición de normalización** cuando la usa (regla crítica 31).

## Checklist del topic

- [ ] Toda tabla discreta de `RESL` tiene dominio entre $2\times2$ y $3\times3$
- [ ] Ningún ejercicio de `RESL` requiere integral doble no trivial
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
