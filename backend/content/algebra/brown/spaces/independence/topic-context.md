# Topic: Independencia

Belt: `brown`, Unit: `spaces`, Topic: `independence`

Skills en este topic: `LEXI`, `CLSF`, `RESL`. **Sin `FORM`**: ningún topic de `spaces` la usa. **Sin `GRAF`**: se pospone.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `CLSF`, `RESL`.

Concepto: un conjunto es **linealmente independiente** cuando ninguno de sus vectores se puede armar combinando los otros, lo que se verifica así:
$$\alpha_1\vec{v}_1 + \dots + \alpha_k\vec{v}_k = \vec{0} \implies \alpha_i = 0$$
Cuarto topic de la unidad, después de `definition`, `subspaces` y `generators`: el alumno ya sabe qué es el conjunto generado y ya vio, en `generators`, que un conjunto puede tener vectores de más sin cambiar su alcance. Todavía no conoce `bases` ni `dimension` (regla crítica 31).

**Este topic bajó un lugar** en el rediseño de ago-2026, para que `generators` venga antes. La razón está escrita en `generators/topic-context.md`: la dependencia solo tiene sentido como respuesta a "este vector no agranda el alcance".

**Función dentro de la unidad**: es el **contraste**. `generators` pregunta si llego a todos; acá se pregunta si me sobra alguno. Las dos preguntas son independientes entre sí, y esa independencia es justamente lo que hace que la definición de base necesite las dos condiciones.

---

## El puente entre las dos definiciones es contenido, no un supuesto

Este topic tiene un riesgo de diseño que hay que atacar de frente, y es el hallazgo más importante de la investigación de la serie.

Hay **dos versiones** del concepto y no se parecen entre sí:

- **La intuitiva**: un conjunto es dependiente cuando alguno de sus vectores es redundante, o sea cuando se puede armar combinando los otros y por lo tanto no agrega ninguna dirección nueva. Es la que hace entender **para qué sirve**.
- **La operativa**: un conjunto es independiente cuando la única combinación que da el vector nulo es la que tiene todos los coeficientes en cero. Es la que se **calcula**, y es la que toma el parcial.

Un alumno que solo tiene la primera no puede decidir nada; uno que solo tiene la segunda ejecuta un procedimiento sin saber qué está midiendo. **La traducción entre las dos es contenido evaluable de este topic**, no una nota al pie: si $\vec{v}_3 = 2\vec{v}_1 - \vec{v}_2$, entonces pasar todo a un lado produce $2\vec{v}_1 - \vec{v}_2 - \vec{v}_3 = \vec{0}$, que es exactamente una combinación nula con coeficientes no nulos. La sub-familia `traducir-entre-las-dos-versiones` de `LEXI` existe para eso y no se puede podar.

---

**Nota de referencia editorial**: registro abstracto en `LEXI` (regla 43, autorizado acá). En `CLSF` y `RESL` los vectores son explícitos y se muestran escritos (regla 62).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Qué significa que un vector sea redundante | 5 | `que-significa-redundante` | Entender la dependencia como un problema de economía, no como una ecuación | Vector que no agranda el alcance, conexión con `generators` |
| Traducir entre la versión intuitiva y la que se calcula | 5 | `traducir-entre-las-dos-versiones` | Ver que "uno es combinación de los otros" y "hay una combinación nula no trivial" son la misma afirmación despejada | Pasaje de términos, coeficiente no nulo del vector despejado |
| Por qué la definición se escribe con el vector nulo | 5 | `por-que-se-define-con-el-nulo` | Entender que igualar al nulo es la manera de preguntar por todos los vectores del conjunto a la vez | Combinación trivial, por qué siempre existe y por qué no cuenta |
| **Total** | **15** | | | |

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Decidir si un conjunto es independiente | 5 | `decidir-si-es-independiente` | Aplicar el criterio a vectores explícitos, a ojo cuando se puede | Proporcionalidad en $\mathbb{R}^2$, determinante nulo, vectores con un cero |
| Reconocer conjuntos dependientes por inspección | 5 | `reconocer-dependencia-a-ojo` | Detectar los casos que no requieren ninguna cuenta | Vector nulo en el conjunto, vector repetido, más vectores que componentes |
| Identificar cuál vector es el redundante | 5 | `identificar-el-redundante` | Señalar cuál de los vectores se puede armar con los otros | Combinación explícita, más de una respuesta posible cuando la hay |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Hallar el parámetro que produce dependencia | 5 | `hallar-el-parametro-que-vuelve-dependiente` | Igualar a cero el determinante o plantear la proporcionalidad, y despejar | Ecuación con parámetro, determinante de $2 \times 2$ |
| Escribir el vector redundante como combinación | 5 | `escribir-la-combinacion-redundante` | Dar los coeficientes concretos que arman uno de los vectores con los otros | Sistema chico con solución entera |
| Decidir la independencia desde una matriz escalonada | 5 | `decidir-desde-la-escalonada` | Leer una escalonada ya dada y contar las filas no nulas contra la cantidad de vectores | Filas no nulas, conexión con el rango de `violet` |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones en `LEXI` y `CLSF`. 4 opciones en `RESL`; los valores sueltos entran en grilla 2×2.

---

## Contextos variados

