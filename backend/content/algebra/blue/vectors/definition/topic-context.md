# Topic: Definición

Belt: `blue`, Unit: `vectors`, Topic: `definition`

Skills en este topic: `LEXI`, `FORM`. **Sin `CLSF`** (rediseño de la unidad, ago-2026): la clasificación sintáctica "¿esto es un vector?" se reemplazó por `FORM`, que traduce una cantidad real a su notación vectorial correcta — más alineado con la utilidad del concepto. **Sin `GRAF`**: el componente de dibujo de vectores (flechas) todavía no existe en el frontend, se pospone para una ronda futura.

Este topic tiene 2 ítems (uno por skill): `LEXI`, `FORM`.

Concepto: un **vector** es una tupla ordenada de componentes reales, $\vec{v}=(v_1,\dots,v_n)$, que pertenece a un espacio $\mathbb{R}^n$. A diferencia de un escalar (un solo número), un vector puede representar una cantidad que tiene **magnitud y dirección** a la vez (un desplazamiento, una fuerza, una velocidad). Primer topic de la unidad `vectors` y del cinturón `blue`: no asume ningún conocimiento previo de vectores, solo lo de `white/aritmetica`. Ningún ejercicio asume repaso de topics posteriores del propio cinturón (regla crítica 31): `operations`, `norm`, `scalar`, `orthogonality` y `product` todavía no existen para este alumno.

**Nota de referencia editorial**: registro "Paenza", contextos físicos y cotidianos (desplazamientos, movimientos, cambios de posición), evitando nombres propios y jerga de carrera puntual (ver regla 43 de `authoring-context.md`).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Por qué una cantidad necesita un vector y no alcanza con un escalar | 5 | `distinguir-escalar-vector` | Entender que un vector agrega dirección/sentido a una magnitud, algo que un único número no puede describir | Magnitud + dirección vs. magnitud sola; motivación central del concepto |
| Componentes y dimensión | 5 | `componentes-dimension` | Entender qué es una componente y qué determina que un vector pertenezca a $\mathbb{R}^n$ | Cantidad de componentes = dimensión del espacio |
| Orden de las componentes en la tupla | 5 | `notacion-orden-componentes` | Entender por qué el orden de las componentes importa, a diferencia de un conjunto desordenado | $(2,5) \neq (5,2)$; cada posición corresponde a un eje fijo |
| **Total** | **15** | | | |

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Caso base: desplazamiento en $\mathbb{R}^2$ con componentes positivas | 5 | `elegir-vector-basico` | Traducir una descripción con dos direcciones independientes a la tupla que la representa | Cada dirección ocupa una posición fija en la tupla |
| Sentido opuesto al eje de referencia | 5 | `elegir-vector-signo-negativo` | Reconocer que "retroceder", "bajar" o "perder" en el sentido de un eje se traduce en una componente negativa | El signo indica sentido, no un error de cálculo |
| Desplazamiento en $\mathbb{R}^3$ | 5 | `elegir-vector-tercera-dimension` | Extender la traducción agregando una tercera dirección independiente (ej. altura o profundidad) | La dimensión del vector sigue a la cantidad de direcciones independientes descriptas |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones para `LEXI` (conceptual). `FORM` con 3 opciones también, salvo que el set de distractores numéricos pida una cuarta variante plausible (ver `authoring-context.md` regla de cardinalidad por skill).

---

## Contextos variados

**Registro Paenza, sin jerga de nicho** (regla 43): desplazamientos de un dron, un repartidor, un buzo, un excursionista, un ascensor — cualquier situación con movimiento en 2 o 3 direcciones independientes, expresado en unidades genéricas (metros, cuadras, pisos).

- **`LEXI`**: puede quedar en un registro más abstracto/conceptual por naturaleza del skill (preguntas de "por qué"), pero cuando ilustra con un ejemplo concreto, usar el mismo tipo de contextos que `FORM`.
- **`FORM` — caso base (`elegir-vector-basico`)**: un dron o repartidor que se mueve en dos direcciones perpendiculares (este/norte); un excursionista que camina y sube una loma.
- **`FORM` — signo negativo (`elegir-vector-signo-negativo`)**: un buzo que desciende en profundidad mientras se desplaza horizontalmente; un ascensor que baja pisos; alguien que retrocede en una dirección.
- **`FORM` — tercera dimensión (`elegir-vector-tercera-dimension`)**: un dron que además de moverse en el plano cambia de altura; una grúa que mueve una carga en tres direcciones.

Ningún experimento supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 2 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Vector vs. escalar | Confundir un vector con un único número, perdiendo la información de dirección |
| Componentes/dimensión | Contar mal la cantidad de componentes o asignarlas a un espacio de dimensión incorrecta |
| Orden de componentes | Invertir el orden de las componentes al traducir la descripción |
| Signo de una componente | Olvidar el signo negativo cuando el movimiento va en sentido contrario al eje de referencia |
| Tercera dimensión | Omitir la tercera componente, o agregarla en la posición incorrecta |

---

## Reglas específicas del topic

- **Coeficientes y constantes enteros chicos** (hasta 2 dígitos) para que la tupla resultante sea fácil de verificar a simple vista.
- **`FORM` nunca calcula, solo traduce**: no hay operaciones entre vectores en este topic (eso empieza en `operations`); cada ítem da una descripción y pide elegir la tupla que la representa.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): en `LEXI`, la razón detrás de "vector vs. escalar" es que una magnitud sola no alcanza para describir una cantidad con dirección; la razón detrás del orden de las componentes es que cada posición está atada a un eje fijo, no es una colección libre de números.
- **Notación de vectores**: siempre con flecha superior (`\vec{v}`), según convención transversal del curso.

## Hallazgos de testing (ronda 1)

- **`FORM` (`elegir-vector-signo-negativo`):** el enunciado mencionaba las dimensiones en un orden distinto al de la tupla resultante (la profundidad antes que el desplazamiento, pero el vector lista el desplazamiento primero) — confuso. Fix: la consigna narra las dimensiones en el mismo orden en que aparecen en la tupla. Regla general derivada: cuando un enunciado describe un vector en prosa, el orden de mención de las dimensiones tiene que coincidir con el orden de las componentes.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún contexto exige conocimiento previo de una carrera puntual (registro Paenza)
- [ ] Toda constante entera, hasta 2 dígitos
- [ ] `FORM` no incluye ninguna operación entre vectores (eso es de `operations`)
- [ ] Cada ítem de `LEXI` reintroduce la razón geométrica/conceptual detrás de lo que pregunta, no solo la regla mecánica
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
