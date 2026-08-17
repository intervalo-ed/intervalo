# Topic: Operaciones

Belt: `violet`, Unit: `matrices`, Topic: `operations`

Skills en este topic: `LEXI`, `RESL`, `FORM`. **Sin `CLSF`** (rediseño de la unidad, ago-2026): no hay nada interesante que clasificar en la suma, que admite un único caso; la clasificación sí aparece en `product`, donde decidir si la operación está definida es una tarea real. **Sin `GRAF`**: se pospone.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `RESL`, `FORM`.

Concepto: la **suma de matrices** y el **producto por un escalar** se calculan entrada a entrada, y solo tienen sentido entre matrices del mismo orden:
$$(A+B)_{ij} = a_{ij} + b_{ij}, \quad (kA)_{ij} = k \cdot a_{ij}$$
Segundo topic de la unidad, después de `definition`: el alumno ya sabe qué es una matriz, cómo se lee una posición y qué significan sus columnas. Todavía no conoce `product`, `determinants`, `inverse` ni `systems` (regla crítica 31).

**Función de este topic dentro de la unidad**: es el más barato de los seis y su valor real es de **contraste**. Instala que una matriz se opera entrada a entrada, con todas las propiedades bien portadas heredadas de los números reales. Ese piso es lo que vuelve memorable la ruptura de `product`, donde el orden de los factores pasa a importar. Si `product` llegara sin este contraste, la no conmutatividad sería un dato más de una lista en vez de una sorpresa.

**Nota de referencia editorial**: registro "Paenza", contextos de tablas que se acumulan, se escalan o se promedian (stock que recibe un envío, precios con un aumento, ventas de dos meses), evitando jerga de carrera puntual (regla 43).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Por qué la suma exige el mismo orden | 5 | `por-que-mismo-orden` | Entender que la suma es posición por posición, así que cada casillero necesita su par en la otra matriz | Definición entrada a entrada, condición de compatibilidad |
| Por qué el escalar multiplica a todas las entradas | 5 | `por-que-escalar-multiplica-todo` | Entender que la definición del producto por escalar es la que hace que multiplicar por $3$ coincida con sumar tres veces | Coherencia entre suma y escalar, ninguna posición privilegiada |
| Por qué la suma hereda las propiedades de los números | 5 | `por-que-hereda-propiedades` | Entender que conmutatividad, asociatividad y neutro salen de que cada posición se opera por separado | Independencia entre casilleros, matriz nula como neutro |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Calcular una suma o una diferencia de matrices | 5 | `calcular-suma-o-diferencia` | Operar casillero por casillero y no confundir la suma con un producto entrada a entrada | Suma y resta de matrices, contraste contra multiplicar casilleros |
| Calcular una combinación con escalares | 5 | `calcular-combinacion-con-escalar` | Aplicar cada escalar a su propia matriz antes de sumar o restar | Orden de las operaciones, el escalar acompaña solo a la matriz que tiene al lado |
| Despejar la matriz incógnita de una ecuación | 5 | `despejar-matriz-incognita` | Resolver $X + A = B$ restando a ambos miembros, respetando el orden y el signo | Despeje matricial, valores negativos como resultado legítimo |
| **Total** | **15** | | | |

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Reconocer que una situación se modela con una suma | 5 | `traducir-situacion-a-suma` | Identificar que acumular dos tablas de las mismas categorías es una suma de matrices | Acumulación casillero a casillero, contraste contra sumar un único número a todo |
| Reconocer que una situación se modela con un escalar | 5 | `traducir-situacion-a-escalar` | Identificar que un cambio proporcional idéntico para todas las entradas es un producto por escalar | Aumento porcentual como factor, contraste contra sumar un valor fijo |
| Reconocer que una situación combina suma y escalar | 5 | `traducir-situacion-a-combinacion` | Armar una expresión que use las dos operaciones, como un promedio o una proyección | Combinación de operaciones, promedio como suma escalada |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones en `LEXI` y `FORM` (conceptuales). 4 opciones en `RESL` (respuesta numérica, default de la guía de `authoring-context.md`). Las opciones de `RESL` son matrices completas, anchas, así que van como lista vertical y no en grilla 2×2.

---

## Contextos variados

**Registro Paenza, sin jerga de nicho** (regla 43): tablas que se acumulan, se escalan o se promedian.