**El registro abstracto es sobre el contexto narrativo, no sobre la notación.** Que un ítem no lleve una situación cotidiana no lo exime del bloque `$$...$$` entre la apertura y la pregunta: ahí va la notación abstracta del objeto (regla 66).

**Registro abstracto en `LEXI`**, autorizado por la regla 43. En `CLSF` y `RESL`, lo que varía es la configuración de los vectores:

- **Dos vectores proporcionales en $\mathbb{R}^2$**: el caso base, resoluble a ojo.
- **Dos vectores no proporcionales**: el contraste inmediato.
- **Tres vectores en $\mathbb{R}^2$**: siempre dependientes, y el alumno tiene que poder decirlo sin calcular. Caso de alto valor.
- **Tres vectores en $\mathbb{R}^3$ con uno que es suma de los otros dos**: el caso donde la redundancia no se ve de una.
- **Un conjunto que contiene al vector nulo**: siempre dependiente, y es el descarte más barato.
- **Vectores con parámetro**: reservados para `RESL`.

Ninguna configuración supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Definición operativa | Creer que basta con encontrar **una** combinación que dé el nulo, sin notar que la trivial siempre existe y no prueba nada |
| Redundancia | Creer que el vector redundante es siempre el último que se escribió |
| Dependencia a ojo | No detectar que un conjunto con el vector nulo es dependiente en cualquier caso |
| Cantidad de vectores | Creer que tres vectores en $\mathbb{R}^2$ pueden ser independientes si apuntan a lados distintos |
| Independencia contra generación | Creer que un conjunto independiente genera automáticamente el espacio, mezclando las dos preguntas |
| Proporcionalidad | Comparar solo la primera componente y concluir que no son múltiplos |
| Determinante | Interpretar el determinante nulo como que el conjunto es independiente, invirtiendo el criterio |
| Parámetro crítico | Invertir el signo al despejar, o confundir el valor buscado con una de las componentes dadas |
| Combinación redundante | Cruzar los coeficientes entre los dos vectores que arman al tercero |
| Lectura de la escalonada | Contar las filas de la matriz original en vez de las no nulas de la escalonada |

---

## Reglas específicas del topic

- **Frontera con `dimension`** (regla 67): `hallar-el-parametro-que-vuelve-dependiente` responde con **el valor del parámetro**. La sub-familia gemela de `dimension` parte del mismo tipo de conjunto pero responde con **la dimensión** a cada lado de ese valor, que es otra pregunta. Ningún ítem de acá puede pedir una dimensión, que además todavía no existe para el alumno (regla crítica 31).
- **Notación**: los coeficientes son $\alpha_1, \alpha_2, \dots$, **nunca** $c_i$ ni $k_i$. Verificado contra UTN FRBA.
- **Las expresiones se escriben completas.** Prohibido abreviar "LI", "L.I.", "LD", "l.i." o "c.l.", aunque las cátedras lo hagan: en un enunciado leído en el celular una sigla cuesta más que la palabra.
- **Vectores de $\mathbb{R}^2$ y $\mathbb{R}^3$ con enteros de un dígito**, a lo sumo un signo negativo por ejercicio.
- **Preferir los casos que se deciden sin cuentas** cuando la sub-familia lo permite: un vector nulo en el conjunto, un vector repetido, más vectores que componentes. Son los que mejor entran en 90 segundos y los que más rinden pedagógicamente.
- **Las matrices escalonadas se dan ya escalonadas.** Ningún ítem pide llevar una matriz a esa forma encadenando operaciones (regla 55), misma regla que en `violet/matrices/systems` y en `generators`.
- **El determinante se puede usar como criterio**, porque viene de `violet/matrices/determinants`, pero **la explicación no puede quedarse en el determinante**: hay que decir por qué un determinante nulo significa que las direcciones colapsan, que es la lectura que `violet` ya instaló.
- **Prohibido nombrar base, dimensión o rango como dimensión**: son de topics posteriores (regla crítica 31). El rango se puede mencionar **solo** en su sentido operativo de `violet`, la cantidad de filas no nulas de la escalonada.
- **Prohibido decir que un conjunto independiente "es base de lo que genera"**, aunque sea cierto: `bases` todavía no existe.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que la combinación trivial no cuente es que existe siempre, para cualquier conjunto, y por lo tanto no distingue nada; la razón de que tres vectores en $\mathbb{R}^2$ sean siempre dependientes es que con dos ya se alcanza todo el plano, así que el tercero está necesariamente adentro de lo que los otros dos generan.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] La sub-familia `traducir-entre-las-dos-versiones` está presente y no fue podada
- [ ] Ningún ítem abrevia "LI", "LD" ni "c.l."
- [ ] Los coeficientes son $\alpha_i$, nunca $c_i$
- [ ] Ningún ítem menciona base ni dimensión, ni usa rango como dimensión (regla crítica 31)
- [ ] Ningún ítem pide ejecutar un escalonamiento de varios pasos encadenados
- [ ] Ninguna explicación se queda en "el determinante da cero" sin decir qué significa
- [ ] Al menos un tercio de `CLSF` se decide sin hacer cuentas
- [ ] Cada ítem de `LEXI` reintroduce la razón detrás de lo que pregunta (regla 44)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `LEXI`/`CLSF`, 4 en `RESL`
- [ ] Ninguna configuración supera ~30% de los ítems de su sub-familia
