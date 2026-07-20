# Topic: Distribución exponencial

Belt: `violet`, Unit: `distribuciones`, Topic: `exponencial`

Skills en este topic: `GRAF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `GRAF`, `FORM`.

Concepto: $X\sim Exp(\lambda)$ modela el tiempo continuo entre eventos sucesivos de un proceso de Poisson con tasa $\lambda$. $f(x)=\lambda e^{-\lambda x}$, $x\geq 0$. $E[X]=1/\lambda$. Única distribución continua con pérdida de memoria (análoga a `geometrica` en el caso discreto).

**Nota de dependencia con integrales**: cuando un ejercicio necesite $P(a\leq X\leq b)$, dar la fórmula cerrada ya resuelta ($P(X\leq x)=1-e^{-\lambda x}$) en vez de pedir la integral (ver `probabilidad/course-context.md`).

---

## GRAF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer la forma de la densidad exponencial (decae monótona desde un valor positivo en $x=0$, nunca cruza el eje) | 6 | `reconocer-forma-exponencial` |
| Comparar dos densidades exponenciales con distinta $\lambda$ (cuál decae más rápido) | 5 | `comparar-tasas` |
| Identificar que la variable es no negativa (densidad nula para $x<0$) | 4 | `identificar-soporte` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Densidad $f(x)=\lambda e^{-\lambda x}$, $x\geq 0$ | 6 | `formula-densidad` |
| Propiedad de pérdida de memoria (conceptual) | 4 | `propiedad-perdida-memoria` |
| $E[X]=1/\lambda$, y fórmula cerrada $P(X\leq x)=1-e^{-\lambda x}$ ya resuelta | 5 | `formula-esperanza-acumulada` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Forma de la densidad | Confundir la exponencial con la normal (simétrica) o con la uniforme (constante) |
| Comparación de tasas | Creer que una $\lambda$ mayor decae más lento (en realidad decae más rápido, la media $1/\lambda$ es menor) |
| Esperanza | Usar $E[X]=\lambda$ en vez de $1/\lambda$ |
| Pérdida de memoria | Creer que el tiempo ya transcurrido afecta la distribución del tiempo restante |
| Soporte | Aceptar densidad no nula para $x<0$ |

---

## Reglas específicas del topic

- **$\lambda$ en valores simples** (ej. $\lambda=0{,}5$, $\lambda=2$) para que $E[X]=1/\lambda$ dé un número manejable.
- **Contextos válidos**: tiempo entre llegadas de clientes, vida útil de un componente, tiempo entre fallas de una máquina.
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).

## Checklist del topic

- [ ] Ningún ejercicio pide resolver una integral; las fórmulas de probabilidad acumulada vienen ya cerradas
- [ ] $\lambda$ es un valor simple que da $1/\lambda$ manejable
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: GRAF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
