# Topic: Bases

Belt: `brown`, Unit: `spaces`, Topic: `bases`

Skills en este topic: `LEXI`, `ESTR`, `RESL`. **Sin `CLSF`**: la clasificación "¿esto es base?" se reemplaza por `ESTR`, que es más rica y captura mejor lo que las guías realmente ejercitan, decidir **qué alcanza verificar** en vez de verificar todo. El ítem `CLSF` viejo se archivó en `backend/content/archive/algebra/brown/spaces/bases/CLSF.json`. **Sin `FORM`**: ningún topic de `spaces` la usa. **Sin `GRAF`**: se pospone.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `ESTR`, `RESL`.

Concepto: una **base** es un conjunto que genera todo el espacio y además es linealmente independiente, o sea que no falta ninguno y no sobra ninguno:
$$B = \{\vec{v}_1, \dots, \vec{v}_n\}$$
Quinto topic de la unidad, después de `definition`, `subspaces`, `generators` e `independence`: el alumno tiene las dos condiciones por separado y acá se juntan. Todavía no conoce `dimension` (regla crítica 31).

**Función dentro de la unidad**: es el **empaquetado**. La definición de base no informa nada nuevo, junta dos cosas que el alumno ya tiene, y ese es exactamente su valor: la doble condición es lo que hace que cada vector se escriba de una **única** manera, y esa unicidad es la que convierte a una base en un sistema de referencia utilizable. Es además el tipo de ejercicio más frecuente de las guías relevadas, 13 de 46 en la Práctica 1 de UBA FIUBA.

**Las coordenadas viven acá.** Son el pago concreto de todo lo anterior: recién con una base fija tiene sentido decir que un vector "es" una lista de números. La **matriz de cambio de base** queda fuera de esta ronda por exceder el techo de carga mental, decisión documentada en `course-context.md`.

**Nota de referencia editorial**: registro abstracto en `LEXI`. En `ESTR` y `RESL` los vectores son explícitos y se muestran escritos (regla 62).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Por qué hacen falta las dos condiciones | 5 | `por-que-las-dos-condiciones` | Entender que generar e independencia son preguntas distintas y que ninguna implica la otra | Conjunto que genera y sobra, conjunto independiente que no alcanza |
| Por qué la escritura en una base es única | 5 | `por-que-la-escritura-es-unica` | Entender que si hubiera dos escrituras distintas, restarlas daría una combinación nula no trivial | Unicidad como consecuencia de la independencia |
| Por qué la base canónica no es la única | 5 | `por-que-hay-muchas-bases` | Entender que el sistema de coordenadas es una elección y no una propiedad del espacio | $E_n$ como una base más, otras bases del mismo espacio |
| **Total** | **15** | | | |

## ESTR, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Qué alcanza verificar según la cantidad de vectores | 5 | `que-alcanza-verificar` | Reconocer que con la cantidad justa de vectores una sola condición implica la otra | Atajo con $n$ vectores en $\mathbb{R}^n$, por qué no vale con otra cantidad |
| Descartar sin verificar nada | 5 | `descartar-por-cantidad` | Usar la cantidad de vectores para descartar antes de calcular | Menos vectores que componentes, más vectores que componentes |
| Elegir el camino para hallar una base | 5 | `elegir-el-camino` | Decidir si conviene sacar vectores de un generador o agregar a un independiente | Reducir un generador, extender un independiente |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Hallar las coordenadas de un vector en una base | 5 | `hallar-las-coordenadas` | Plantear el sistema que da los coeficientes y resolverlo | $[\vec{v}]_B$, sistema de $2 \times 2$ con solución entera |
| Recuperar el vector desde sus coordenadas | 5 | `recuperar-el-vector` | Recorrer el camino inverso, armando la combinación con los coeficientes dados | Coordenadas como instrucciones, contraste con las componentes |
| Extraer una base de un conjunto generador | 5 | `extraer-una-base` | Sacar los vectores redundantes de un generador y quedarse con los que hacen falta | Descarte del múltiplo, base de una recta o un plano |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones en `LEXI` y `ESTR` (conceptuales). 4 opciones en `RESL`; los pares de coordenadas cortos entran en grilla 2×2, los conjuntos de vectores van en lista vertical.

---

## Contextos variados

**El registro abstracto es sobre el contexto narrativo, no sobre la notación.** Que un ítem no lleve una situación cotidiana no lo exime del bloque `$$...$$` entre la apertura y la pregunta: ahí va la notación abstracta del objeto (regla 66).

**Registro abstracto en `LEXI` y `ESTR`**, autorizado por la regla 43: la pregunta es sobre criterios y estrategias, no sobre un caso.

