# Topic: Definición

Belt: `brown`, Unit: `spaces`, Topic: `definition`

**Nombre del topic**: se llama "Definición", igual que el primer topic de todas las demás unidades del proyecto (`blue/vectors`, `violet/matrices`, `black/transformations`, y las tres unidades equivalentes de `analisis`). Un borrador de esta ronda lo había llamado "Espacio vectorial", que además quedaba redundante contra el nombre de la unidad, "Espacios".

Skills en este topic: `LEXI`, `CLSF`, `RESL`. **Sin `FORM`** (rediseño de la unidad, ago-2026): en esta unidad no hay ninguna situación cotidiana que traducir a notación de espacios, el objeto es estructural y no descriptivo; `FORM` no aparece en ningún topic de `spaces`. **Sin `GRAF`**: el componente de dibujo de vectores no existe en el frontend, se pospone.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `CLSF`, `RESL`.

Concepto: un **espacio vectorial** es un conjunto donde sumar dos elementos o multiplicar uno por un número nunca saca del conjunto:
$$\vec{u}+\vec{v} \in V, \quad \alpha\vec{v} \in V$$
Primer topic de la unidad y del cinturón `brown`. El alumno viene de `violet/matrices`, así que ya sabe operar matrices, calcular determinantes e inversas, resolver sistemas de ecuaciones y, sobre todo, ya vio **combinación lineal** y **base canónica** de forma concreta en `violet/matrices/definition`. Todavía no conoce `subspaces`, `generators`, `independence`, `bases` ni `dimension` (regla crítica 31).

**`RESL` es la skill nueva del rediseño (ago-2026)**, y no está de adorno: es la que vuelve creíble el salto abstracto. Que los polinomios sean vectores no se acepta porque un enunciado lo declare, se acepta porque el alumno los suma y los escala y ve que la maquinaria funciona igual.

**Función dentro de la unidad**: es el **encuadre**. Instala que "espacio vectorial" no es un sinónimo elegante de $\mathbb{R}^n$, y por lo tanto que todo lo que se demuestre en los cinco topics siguientes vale también para polinomios y matrices. Sin este topic, la unidad entera se leería como geometría del plano con vocabulario nuevo.

**Este es el único topic de la unidad donde viven los espacios abstractos.** Los cinco restantes trabajan en $\mathbb{R}^2$ y $\mathbb{R}^3$, para que la cuenta entre en el techo de carga mental (regla 55). La decisión está documentada en `course-context.md` y no se relitiga por topic.

**Nota de referencia editorial**: este topic **no admite contexto cotidiano** y la regla 43 lo permite explícitamente para `LEXI`. El objeto de estudio es una definición, no una situación. Forzar una historia acá alarga el enunciado sin agregar nada a la decisión que el alumno tiene que tomar.

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Por qué alcanzan dos operaciones | 5 | `por-que-alcanzan-dos-operaciones` | Entender que toda la estructura se apoya en sumar y escalar, y que la longitud y el ángulo no participan | Suma y producto por escalar como únicas operaciones, lo que queda afuera de la definición |
| Qué significa que una operación sea cerrada | 5 | `que-significa-ser-cerrado` | Entender que el problema de salirse del conjunto es que las cuentas dejan de tener sentido adentro de él | Clausura, resultado que cae fuera, por qué eso invalida la estructura |
| Para qué sirven los axiomas | 5 | `para-que-sirven-los-axiomas` | Entender que los axiomas no son un reglamento a memorizar sino la condición que permite reusar resultados en un conjunto nuevo | Los axiomas como contrato, transferencia de resultados entre espacios |
| **Total** | **15** | | | |

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Decidir si un conjunto es espacio vectorial | 5 | `decidir-si-es-espacio-vectorial` | Aplicar el criterio a conjuntos concretos, con sus operaciones habituales | $\mathbb{R}^n$, $P_n$, $\mathbb{R}^{m \times n}$ contra conjuntos que fallan |
| Identificar qué condición falla | 5 | `identificar-la-condicion-que-falla` | Dado un conjunto que no califica, decir cuál es exactamente la condición rota | Falta de opuesto, falta de neutro, clausura rota por la suma o por el escalar |
| Reconocer el vector nulo de un espacio | 5 | `reconocer-el-vector-nulo` | Entender que el neutro depende del espacio y no siempre es un número ni una tupla de ceros | Vector nulo de $P_n$, de $\mathbb{R}^{m \times n}$, de $\mathbb{R}^n$ |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Calcular una combinación de polinomios | 5 | `calcular-combinacion-de-polinomios` | Ejecutar la cuenta y notar que se opera coeficiente a coeficiente, igual que con tuplas | Suma de polinomios, producto por escalar, agrupación por grado |
| Hallar el neutro o el opuesto de un elemento | 5 | `hallar-el-neutro-o-el-opuesto` | Encontrar el elemento que cancela dentro del espacio dado, sin importar qué forma tenga | Opuesto de un polinomio, opuesto de una matriz, el neutro como resultado |
| Verificar la clausura en un caso concreto | 5 | `verificar-la-clausura-en-un-caso` | Operar dos elementos de un conjunto sospechoso y ver adónde cae el resultado | El resultado que se sale del conjunto como prueba de que no es espacio |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones en `LEXI` y `CLSF` (conceptuales). 4 opciones en `RESL`. Las opciones con polinomios completos son anchas y van como lista vertical, no en grilla 2×2.

---

## Contextos variados

**El registro abstracto es sobre el contexto narrativo, no sobre la notación.** Que un ítem no lleve una situación cotidiana no lo exime del bloque `$$...$$` entre la apertura y la pregunta: ahí va la notación abstracta del objeto (regla 66).