- **`calcular-suma-o-diferencia` / `traducir-situacion-a-suma`**: producción de dos días con una fila por turno, stock que recibe un envío, ventas de dos sucursales que se consolidan.
- **`traducir-situacion-a-escalar`**: un aumento porcentual idéntico para toda una lista de precios, una receta que se multiplica para el triple de porciones, una conversión de unidades aplicada a toda una tabla.
- **`traducir-situacion-a-combinacion`**: el promedio de dos meses, una proyección que duplica un período y le descuenta un ahorro ya calculado.
- **`despejar-matriz-incognita`**: puede quedar en abstracto, es un ejercicio de despeje y el contexto no aporta a la decisión.

Ningún experimento supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Condición de mismo orden | Creer que el obstáculo es la forma de una de las matrices, o que el resultado tendría que ser cuadrado |
| Producto por escalar | Aplicar el escalar solo a una fila, o solo a la diagonal, en vez de a todas las entradas |
| Propiedades heredadas | Confundir la condición para poder sumar con la razón por la que el orden de los sumandos da igual |
| Suma de matrices | Multiplicar los casilleros entre sí en vez de sumarlos, o restar donde correspondía sumar |
| Combinación con escalar | Aplicar el escalar a la expresión completa en vez de solo a la matriz que lo lleva al lado |
| Despeje matricial | Sumar en vez de restar, restar en el orden inverso, o anotar en positivo una diferencia negativa |
| Situación con suma | Sumar un único número a todas las entradas, repartiendo el total completo en cada casillero |
| Situación con escalar | Sumar el porcentaje como valor fijo, o multiplicar solo por el incremento y perder el valor original |

---

## Reglas específicas del topic

- **Constantes enteras chicas** (un dígito, hasta 2 en casos puntuales) y matrices de $2 \times 2$ en `RESL`, para que las cuatro cuentas entren cómodas en la cabeza.
- **`RESL` nunca encadena más de dos operaciones**: como máximo un escalar aplicado y una suma o resta. Tres operaciones encadenadas exceden el techo de carga mental (regla 55).
- **El escalar siempre es un entero chico o un decimal de una cifra** ($2$, $3$, $0{,}5$, $1{,}15$), nunca una fracción que obligue a operar denominadores.
- **Prohibido adelantar el producto matricial**, ni siquiera para contrastar: en este topic el alumno todavía no sabe que existe (regla crítica 31). El distractor de "multiplicar casillero por casillero" es legítimo porque es una operación inventada por el alumno, no el producto matricial real.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que la suma conmute es que cada posición es una suma de números y ahí ya conmuta; la razón de que el escalar entre en todas las entradas es que multiplicar por $3$ tiene que coincidir con sumar la matriz tres veces.
- **Notación de matrices**: mayúsculas en cursiva ($A$, $B$, $X$), según convención transversal del curso.

## Hallazgos de testing (ronda 1)

- **`FORM` (`traducir-situacion-a-combinacion`):** el enunciado hablaba de dos matrices de ventas sin mostrarlas. Fix: se agregan las dos matrices concretas. Acá mostrarlas **no** regala la respuesta, porque las opciones son operaciones y no resultados, así que la pregunta se mantuvo igual (ver regla 62 y su excepción).
- **`LEXI` (`por-que-escalar-multiplica-todo`):** el ítem era redundante, el enunciado prácticamente enunciaba la respuesta ("multiplicar por $3$ tiene que dar lo mismo que sumar tres veces" y se preguntaba qué obliga eso sobre las entradas). Fix: se reformuló como detección de error, mostrando una resolución que aplica el factor solo a la diagonal y preguntando **qué deja de cumplirse**. El concepto evaluado es el mismo, pero ahora hay algo que decidir.
    - **Criterio general derivado**: en una sub-familia de tipo "por qué la definición es así", si la premisa del enunciado ya contiene la respuesta reformulada, conviene invertir el ítem hacia el formato de detectar qué se rompe (regla 53), en vez de intentar reescribir la pregunta.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún contexto exige conocimiento previo de una carrera puntual (registro Paenza)
- [ ] Toda constante entera chica, matrices de $2 \times 2$ en `RESL`
- [ ] Ningún ítem encadena más de dos operaciones
- [ ] Ningún ítem menciona el producto matricial ni ningún topic posterior
- [ ] Cada ítem de `LEXI` reintroduce la razón detrás de lo que pregunta (regla 44)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `LEXI`/`FORM`, 4 en `RESL`
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
