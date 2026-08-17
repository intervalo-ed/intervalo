# Topic: Subespacios

Belt: `brown`, Unit: `spaces`, Topic: `subspaces`

Skills en este topic: `LEXI`, `CLSF`, `RESL`. **Sin `FORM`**: ningún topic de `spaces` la usa, el objeto es estructural y no hay situación que traducir. **Sin `GRAF`**: es el topic donde `GRAF` sería más razonable de toda la unidad, con una recta que pasa por el origen contra una que no, que es exactamente lo que el componente actual sabe dibujar. Queda anotado como la primera candidata para una ronda futura.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `CLSF`, `RESL`.

Concepto: un **subespacio** es un subconjunto que se comporta como un espacio vectorial por sí solo, y para eso alcanza con que sea cerrado bajo las dos operaciones:
$$\alpha\vec{u} + \vec{v} \in S$$
Segundo topic de la unidad, después de `definition`: el alumno ya sabe qué exige un espacio vectorial y ya vio que los polinomios y las matrices también califican. Todavía no conoce `generators`, `independence`, `bases` ni `dimension` (regla crítica 31).

**Función dentro de la unidad**: es el **filtro**, y es el contenido más ejercitado del tema en las guías reales. Su valor pedagógico está en que el alumno deje de verificar ocho condiciones y pase a verificar dos, porque las otras seis las hereda del espacio grande. Ese razonamiento de herencia es el que hace que la definición abstracta del topic anterior valga la pena.

**El conjunto solución de un sistema homogéneo entra acá**, ascendido desde su versión operativa de `violet/matrices/systems`. Allá se decía que toda solución se obtiene sumándole a una conocida algo que resuelva el sistema con términos independientes en cero; acá eso tiene nombre: ese conjunto es un subespacio, y se escribe $\text{Nul}(A)$.

**Nota de referencia editorial**: registro "Paenza" cuando el contexto aporta, que acá es poco: el objeto es un conjunto definido por una condición, no una situación. Los ítems pueden quedar en abstracto, con la salvedad de que **el conjunto siempre se muestra escrito**, nunca solo descripto en prosa (regla 62).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Por qué alcanza con verificar dos condiciones | 5 | `por-que-alcanzan-dos-condiciones` | Entender que las propiedades se heredan del espacio grande y solo falta comprobar que no se sale | Herencia de propiedades, clausura como única exigencia real |
| Por qué el vector nulo tiene que pertenecer | 5 | `por-que-el-cero-es-obligatorio` | Entender que multiplicar cualquier elemento por cero obliga a que el nulo esté adentro, así que su ausencia descarta al conjunto de entrada | Consecuencia de la clausura, criterio de descarte rápido |
| Qué subconjuntos del plano y del espacio califican | 5 | `que-figuras-son-subespacios` | Entender que solo las rectas y los planos que pasan por el origen califican, y por qué la condición geométrica es esa | Recta y plano por el origen, el origen como punto obligado |
| **Total** | **15** | | | |

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Decidir si un conjunto es subespacio | 5 | `decidir-si-es-subespacio` | Aplicar el criterio a un conjunto escrito por comprensión | Condición lineal contra condición con término independiente, con desigualdad o con producto |
| Identificar qué condición se rompe | 5 | `identificar-la-condicion-que-se-rompe` | Dado un conjunto que no califica, decir si falla el nulo, la suma o el escalar | Cada una de las tres condiciones fallando por separado |
| Reconocer el conjunto solución como subespacio | 5 | `reconocer-el-conjunto-solucion` | Distinguir el sistema homogéneo, cuyo conjunto solución sí es subespacio, del que tiene términos independientes no nulos | $\text{Nul}(A)$, sistema homogéneo, el nulo como solución siempre disponible |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Decidir si un vector pertenece a un subespacio | 5 | `decidir-pertenencia-por-la-condicion` | Reemplazar las componentes en la condición y ver si se cumple | Verificación directa, condición como ecuación |
| Hallar el parámetro que hace pertenecer | 5 | `hallar-el-parametro-de-pertenencia` | Plantear la condición como ecuación en el parámetro y despejarlo | Despeje de un parámetro, condición lineal |
| Encontrar el contraejemplo que descarta un conjunto | 5 | `encontrar-el-contraejemplo` | Elegir dos elementos del conjunto, operarlos, y mostrar que el resultado se sale | Suma que rompe la condición, escalar negativo que rompe una desigualdad |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones en `LEXI` y `CLSF`. 4 opciones en `RESL`; las que son un número suelto entran en grilla 2×2, las que son vectores o conjuntos van en lista vertical.

---

## Contextos variados

**El registro abstracto es sobre el contexto narrativo, no sobre la notación.** Que un ítem no lleve una situación cotidiana no lo exime del bloque `$$...$$` entre la apertura y la pregunta: ahí va la notación abstracta del objeto (regla 66).

