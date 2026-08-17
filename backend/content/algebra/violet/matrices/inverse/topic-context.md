# Topic: Inversa

Belt: `violet`, Unit: `matrices`, Topic: `inverse`

Skills en este topic: `LEXI`, `CLSF`, `RESL`. **Sin `FORM`**: la traducción de una situación a notación matricial se concentra en `systems`. **Sin `GRAF`**: se pospone.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `CLSF`, `RESL`.

Concepto: la **matriz inversa** es la que deshace exactamente lo que hizo la original:
$$A A^{-1} = A^{-1} A = I$$
Quinto topic de la unidad, después de `definition`, `operations`, `product` y `determinants`: el alumno ya sabe multiplicar matrices, sabe que el producto no conmuta, y sabe leer el determinante como factor de área. Todavía no conoce `systems` (regla crítica 31), así que **está prohibido caracterizar la inversibilidad por la cantidad de soluciones de un sistema**, aunque sea la caracterización más habitual en las cátedras.

**Nota de orden, decisión deliberada.** La mayoría de las cátedras relevadas da la inversa *antes* que el determinante, porque la calculan por Gauss-Jordan y no lo necesitan. Intervalo se aparta a propósito: como el algoritmo completo de Gauss-Jordan sobre una $3 \times 3$ excede el techo de carga mental (regla 55) y no se enseña, tanto la fórmula de la inversa de $2 \times 2$ como el criterio de existencia dependen del determinante, que por lo tanto tiene que venir antes. La secuencia resultante coincide igual con UTN FR Córdoba y con UTN FRBA.

**Función dentro de la unidad**: es la operación de **deshacer**, y cierra el álgebra matricial. Le da sentido retroactivo a la no conmutatividad, porque revertir dos pasos encadenados exige invertirlos en orden contrario. Y es donde el alumno paga el costo de que no exista la división de matrices.

**Nota de referencia editorial**: registro "Paenza". La imagen central es la de revertir una acción, y la analogía de vestirse y desvestirse en orden inverso es la que mejor funciona para la propiedad del orden invertido (regla 43, analogía cotidiana en tono formal).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Por qué un determinante nulo impide la inversa | 5 | `por-que-determinante-cero-impide` | Entender que al colapsar el plano infinitos puntos comparten destino, y ya no hay forma de devolverlos | Pérdida de información, no se puede des-aplastar una recta |
| Por qué la inversa de un producto invierte el orden | 5 | `por-que-se-invierte-el-orden` | Entender que revertir una cadena de pasos empieza por el último | $(AB)^{-1} = B^{-1}A^{-1}$, cancelación de a pares |
| Por qué no existe la división de matrices | 5 | `por-que-no-existe-division` | Entender que sin conmutatividad un cociente sería ambiguo, y por eso hay que decir de qué lado se multiplica | Ambigüedad del cociente, importancia del lado al despejar |
| **Total** | **15** | | | |

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Decidir si una matriz dada tiene inversa | 5 | `decidir-si-tiene-inversa` | Calcular el determinante y concluir, sin dejarse llevar por la presencia o ausencia de ceros | Criterio del determinante, ser cuadrada como condición necesaria pero insuficiente |
| Verificar si dos matrices son inversas entre sí | 5 | `verificar-si-dos-son-inversas` | Comprobar que el producto da la identidad, en vez de comparar formas o determinantes | Verificación por producto, alcanza con un solo orden |
| Reconocer la inversa de un caso simple | 5 | `reconocer-inversa-de-caso-simple` | Escribir de memoria la inversa de una diagonal o de la identidad, sin aplicar la fórmula general | Inversa de una diagonal como la de los recíprocos, por qué un cero en la diagonal la destruye |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Calcular la inversa de una matriz de $2 \times 2$ | 5 | `calcular-inversa-2x2` | Ejecutar los tres gestos de la fórmula sin saltearse ninguno | Intercambio de la diagonal, cambio de signo, división por el determinante |
| Hallar los valores del parámetro que destruyen la inversa | 5 | `hallar-parametro-para-inversibilidad` | Plantear el determinante igualado a cero y resolver, sin perder soluciones | Ecuación con parámetro, raíz cuadrada con dos signos |
| Despejar la matriz incógnita usando la inversa | 5 | `despejar-matriz-con-inversa` | Elegir de qué lado multiplicar para que la cancelación efectivamente ocurra | $AX = B$ contra $XA = B$, el lado como parte del despeje |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones en `LEXI` y `CLSF`. 4 opciones en `RESL`; cuando las opciones son matrices completas van como lista vertical, y cuando son conjuntos o expresiones cortas entran en grilla 2×2.

