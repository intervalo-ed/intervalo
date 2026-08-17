# Topic: Generadores

Belt: `brown`, Unit: `spaces`, Topic: `generators`

Skills en este topic: `LEXI`, `CLSF`, `RESL`. **Sin `FORM`**: ningún topic de `spaces` la usa. **Sin `GRAF`**: se pospone.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `CLSF`, `RESL`.

Concepto: el **conjunto generado** por unos vectores reúne todas sus combinaciones lineales, y describe hasta dónde se puede llegar con ellos:
$$\text{gen}\{\vec{v}_1, \dots, \vec{v}_k\} = V$$
Tercer topic de la unidad, después de `definition` y `subspaces`: el alumno ya sabe qué es un espacio y qué subconjuntos califican como subespacio. Todavía no conoce `independence`, `bases` ni `dimension` (regla crítica 31).

**Este topic absorbió el viejo topic `combinations`** (rediseño ago-2026). La razón es que la combinación lineal **ya se enseña en `violet/matrices/definition`**, con una sub-familia dedicada, de forma concreta y geométrica. Repetir la definición en `brown` no agrega nada. Lo que sí es nuevo acá es la **pregunta inversa**: dados unos vectores y un objetivo, ¿existe la combinación que lo alcanza? Y esa pregunta es exactamente el conjunto generado.

**Este topic pasó antes que `independence`** en el mismo rediseño. Las dos fuentes relevadas coinciden en el orden: primero el alcance, después la redundancia. La dependencia lineal solo tiene sentido como respuesta a "este vector no agranda el alcance", así que sin el alcance definido antes la definición queda flotando.

**Función dentro de la unidad**: es donde el alumno pasa de **reconocer** subespacios a **producirlos**. Hasta acá le daban un conjunto y decidía; ahora arma uno a partir de unos pocos vectores. Es también el primer lugar donde aparece la idea de que puede sobrar, que es el puente hacia el topic siguiente.

**Nota de referencia editorial**: registro abstracto en `LEXI`, autorizado por la regla 43. En `CLSF` y `RESL` el objeto son vectores explícitos de $\mathbb{R}^2$ o $\mathbb{R}^3$, que se muestran siempre escritos (regla 62).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Qué es el conjunto generado y por qué es infinito | 5 | `que-es-el-conjunto-generado` | Entender la diferencia entre el conjunto de vectores dado y el conjunto de todas sus combinaciones | $\{\vec{v}_1, \dots\}$ contra $\text{gen}\{\vec{v}_1, \dots\}$, finito contra infinito |
| Por qué el generado siempre es un subespacio | 5 | `por-que-el-generado-es-subespacio` | Entender que sumar o escalar combinaciones produce otra combinación, así que la clausura sale sola | Clausura del generado, el nulo con todos los coeficientes en cero |
| Por qué generar no es lo mismo que ser base | 5 | `generar-no-es-ser-base` | Entender que un conjunto generador puede tener vectores de más y seguir generando lo mismo | Redundancia sin pérdida de alcance, puente hacia independencia |
| **Total** | **15** | | | |

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Decidir si un conjunto genera el espacio | 5 | `decidir-si-genera` | Reconocer cuándo unos vectores alcanzan todo $\mathbb{R}^2$ o $\mathbb{R}^3$ y cuándo se quedan cortos | Cantidad mínima de vectores, vectores paralelos que no suman alcance |
| Identificar qué subespacio genera un conjunto | 5 | `identificar-que-genera` | Decir si lo generado es el origen, una recta, un plano o todo el espacio | Generado de un vector, de dos paralelos, de dos no paralelos |
| Reconocer dos conjuntos que generan lo mismo | 5 | `reconocer-generados-iguales` | Entender que conjuntos distintos pueden describir el mismo subespacio | Distintos generadores del mismo subespacio, cambio de descripción |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Decidir si un vector pertenece al generado | 5 | `decidir-pertenencia-al-generado` | Plantear la combinación como sistema y ver si tiene solución | Combinación lineal como sistema, compatibilidad |
| Hallar los coeficientes de la combinación | 5 | `hallar-los-coeficientes` | Resolver el sistema chico y dar los escalares que arman el vector | Sistema de $2 \times 2$ con solución entera |
| Hallar generadores del conjunto solución | 5 | `hallar-generadores-del-nulo` | Partir de un sistema homogéneo ya escalonado y leer los vectores que generan sus soluciones | $\text{Nul}(A)$ descripto por generadores, variable libre |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones en `LEXI` y `CLSF`. 4 opciones en `RESL`; los pares de coeficientes cortos entran en grilla 2×2, los conjuntos de vectores van en lista vertical.

---

## Contextos variados

**El registro abstracto es sobre el contexto narrativo, no sobre la notación.** Que un ítem no lleve una situación cotidiana no lo exime del bloque `$$...$$` entre la apertura y la pregunta: ahí va la notación abstracta del objeto (regla 66).

**Registro abstracto en `LEXI`** (regla 43, autorizado explícitamente acá): la pregunta es sobre una definición general y no hay caso concreto que mostrar sin trivializarla.

En `CLSF` y `RESL` lo que varía es la **configuración geométrica** de los vectores dados, y hay que repartirla:

