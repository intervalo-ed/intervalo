# Topic: Factorial

Belt: `white`, Unit: `conteo`, Topic: `factoriales`

Skills en este topic: `FORM`, `RESL`.

Este topic tiene 2 ítems (uno por skill): `FORM`, `RESL`.

Concepto: el **factorial** $n! = n \times (n-1) \times \cdots \times 1$, con la convención $0! = 1$, y la relación recursiva $n! = n \cdot (n-1)!$. Es la operación sobre la que se construyen `permutaciones`, `variaciones` y `combinaciones`; acá se trabaja aislada, sin todavía nombrar esas técnicas.

**Frontera con el resto de la unidad:** ningún ejercicio plantea un problema de conteo con contexto (personas, objetos a ordenar/elegir); son manipulaciones y evaluaciones directas de la expresión $n!$ y de cocientes/combinaciones simples entre factoriales. El contexto narrativo (podios, comités) empieza recién en `permutaciones`.

---

## FORM, 19 ejercicios

Identificar o armar la **expresión** equivalente (no calcular el valor numérico).

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Expresión expandida de $n!$ para un $n$ concreto | 4 | `expansion-directa` |
| Simplificación de un cociente de factoriales $\dfrac{n!}{k!}$ dejando el producto de los términos que no se cancelan | 4 | `cociente-simplificado` |
| Relación recursiva $n! = n \cdot (n-1)!$ aplicada para reescribir una expresión | 3 | `relacion-recursiva` |
| Caso especial $0! = 1$ y $1! = 1$ | 2 | `casos-especiales` |
| Expresión con suma/resta de factoriales sin simplificar todavía (identificar que no se puede sumar/restar los $n$ antes de expandir) | 2 | `suma-resta-factoriales` |
| **Con tabla** (`table`, modo `column`, sub-formato patrón): la tabla trae $n!$ para dos valores y deja los siguientes vacíos; las opciones reconstruyen $n!$ desde la fila de arriba | 2 | `recursiva-tabla` |
| **Con tabla** (`table`, modo `column`, sub-formato modelo): la columna arranca vacía y la regla está en la prosa; las opciones dan el cociente $\dfrac{n!}{(n-k)!}$ | 2 | `cociente-tabla` |
| **Total** | **19** | |

---

## RESL, 18 ejercicios

Calcular el **valor numérico**.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Factorial completo de un número chico ($n \leq 7$) | 3 | `factorial-directo` |
| Cociente de factoriales con cancelación ($\dfrac{n!}{k!}$, $n>k$) | 5 | `cociente-factoriales` |
| Expresión con suma o resta de factoriales ya expandidos (ej. $4! + 3!$, $5! - 4!$) | 3 | `suma-resta-evaluada` |
| Comparación entre dos factoriales (cuál es mayor, o la razón entre ambos) | 2 | `comparacion-factoriales` |
| Factorial dentro de una fracción con producto simple en el denominador (ej. $\dfrac{6!}{2! \cdot 3!}$, preparación directa para `combinaciones`, sin nombrar todavía el binomial) | 2 | `fraccion-producto-denominador` |
| **Con tabla** (`table`, modo `cell`): la tabla evalúa $n!$ para varios $n$ y deja **una celda intermedia** vacía, que se puede llegar desde arriba o desde abajo | 3 | `valor-desde-tabla` |
| **Total** | **18** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2). **Los ejercicios con `table` de este topic también van con 4 opciones** (ver *Reglas específicas*).

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

### Ejercicios con tabla (`recursiva-tabla`, `cociente-tabla`, `valor-desde-tabla`)

Reglas 68-75 de `authoring-context.md` más lo específico de este topic:

- **4 opciones**, igual que el resto del topic. Acá la cuarta opción sale gratis porque las
  restricciones A1 y A2 (regla 71) **no aplican** a esta familia.
- **Por qué no aplican A1 y A2.** Nada se parece a un factorial en dos puntos seguidos: cualquier
  distractor va a diferir de la correcta en todas las filas visibles, y casi cualquier fila va a
  separar a todos los candidatos. No es un defecto del ejercicio, es aritmética. El validador tira
  el WARNING de A2 en estos ítems y es **esperable**; se deja pasar.
- **El trabajo de la tabla acá es perceptual, no discriminativo.** El crecimiento factorial se
  subestima de forma masiva y la instrucción verbal no lo corrige. Una tabla que muestra
  $3\to6$, $5\to120$, $8\to40320$ en una pantalla entrega la explosión de un vistazo, que es el
  canal que las palabras no alcanzan. Ése es el motivo de existir de estos ítems.
- **El distractor bueno es la correcta desfasada, no una fórmula rival.** Cuando los órdenes de
  magnitud no compiten, lo que compite visualmente es una columna corrida un renglón: $(n-1)!$
  contra $n\cdot(n-1)!$ pinta exactamente la columna correcta un lugar más abajo, y el alumno no
  lee un número mal, ve un desfasaje. Es el error conceptual hecho imagen.
- **Régimen de consecutividad (regla 72): consecutivas** en `recursiva-tabla` (la recursión $n! =
  n\cdot(n-1)!$ **es** el contenido) y **no consecutivas** en `cociente-tabla`, que apunta a una
  fórmula cerrada ($5, 6, 8$, no $5, 6, 7$).
- **La tabla es contexto visual, no narrativo**, así que no viola la regla de "sin contexto
  narrativo" de este topic: sigue sin haber personas ni objetos que ordenar. Es justamente por eso
  que el formato encaja acá.
- **En `valor-desde-tabla`, la celda vacía va entre dos filas dadas**, para que se pueda llegar
  desde arriba ($5\times 24$) y verificar desde abajo ($720/6$). Eso convierte a la tabla en un
  mecanismo de autoverificación y no en decoración.
- $n \leq 8$ sigue valiendo, pero **los valores mostrados en la tabla pueden pasarse** ($8! =
  40320$) cuando la explosión es el punto: el techo acota lo que hay que *calcular*, no lo que se
  puede *mostrar*.

## Checklist del topic

- [ ] Ningún ejercicio tiene contexto narrativo de personas/objetos a ordenar o elegir
- [ ] $n \leq 8$ en factoriales completos, sin excepción
- [ ] $0!$ tratado como $1$ en todos los ejercicios que lo usan
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad numérica → 4 opciones ≤35 caracteres
- [ ] **Ejercicios con `table`: el WARNING de A2 del validador es esperable acá, no se "arregla"**
