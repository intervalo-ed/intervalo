# Topic: Determinantes

Belt: `violet`, Unit: `matrices`, Topic: `determinants`

Skills en este topic: `LEXI`, `CLSF`, `RESL`. **Sin `FORM`**: no hay ninguna situación cotidiana que se traduzca naturalmente a un determinante sin apoyarse en área orientada, que excede el alcance del curso. **Sin `GRAF`**: se pospone.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `CLSF`, `RESL`.

Concepto: el **determinante** de una matriz cuadrada es el factor por el que se multiplican las áreas al aplicar la transformación que la matriz representa:
$$\det\begin{pmatrix} a & b \\ c & d \end{pmatrix} = ad - bc$$
Cuarto topic de la unidad, después de `definition`, `operations` y `product`: el alumno ya sabe que las columnas registran en qué se convierte cada dirección básica, y ya sabe multiplicar matrices. Todavía no conoce `inverse` ni `systems` (regla crítica 31), así que **está prohibido mencionar inversa, inversibilidad, matriz singular o solución única de un sistema en cualquier campo**.

**Función dentro de la unidad**: es el **diagnóstico**. Un solo número que resume si la transformación colapsa el espacio o no, y en qué proporción lo deforma. Su valor pedagógico no está en la cuenta sino en el criterio, y la lectura geométrica es la que hace que `inverse` y `systems` después se apoyen en algo entendido en vez de en una regla memorizada.

**Consecuencia de la frontera con `inverse`**: como no se puede hablar de inversibilidad, toda la carga conceptual la lleva la lectura de área. Eso no es una limitación sino una ventaja de secuencia: "el plano se aplastó contra una recta" prepara mucho mejor el "no se puede des-aplastar" del topic siguiente que un criterio enunciado sin sustento.

**Nota de referencia editorial**: registro "Paenza". La lectura de área se explica con figuras y hojas de papel, no con integrales ni con jerga de geometría analítica (regla 43).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Qué significa que el determinante sea cero | 5 | `que-significa-cero` | Entender que un factor de área nulo implica que el plano quedó aplastado sobre una recta o un punto | Colapso dimensional, filas alineadas, contraste contra "no hace nada" |
| Qué informa el signo del determinante | 5 | `que-informa-el-signo` | Separar las dos informaciones que el determinante guarda: el valor absoluto mide, el signo orienta | Inversión de orientación, analogía de la hoja dada vuelta |
| Por qué el escalar entra elevado y por qué no reparte en la suma | 5 | `por-que-no-se-reparte-en-la-suma` | Entender que multiplicar la matriz estira todas las direcciones a la vez, y que por eso el área crece con exponente | $\det(kA) = k^n\det(A)$, $\det(A+B) \neq \det(A)+\det(B)$ |
| **Total** | **15** | | | |

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Identificar un determinante nulo sin calcularlo | 5 | `identificar-nulo-sin-calcular` | Reconocer filas proporcionales, filas repetidas o una fila nula, y concluir de un vistazo | Estrategia de mirar la estructura antes de desarrollar |
| Clasificar el efecto de un determinante dado | 5 | `clasificar-el-efecto` | Leer por separado el factor de área y la orientación a partir de un valor dado | Valor absoluto como factor, signo como orientación |
| Elegir qué propiedad justifica un paso | 5 | `elegir-la-propiedad-que-aplica` | Distinguir las tres operaciones elementales por su efecto sobre el determinante | Suma de un múltiplo de otra fila, permutación, multiplicación de una fila |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Calcular el determinante de una matriz de $2 \times 2$ | 5 | `calcular-determinante-2x2` | Ejecutar la resta de los dos productos diagonales, respetando el orden | Fórmula directa, contraste contra sumar las diagonales |
| Calcular usando propiedades, sin desarrollar | 5 | `calcular-con-propiedades` | Obtener $\det(kA)$, $\det(A^2)$, $\det(A^T)$ a partir de un determinante dado | Propiedades del producto y del escalar, exponente igual al orden |
| Hallar el parámetro que anula el determinante | 5 | `hallar-parametro-para-anular` | Plantear el determinante igualado a cero como ecuación y despejar | Ecuación lineal con una incógnita, condición de colapso como restricción |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones en `LEXI` y `CLSF` (conceptuales). 4 opciones en `RESL`, casi siempre números sueltos que entran en grilla 2×2.

