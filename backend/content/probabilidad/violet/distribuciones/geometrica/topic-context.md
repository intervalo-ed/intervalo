# Topic: Distribución geométrica

Belt: `violet`, Unit: `distribuciones`, Topic: `geometrica`

Skills en este topic: `CLSF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `CLSF`, `FORM`.

Concepto: $X\sim Geom(p)$ modela la cantidad de ensayos hasta el **primer** éxito. $P(X=k)=(1-p)^{k-1}p$, $E[X]=1/p$. Única distribución discreta con **pérdida de memoria**.

**Frontera con el resto del topic:** la distinción con `binomial` (cuenta éxitos en $n$ fijo, no ensayos hasta el primero) y con `negativa` (busca el $r$-ésimo éxito con $r>1$, la geométrica es el caso $r=1$) es la fuente principal de distractores.

---

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer geométrica (ensayos hasta el primer éxito) | 8 | `reconocer-geometrica` |
| Distractor: en realidad binomial ($n$ fijo, cuenta éxitos totales, no ensayos hasta el primero) | 4 | `distractor-binomial` |
| Distractor: en realidad binomial negativa (busca el $r$-ésimo éxito con $r>1$) | 3 | `distractor-negativa` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Fórmula $P(X=k)=(1-p)^{k-1}p$ | 7 | `formula-directa` |
| Propiedad de pérdida de memoria (conceptual) | 4 | `propiedad-perdida-memoria` |
| $E[X]=1/p$ | 4 | `formula-esperanza` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Geométrica vs. binomial | Tratar como geométrico un problema con $n$ fijo que en realidad cuenta el total de éxitos (eso es binomial) |
| Geométrica vs. negativa | Aplicar la fórmula geométrica cuando el enunciado pide el $r$-ésimo éxito con $r>1$ |
| Fórmula | Invertir el exponente, usando $(1-p)^{k}p^{k-1}$ o similar |
| Fórmula | Contar el ensayo exitoso entre los "fracasos", usando $(1-p)^k$ en vez de $(1-p)^{k-1}$ |
| Pérdida de memoria | Creer que la probabilidad de éxito cambia según cuántos fracasos ya ocurrieron |

---

## Reglas específicas del topic

- **Contextos válidos**: intentos hasta el primer acierto (dado, tiro al arco, prueba de un producto), primer cliente que acepta una oferta.
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).

## Checklist del topic

- [ ] Todo contexto de `reconocer-geometrica` pregunta por el número de ensayos hasta el **primer** éxito, nunca un total fijo de $n$
- [ ] El distractor de binomial negativa especifica $r>1$ explícitamente
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
