# Topic: Operaciones

Belt: `blue`, Unit: `vectors`, Topic: `operations`

Skills en este topic: `FORM`, `RESL`. **Sin `LEXI`** (rediseño de la unidad, ago-2026): el vocabulario básico de "qué es un vector" ya se cubrió en `definition`; acá el foco pasa directo a decidir la operación correcta (`FORM`) y calcularla (`RESL`). **Sin `GRAF`**: el componente de dibujo de vectores (flechas, suma punta a cola) todavía no existe en el frontend, se pospone para una ronda futura.

Este topic tiene 2 ítems (uno por skill): `FORM`, `RESL`.

Concepto: las dos operaciones básicas entre vectores son la **suma** componente a componente, $\vec{u}+\vec{v}=(u_1+v_1,\dots,u_n+v_n)$, y el **producto por un escalar**, $\alpha\vec{v}=(\alpha v_1,\dots,\alpha v_n)$. Segundo topic de la unidad, después de `definition`: el alumno ya sabe qué es un vector (tupla ordenada), pero todavía no conoce `norm`, `scalar`, `orthogonality` ni `product` (regla crítica 31).

**Nota de referencia editorial**: registro "Paenza", contextos de desplazamientos y escalados cotidianos (combinar movimientos sucesivos, agrandar o invertir un empuje), evitando jerga de carrera puntual (regla 43).

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Decidir si una situación pide sumar dos vectores o escalar uno solo | 5 | `decidir-suma-vs-escalar` | Reconocer cuándo un escenario combina dos desplazamientos distintos (suma) y cuándo redimensiona uno solo (escalar) | Suma como combinación de dos vectores; escalar como cambio de tamaño de uno solo |
| Decidir el signo del escalar según el efecto buscado | 5 | `decidir-signo-escalar` | Reconocer que un escalar positivo mantiene el sentido y uno negativo lo invierte | Signo del escalar como sentido, magnitud del escalar como tamaño |
| Decidir la expresión que combina suma y escalar en un mismo escenario | 5 | `decidir-combinacion-suma-escalar` | Reconocer un escenario que requiere escalar un vector y después sumarle otro | Combinación lineal simple, $\alpha\vec{u}+\vec{v}$ |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Calcular la suma de vectores en contexto | 5 | `resl-suma-vectores` | Calcular el resultado de combinar dos o tres desplazamientos sucesivos | Suma componente a componente |
| Calcular el producto por un escalar en contexto | 5 | `resl-escalar-vector` | Calcular el resultado de redimensionar o invertir un vector | Producto por escalar, incluido escalar negativo |
| Calcular una combinación de escalar y suma en contexto | 5 | `resl-combinacion-suma-escalar` | Calcular el resultado de escalar un vector y sumarle otro | Combinación lineal simple, orden de operaciones |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones para `FORM` (decide la operación, sin calcular; conceptual). 4 opciones para `RESL` (cálculo numérico, sigue el default de la guía de `authoring-context.md`).

---

## Contextos variados

**Registro Paenza, sin jerga de nicho** (regla 43): desplazamientos sucesivos de un repartidor, un dron o un excursionista; escalados de un empuje, una fuerza o un plano de diseño.

- **`decidir-suma-vs-escalar` / `resl-suma-vectores`**: un repartidor que hace dos tramos sucesivos; un dron que combina dos movimientos; un excursionista que camina y después sube una loma.
- **`decidir-signo-escalar` / `resl-escalar-vector`**: duplicar o achicar la fuerza de un empuje sin cambiar su dirección; invertir por completo el sentido de un movimiento; agrandar el tamaño de un plano de diseño manteniendo las proporciones.
- **`decidir-combinacion-suma-escalar` / `resl-combinacion-suma-escalar`**: duplicar un empuje y sumarle un segundo empuje distinto; combinar un tramo escalado con otro tramo sin escalar.

Ningún experimento supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 2 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Suma vs. escalar | Confundir un escenario de "combinar dos vectores" con uno de "redimensionar uno solo", o viceversa |
| Signo del escalar | Aplicar un escalar positivo cuando el efecto buscado es invertir el sentido, o negativo cuando el sentido debe mantenerse |
| Suma componente a componente | Sumar todas las componentes entre sí en vez de sumar cada componente con su par en la misma posición |
| Escalar un vector | Escalar una sola componente en vez de todas, o aplicar el escalar solo a la magnitud sin invertir el sentido cuando es negativo |
| Combinación suma + escalar | Sumar antes de escalar, invirtiendo el orden que pide el enunciado |

---

## Reglas específicas del topic

- **Coeficientes y constantes enteros chicos** (hasta 2 dígitos, escalares hasta 3 en valor absoluto) para que el cálculo sea manejable a mano.
- **`FORM` nunca calcula el resultado**, solo identifica qué operación (o combinación) corresponde antes de resolver.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que sumar combine dos vectores es que cada uno aporta un desplazamiento independiente que se agrega al otro; la razón de que el signo del escalar invierta el sentido es que multiplicar por $-1$ da el vector opuesto, misma magnitud, sentido contrario.
- **Notación de vectores**: siempre con flecha superior (`\vec{v}`), según convención transversal del curso.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún contexto exige conocimiento previo de una carrera puntual (registro Paenza)
- [ ] Toda constante entera, hasta 2 dígitos; escalares hasta 3 en valor absoluto
- [ ] `FORM` identifica la operación sin calcular el resultado
- [ ] Cada ítem reintroduce la razón detrás de la operación (regla 44), no solo el procedimiento mecánico
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `FORM`, 4 en `RESL`
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
