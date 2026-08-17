# Topic: Dimensión

Belt: `brown`, Unit: `spaces`, Topic: `dimension`

Skills en este topic: `LEXI`, `CLSF`, `RESL`. **Sin `FORM`**: ningún topic de `spaces` la usa. **Sin `ESTR`**: la elección de método vive en `bases`, que es donde hay dos caminos posibles; acá la cuenta es una sola. **Sin `GRAF`**: se pospone.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `CLSF`, `RESL`.

Concepto: la **dimensión** de un espacio es la cantidad de vectores que tiene cualquiera de sus bases:
$$\dim(V) = n$$
Sexto y último topic de la unidad. El alumno ya tiene todo: espacios, subespacios, conjunto generado, independencia y bases. Acá se cierra.

**Función dentro de la unidad**: es el **cierre**, y tiene dos trabajos distintos.

El primero es cubrir el **hueco más serio** que deja la serie de referencia: la dimensión nunca se define ahí formalmente, y sobre todo nunca se plantea el problema de que esté bien definida. Que **todas** las bases de un mismo espacio tengan la misma cantidad de elementos no es obvio, y es exactamente lo que convierte a la dimensión en una propiedad del espacio en vez de una propiedad de la base que elegiste. Sin eso, "dimensión" es un número que se lee del dibujo, y en un espacio de polinomios no hay dibujo del cual leerlo.

El segundo es **cobrar la promesa abstracta que abrió el topic 1**. Si los polinomios de grado hasta 2 tienen dimensión 3, entonces se comportan igual que $\mathbb{R}^3$: todo lo que el alumno aprendió en los cinco topics anteriores vale ahí sin cambiar nada. Ese es el momento ajá de la unidad y es el único lugar donde los espacios abstractos vuelven a aparecer después de `definition`.

**Nota de referencia editorial**: registro abstracto en `LEXI` (regla 43). En `CLSF` y `RESL` los objetos son explícitos y se muestran escritos (regla 62).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Por qué todas las bases tienen la misma cantidad | 5 | `por-que-el-numero-no-cambia` | Entender que si una base tuviera más elementos que otra, los de más serían necesariamente redundantes | Buena definición, por qué el número es del espacio y no de la elección |
| Qué mide la dimensión | 5 | `que-mide-la-dimension` | Entender la dimensión como la cantidad de direcciones independientes, o los grados de libertad | Direcciones independientes, contraste con la cantidad de elementos del conjunto |
| Por qué dos espacios de igual dimensión se comportan igual | 5 | `por-que-la-dimension-los-iguala` | Entender que fijada una base, cualquier espacio de dimensión $n$ se maneja como $\mathbb{R}^n$ | Coordenadas como puente, $P_2$ y $\mathbb{R}^3$ |
| **Total** | **15** | | | |

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Identificar la dimensión de un subespacio conocido | 5 | `dimension-de-un-subespacio` | Leer si el subespacio es el origen, una recta, un plano o todo el espacio | Dimensión 0, 1, 2 y 3, el subespacio nulo |
| Identificar la dimensión de un espacio abstracto | 5 | `dimension-de-un-espacio-abstracto` | Contar los elementos de la base natural de $P_n$ y de $\mathbb{R}^{m \times n}$ | $\dim(P_2)=3$, $\dim(\mathbb{R}^{2\times2})=4$ |
| Decidir qué información alcanza para dar la dimensión | 5 | `que-informacion-alcanza` | Distinguir la cantidad de vectores de un generador de la dimensión de lo que generan | Generador con vectores de más, conjunto independiente |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Calcular la dimensión de un generado | 5 | `calcular-dimension-del-generado` | Descartar los vectores redundantes y contar los que quedan | Múltiplos, vector que es suma de los otros |
| Hallar el rango de una matriz como dimensión | 5 | `hallar-el-rango-como-dimension` | Conectar el conteo de filas no nulas con la dimensión del espacio que generan las columnas | $\text{rg}(A) = \dim(\text{Col}(A))$, reconciliación con `violet` |
| Hallar el parámetro que cambia la dimensión | 5 | `hallar-el-parametro-que-la-cambia` | Encontrar el valor que vuelve redundante a un vector y baja la dimensión en uno | Parámetro crítico, salto de dimensión |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones en `LEXI` y `CLSF`. 4 opciones en `RESL`; como casi todas las respuestas son números sueltos, la grilla 2×2 se activa en la mayoría de los ítems.

---

## La reconciliación del rango es obligatoria

En `violet/matrices` el **rango** se definió de una sola manera, operativa: la cantidad de filas no nulas de una matriz escalonada equivalente. Estaba **prohibido** llamarlo dimensión, porque el concepto no existía todavía (ver la frontera fina de `violet` en `course-context.md`).

Acá se levanta esa prohibición, y el levantamiento es contenido, no un permiso silencioso. La sub-familia `hallar-el-rango-como-dimension` existe para eso: el alumno tiene que ver que el número que venía contando de una manera es el mismo que ahora mide otra cosa.
$$\text{rg}(A) = \dim(\text{Col}(A)) = \dim(\text{Fil}(A))$$
Si esta traducción se deja implícita, el alumno termina con dos conceptos homónimos y usa el equivocado.

