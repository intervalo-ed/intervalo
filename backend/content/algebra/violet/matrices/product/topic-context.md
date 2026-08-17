# Topic: Producto

Belt: `violet`, Unit: `matrices`, Topic: `product`

Skills en este topic: `LEXI`, `CLSF`, `RESL`. **Sin `FORM`** (topic nuevo, ago-2026): la traducción de una situación a notación matricial se concentra en `systems`, donde la forma $AX = B$ tiene un referente concreto; acá el foco está en entender la operación y ejecutarla. **Sin `GRAF`**: se pospone.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `CLSF`, `RESL`.

Concepto: el **producto de matrices** combina cada fila de la primera con cada columna de la segunda, y solo está definido si las dimensiones se encuentran:
$$c_{ij} = \sum_{k} a_{ik}\,b_{kj}$$
Tercer topic de la unidad, después de `definition` y `operations`: el alumno ya sabe leer una posición, sabe que las columnas registran en qué se convierte cada dirección básica, y sabe operar entrada a entrada. Todavía no conoce `determinants`, `inverse` ni `systems` (regla crítica 31), así que **no se puede mencionar determinante ni inversibilidad en ningún campo**.

**Topic nuevo del rediseño (ago-2026)**, separado de `operations`. La razón es de densidad de error: el relevamiento curricular encontró acá la mayor concentración de confusiones documentadas de todo el tema, al punto de que el ejercicio 4 del TP2 de UTN FRBA es literalmente un catálogo de ellas en formato verdadero o falso. Mezclado con la suma, ese material no tenía lugar donde entrar.

**Función dentro de la unidad**: es el corazón conceptual. Acá el alumno descubre que las matrices no son números, y acá se instala la lectura de **composición**, que es lo que vuelve razonable una definición que de otro modo parece arbitraria. Todo lo que viene después se apoya en esto.

**Nota de referencia editorial**: registro "Paenza". Este topic admite menos contexto narrativo que el resto de la unidad, porque las preguntas son sobre la operación en sí; `LEXI` y `CLSF` pueden quedar en abstracto por diseño (regla 43 lo permite explícitamente), apoyándose en transformaciones del plano descriptas en lenguaje llano cuando hace falta una imagen.

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Por qué el producto no conmuta | 5 | `por-que-no-conmuta` | Entender que multiplicar es encadenar transformaciones, y que encadenarlas al revés lleva a otro lado | Composición, el orden como parte del resultado |
| Por qué la traspuesta de un producto invierte el orden | 5 | `por-que-se-invierte-en-la-traspuesta` | Entender que trasponer invierte justamente el dato que hace encajar a los factores, así que el otro orden ni siquiera está definido | $(AB)^T = B^T A^T$, argumento dimensional |
| Por qué un producto nulo no obliga a un factor nulo | 5 | `por-que-no-hay-anulacion` | Entender que cada entrada es una suma, y que una suma puede cancelarse sin que ningún término valga cero | Ausencia de ley de anulación, cancelación dentro de la suma |
| **Total** | **15** | | | |

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Decidir si el producto está definido y de qué orden es | 5 | `decidir-si-esta-definido` | Verificar que columnas de la primera coincidan con filas de la segunda, y leer el orden del resultado en los extremos | Condición de compatibilidad, contraste contra la condición de la suma |
| Identificar cuál igualdad del álgebra matricial vale siempre | 5 | `identificar-igualdad-valida` | Distinguir las factorizaciones que sobreviven de las que dependen de que los factores conmuten | Desarrollo de binomios, términos cruzados, el caso de la identidad |
| Reconocer pares que sí conmutan | 5 | `reconocer-cuando-si-conmutan` | Evitar tratar la no conmutatividad como una prohibición absoluta | Potencias de una misma matriz, identidad como neutro |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Calcular una única entrada del producto | 5 | `calcular-una-entrada` | Localizar la fila y la columna que corresponden a un subíndice dado, sin armar el producto completo | Lectura de subíndices, fila por columna |
| Calcular el producto de una matriz por un vector | 5 | `calcular-matriz-por-vector` | Ejecutar la cuenta y reconocer la lectura alternativa como combinación de las columnas | Producto matriz por vector, conexión con las columnas como imágenes de la base |
| Calcular una potencia chica de una matriz cuadrada | 5 | `calcular-potencia-chica` | Entender que la potencia es un producto de matrices y no una operación entrada a entrada | $A^2 = A \cdot A$, contraste contra elevar cada entrada y contra duplicar |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones en `LEXI` y `CLSF` (conceptuales). 4 opciones en `RESL`. Cuando la respuesta de `RESL` es un número suelto o un par ordenado corto, las cuatro opciones entran en grilla 2×2; cuando son matrices completas van como lista vertical.

---

## Contextos variados

**Registro Paenza, sin jerga de nicho** (regla 43). Este topic es el que menos contexto narrativo admite de la unidad, y forzarlo alarga el enunciado sin agregar nada a la decisión que el alumno tiene que tomar.

