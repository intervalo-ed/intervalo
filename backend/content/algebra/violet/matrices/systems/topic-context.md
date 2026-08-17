# Topic: Sistemas

Belt: `violet`, Unit: `matrices`, Topic: `systems`

Skills en este topic: `FORM`, `CLSF`, `RESL`. **Sin `LEXI`** (tope de 3 skills por topic): el porqué de cada concepto queda dentro de las `explanation`, que igual lo exigen (regla 44). **Sin `GRAF`, por ahora**: es el único topic de la unidad donde `GRAF` sería viable, con dos rectas del plano que se cortan, son paralelas o coinciden, y queda anotado como la primera candidata para una ronda futura. La versión de tres planos en $\mathbb{R}^3$ no es viable con el componente actual.

Este topic tiene 3 ítems (uno por skill): `FORM`, `CLSF`, `RESL`.

Concepto: un **sistema de ecuaciones lineales** se escribe de forma compacta como una matriz de coeficientes multiplicada por la matriz de incógnitas:
$$AX = B$$
Sexto y último topic de la unidad, después de `definition`, `operations`, `product`, `determinants` e `inverse`: el alumno ya tiene todo lo que hace falta, y este topic es donde se junta.

**Topic recuperado del archivo (ago-2026).** Se había podado en julio junto con `elimination`. El relevamiento curricular sobre UBA, UTN y UNLP lo devolvió como el contenido **más ejercitado** del tema: discutir un sistema según un parámetro y resolver por escalonamiento clasificando el resultado son los dos tipos de ejercicio más frecuentes de todas las guías de trabajos prácticos relevadas. **`elimination` no vuelve como topic propio**: el escalonamiento es el método dentro de este topic, no un tema aparte.

**Función dentro de la unidad**: es el **destino**. Acá todo lo anterior se vuelve útil de golpe. La matriz es la forma compacta del sistema, el determinante decide si la solución es única, y la inversa la despeja. Es además el topic con más superficie de contacto con lo que el alumno efectivamente rinde en un parcial.

**Nota de referencia editorial**: registro "Paenza", situaciones con dos cantidades desconocidas y dos condiciones que las vinculan (repartos, totales y diferencias, mezclas), evitando jerga de carrera puntual (regla 43). El contexto de insumo-producto es territorio compartido y no exclusivo de económicas, así que se admite redactado sin jerga económica.

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Traducir una situación a una ecuación matricial | 5 | `traducir-situacion-a-sistema-matricial` | Armar $AX = B$ a partir de dos condiciones descriptas en palabras | Coeficientes por fila, signo de una diferencia, orden de los términos independientes |
| Identificar la matriz ampliada de un sistema | 5 | `identificar-matriz-ampliada` | Distinguir la matriz de coeficientes de la ampliada, y conservar los signos | Columna de términos independientes, signo como parte del coeficiente |
| Leer el sistema que representa una matriz dada | 5 | `leer-el-sistema-desde-la-matriz` | Recorrer el camino inverso y reconocer que una matriz reducida ya contiene la solución | Cada fila es una ecuación, la forma reducida como sistema ya resuelto |
| **Total** | **15** | | | |

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Clasificar a partir de la matriz escalonada | 5 | `clasificar-por-escalonada` | Leer la última fila no nula y decidir entre las tres clasificaciones posibles | Fila imposible, fila nula, distinción por un único número |
| Clasificar sin resolver, por la forma del sistema | 5 | `clasificar-sin-resolver` | Reconocer que un sistema con términos independientes nulos siempre tiene solución | Sistema homogéneo, solución trivial, la pregunta real es si hay otras |
| Clasificar según el determinante de los coeficientes | 5 | `clasificar-segun-determinante` | Conectar el determinante con la cantidad de soluciones, sin depender de los términos independientes | Determinante no nulo implica solución única, el lado derecho mueve la solución pero no su cantidad |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Resolver un sistema de dos ecuaciones con dos incógnitas | 5 | `resolver-sistema-2x2` | Plantear las dos condiciones, resolver, y verificar que la respuesta cumpla ambas | Sustitución o escalonamiento, verificación de las dos condiciones |
| Hallar el parámetro que rompe la unicidad | 5 | `hallar-el-parametro-critico` | Igualar a cero el determinante de los coeficientes y despejar | Ecuación con parámetro, filas proporcionales |
| Construir otra solución a partir de dos conocidas | 5 | `construir-otra-solucion` | Usar la estructura del conjunto solución en vez de resolver el sistema | Diferencia de soluciones, por qué sumar dos soluciones no funciona |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones en `FORM` y `CLSF`. 4 opciones en `RESL`; los pares y ternas cortos entran en grilla 2×2.

---

## Contextos variados

**Registro Paenza, sin jerga de nicho** (regla 43): dos cantidades desconocidas vinculadas por dos condiciones simples.

