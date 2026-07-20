# Topic: Distribuciones marginales

Belt: `brown`, Unit: `vectores`, Topic: `marginales`

Skills en este topic: `FORM`, `RESL`.

Este topic tiene 2 ítems (uno por skill): `FORM`, `RESL`.

Concepto: la **marginal** de una variable se obtiene de la conjunta sumando (discreta, $p_X(x)=\sum_y p(x,y)$) o integrando (continua, $f_X(x)=\int f(x,y)\,dy$) sobre todos los valores de la otra variable.

**Frontera con el resto de la unidad:** reutiliza directamente las tablas conjuntas de `conjunta`. No usa todavía covarianza, correlación ni independencia.

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Fórmula marginal discreta $p_X(x)=\sum_y p(x,y)$ | 6 | `formula-marginal-discreta` |
| Fórmula marginal continua $f_X(x)=\int f(x,y)\,dy$ | 5 | `formula-marginal-continua` |
| Reconocer que la marginal ya no depende de la otra variable (conceptual) | 4 | `propiedad-marginal-conceptual` |
| **Total** | **15** | |

---

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Calcular una marginal discreta sumando una fila o columna de la tabla conjunta | 8 | `resl-marginal-desde-tabla` |
| Calcular ambas marginales de una tabla y verificar que cada una sume $1$ | 4 | `resl-verificar-marginales` |
| Calcular una probabilidad simple usando la marginal ya obtenida | 3 | `resl-probabilidad-desde-marginal` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Marginal discreta | Sumar sobre la variable equivocada (calcular $p_X$ sumando sobre $x$ en vez de sobre $y$) |
| Marginal desde tabla | Tomar un solo valor de la tabla en vez de sumar toda la fila/columna correspondiente |
| Verificación de marginales | No notar que ambas marginales deben sumar $1$ por separado |
| Marginal continua | Confundir la variable de integración (se integra sobre la que se "elimina", no sobre la que queda) |

---

## Reglas específicas del topic

- **Reutilizar el mismo tipo de tabla** de `conjunta` (dominio $2\times2$ a $3\times3$).
- **Cada ejercicio reintroduce la fórmula de marginal** que usa (regla crítica 31).

## Checklist del topic

- [ ] Toda tabla reutiliza el formato de `conjunta` (dominio $2\times2$ a $3\times3$)
- [ ] Las marginales calculadas suman $1$ en los ejercicios que las verifican
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