- **Un solo vector**: genera una recta por el origen. El caso más simple y el que instala la lectura.
- **Dos vectores paralelos**: generan una recta, no un plano. Es el caso que más sorprende y el que mejor prepara `independence`.
- **Dos vectores no paralelos en $\mathbb{R}^2$**: generan todo el plano.
- **Dos vectores no paralelos en $\mathbb{R}^3$**: generan un plano por el origen, no todo el espacio.
- **Tres vectores en $\mathbb{R}^3$ con uno redundante**: generan un plano. El caso que hace visible que sobrar no es un error.
- **El vector nulo entre los generadores**: no agrega nada, y es un buen distractor.

Ningún configuración supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

Las dos primeras están documentadas en el apunte de cátedra de UBA FIUBA, con ejercicio dedicado y con un ejercicio de verdadero o falso respectivamente. No son inventadas.

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Conjunto contra generado | Confundir $\{\vec{v}_1, \vec{v}_2\}$, que tiene dos elementos, con $\text{gen}\{\vec{v}_1, \vec{v}_2\}$, que tiene infinitos |
| Generado de una intersección | Creer que el generado de la intersección es la intersección de los generados |
| Generar contra ser base | Creer que si un conjunto genera el espacio entonces no le sobra ningún vector |
| Cantidad de generadores | Creer que tres vectores en $\mathbb{R}^3$ siempre generan todo el espacio, sin mirar si uno es combinación de los otros |
| Vectores paralelos | Contar dos vectores paralelos como dos direcciones distintas y concluir que generan un plano |
| Generado en $\mathbb{R}^3$ | Creer que dos vectores no paralelos generan todo $\mathbb{R}^3$ |
| Vector nulo entre los generadores | Creer que agregarlo agranda el generado |
| Pertenencia al generado | Concluir que el vector no pertenece porque el sistema quedó feo, sin terminar de resolverlo |
| Coeficientes | Cruzar los coeficientes entre los dos vectores, o invertir el signo de uno |
| Generadores del conjunto solución | Dar la solución trivial como generador, o confundir los coeficientes de la matriz con las componentes de los generadores |

---

## Reglas específicas del topic

- **Frontera con `dimension`** (regla 67): `identificar-que-genera` responde con un **objeto geométrico** (el origen, una recta, un plano, todo el espacio). La versión numérica de esa misma pregunta, que responde con un número, es `calcular-dimension-del-generado` y pertenece a `dimension`.
- **Notación**: el conjunto generado se escribe $\text{gen}\{\vec{v}_1, \dots, \vec{v}_k\}$, **con llaves y sin paréntesis**. Verificado contra UTN FRBA y UBA FIUBA, que coinciden literalmente. **Prohibido** `span`, $\langle \cdot \rangle$ y "cápsula lineal".
- **Se dice "conjunto generador"**, no "sistema de generadores". Las dos cátedras relevadas usan la primera.
- **Vectores de $\mathbb{R}^2$ y $\mathbb{R}^3$ con enteros de un dígito**, y a lo sumo un signo negativo por ejercicio. El sistema que resuelve la pertenencia tiene que ser de $2 \times 2$ con solución entera (regla 55).
- **Los sistemas de `hallar-generadores-del-nulo` se dan ya escalonados.** Ningún ítem pide llevar una matriz a forma escalonada encadenando operaciones, misma regla que rige en `violet/matrices/systems`.
- **Prohibido nombrar independencia lineal, base o dimensión**: son topics posteriores (regla crítica 31). En particular, **no se puede explicar que dos vectores paralelos generan una recta diciendo que "son linealmente dependientes"**: la razón que corresponde acá es que uno es múltiplo del otro y por lo tanto no aporta ninguna dirección nueva.
- **$\text{Col}(A)$ se puede nombrar** como el subespacio generado por las columnas, y conviene hacerlo al menos en una sub-familia, porque conecta con la lectura de `violet/matrices/definition`: las columnas registran en qué se convierte cada dirección básica, así que su generado es el conjunto de destinos posibles. **Prohibido** llamarlo imagen, que es de `black`.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que el generado sea siempre un subespacio es que sumar dos combinaciones da otra combinación y escalar una también, así que la clausura se cumple por construcción; la razón de que generar no implique ser base es que agregar un vector que ya estaba alcanzado no cambia el conjunto de destinos.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] La notación es siempre $\text{gen}\{\dots\}$, con llaves, sin `span` ni $\langle \cdot \rangle$
- [ ] Se dice "conjunto generador", nunca "sistema de generadores"
- [ ] Ningún ítem menciona independencia lineal, base ni dimensión (regla crítica 31)
- [ ] Ningún ítem pide ejecutar un escalonamiento de varios pasos encadenados
- [ ] Los sistemas de pertenencia son de $2 \times 2$ con solución entera
- [ ] La distinción entre $\{\vec{v}_1, \vec{v}_2\}$ y $\text{gen}\{\vec{v}_1, \vec{v}_2\}$ aparece explícita en al menos una sub-familia
- [ ] Cada ítem de `LEXI` reintroduce la razón detrás de lo que pregunta (regla 44)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `LEXI`/`CLSF`, 4 en `RESL`
- [ ] Ninguna configuración geométrica supera ~30% de los ítems de su sub-familia
