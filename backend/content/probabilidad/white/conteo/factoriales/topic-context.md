# Topic: Factorial

Belt: `white`, Unit: `conteo`, Topic: `factoriales`

Skills en este topic: `FORM`, `RESL`.

Este topic tiene 2 ítems (uno por skill): `FORM`, `RESL`.

Concepto: el **factorial** $n! = n \times (n-1) \times \cdots \times 1$, con la convención $0! = 1$, y la relación recursiva $n! = n \cdot (n-1)!$. Es la operación sobre la que se construyen `permutaciones`, `variaciones` y `combinaciones`; acá se trabaja aislada, sin todavía nombrar esas técnicas.

**Frontera con el resto de la unidad:** ningún ejercicio plantea un problema de conteo con contexto (personas, objetos a ordenar/elegir); son manipulaciones y evaluaciones directas de la expresión $n!$ y de cocientes/combinaciones simples entre factoriales. El contexto narrativo (podios, comités) empieza recién en `permutaciones`.

---

## FORM, 15 ejercicios

Identificar o armar la **expresión** equivalente (no calcular el valor numérico).

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Expresión expandida de $n!$ para un $n$ concreto | 4 | `expansion-directa` |
| Simplificación de un cociente de factoriales $\dfrac{n!}{k!}$ dejando el producto de los términos que no se cancelan | 4 | `cociente-simplificado` |
| Relación recursiva $n! = n \cdot (n-1)!$ aplicada para reescribir una expresión | 3 | `relacion-recursiva` |
| Caso especial $0! = 1$ y $1! = 1$ | 2 | `casos-especiales` |
| Expresión con suma/resta de factoriales sin simplificar todavía (identificar que no se puede sumar/restar los $n$ antes de expandir) | 2 | `suma-resta-factoriales` |
| **Total** | **15** | |

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
| **Con tabla** (`table`, modo `cell`): la tabla evalúa $n!$ sobre la grilla fija $n=3,4,5,6$ y deja **una celda vacía**, distinta en cada ejercicio | 3 | `valor-desde-tabla` |
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

### Ejercicios con tabla (`valor-desde-tabla`)

Reglas 68-75 de `authoring-context.md` más lo específico de este topic:

- **Grilla fija $n = 3, 4, 5, 6$** en los tres ejercicios, o sea la columna $6, 24, 120, 720$. Lo
  que cambia entre ellos es **cuál celda queda vacía**, no la tabla. Es deliberado: el alumno
  reconoce la misma tabla y lo que varía es desde dónde tiene que llegar al valor que falta.
- **4 opciones**, igual que el resto del topic.
- **A1 y A2 (regla 71) no aplican**, por dos motivos que se refuerzan. El operativo: estos ítems son
  modo `cell`, y ahí no hay columnas rivales que compitan fila por fila, solo un valor contra otro.
  El de fondo: nada se parece a un factorial en dos puntos seguidos, así que aunque fueran modo
  `column` serían insatisfacibles. Lo único que el validador exige acá es que los cuatro valores
  sean distintos entre sí.
- **La celda vacía va entre filas dadas siempre que se pueda**, para que se pueda llegar desde
  arriba ($5 	imes 24$) y verificar desde abajo ($720 / 6$). Eso convierte a la tabla en un
  mecanismo de autoverificación y no en decoración. En el ejercicio que deja vacío el $6!$ solo se
  puede subir, y ahí el distractor bueno es el que usa el índice equivocado como factor.
- **El trabajo de la tabla acá es perceptual, no discriminativo.** El crecimiento factorial se
  subestima de forma masiva y la instrucción verbal no lo corrige. Ver $6, 24, 120, 720$ de un
  vistazo entrega la explosión por el canal que las palabras no alcanzan. Ése es el motivo de
  existir de estos ítems.
- **Los distractores salen del índice equivocado**, no de fórmulas rivales: multiplicar por el
  índice de la fila de arriba, por el de la de abajo, o dividir por el que no corresponde. La
  potencia ($5^{3}$, $4^{3}$, $6^{3}$) es el único distractor de otra naturaleza y aparece una vez
  por ejercicio.
- **La tabla es contexto visual, no narrativo**, así que no viola la regla de "sin contexto
  narrativo" de este topic: sigue sin haber personas ni objetos que ordenar. Es justamente por eso
  que el formato encaja acá.

> **Sin tablas en `FORM` (ago-2026).** Hubo 4 ítems con tabla en `FORM` (`recursiva-tabla` y
> `cociente-tabla`, modo `column`) y se sacaron después del testeo. En este topic la tabla rinde
> cuando el alumno **completa un valor**, no cuando elige entre expresiones: para eso ya están los
> ítems simbólicos de `FORM`, que muestran la expresión directamente y no necesitan la tabla como
> intermediaria. El cupo no se redistribuye. No volver a proponer tablas para `FORM` en este topic.

## Checklist del topic

- [ ] Ningún ejercicio tiene contexto narrativo de personas/objetos a ordenar o elegir
- [ ] $n \leq 8$ en factoriales completos, sin excepción
- [ ] $0!$ tratado como $1$ en todos los ejercicios que lo usan
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad numérica → 4 opciones ≤35 caracteres
- [ ] Ejercicios con `table`: solo en `RESL`, grilla fija $n=3,4,5,6$, una celda vacía distinta en cada uno