---

## Contextos variados

**Registro Paenza, sin jerga de nicho** (regla 43): la lectura geométrica se apoya en figuras, cuadrados unitarios, rectángulos y hojas de papel dadas vuelta.

- **`LEXI`** puede quedar en abstracto por diseño (regla 43 lo permite), apoyándose en la imagen del área y no en un contexto narrativo.
- **`calcular-determinante-2x2`** admite un contexto liviano de transformación del plano, en un subconjunto de los ítems, para que la mecánica siga disponible desnuda.
- **`hallar-parametro-para-anular`** queda en registro abstracto: es un despeje, y el contexto no aporta a la decisión.

Ningún experimento supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Determinante nulo | Creer que significa que la transformación no hace nada, o confundirlo con conservar el área |
| Signo del determinante | Leer el negativo como si achicara las áreas, en vez de como una inversión de orientación |
| Escalar elevado | Escribir $\det(kA) = k\det(A)$, olvidando el exponente, o creer que multiplicar la matriz no cambia el determinante |
| Reparto en la suma | Escribir $\det(A+B) = \det(A)+\det(B)$, importando la linealidad desde otras operaciones |
| Nulo sin calcular | No mirar la relación entre filas y lanzarse a desarrollar, o creer que hace falta alguna entrada nula |
| Propiedades elementales | Confundir cuál de las tres operaciones conserva el determinante, cuál le cambia el signo y cuál lo multiplica |
| Cálculo de $2 \times 2$ | Sumar los dos productos diagonales en vez de restarlos, restarlos en el orden inverso, u olvidar la segunda diagonal |
| Despeje del parámetro | Quedarse en el paso previo a dividir por el coeficiente, o invertir el signo al despejar |

---

## Reglas específicas del topic

- **Frontera con `inverse` y `systems`** (regla 67): las tres unidades tienen una sub-familia que se resuelve igualando el determinante a cero y despejando un parámetro. Lo que las separa es la **entrada** y la **forma de la respuesta**. Acá la entrada es una **matriz pelada** y la respuesta es el valor que anula el determinante, sin ninguna consecuencia agregada.
- **Matrices de $2 \times 2$ con enteros de un dígito** en `RESL`. El desarrollo por cofactores de una $3 \times 3$ excede el techo de carga mental (regla 55) y no entra en esta ronda; las $3 \times 3$ solo aparecen en `CLSF` cuando el determinante se decide de un vistazo por estructura.
- **Nunca enseñar la regla de Sarrus** como método propio. El CBC 27 la omite deliberadamente y va directo a cofactores; se sigue ese criterio.
- **Prohibido mencionar inversa, inversibilidad, matriz singular o regular, rango, o la cantidad de soluciones de un sistema**: son topics posteriores (regla crítica 31). El criterio de este topic es geométrico, no algebraico.
- **La palabra "colapso" se explica siempre**, nunca se usa como término técnico dado por sabido: el plano queda aplastado sobre una recta o sobre un punto.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que el escalar entre elevado es que estira todas las direcciones a la vez; la razón de que sumarle a una fila un múltiplo de otra no altere el determinante es que inclina el paralelogramo sin cambiar su base ni su altura.
- **Notación de matrices**: mayúsculas en cursiva, y el determinante siempre como $\det(A)$, nunca con barras verticales, que se confunden con el valor absoluto en un enunciado corto.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún ítem menciona inversa, inversibilidad, rango ni sistemas (regla crítica 31)
- [ ] Ningún ítem usa la regla de Sarrus
- [ ] `RESL` trabaja solo con matrices de $2 \times 2$ de enteros de un dígito
- [ ] Cada ítem de `LEXI` reintroduce la lectura de área detrás de lo que pregunta (regla 44)
- [ ] El determinante se escribe siempre como $\det(A)$, nunca con barras verticales
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `LEXI`/`CLSF`, 4 en `RESL`
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
