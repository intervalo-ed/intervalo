# Topic: Esperanza

Belt: `blue`, Unit: `variables`, Topic: `esperanza`

Skills en este topic: `FORM`, `RESL`.

Concepto: la **esperanza** $E[X]=\sum_x x\cdot p(x)$ (discreta) o $E[X]=\int x\cdot f(x)\,dx$ (continua), el promedio ponderado a largo plazo. Es lineal: $E[aX+b]=a\cdot E[X]+b$.

---

## FORM, 15 ítems

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| $E[X]=\sum_x x\cdot p(x)$ discreta | 6 | `formula-discreta` |
| Linealidad $E[aX+b]=a\cdot E[X]+b$ | 5 | `propiedad-linealidad` |
| $E[X]=\int x f(x)\,dx$ continua (fórmula, sin resolver la integral) | 4 | `formula-continua` |
| **Total** | **15** | |

---

## RESL, 15 ítems

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Calcular $E[X]$ discreta desde una tabla $p(x)$ | 7 | `resl-discreta` |
| Calcular $E[aX+b]$ usando linealidad, con $E[X]$ ya conocido | 5 | `resl-linealidad` |
| Calcular $E[X]$ continua con una densidad uniforme (fórmula $(a+b)/2$ dada, sin integrar) | 3 | `resl-continua-uniforme` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| $E[X]$ discreta | Promediar los valores de $x$ sin ponderar por $p(x)$ (promedio simple en vez de ponderado) |
| Linealidad | Aplicar $E[aX+b]=a\cdot E[X]$ olvidando sumar $b$ |
| Linealidad | Multiplicar $b$ por $a$ también (creer que $E[aX+b]=a(E[X]+b)$) |
| $E[X]$ continua uniforme | Usar el punto medio del dominio completo en vez del intervalo donde la densidad es no nula |
| Cálculo discreto | Omitir algún término $x\cdot p(x)$ de la suma |

---

## Reglas específicas del topic

- **Dominio discreto chico** (3-5 valores), consistente con `puntual`.
- **Densidad continua uniforme únicamente**, reutilizando la fórmula ya vista $(a+b)/2$; no pedir la integral en este topic.
- **Cada ítem reintroduce la fórmula de esperanza** que usa (regla crítica 31).

## Checklist del topic

- [ ] Los ítems discretos ponderan correctamente cada valor por su $p(x)$
- [ ] Los ítems continuos usan solo densidad uniforme con fórmula ya conocida
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
