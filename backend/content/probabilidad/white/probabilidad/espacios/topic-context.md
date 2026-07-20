# Topic: Espacios muestrales y eventos

Belt: `white`, Unit: `probabilidad`, Topic: `espacios`

Skills en este topic: `LEXI`, `CLSF`.

Este topic tiene 2 ítems (uno por skill): `LEXI`, `CLSF`.

Concepto: el **espacio muestral** $\Omega$ (todos los resultados posibles de un experimento aleatorio), el **evento** ($A \subseteq \Omega$), el **suceso elemental** (resultado individual que no se descompone en subeventos), el **evento seguro** ($\Omega$), el **evento imposible** ($\emptyset$), el **complemento** de un evento, y la relación entre dos eventos (**mutuamente excluyentes** o no). Es el vocabulario base de toda la unidad `probabilidad`.

**Frontera con el resto de la unidad:** ningún ejercicio calcula una probabilidad numérica todavía (eso empieza en `axiomas`/`laplace`). Acá se trabaja pura teoría de conjuntos sobre $\Omega$: identificar, nombrar y clasificar, no medir.

---

## LEXI, 50 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Nombre/definición de espacio muestral $\Omega$ | 8 | `definicion-espacio-muestral` |
| Nombre/definición de evento | 8 | `definicion-evento` |
| Suceso elemental | 6 | `definicion-suceso-elemental` |
| Evento seguro ($\Omega$) | 6 | `definicion-evento-seguro` |
| Evento imposible ($\emptyset$) | 6 | `definicion-evento-imposible` |
| Complemento de un evento | 8 | `definicion-complemento` |
| Eventos mutuamente excluyentes | 8 | `definicion-mutuamente-excluyentes` |
| **Total** | **50** | |

---

## CLSF, 50 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Determinar si un conjunto dado es un evento válido ($A \subseteq \Omega$) | 10 | `validar-subconjunto` |
| Clasificar el tipo de evento (elemental, compuesto, seguro, imposible) en un caso concreto | 14 | `clasificar-tipo-evento` |
| Reconocer si dos eventos dados (enumerados explícitamente) son mutuamente excluyentes o no | 14 | `reconocer-mutuamente-excluyentes` |
| Identificar el resultado de una operación entre eventos (unión, intersección, complemento) dado $\Omega$ explícito | 12 | `operar-entre-eventos` |
| **Total** | **50** | |

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Espacio muestral vs. evento | Confundir $\Omega$ con un evento particular dentro de él |
| Evento imposible | Confundir $\emptyset$ (nunca ocurre) con un evento simplemente poco probable |
| Suceso elemental | Tratar un evento compuesto (2+ resultados) como si fuera elemental |
| Complemento | Confundir el complemento de $A$ con la intersección o unión de $A$ con otro evento |
| Mutuamente excluyentes | Creer que dos eventos son excluyentes solo porque parecen "distintos", sin verificar que su intersección sea vacía |
| Mutuamente excluyentes | Confundir "mutuamente excluyentes" con "independientes" (son conceptos distintos; no nombrar todavía "independencia" en este topic, solo evitar la confusión en el distractor) |

---

## Reglas específicas del topic

- **Espacios muestrales chicos y enumerables**: monedas (C/X), dados (1-6), cartas de un palo, encuestas con 2-3 categorías. Nunca un espacio muestral continuo o infinito en este topic.
- **El distractor de "independencia" nunca nombra la palabra**: si se usa como confusión en `mutuamente-excluyentes`, se describe la situación ("los dos eventos no comparten ningún resultado" vs. "el resultado de uno no cambia la chance del otro") sin adelantar el término técnico, que se define recién en `independencia`.
- **Complemento siempre sobre $\Omega$ explícito**: el enunciado enumera o define $\Omega$ antes de preguntar por el complemento de un evento.

## Checklist del topic

- [ ] Ningún ejercicio calcula una probabilidad numérica (eso es de otro topic)
- [ ] Todo espacio muestral es finito y enumerable explícitamente en el enunciado
- [ ] El distractor de independencia (si aparece) no usa la palabra "independiente"
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: LEXI/CLSF conceptual → 3 opciones