**Prohibido, en cambio, el teorema de la dimensión** (rango más nulidad): es de `black/transformations/theorem`, y en las cátedras relevadas también cae en la unidad de transformaciones lineales, no en esta.

---

## Contextos variados

**El registro abstracto es sobre el contexto narrativo, no sobre la notación.** Que un ítem no lleve una situación cotidiana no lo exime del bloque `$$...$$` entre la apertura y la pregunta: ahí va la notación abstracta del objeto (regla 66).

**Registro abstracto en `LEXI`**, autorizado por la regla 43.

En `CLSF` y `RESL` varía el objeto:

- **Subespacios de $\mathbb{R}^3$**: rectas y planos por el origen, más los dos casos extremos, el subespacio nulo y el espacio entero. Es el repertorio principal.
- **Espacios abstractos**: $P_2$, $P_3$ y $\mathbb{R}^{2 \times 2}$, y **solo en `dimension-de-un-espacio-abstracto` y en `por-que-la-dimension-los-iguala`**. Es la única reaparición de los espacios abstractos después de `definition`, y es deliberada.
- **Matrices**: para el rango, matrices de hasta $3 \times 3$ dadas ya escalonadas.
- **Conjuntos con un parámetro**: reservados para `RESL`.

Ningún objeto supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Buena definición | Creer que la dimensión depende de qué base se elija |
| Qué mide la dimensión | Confundirla con la cantidad de componentes de los vectores, y decir que una recta en $\mathbb{R}^3$ tiene dimensión 3 |
| Dimensión de un generado | Contar los vectores del conjunto generador sin descartar los redundantes |
| Subespacio nulo | Decir que el conjunto formado solo por el vector nulo tiene dimensión 1, contando su único elemento |
| Dimensión de $P_2$ | Responder 2, siguiendo el subíndice, sin contar el término independiente |
| Dimensión de $\mathbb{R}^{2\times2}$ | Responder 2 en vez de 4, contando el orden de la matriz en lugar de sus casilleros |
| Rango | Contar todas las filas de la matriz en vez de las no nulas de la escalonada |
| Rango y dimensión | Creer que el rango se calcula de una manera y la dimensión del espacio columna de otra, sin notar que son el mismo número |
| Parámetro crítico | Dar el valor que mantiene la dimensión en vez del que la baja |
| Espacios de igual dimensión | Creer que dos espacios de la misma dimensión son literalmente el mismo conjunto, en vez de que se comportan igual |

---

## Reglas específicas del topic

- **Frontera con `generators` e `independence`** (regla 67): `calcular-dimension-del-generado` responde con un **número**, mientras que la pregunta equivalente de `generators` responde con un objeto geométrico; y `hallar-el-parametro-que-la-cambia` responde con **la dimensión** a cada lado del valor crítico, mientras que la de `independence` responde con el valor del parámetro. Si un ítem de este topic se puede contestar sin nombrar una dimensión, está en el topic equivocado.
- **Notación**: $\dim(V)$ con paréntesis. $\text{rg}(A)$ para el rango, $\text{Col}(A)$ y $\text{Fil}(A)$ para los espacios columna y fila. Verificado contra UTN FRBA y UBA FIUBA.
- **Prohibido el teorema de la dimensión** (rango más nulidad), y prohibido nombrar núcleo, imagen o transformación lineal: son de `black` (ver la frontera fina de `brown` en `course-context.md`).
- **Las matrices para el rango se dan ya escalonadas.** Ningún ítem pide escalonar encadenando operaciones (regla 55).
- **Los espacios abstractos vuelven solo en dos sub-familias.** El resto del topic es $\mathbb{R}^2$ y $\mathbb{R}^3$. Esa dosificación es deliberada: la reaparición rinde porque es escasa.
- **El cierre de la unidad se enuncia con cuidado.** Que $P_2$ y $\mathbb{R}^3$ tengan la misma dimensión significa que **se comportan igual una vez fijada una base**, no que sean el mismo conjunto. La palabra "isomorfo" está prohibida, y la formulación correcta es que cualquier resultado probado para uno vale para el otro leyendo coordenadas.
- **Enteros de un dígito** en los vectores y las matrices.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que todas las bases tengan la misma cantidad de elementos es que una base con más elementos que otra tendría vectores alcanzables por los demás, y eso contradice su independencia; la razón de que el rango sea la dimensión del espacio columna es que las filas no nulas de la escalonada cuentan exactamente cuántas columnas aportan una dirección nueva.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún ítem enuncia el teorema de la dimensión ni nombra núcleo, imagen o transformación
- [ ] La reconciliación entre el rango de `violet` y la dimensión aparece explícita en `hallar-el-rango-como-dimension`
- [ ] Ningún ítem pide escalonar una matriz encadenando operaciones
- [ ] Los espacios abstractos aparecen solo en las dos sub-familias previstas
- [ ] Ningún ítem usa la palabra "isomorfo" ni afirma que dos espacios de igual dimensión son el mismo conjunto
- [ ] El caso del subespacio nulo, de dimensión 0, aparece al menos una vez
- [ ] Cada ítem de `LEXI` reintroduce la razón detrás de lo que pregunta (regla 44)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `LEXI`/`CLSF`, 4 en `RESL`
- [ ] Ningún objeto supera ~30% de los ítems de su sub-familia
