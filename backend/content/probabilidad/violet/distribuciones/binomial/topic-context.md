# Topic: Distribución binomial

Belt: `violet`, Unit: `distribuciones`, Topic: `binomial`

Skills en este topic: `CLSF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `CLSF`, `FORM`.

Concepto: $X\sim Bin(n,p)$ modela la cantidad de éxitos en $n$ ensayos independientes idénticos con probabilidad de éxito constante $p$. $P(X=k)=\binom{n}{k}p^k(1-p)^{n-k}$, $E[X]=np$, $\mathrm{Var}(X)=np(1-p)$.

**Frontera con el resto del topic:** primera distribución de la unidad. La distinción con `geometrica` (busca el primer éxito, no cuenta éxitos en $n$ fijos) y con `hipergeometrica` (sin reposición, población finita) es la fuente principal de distractores en `CLSF` en ambos topics.

---

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer binomial ($n$ ensayos independientes idénticos, cuenta éxitos totales) | 8 | `reconocer-binomial` |
| Distractor: en realidad geométrica (se busca el primer éxito, no un total en $n$ fijos) | 4 | `distractor-geometrica` |
| Distractor: en realidad hipergeométrica (extracción sin reposición de población finita) | 3 | `distractor-hipergeometrica` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Fórmula $P(X=k)=\binom{n}{k}p^k(1-p)^{n-k}$ | 6 | `formula-directa` |
| $E[X]=np$, $\mathrm{Var}(X)=np(1-p)$ | 5 | `formula-esperanza-varianza` |
| Identificar $n$ y $p$ desde un contexto dado | 4 | `identificar-parametros` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Binomial vs. geométrica | Aplicar la binomial a un problema que en realidad pregunta "cuántos ensayos hasta el primer éxito" (eso es geométrica) |
| Binomial vs. hipergeométrica | Aplicar la binomial cuando la extracción es sin reposición de una población chica y finita |
| Fórmula | Olvidar el coeficiente combinatorio $\binom{n}{k}$, dejando solo $p^k(1-p)^{n-k}$ |
| Fórmula | Invertir los exponentes, usando $p^{n-k}(1-p)^k$ |
| Parámetros | Confundir $n$ (cantidad de ensayos) con $k$ (cantidad de éxitos buscada) al identificar los datos del contexto |

---

## Reglas específicas del topic

- **Contextos válidos**: monedas/dados lanzados $n$ veces, tasa de defectos en $n$ piezas, encuestas con $n$ personas y una probabilidad fija de respuesta.
- **$n$ acotado** (≤30) para que $\binom{n}{k}$ no genere números que se descarten por magnitud a ojo.
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).

## Checklist del topic

- [ ] Todo contexto de `reconocer-binomial` tiene $n$ fijo y ensayos independientes idénticos
- [ ] Los distractores de geométrica/hipergeométrica describen la situación sin nombrar la fórmula de la otra distribución
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
