# Topic: Espacios muestrales y eventos

Belt: `white`, Unit: `probabilidad`, Topic: `espacios`

Skills en este topic: `LEXI`, `CLSF`.

Este topic tiene 2 ítems (uno por skill): `LEXI`, `CLSF`.

Concepto: el **espacio muestral** $\Omega$, el **evento** ($A \subseteq \Omega$), el **suceso elemental** (resultado individual que no se descompone en subeventos), el **complemento** de un evento, y la relación entre dos eventos (**mutuamente excluyentes** o no). Es el vocabulario base de toda la unidad `probabilidad`.

**Frontera con el resto de la unidad:** ningún ejercicio calcula una probabilidad numérica todavía (eso empieza en `axiomas`/`laplace`). Acá se trabaja pura teoría de conjuntos sobre $\Omega$: identificar, nombrar y clasificar, no medir.

**No se evalúa "evento seguro" como término propio.** Es redundante: una vez que el alumno entiende que un evento es un subconjunto de $\Omega$, que "$\Omega$ mismo es un evento" no aporta una confusión nueva ni un concepto que valga un ítem dedicado. Se saca de la taxonomía completa (ni LEXI, ni CLSF, ni como opción de clasificación).

**Tampoco se evalúa "evento imposible" ($\emptyset$) como término propio.** Mismo criterio: una vez que el alumno entiende que un evento es un subconjunto de $\Omega$, que "el subconjunto vacío también es un evento" no aporta una confusión nueva ni un concepto que valga un ítem dedicado. Se saca de la taxonomía completa (ni LEXI, ni CLSF, ni como opción de clasificación).

**Contextos variados, no solo cartas.** Alternar moneda(s), dado(s), mazo de cartas españolas (truco: 40 cartas, palos oro/copa/espada/basto, números 1 al 7 y 10-11-12, sin 8 ni 9), urna con bolitas de colores, encuesta con 2-3 categorías. Ningún experimento debe superar ~30% de los ítems de una misma sub-familia.

---

## LEXI, 50 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Nombre/definición de espacio muestral $\Omega$ | 10 | `definicion-espacio-muestral` |
| Nombre/definición de evento | 10 | `definicion-evento` |
| Suceso elemental | 8 | `definicion-suceso-elemental` |
| Complemento de un evento | 11 | `definicion-complemento` |
| Eventos mutuamente excluyentes | 11 | `definicion-mutuamente-excluyentes` |
| **Total** | **50** | |

---

## CLSF, 50 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Determinar si un conjunto dado es un evento válido ($A \subseteq \Omega$) | 10 | `validar-subconjunto` |
| Clasificar el tipo de evento (elemental o compuesto) en un caso concreto | 14 | `clasificar-tipo-evento` |
| Reconocer si dos eventos dados (enumerados explícitamente) son mutuamente excluyentes o no | 14 | `reconocer-mutuamente-excluyentes` |
| Identificar el resultado de una operación entre eventos (unión, intersección, complemento) dado $\Omega$ explícito | 12 | `operar-entre-eventos` |
| **Total** | **50** | |

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Espacio muestral vs. evento | Confundir $\Omega$ con un evento particular dentro de él |
| Suceso elemental | Tratar un evento compuesto (2+ resultados) como si fuera elemental |
| Complemento | Confundir el complemento de $A$ con la intersección o unión de $A$ con otro evento |
| Mutuamente excluyentes | Creer que dos eventos son excluyentes solo porque parecen distintos, sin verificar que su intersección sea vacía |
| Mutuamente excluyentes | Confundir mutuamente excluyentes con independientes; son conceptos distintos y acá no se nombra todavía "independencia", solo se evita la confusión en el distractor describiendo la situación sin el término técnico |

---

## Reglas específicas del topic

- **Espacios muestrales chicos y enumerables**: monedas, dados, cartas de truco, urnas con pocas bolitas, encuestas de 2-3 categorías. Nunca un espacio muestral continuo o infinito en este topic.
- **Contextos variados** (ver arriba): no concentrar todos los ítems de una sub-familia en el mismo experimento.
- **El distractor de independencia nunca nombra la palabra**: si se usa como confusión en `mutuamente-excluyentes`, se describe la situación sin adelantar el término técnico, que se define recién en `independencia`.
- **Complemento siempre sobre $\Omega$ explícito**: el enunciado enumera o define $\Omega$ antes de preguntar por el complemento de un evento.
- **Sin aclaraciones entre paréntesis en ningún campo del ejercicio** (regla crítica del `authoring-context.md`): toda aclaración va como oración propia en la prosa, nunca `(así)` al lado de un término u opción.

## Checklist del topic

- [ ] Ningún ejercicio calcula una probabilidad numérica (eso es de otro topic)
- [ ] Ningún ítem evalúa "evento seguro" ni "evento imposible" como término dedicado
- [ ] Todo espacio muestral es finito y enumerable explícitamente en el enunciado
- [ ] Contextos variados dentro de cada sub-familia (no más de ~30% del mismo experimento)
- [ ] El distractor de independencia (si aparece) no usa la palabra "independiente"
- [ ] Ningún campo usa paréntesis para aclaraciones (`question`, `options`, `feedback_correct`, `feedback_incorrect`, `explanation`)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: LEXI/CLSF conceptual → 3 opciones