En `RESL` lo que varía es la base con la que se trabaja:

- **Bases de $\mathbb{R}^2$ distintas de la canónica**: $\{(1,1),(1,-1)\}$ es el caballito de batalla, porque los sistemas dan enteros. Otras: $\{(2,1),(1,1)\}$, $\{(1,0),(1,1)\}$.
- **La base canónica $E_2$ o $E_3$**: aparece como contraste, para que se vea que ahí las coordenadas coinciden con las componentes y que eso es una casualidad de esa base, no una regla.
- **Bases de un subespacio, no del espacio entero**: una recta o un plano por el origen dentro de $\mathbb{R}^3$. Es el caso que las guías más ejercitan y no puede quedar afuera.
- **Bases de $\mathbb{R}^3$**: solo cuando la cuenta se mantiene entera y corta.

Ninguna base supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Las dos condiciones | Creer que alcanza con que el conjunto genere, sin verificar que no sobre |
| Las dos condiciones, al revés | Creer que un conjunto independiente ya es base de todo el espacio, sin verificar que alcance |
| Cantidad de vectores | Creer que cualquier conjunto de tres vectores de $\mathbb{R}^3$ es base |
| Atajo con la cantidad justa | Aplicar el atajo a un conjunto de dos vectores en $\mathbb{R}^3$, donde no vale |
| Unicidad de la escritura | Creer que un vector puede escribirse de varias maneras en la misma base |
| Base canónica | Creer que es la única base posible, o que las coordenadas en cualquier base coinciden con las componentes |
| Coordenadas | Tomar las componentes del vector como si fueran sus coordenadas en la base dada, sin resolver el sistema |
| Coordenadas, orden | Cruzar los dos coeficientes entre sí |
| Recuperar el vector | Sumar las coordenadas a los vectores de la base en vez de multiplicarlos por ellas |
| Extraer una base | Sacar un vector que sí hacía falta, quedándose con un conjunto que ya no genera lo mismo |

---

## Reglas específicas del topic

- **Notación**: la base se escribe $B = \{\vec{v}_1, \dots, \vec{v}_n\}$ con comas; la base canónica es $E_n$ y **nunca** se la llama "versores canónicos"; las coordenadas se escriben $[\vec{v}]_B$. Verificado contra UTN FRBA y UBA FIUBA. Las cátedras distinguen la base ordenada con punto y coma, distinción que Intervalo **no** usa porque ningún ítem depende del orden de una manera que la exija.
- **Sistemas de $2 \times 2$ con solución entera** en `RESL` (regla 55). Las bases se eligen para que el despeje no produzca fracciones.
- **El atajo de `que-alcanza-verificar` se justifica, no se declara.** La razón de que con $n$ vectores independientes en $\mathbb{R}^n$ ya alcance es que no puede faltarle alcanzar ninguna dirección: si le faltara, se le podría agregar un vector más manteniendo la independencia, y eso daría más de $n$ vectores independientes en $\mathbb{R}^n$, que es imposible. **Ese argumento se escribe**, no se resume en "es una propiedad conocida".
- **Prohibido nombrar dimensión**: es el topic siguiente (regla crítica 31). El atajo se enuncia en términos de "la cantidad de componentes del espacio" o "$n$ vectores en $\mathbb{R}^n$", **nunca** como "tantos vectores como la dimensión".
- **Prohibida la matriz de cambio de base** y todo lo que dependa de ella, incluida la notación $C_{BC}$. Queda para una ronda futura.
- **Las coordenadas se presentan como instrucciones, no como una segunda identidad del vector**: $[\vec{v}]_B$ dice cuánto tomar de cada vector de la base, y por eso cambia si la base cambia aunque el vector sea el mismo. Esa lectura ya está instalada en `violet/matrices/definition` con la base canónica, y acá se generaliza.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que la escritura sea única es que dos escrituras distintas del mismo vector, restadas, producirían una combinación nula con algún coeficiente no nulo, y eso contradice la independencia.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún ítem menciona dimensión (regla crítica 31)
- [ ] Ningún ítem usa la matriz de cambio de base ni la notación $C_{BC}$
- [ ] La base canónica se nota $E_n$ y nunca se dice "versores"
- [ ] El atajo de la cantidad justa aparece justificado, no declarado
- [ ] `RESL` resuelve solo sistemas de $2 \times 2$ con solución entera
- [ ] Al menos un tercio de los ítems trabaja sobre una base de un subespacio, no del espacio entero
- [ ] Cada ítem de `LEXI` reintroduce la razón detrás de lo que pregunta (regla 44)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `LEXI`/`ESTR`, 4 en `RESL`
- [ ] Ninguna base supera ~30% de los ítems de su sub-familia