---

## Contextos variados

**Registro Paenza, sin jerga de nicho** (regla 43). Este topic admite poco contexto narrativo, porque las preguntas son sobre la operación en sí.

- **`por-que-se-invierte-el-orden`**: la analogía de vestirse y desvestirse es la más eficaz y conviene reservarla para esta sub-familia, sin repetirla en más de un tercio de sus ítems.
- **`por-que-determinante-cero-impide`**: la imagen es la del plano aplastado sobre una recta, retomada de `determinants`.
- **`RESL`**: abstracto por naturaleza, no forzar contexto.

Ningún experimento supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Determinante nulo e inversa | Creer que el problema es la forma de la matriz, o que el signo del determinante tiene algo que ver |
| Orden invertido | Escribir $(AB)^{-1} = A^{-1}B^{-1}$, sin notar que la cancelación no ocurre en ese orden |
| Ausencia de división | Creer que es una cuestión de dificultad de cálculo, o que la inversa exige condiciones distintas a las de un cociente |
| Existencia de la inversa | Usar la presencia de ceros como criterio, o creer que toda matriz cuadrada tiene inversa |
| Verificación por producto | Comparar determinantes o formas en vez de multiplicar, o confundir la inversa con la traspuesta |
| Inversa de una diagonal | Cambiar el signo en vez de tomar el recíproco, o intercambiar los dos valores de la diagonal |
| Cálculo de la inversa | Intercambiar la diagonal sin cambiar los signos, cambiar los signos sin intercambiar la diagonal, u olvidar la división |
| Parámetro | Quedarse con una sola de las dos raíces, o dar el valor del cuadrado en vez del valor del parámetro |
| Despeje | Multiplicar por la inversa del lado que no cancela, o invertir la matriz del miembro equivocado |

---

## Reglas específicas del topic

- **Frontera con `determinants` y `systems`** (regla 67): `determinants` ya pide el valor que anula el determinante sobre una matriz pelada. Acá la entrada es una matriz dentro de un planteo de inversión, y la respuesta es la **condición sobre el parámetro para que la inversa exista** (el complemento del valor crítico), nunca el valor crítico suelto. Lo mismo vale para `decidir-si-tiene-inversa` contra `identificar-nulo-sin-calcular`: acá se puede usar una matriz no cuadrada, que descarta la inversa sin calcular nada y no tiene equivalente en `determinants`.
- **Matrices de $2 \times 2$ con enteros de un dígito** en `RESL`, y **determinante igual a $1$ o $-1$** en la mayoría de los ítems de `calcular-inversa-2x2`, para que el resultado quede en enteros y la división no agregue una operación de más (regla 55).
- **Prohibido enseñar Gauss-Jordan para calcular la inversa**: el algoritmo completo sobre una $3 \times 3$ excede el techo de carga mental. Solo se usa la fórmula directa de $2 \times 2$.
- **Prohibido mencionar sistemas de ecuaciones, cantidad de soluciones, rango o matriz ampliada**: es el topic siguiente (regla crítica 31). El criterio de inversibilidad se apoya en el determinante y en la lectura de colapso, nunca en la unicidad de la solución de un sistema.
- **Prohibido usar independencia lineal de filas o columnas** como caracterización de la inversibilidad: es vocabulario de `brown` (ver la frontera fina de `violet` en `course-context.md`).
- **Prohibida la matriz adjunta** como método: no aparece en esta ronda.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que un determinante nulo impida la inversa es que el colapso hace que infinitos puntos compartan destino; la razón de que el orden se invierta es que deshacer una cadena empieza por el último paso.
- **Notación**: la inversa siempre como $A^{-1}$; la identidad siempre como $I$, nunca como $\mathbb{I}$ ni como $\text{Id}$.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún ítem menciona sistemas, cantidad de soluciones, rango ni matriz ampliada (regla crítica 31)
- [ ] Ningún ítem usa Gauss-Jordan ni la matriz adjunta
- [ ] `RESL` trabaja solo con matrices de $2 \times 2$, con determinante $\pm 1$ en la mayoría de `calcular-inversa-2x2`
- [ ] Cada ítem de `LEXI` reintroduce la razón detrás de lo que pregunta (regla 44)
- [ ] La analogía de vestirse no aparece en más de un tercio de los ítems de su sub-familia
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `LEXI`/`CLSF`, 4 en `RESL`
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
