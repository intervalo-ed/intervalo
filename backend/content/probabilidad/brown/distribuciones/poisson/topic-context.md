# Topic: Distribución de Poisson

Belt: `brown`, Unit: `distribuciones`, Topic: `poisson`

Skills en este topic: `CLSF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `CLSF`, `FORM`.

Concepto: cantidad de eventos independientes en un intervalo fijo de tiempo, longitud o área, a tasa promedio $\lambda$. $P(X=k)=\dfrac{e^{-\lambda}\lambda^k}{k!}$, $E[X]=\mathrm{Var}(X)=\lambda$.

**Frontera con el resto del topic:** distinguir de `binomial` (no hay un $n$ de ensayos discreto, sino una tasa continua de ocurrencia) y de `geometrica` (Poisson cuenta eventos en un intervalo, no espera hasta el primer evento).

**Marco de la unidad:** ver la nota de marco compartido en `binomial/topic-context.md`. `CLSF` evalúa reconocer-propia / distractor-vecino / supuesto-violado; `FORM` evalúa identificar-parametros / formula-directa / esperanza-varianza-y-ajuste-tasa.

---

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer Poisson (conteo de eventos en un intervalo fijo con tasa promedio conocida) | 6 | `reconocer-poisson` |
| Distractor: la historia parece Poisson pero en realidad es binomial ($n$ ensayos discretos bien definidos) o geométrica (espera hasta el próximo evento, no conteo en un intervalo) | 5 | `distractor-vecino` |
| Supuesto violado: la tasa de ocurrencia no es constante dentro del intervalo (ej. varía según la hora del día) | 4 | `supuesto-violado` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Identificar $\lambda$ y el intervalo al que corresponde desde un contexto dado | 4 | `identificar-parametros` |
| Fórmula $P(X=k)=\dfrac{e^{-\lambda}\lambda^k}{k!}$ | 6 | `formula-directa` |
| $E[X]=\mathrm{Var}(X)=\lambda$, ajuste de $\lambda$ al cambiar la longitud del intervalo, con lectura interpretativa | 5 | `esperanza-varianza-y-ajuste-tasa` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## Contextos variados

- Llamadas por hora en un call center, a tasa promedio conocida.
- Clientes por minuto llegando a una caja de supermercado.
- Errores tipográficos por página en un documento largo.
- Autos por minuto pasando por un semáforo en hora pico.
- Mensajes por minuto recibidos en un canal de soporte.
- Fallas por mes en una máquina de una línea de producción.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Poisson vs. binomial | Tratar como Poisson un problema con $n$ ensayos discretos y probabilidad fija por ensayo (eso es binomial) |
| Poisson vs. geométrica | Confundir "cuántos eventos ocurren en una hora" con "cuánto hay que esperar para el próximo evento" |
| Supuesto violado | No notar que la tasa de ocurrencia cambia dentro del propio intervalo (ej. más llamadas al mediodía que a la madrugada) y tratar la situación como Poisson de tasa única igual |
| Ajuste de tasa | No reescalar $\lambda$ al cambiar la longitud del intervalo (usar la tasa de una hora para un intervalo de 2 horas) |
| Fórmula | Olvidar el factorial $k!$ en el denominador |
| Esperanza/varianza | Usar $\mathrm{Var}(X)=\lambda^2$ en vez de $\lambda$ |

---

## Reglas específicas del topic

- **Contextos válidos**: ver tabla de arriba.
- **$\lambda$ acotado** (≤15) para que $e^{-\lambda}$ no genere números que se descarten a ojo por magnitud.
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).
- **Toda `explanation` de este topic (`CLSF` y `FORM`) incluye un párrafo breve que interpreta intuitivamente el concepto central del ejercicio.** En `esperanza-varianza-y-ajuste-tasa` esa interpretación explica que $\lambda$ es a la vez el promedio y la varianza porque el mismo parámetro gobierna cuánto ocurre en promedio y cuánto varía de un intervalo a otro (a diferencia de la binomial, acá promedio y variabilidad no se pueden ajustar por separado); y que reescalar $\lambda$ al cambiar el intervalo refleja que "más tiempo, más eventos esperados", en la misma proporción.
- **`supuesto-violado`**: la historia describe una tasa que no es pareja dentro del propio intervalo (más llamadas al mediodía, más autos en hora pico dentro de una franja de varias horas); las opciones incluyen una que nombra esa razón explícitamente.

## Checklist del topic

- [ ] Todo contexto especifica explícitamente la tasa promedio y el intervalo al que corresponde
- [ ] `distractor-vecino` varía entre confundir con binomial y con geométrica
- [ ] `supuesto-violado` describe una tasa que cambia dentro del propio intervalo, sin nombrar la distribución que sí aplicaría
- [ ] Los ejercicios de ajuste de tasa reescalan $\lambda$ correctamente y lo muestran como paso explícito
- [ ] Toda `explanation` tiene su párrafo de interpretación intuitiva
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
