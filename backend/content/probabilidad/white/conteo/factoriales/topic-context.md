# Topic: Factorial

Belt: `white`, Unit: `conteo`, Topic: `factoriales`

Skills en este topic: `FORM`, `RESL`.

Este topic tiene 2 ítems (uno por skill): `FORM`, `RESL`.

Concepto: el **factorial** $n! = n \times (n-1) \times \cdots \times 1$, con la convención $0! = 1$, y la relación recursiva $n! = n \cdot (n-1)!$. Es la operación sobre la que se construyen `permutaciones`, `variaciones` y `combinaciones`; acá se trabaja aislada, sin todavía nombrar esas técnicas.

**Frontera con el resto de la unidad:** ningún ejercicio plantea un problema de conteo con contexto (personas, objetos a ordenar/elegir); son manipulaciones y evaluaciones directas de la expresión $n!$ y de cocientes/combinaciones simples entre factoriales. El contexto narrativo (podios, comités) empieza recién en `permutaciones`.

---

## FORM, 50 ejercicios

Identificar o armar la **expresión** equivalente (no calcular el valor numérico).

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Expresión expandida de $n!$ para un $n$ concreto | 12 | `expansion-directa` |
| Simplificación de un cociente de factoriales $\dfrac{n!}{k!}$ dejando el producto de los términos que no se cancelan | 14 | `cociente-simplificado` |
| Relación recursiva $n! = n \cdot (n-1)!$ aplicada para reescribir una expresión | 10 | `relacion-recursiva` |
| Caso especial $0! = 1$ y $1! = 1$ | 6 | `casos-especiales` |
| Expresión con suma/resta de factoriales sin simplificar todavía (identificar que no se puede sumar/restar los $n$ antes de expandir) | 8 | `suma-resta-factoriales` |
| **Total** | **50** | |

---

## RESL, 50 ejercicios

Calcular el **valor numérico**.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Factorial completo de un número chico ($n \leq 7$) | 10 | `factorial-directo` |
| Cociente de factoriales con cancelación ($\dfrac{n!}{k!}$, $n>k$) | 16 | `cociente-factoriales` |
| Expresión con suma o resta de factoriales ya expandidos (ej. $4! + 3!$, $5! - 4!$) | 10 | `suma-resta-evaluada` |
| Comparación entre dos factoriales (cuál es mayor, o la razón entre ambos) | 8 | `comparacion-factoriales` |
| Factorial dentro de una fracción con producto simple en el denominador (ej. $\dfrac{6!}{2! \cdot 3!}$, preparación directa para `combinaciones`, sin nombrar todavía el binomial) | 6 | `fraccion-producto-denominador` |
| **Total** | **50** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

---

## `feedback_incorrect`, confusiones típicas

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Expansión de $n!$ | Incluir el $0$ como factor (da $0$) en vez de detenerse en $1$ |
| Cociente de factoriales | Cancelar solo parcialmente, dejando términos de más o de menos en el resultado |
| Cociente de factoriales | Restar los índices en vez de cancelar el producto (creer que $\dfrac{7!}{5!} = 2!$) |
| $0!$ | Tratar $0! = 0$ en vez de $1$ |
| Suma/resta de factoriales | Sumar o restar los $n$ antes de expandir (creer que $4! + 3! = 7!$) |
| Relación recursiva | Aplicar $n! = n \cdot (n-1)!$ en la dirección incorrecta o con el índice equivocado |
| Comparación de factoriales | Comparar los $n$ en vez del valor de $n!$ (ej. creer $5! < 6$ por comparar $5$ con $6$) |

---

## Reglas específicas del topic

- **Sin contexto narrativo**: los ejercicios son manipulación/evaluación directa de expresiones con factorial, no problemas de conteo con personas u objetos. El contexto llega en `permutaciones`.
- **$n$ acotado**: usar $n \leq 8$ en factoriales completos para que el resultado no sea un número gigante que se descarta a ojo (ratio de magnitud entre opciones, regla crítica de `authoring-context.md`).
- **Reintroducir la definición** (regla crítica 31): cada ejercicio que usa $n!$ reintroduce brevemente qué es (aunque sea en una subordinada corta), no asume que el alumno la vio en otro ejercicio de la sesión.
- **En `fraccion-producto-denominador`, la división final tiene que ser mental**: el objetivo del ítem es practicar expandir cada factorial y multiplicar el denominador, no hacer una cuenta larga al final. Elegir $n$/denominador de forma que el cociente salga limpio y chico (ej. $\dfrac{5!}{2!\cdot3!}=\dfrac{120}{12}=10$, no $\dfrac{6!}{2!\cdot3!}=\dfrac{720}{12}=60$, que ya obliga a dividir un número de 3 cifras a mano).

## Checklist del topic

- [ ] Ningún ejercicio tiene contexto narrativo de personas/objetos a ordenar o elegir
- [ ] $n \leq 8$ en factoriales completos, sin excepción
- [ ] $0!$ tratado como $1$ en todos los ejercicios que lo usan
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad numérica → 4 opciones ≤35 caracteres