**Este topic va en registro abstracto por diseño** (regla 43 lo autoriza cuando el `topic-context.md` lo aclara, y lo aclara acá). No hay una situación cotidiana donde la pregunta "¿esto es un espacio vectorial?" aparezca de forma natural, y las que se pueden inventar son artificiales.

Lo que sí varía entre ítems es **el espacio con el que se trabaja**, y esa variación es obligatoria:

- **$P_n$, polinomios de grado menor o igual a $n$**: el caso principal, porque es el más lejano de una flecha y el que mejor produce el momento ajá. Usar $P_2$ y $P_3$, nunca grados más altos.
- **$\mathbb{R}^{m \times n}$, matrices**: el segundo caso, y tiene la ventaja de que el alumno ya sabe operarlas desde `violet`. Matrices de $2 \times 2$ únicamente.
- **$\mathbb{R}^2$ y $\mathbb{R}^3$**: aparecen como el caso conocido contra el cual comparar, no como el objeto interesante.
- **Conjuntos que fallan**, para `CLSF` y para `verificar-la-clausura-en-un-caso`: los polinomios de grado exactamente 2, los vectores de norma 1, los enteros positivos con la suma, las matrices inversibles, los vectores de primera componente positiva.

Ningún espacio supera ~40% de los ítems de una misma sub-familia. El tope es más alto que el ~30% habitual porque acá el repertorio de espacios es chico y forzarlo más produciría ejemplos exóticos.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Qué define un espacio vectorial | Creer que hace falta poder medir longitudes o ángulos, importando la estructura de $\mathbb{R}^n$ |
| Clausura | Confundir "el conjunto es infinito" con "el conjunto es cerrado", que son cosas distintas |
| Función de los axiomas | Creer que son propiedades que hay que demostrar cada vez, en vez de condiciones que hay que verificar una sola vez por espacio |
| Polinomios de grado exactamente $n$ | No notar que sumar dos polinomios de grado 2 puede bajar el grado, así que el conjunto no es cerrado |
| Vectores de norma 1 | Creer que alcanza con que la suma esté definida, sin verificar que el resultado siga teniendo norma 1 |
| Enteros positivos con la suma | Detectar que falta el opuesto pero creer que el problema es el neutro, o al revés |
| Matrices inversibles | Creer que forman un espacio porque el producto se porta bien, sin notar que la suma de dos inversibles puede no serlo |
| Vector nulo de $P_n$ | Responder el número $0$ o la tupla de ceros en vez del polinomio nulo |
| Combinación de polinomios | Sumar los exponentes en vez de los coeficientes, o agrupar términos de grados distintos |
| Opuesto de un elemento | Dar el inverso multiplicativo en vez del opuesto aditivo |

---

## Reglas específicas del topic

- **Los axiomas son 8 y se presentan agrupados, nunca listados sueltos.** Los cuatro bloques son: los dos neutros y opuestos, las dos distributividades, las dos asociatividades, y el caso $1 \cdot \vec{v} = \vec{v}$. La clausura no se cuenta entre los 8 porque está absorbida en la definición de las operaciones, pero **sí se trabaja explícitamente**, y es la condición que casi todos los ejercicios usan. Verificado contra el apunte de cátedra de UBA FIUBA.
- **Ningún ítem pide verificar los 8 axiomas de corrido.** Excede el techo de carga mental (regla 55) por varios órdenes. Los ítems preguntan por **una** condición a la vez, o por cuál es la que falla.
- **Prohibida la palabra "cuerpo" y el símbolo $K$.** El curso trabaja solo sobre $\mathbb{R}$, y ninguna de las cátedras relevadas que apuntan a nuestro público nombra el cuerpo en esta unidad. Los escalares se llaman "escalares" o "números reales".
- **Prohibido nombrar subespacio, conjunto generado, independencia lineal, base o dimensión**: son topics posteriores (regla crítica 31). En particular, **no se puede justificar que un conjunto no es espacio vectorial diciendo que "no es un subespacio de algo"**, aunque sea el argumento más corto.
- **Polinomios de grado a lo sumo 3, con coeficientes enteros de un dígito.** Matrices de $2 \times 2$ con enteros de un dígito.
- **Notación**: $P_n$ para polinomios de grado menor o igual a $n$, $\mathbb{R}^{m \times n}$ para matrices. La variable de los polinomios es $x$. El vector nulo del espacio se escribe $\vec{0}$ cuando hay riesgo de confundirlo con el número cero.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que la clausura importe es que sin ella una cuenta legítima produce algo que ya no pertenece al conjunto y el resto de las reglas deja de aplicar; la razón de que los axiomas se verifiquen una sola vez es que a partir de ahí todo teorema demostrado para espacios vectoriales cae sobre ese conjunto sin volver a probarse.
- **Los espacios abstractos se presentan operando, no describiendo.** Un ítem que dice "los polinomios forman un espacio vectorial" sin mostrar una suma concreta no cumple su función. Mostrar el objeto (regla 62).

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún ítem pide verificar los 8 axiomas de corrido
- [ ] Ningún ítem menciona subespacio, generado, independencia, base ni dimensión (regla crítica 31)
- [ ] Ningún ítem usa la palabra "cuerpo" ni el símbolo $K$
- [ ] Polinomios hasta grado 3 y matrices de $2 \times 2$, coeficientes enteros de un dígito
- [ ] Cada ítem de `LEXI` reintroduce la razón detrás de lo que pregunta (regla 44)
- [ ] Al menos un tercio de los ítems trabaja sobre $P_n$, el espacio que más rinde acá
- [ ] Los espacios abstractos se muestran con un objeto concreto, no solo se nombran (regla 62)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `LEXI`/`CLSF`, 4 en `RESL`
- [ ] Ningún espacio supera ~40% de los ítems de su sub-familia
