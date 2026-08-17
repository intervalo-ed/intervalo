# Topic: Escalar

Belt: `blue`, Unit: `vectors`, Topic: `scalar`

Skills en este topic: `LEXI`, `CLSF`, `RESL`. Uno de los topics con las 3 skills (rediseño de la unidad, ago-2026): además del cálculo (`RESL`), se suma `CLSF` para explotar el dato más rico de esta operación, el **signo** del resultado, que dice si dos vectores "apuntan para el mismo lado" sin necesidad de calcular el ángulo. **Sin `GRAF`**: se pospone para una ronda futura.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `CLSF`, `RESL`.

Concepto: el **producto escalar** (o producto interno) de dos vectores, $\vec{u}\cdot\vec{v}$, devuelve un número real, no otro vector. Tiene dos fórmulas equivalentes:
$$\vec{u}\cdot\vec{v} = u_1v_1+u_2v_2+\dots+u_nv_n = \|\vec{u}\|\|\vec{v}\|\cos(\theta)$$
Cuarto topic de la unidad, después de `definition`, `operations` y `norm`: el alumno ya sabe qué es un vector, cómo operarlo y qué es su norma, pero todavía no conoce `orthogonality` ni `product` (regla crítica 31).

**Nota de referencia editorial**: registro "Paenza", contextos físicos de fuerzas que se ayudan, se oponen o no se afectan entre sí, evitando jerga de carrera puntual como "trabajo mecánico" o "torque" (regla 43).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Por qué el producto escalar se relaciona con el ángulo entre los vectores | 5 | `por-que-relacion-angulo` | Entender que la fórmula geométrica del producto escalar incluye el coseno del ángulo | Fórmula geométrica, dependencia de la dirección relativa, no solo de las magnitudes |
| Por qué da cero cuando los vectores son perpendiculares | 5 | `por-que-perpendicular-cero` | Entender que el coseno de $90°$ es cero, y por eso se anula todo el producto | Coseno de un ángulo recto, anulación del producto por un factor cero |
| Por qué las dos fórmulas, por componentes y por ángulo, dan siempre el mismo resultado | 5 | `dos-formulas-equivalentes` | Entender que ambas fórmulas describen la misma operación desde dos caminos distintos | Equivalencia entre cálculo algebraico y cálculo geométrico |
| **Total** | **15** | | | |

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Clasificar la relación entre dos vectores a partir del valor numérico ya calculado del producto escalar | 5 | `clasificar-por-signo-numerico` | Leer el signo de un resultado dado y asociarlo al tipo de ángulo, sin calcular nada | Signo positivo = ángulo agudo, cero = perpendicular, negativo = ángulo obtuso |
| Clasificar la relación entre dos vectores dados por sus componentes, calculando primero el signo | 5 | `clasificar-por-signo-a-calcular` | Calcular el producto escalar y usar su signo para clasificar la relación | Cálculo por componentes, mismo criterio de signo que la sub-familia anterior |
| Clasificar en un contexto real si dos fuerzas se ayudan, se oponen o no se afectan | 5 | `clasificar-por-contexto` | Aplicar el criterio de signo a una situación concreta, sin jerga técnica | Interpretación física del signo del producto escalar |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Calcular el producto escalar dado directamente por componentes | 5 | `resl-producto-escalar-directo` | Calcular el valor del producto escalar a partir de las componentes de dos vectores | Fórmula por componentes |
| Calcular cuánto de una fuerza aporta a un movimiento en una dirección dada | 5 | `resl-producto-escalar-contexto-fuerza` | Aplicar el producto escalar para medir el aporte efectivo de una fuerza en una dirección | Producto escalar como medida de aporte direccional |
| Calcular el producto escalar contra un vector de referencia simple (eje $x$ o eje $y$) | 5 | `resl-producto-escalar-vector-unitario` | Reconocer que el producto escalar contra $(1,0)$ o $(0,1)$ selecciona una única componente del otro vector | Producto escalar contra un vector de la base canónica |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones para `LEXI` y `CLSF` (conceptuales). 4 opciones para `RESL` (cálculo numérico, default de la guía de `authoring-context.md`).

---

## Contextos variados

**Registro Paenza, sin jerga de nicho** (regla 43): fuerzas que empujan un mismo objeto, en la misma dirección o en direcciones distintas.

- **`clasificar-por-contexto` / `resl-producto-escalar-contexto-fuerza`**: dos personas empujando un mismo objeto; una fuerza y la dirección en la que efectivamente se mueve algo; cuánto ayuda un viento a un desplazamiento según su dirección.
- **`resl-producto-escalar-vector-unitario`**: no necesita contexto narrativo, es una propiedad algebraica en sí misma (seleccionar una componente), puede quedar en abstracto.

Ningún experimento supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Relación con el ángulo | Pensar que el resultado depende solo de las magnitudes, sin el coseno del ángulo |
| Perpendicularidad y cero | Pensar que el producto escalar no está definido entre vectores perpendiculares, en vez de que da cero |
| Dos fórmulas equivalentes | Pensar que son dos resultados distintos en vez de dos caminos al mismo número |
| Clasificar por signo | Confundir qué signo corresponde a ángulo agudo y cuál a obtuso, o pensar que cero significa "sin relación" |
| Cálculo del producto escalar | No respetar el signo negativo de una componente al multiplicar |
| Producto contra vector de referencia | No reconocer que multiplicar por $(1,0)$ o $(0,1)$ selecciona una única componente del otro vector |

---

## Reglas específicas del topic

- **Frontera con `orthogonality`** (regla 67): las dos sub-familias que podrían chocar son `por-que-perpendicular-cero` y `resl-producto-escalar-directo`. Acá el recorrido va **de la fórmula al hecho**: dada la fórmula geométrica, por qué el ángulo recto anula el producto. Y `RESL` siempre pide **el valor**, con su signo. En `orthogonality` la dirección se invierte y la respuesta es binaria.
- **Coeficientes y constantes enteros chicos** (hasta 2 dígitos) para que el cálculo sea manejable a mano.
- **`CLSF` nunca pide calcular el ángulo exacto**, solo clasificar por el signo del producto escalar (agudo/perpendicular/obtuso).
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que el signo indique el tipo de ángulo es que el coseno es positivo para ángulos agudos, cero para el recto y negativo para los obtusos; la razón de que perpendicular dé cero es justamente que $\cos(90°)=0$.
- **Notación de vectores**: siempre con flecha superior (`\vec{v}`), según convención transversal del curso.

## Hallazgos de testing (ronda 1)

- **`CLSF` (`clasificar-por-contexto`, empuje de dos personas):** se pidió reforzar visualmente que los empujes se representan con vectores. Fix: se sacó la mención de $\vec{F_1}$/$\vec{F_2}$ del párrafo narrativo y se la dejó únicamente en el bloque display del producto escalar (`$\vec{F_1}\cdot\vec{F_2}>0$`), de paso evitando la fórmula tejida-y-repetida (regla 35).

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún contexto exige conocimiento previo de una carrera puntual (registro Paenza, sin "trabajo mecánico" ni "torque")
- [ ] Toda constante entera, hasta 2 dígitos
- [ ] `CLSF` clasifica por signo, nunca pide calcular el ángulo exacto
- [ ] Cada ítem de `LEXI` reintroduce la razón geométrica detrás de lo que pregunta (regla 44)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `LEXI`/`CLSF`, 4 en `RESL`
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