- **`por-que-no-conmuta`**: la única imagen que conviene usar es la de dos transformaciones del plano encadenadas, descriptas en lenguaje llano (rotar, estirar, inclinar), nunca con la fórmula de la rotación ni con ángulos concretos.
- **`calcular-una-entrada`**: es la sub-familia con **mejor aplicación real de toda la unidad**, y conviene explotarla. El arquetipo es el encadenamiento de tres categorías: una matriz de consumos (talleres por insumos) multiplicada por una de precios (insumos por proveedores) da el gasto de cada taller con cada proveedor. Pedir una sola entrada tiene ahí una justificación genuina, porque un gasto puntual involucra un único taller y un único proveedor, y no hace falta armar el producto entero. Variantes del mismo arquetipo: recetas por ingredientes contra ingredientes por nutrientes, sucursales por productos contra productos por depósitos.
- **`calcular-potencia-chica`**: abstracta por naturaleza, no forzar contexto.
- **`calcular-matriz-por-vector`**: admite un contexto liviano de desplazamiento o de mezcla de ingredientes, pero solo en un subconjunto de los ítems, para que la mecánica quede también disponible desnuda.

Ningún experimento supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

Esta tabla es la más rica de la unidad. Todas las confusiones están documentadas en material de cátedra relevado (AGA Virtual de UTN FRBA y el ejercicio 4 de su TP2), no son inventadas.

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| No conmutatividad | Creer que al invertir el orden solo se reordenan las entradas, o que una de las dos multiplicaciones no está definida |
| Traspuesta de un producto | Escribir $(AB)^T = A^T B^T$, sin notar que en ese orden las dimensiones ni siquiera permiten multiplicar |
| Ley de anulación | Creer que un producto nulo obliga a que algún factor lo sea, como ocurre entre números |
| Producto definido | Importar la condición de la suma y exigir que las dos matrices tengan el mismo orden |
| Orden del resultado | Quedarse con las dimensiones que se cancelan en vez de con las de los extremos |
| Cuadrado de un binomio | Escribir $(A+B)^2 = A^2 + 2AB + B^2$, juntando los dos términos cruzados como si coincidieran |
| Diferencia de cuadrados | Escribir $A^2 - B^2 = (A+B)(A-B)$, que solo vale si las dos matrices conmutan |
| Caso de la identidad | Descartar $A^2 - I = (A+I)(A-I)$ por haber memorizado que ninguna factorización vale; esta sí, porque la identidad conmuta con todo |
| Pares que conmutan | Creer que una matriz conmuta con su traspuesta, o que dos triangulares del mismo tipo conmutan entre sí |
| Cálculo de una entrada | Multiplicar directamente las dos entradas de esa posición, o tomar la fila de la matriz equivocada |
| Matriz por vector | Combinar las columnas en vez de las filas, o cruzar los coeficientes del vector |
| Potencia | Elevar cada entrada por separado, o confundir $A^2$ con $2A$ |

---

## Reglas específicas del topic

- **Matrices de $2 \times 2$ con enteros de un dígito** en `RESL`, y a lo sumo un signo negativo por ejercicio. El producto acumula dos multiplicaciones y una suma por casillero, así que el techo de carga mental (regla 55) se alcanza rápido.
- **Preferir pedir una sola entrada antes que la matriz completa** cuando el ejercicio lo permita: es el formato que usan las propias guías de cátedra y reduce la aritmética sin perder el concepto.
- **Prohibido mencionar determinante, inversa, inversibilidad, rango o sistemas**: son topics posteriores (regla crítica 31). En particular, **no se puede justificar que un producto sea nulo apelando al determinante**, aunque sea la explicación más corta.
- **Prohibido nombrar la "regla de la mano derecha", la composición de funciones con notación $f \circ g$, o cualquier formalismo de transformaciones lineales**: la composición se describe en lenguaje llano, como aplicar una cosa y después la otra.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que el orden importe es que se está encadenando dos acciones sobre el mismo objeto; la razón de que la traspuesta invierta es que trasponer da vuelta el dato que hacía encajar los factores; la razón de que no haya ley de anulación es que cada entrada es una suma donde los términos pueden compensarse.
- **La lectura de composición se usa para explicar, no para calcular**: ningún ítem pide componer transformaciones geométricas concretas ni identificar qué transformación representa una matriz dada.

## Hallazgos de testing (ronda 1)

- **Formato "representar un problema con matrices", pedido explícitamente en testing (feedback 398).** El ítem de `systems/RESL` que traduce un problema de reparto a un sistema recibió un pedido directo de usarlo más seguido y en más topics. `product/RESL` era el hueco más grande: tenía las tres sub-familias en abstracto, justo en el topic donde el producto de matrices tiene su aplicación más natural.
    - **Fix aplicado:** `calcular-una-entrada` pasó a un contexto de consumos por precios. La explicación aprovecha el contexto para justificar la condición de dimensiones, que deja de ser una regla arbitraria: las columnas de la primera y las filas de la segunda tienen que coincidir porque **son el mismo conjunto de insumos**, mirado una vez como consumo y otra como precio.
    - **Dónde sí y dónde no.** El formato encaja en `definition`, `operations`, `product` y `systems`, donde el objeto matricial organiza datos reales. **No encaja en `determinants` ni en `inverse`**: los contextos disponibles ahí son geométricos y no cotidianos, y forzarlos produce enunciados artificiales. Eso está asumido en el diseño de esos dos topics, no es un pendiente.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún ítem menciona determinante, inversa, rango ni sistemas (regla crítica 31)
- [ ] Matrices de $2 \times 2$ con enteros de un dígito en `RESL`, a lo sumo un signo negativo
- [ ] Al menos un tercio de `RESL` pide una sola entrada, no la matriz completa
- [ ] Cada ítem de `LEXI` reintroduce la razón detrás de lo que pregunta (regla 44)
- [ ] La sub-familia `identificar-igualdad-valida` incluye el caso de la identidad como correcta en parte de sus ítems, no siempre como distractor
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `LEXI`/`CLSF`, 4 en `RESL`
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