- **`traducir-situacion-a-sistema-matricial` / `resolver-sistema-2x2`**: un total repartido entre dos cajas con una diferencia o una proporción conocida, dos productos con precios distintos y dos compras registradas, una mezcla de dos ingredientes.
- **Insumo-producto**: admitido como contexto ocasional, redactado sin jerga económica ("una fábrica consume parte de su propia producción"). Nunca como sub-familia propia, y nunca usando las palabras "coeficientes técnicos", "demanda externa" o "matriz de Leontief".
- **`identificar-matriz-ampliada` / `leer-el-sistema-desde-la-matriz` / `construir-otra-solucion`**: abstractas por naturaleza, no forzar contexto.

Ningún experimento supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Traducción a forma matricial | Perder el signo que convierte una diferencia en suma, o cruzar los términos independientes |
| Matriz ampliada | Entregar la matriz de coeficientes sin la última columna, o anotar un coeficiente negativo en positivo |
| Lectura de una matriz reducida | Leer los ceros y unos como valores de las incógnitas en vez de como coeficientes |
| Clasificación por escalonada | Confundir una fila de ceros con término independiente nulo, que da infinitas soluciones, con una de término no nulo, que da ninguna |
| Sistema homogéneo | Creer que no tiene solución, o creer que la solución trivial es necesariamente la única |
| Determinante y unicidad | Creer que la cantidad de soluciones depende también de los términos independientes |
| Resolución | Dar una respuesta que cumple una de las dos condiciones y falla la otra, o invertir el orden de las incógnitas |
| Parámetro crítico | Invertir el signo al despejar, o confundir el valor buscado con alguno de los coeficientes de la matriz |
| Estructura del conjunto solución | Sumar dos soluciones entre sí, o duplicar una, sin notar que eso duplica los términos independientes |

---

## Reglas específicas del topic

- **Frontera con `determinants` e `inverse`** (regla 67): la cuenta del parámetro crítico es la misma en los tres topics. Acá la entrada es siempre un **sistema**, escrito en prosa o en la forma $AX = B$, nunca una matriz suelta, y la pregunta vive en la clasificación: qué deja de valer en ese valor. Un ítem de este topic que se pueda responder mirando solo una matriz pertenece a `determinants`.
- **Sistemas de $2 \times 2$ con enteros de un dígito** en `RESL`, con solución entera. Los de $3 \times 3$ solo aparecen ya escalonados, para clasificar o leer, nunca para resolver desde cero (regla 55).
- **El escalonamiento se muestra, no se ejecuta paso a paso**: ningún ítem pide llevar una matriz a forma escalonada aplicando varias operaciones elementales encadenadas. Las matrices escalonadas se dan ya escalonadas y la tarea es leerlas.
- **Rango en sentido operativo únicamente**: si aparece, se define como la cantidad de filas no nulas de la matriz escalonada. **Prohibido** definirlo como dimensión del espacio fila o columna, o como cantidad de filas linealmente independientes (ver la frontera fina de `violet` en `course-context.md`).
- **La estructura del conjunto solución se enuncia de forma operativa**: toda solución se obtiene sumándole a una conocida algo que resuelva el sistema con términos independientes nulos. **Prohibido** llamarlo espacio nulo, subespacio o variedad afín.
- **Prohibida la regla de Cramer**: muy extendida en las cátedras, pero el propio CBC 27 la omite, y con determinantes de $3 \times 3$ excede el techo de carga mental.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que un sistema homogéneo siempre tenga solución es que todas las incógnitas en cero cumplen cualquier ecuación igualada a cero; la razón de que el determinante decida la unicidad es que con inversa el despeje deja una única posibilidad.
- **Notación**: la ecuación matricial siempre como $AX = B$, con la matriz de incógnitas en mayúscula, para no chocar con la notación vectorial de `blue`.

## Hallazgos de testing (ronda 1)

- **Vocabulario: "sistema de ecuaciones", no "sistema" a secas.** La palabra sola es ambigua, no dice sistema de qué. Convención adoptada, en paralelo a la regla crítica 3: **la primera mención dentro de cada campo dice "sistema de ecuaciones"**; a partir de ahí, dentro del mismo campo, "el sistema" ya es una referencia clara y se puede usar. Aplica a `question` y a `explanation`, no hace falta forzarlo en los `feedback`, que son de una sola oración y llegan después del enunciado.
- **El formato "representar un problema con matrices" funciona.** El ítem de reparto de tornillos de `resolver-sistema-2x2` recibió feedback positivo explícito, con pedido de usarlo más. Este topic ya lo tiene en dos sub-familias (`traducir-situacion-a-sistema-matricial` y `resolver-sistema-2x2`) y conviene sostener esa proporción al escalar a los 10 ítems por sub-familia. Ver la nota equivalente en `product/topic-context.md`, donde se aplicó el mismo formato como consecuencia de este feedback.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún ítem pide ejecutar un escalonamiento de varios pasos encadenados
- [ ] Ningún ítem usa la regla de Cramer
- [ ] Ningún ítem define rango como dimensión, ni nombra espacio nulo, subespacio o independencia lineal
- [ ] `RESL` resuelve solo sistemas de $2 \times 2$ con solución entera
- [ ] Cada `explanation` reintroduce el porqué, no solo el procedimiento (regla 44)
- [ ] El contexto de insumo-producto, si aparece, va sin jerga económica
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `FORM`/`CLSF`, 4 en `RESL`
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
