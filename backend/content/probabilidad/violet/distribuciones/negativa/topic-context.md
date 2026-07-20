# Topic: Distribución binomial negativa

Belt: `violet`, Unit: `distribuciones`, Topic: `negativa`

Skills en este topic: `CLSF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `CLSF`, `FORM`.

Concepto: generaliza la geométrica: cantidad de ensayos hasta acumular $r$ éxitos. $P(X=k)=\binom{k-1}{r-1}p^r(1-p)^{k-r}$, $E[X]=r/p$. Coincide con `geometrica` cuando $r=1$.

**Frontera con el resto del topic:** distinguir de `geometrica` (caso particular $r=1$) y de `binomial` ($n$ fijo, no se detiene al llegar a $r$ éxitos).

---

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer binomial negativa (ensayos hasta acumular $r>1$ éxitos) | 8 | `reconocer-negativa` |
| Distractor: en realidad geométrica ($r=1$) | 4 | `distractor-geometrica` |
| Distractor: en realidad binomial ($n$ fijo, no se detiene al llegar a $r$ éxitos) | 3 | `distractor-binomial` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Fórmula $P(X=k)=\binom{k-1}{r-1}p^r(1-p)^{k-r}$ | 7 | `formula-directa` |
| Relación con la geométrica cuando $r=1$ | 4 | `relacion-con-geometrica` |
| $E[X]=r/p$ | 4 | `formula-esperanza` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Binomial negativa vs. geométrica | No notar que $r>1$ e igual aplicar la fórmula geométrica simple |
| Binomial negativa vs. binomial | Tratar el problema como $n$ ensayos fijos cuando en realidad el experimento se detiene al llegar al $r$-ésimo éxito ($n$ es aleatorio) |
| Fórmula | Usar $\binom{k}{r}$ en vez de $\binom{k-1}{r-1}$ (olvidar que el último ensayo siempre es un éxito) |
| Fórmula | Invertir los exponentes de $p$ y $(1-p)$ |
| Esperanza | Usar $E[X]=r\cdot p$ en vez de $r/p$ |

---

## Reglas específicas del topic

- **Contextos válidos**: vendedor que busca $r$ ventas, curriculums enviados hasta $r$ respuestas positivas, intentos hasta acumular $r$ aciertos.
- **$r$ siempre $\geq 2$** en `reconocer-negativa` (para no solaparse con `geometrica`, que cubre $r=1$).
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).

## Checklist del topic

- [ ] Todo ejercicio de `reconocer-negativa` tiene $r\geq 2$ explícito
- [ ] El distractor de binomial especifica que el experimento se detiene al llegar a $r$ éxitos, no en un $n$ fijo
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