**Los conjuntos a clasificar son el repertorio, y hay que variarlos**, porque son lo que el alumno lee. Nunca repetir el mismo tipo de condición en dos ítems seguidos de la misma sub-familia.

- **Sí son subespacios**: rectas por el origen ($y = 2x$), planos por el origen ($x + y - z = 0$), el conjunto solución de un sistema homogéneo, el conjunto formado solo por el vector nulo, el espacio entero.
- **No son subespacios, y cada uno falla distinto**: rectas que no pasan por el origen ($y = 2x + 1$), condiciones con desigualdad ($x \geq 0$), condiciones con producto o cuadrado ($xy = 0$, $x^2 = y$), la unión de dos rectas por el origen, los vectores de norma 1.
- **En $P_n$ o $\mathbb{R}^{m \times n}$**: no en este topic. Los espacios abstractos quedan acotados a `definition` (ver `course-context.md`); acá todo es $\mathbb{R}^2$ y $\mathbb{R}^3$, para que la verificación entre en 90 segundos.

Ningún tipo de conjunto supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Cuántas condiciones verificar | Creer que hay que verificar los 8 axiomas de nuevo, sin notar que se heredan |
| El vector nulo | No verificarlo, y aceptar como subespacio una recta que no pasa por el origen |
| Recta con término independiente | Creer que por ser una recta ya califica, atendiendo a la forma y no a la condición |
| Condición con desigualdad | Verificar que la suma cierra y olvidar que multiplicar por un escalar negativo se sale |
| Condición con producto o cuadrado | Creer que como el nulo pertenece, el conjunto ya califica |
| Unión de dos subespacios | Creer que la unión es subespacio porque cada parte lo es, sin sumar un elemento de cada una |
| Conjunto solución | Confundir el sistema homogéneo con uno de términos independientes no nulos, cuyo conjunto solución no contiene al nulo |
| Pertenencia de un vector | Verificar solo una de las dos condiciones cuando el subespacio está definido por dos ecuaciones |
| Parámetro de pertenencia | Invertir el signo al despejar, o reemplazar en la componente equivocada |
| Contraejemplo | Elegir dos elementos cuya suma casualmente sí cumple, y concluir que el conjunto califica |

---

## Reglas específicas del topic

- **Todo conjunto se muestra escrito, nunca solo descripto** (regla 62). Un enunciado que dice "el conjunto de los vectores del plano cuya primera componente es el doble de la segunda" obliga al alumno a traducirlo antes de poder pensar. Se escribe $S = \{(x,y) : x = 2y\}$ y se acabó.
- **Enteros de un dígito en las condiciones**, y coeficientes que no obliguen a fracciones al despejar.
- **Solo $\mathbb{R}^2$ y $\mathbb{R}^3$.** Los espacios de polinomios y matrices quedan en `definition`.
- **Prohibido nombrar conjunto generado, independencia lineal, base o dimensión**: son topics posteriores (regla crítica 31). En particular, **no se puede decir que un subespacio de $\mathbb{R}^3$ "es un plano porque tiene dimensión 2"**, aunque sea la explicación más económica: acá la razón es que la condición es lineal y homogénea.
- **$\text{Nul}(A)$ se puede nombrar y se llama espacio nulo.** **Prohibido** llamarlo núcleo o $\ker$, que son de la transformación y viven en el cinturón `black` (ver la frontera fina de `brown` en `course-context.md`).
- **El criterio del nulo se usa para descartar, nunca para confirmar.** Que el vector nulo pertenezca no alcanza: $\{(x,y) : xy = 0\}$ lo contiene y no es subespacio. Ningún ítem puede sugerir lo contrario, ni en la explicación ni en un `feedback`.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que alcance con dos condiciones es que la asociatividad o la distributividad valen para todos los elementos del espacio grande y por lo tanto también para los del subconjunto; la razón de que el nulo sea obligatorio es que multiplicar cualquier elemento por el escalar cero lo produce, y la clausura obliga a que el resultado esté adentro.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Todo conjunto aparece escrito por comprensión en el enunciado, no descripto en prosa (regla 62)
- [ ] Ningún ítem menciona conjunto generado, independencia, base ni dimensión (regla crítica 31)
- [ ] Ningún ítem trata a $\text{Nul}(A)$ como núcleo de una transformación
- [ ] Ningún ítem sugiere que contener al vector nulo alcanza para ser subespacio
- [ ] Solo $\mathbb{R}^2$ y $\mathbb{R}^3$, sin polinomios ni matrices
- [ ] Cada ítem de `LEXI` reintroduce la razón detrás de lo que pregunta (regla 44)
- [ ] Los tres modos de falla (nulo, suma, escalar) aparecen repartidos, ninguno domina
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `LEXI`/`CLSF`, 4 en `RESL`
- [ ] Ningún tipo de conjunto supera ~30% de los ítems de su sub-familia
