# Topic: interpretacion (Qué mide una integral)

Belt: `brown`, Unit: `integrals`, Topic: `interpretacion`

Skills en este topic: `GRAF`, `ESTR`. **30 ejercicios cada uno (60 en total)** al cerrar el refactor.

**Estado.** Topic nuevo, creado en la ronda 3 (ago-2026). Va **segundo** en el cinturón, entre `definition` y `reglas`, y es el único de la unidad donde no se calcula nada. Su razón de ser: el resto del cinturón enseña a integrar, y ninguna de sus skills responde para qué sirve. El estudiante llega a `definite` sabiendo aplicar Barrow sin haber decidido nunca qué pregunta contesta una integral.

Acá se trabaja la integral como **acumulación**: el gráfico muestra un ritmo, el área mide lo acumulado, el signo dice en qué dirección, y una situación cotidiana concreta le da unidades a ese número. Ninguna técnica de integración, ningún resultado numérico.

Los `external_id` se generarán como `brown_interpretacion_graf_01…`, `brown_interpretacion_estr_01…`.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** todo el cinturón violet (derivadas completas, incluida la interpretación de la derivada como ritmo de cambio) y `definition` de integrales (anatomía de la notación, primitiva, familia de primitivas, linealidad, acondicionamiento algebraico previo).
- **Lo que está aprendiendo acá:** que $\int_a^b f$ **acumula** lo que $f$ mide por unidad de la variable; que el área bajo el gráfico es esa acumulación y que **computa con signo**; que el resultado tiene **unidades propias**, distintas de las del eje vertical, y que sale del producto entre alto y ancho; y que una integral se **plantea** a partir de una situación antes de resolverse.
- **Lo que NO sabe todavía:** la **tabla de integrales inmediatas**, **sustitución**, **partes**, la **regla de Barrow** y el Teorema Fundamental del Cálculo. No puede calcular ninguna primitiva más allá de lo que `definition` cubre.

### Regla dura

**Ningún ejercicio de este topic se resuelve calculando.** La integral se lee, se interpreta y se plantea; nunca se evalúa.

**Prohibido**:

- **Cualquier técnica de integración**: tabla, sustitución, partes. Todavía no se conocen.
- **Regla de Barrow y TFC**: son de `definite`. Acá la integral definida aparece solo como **notación a leer**, nunca como cálculo a ejecutar.
- **Respuestas numéricas obtenidas por el estudiante.** Los números que aparecen vienen dados en el enunciado, y la pregunta es qué significan. Ninguna opción es el resultado de una cuenta que el estudiante tenga que hacer, ni siquiera de una geométrica simple: calcular el valor del área es trabajo de `definite/GRAF`.
- **Áreas entre dos curvas**: el alcance es siempre **una función contra el eje horizontal**.
- **Sumas de Riemann** y su formalismo. La idea de acumulación se trabaja en palabras y en el gráfico, sin notación de sumatoria.
- **Contextos de nicho.** Ver la nota de contextos más abajo.

Los ejercicios que quiebren esta regla se descartan y se reescriben.

### Deslinde con `definite`

Los dos topics miran el mismo gráfico y preguntan cosas distintas. La frontera es **cualitativo contra cuantitativo**:

| | `interpretacion` | `definite` |
|---|---|---|
| Pregunta típica | Qué representa el área sombreada, qué dice su signo, en qué unidad queda | Cuánto vale la integral, qué pasa al invertir los límites |
| Respuesta | Una frase | Un número |
| Contexto | Siempre, es la mitad del ejercicio | En un subconjunto de ítems, decora un cálculo que existe igual sin él |
| Posición | Antes de las técnicas | Al final del cinturón |

Un ítem de este topic que pida el valor numérico del área está mal ubicado y va a `definite`. Un ítem de `definite` que pregunte qué significa el resultado sin pedir calcularlo está mal ubicado y viene acá.

### Contextos variados

Registro **Paenza** obligatorio, según la regla 43 de `authoring-context.md`: situaciones concretas que cualquier estudiante universitario entiende sin formación previa específica. El curso reúne ingeniería, computación, ciencia de datos y matemática, así que un contexto que exige vocabulario de una sola carrera excluye al resto.

Repertorio, con tope de repetición del 30% por skill: velocidad y distancia recorrida, caudal que entra o sale de un tanque, velocidad de descarga y datos acumulados, consumo eléctrico y energía, costo marginal y costo total, ritmo de crecimiento y crecimiento acumulado, medicamento que entra a la sangre.

**La unidad siempre se nombra en el enunciado**, tanto la del eje vertical como la del horizontal: "litros por minuto", "en minutos". Sin eso, la pregunta por las unidades del resultado no tiene respuesta y la interpretación queda en el aire. Montos en pesos con `\$`.

---

## Correcciones de formato transversales (los 2 skills)

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`, con enfoque **conceptual**: (a) qué mide el alto del gráfico y qué mide el ancho del tramo, (b) qué resulta de multiplicar esas dos cosas y acumularlas, (c) qué distingue la respuesta correcta de la confusión que el ítem apunta. Sin viñetas, **sin em-dash `—` (prohibido estricto)**, sin humor.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Segunda persona amable, sin arrancar con "Falta" ni "Olvidaste".
4. **Negrita en primera mención** de **acumulación**, **ritmo de cambio**, **área neta**. Nunca negritas dentro de `options`.
5. **Ortotipografía**: decimales con **coma**. Sin nombres propios. Montos con `\$`.
6. **`correct_index` variado**, no concentrado en un solo índice.
7. **La apertura no repite lo que la fórmula muestra ni nombra la respuesta** (reglas 51 y 57).

---

## GRAF, 30 ejercicios

### Qué evalúa

**Lectura cualitativa de un gráfico de ritmo.** El gráfico muestra a qué velocidad cambia algo; el área sombreada mide cuánto cambió en total. El estudiante decide qué representa esa área, qué significa su signo, en qué unidad queda y cómo se compara con la de otro tramo. Nunca cuánto vale.

### Cardinalidad

**Exactamente 3 opciones** por ejercicio. Todas las preguntas de este topic son conceptuales, así que no aparece la grilla 2×2 de cuatro opciones numéricas.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Qué mide el área sombreada | El gráfico muestra un ritmo y el sombreado marca un tramo. Qué cantidad representa esa área, en qué unidad queda, y qué dice el signo cuando la recta pasa por debajo del eje. Incluye la distinción entre lo acumulado y el valor final, que solo coinciden si el punto de partida es cero. | `que-mide-el-area-sombreada` | 10 |
| B. Acumulación y comparación | Lecturas relativas sobre el mismo gráfico: en qué tramo se acumuló más, en qué momento lo acumulado toca su valor más bajo, si un tramo entra sumando o restando al total, y la confusión entre que el ritmo suba y que la cantidad suba. | `acumulacion-y-comparacion` | 10 |
| C. Congelar el ritmo | Por qué alto por ancho funciona cuando el ritmo cambia (ronda 5, ver Ampliación). Se imagina el ritmo congelado en un valor, y se compara ese rectángulo contra la región real: con ritmo que baja, congelar al arranque sobra y congelar al final falta; con ritmo constante, coincide exacto; con tramos más cortos, la mentira de cada tramo se achica. Nunca se dibujan los rectángulos, se comparan mentalmente contra la región sombreada, y jamás aparece la notación de sumatoria. | `congelar-el-ritmo` | 5 |
| D. La velocidad del área | El alto de la recta es la velocidad a la que crece lo acumulado (ronda 5, ver Ampliación). Dónde crece más rápido el total, qué le pasa al acumulado cuando el ritmo baja pero sigue positivo, cuándo el acumulado toca su máximo (el cruce por cero bajando), y el caso constante donde el acumulado crece parejo. Es la semilla del TFC contada sin nombrarlo, sin primitivas y sin Barrow. | `la-velocidad-del-area` | 5 |

### `feedback_incorrect`, confusiones fuente

- **Confundir el alto con el área**: leer el valor de la función en un punto como si fuera lo acumulado. El alto es el ritmo instantáneo y el área es el total; tienen unidades distintas.
- **Confundir lo acumulado con el valor final**: dar "los litros que hay en el tanque" cuando el área mide "los litros que entraron". Los dos coinciden únicamente si el tanque arrancó vacío.
- **Ritmo que sube contra cantidad que sube**: con un ritmo negativo que se acerca a cero, el ritmo aumenta y la cantidad sigue bajando. Es la confusión más fuerte del topic y merece ítems propios.
- **Área geométrica contra integral**: sostener que un área no puede dar negativa. El área geométrica nunca es negativa; la integral computa **área neta** y sí lo es cuando la recta va por debajo del eje.
- **Integral cero leída como quietud**: interpretar que el objeto no se movió. Un resultado cero significa que lo que subió y lo que bajó se compensaron, no que no pasó nada.
- **Unidad del resultado copiada del eje vertical**: contestar "litros por minuto" cuando el resultado está en litros. La unidad del área sale del producto entre las del eje vertical y las del horizontal.
- **Tramo negativo contado como positivo**: sumar un tramo que está por debajo del eje. En el total entra restando.

### Reglas específicas

- **`graph_shade` en todos los ítems de sub-A** y en los de sub-B que hablen de un tramo puntual. El sombreado con signo pinta de un color lo que queda arriba del eje y de otro lo que queda abajo, así que la lectura de signos es visual y no hay que imaginarla.
- **No llamar curva a una recta.** Todas las funciones de este topic son rectas o constantes, así que el enunciado dice "la recta" o "el gráfico". Reporte del testeo de la sesión 450 sobre `GRAF#3`: *"acá no hay una curva sino una recta"*. La palabra *curva* queda reservada para enunciados genéricos que no describen un gráfico concreto.
- **Funciones analíticas simples**: rectas con pendiente $|m| \leq 3$ y constantes. El 1:1 es obligatorio en `analisis`, así que `graph_view` se elige **cuadrado**, con el mismo ancho que alto, y `graph_free_aspect` está prohibido.
- **El eje horizontal siempre queda visible dentro de `graph_view`**, incluso cuando la función es negativa en todo el tramo: sin el eje a la vista, el signo del área no se puede leer.
- **Una sola función contra el eje**. Nada de áreas entre curvas.
- **Ninguna opción es un número.** Las tres opciones son frases de largo parejo (regla 15).
- **El enunciado nombra las dos unidades** y describe la situación antes de mencionar el gráfico, siguiendo el orden que ya usa `probabilidad/distribuciones`.

---

## ESTR, 30 ejercicios

Se muestra en la app como **Planteo**.

### Qué evalúa

**Traducción entre una situación y la integral que la modela**, en los dos sentidos. De la situación a la integral: cuál es el integrando, cuáles son los límites, qué se integra y qué no. De la integral al significado: qué cantidad es ese número, con qué unidad, y qué información **no** contiene.

### Cardinalidad

**Exactamente 3 opciones** por ejercicio.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. De la situación a la integral | Elegir la integral que modela la situación descripta. Los tres ejes de decisión: **qué se integra** (el ritmo, no la cantidad, y nunca su derivada), **entre qué límites** (con las unidades del enunciado, que a veces no son las del intervalo dado), y **si hace falta sumar el valor inicial** para responder lo que se pregunta. | `de-la-situacion-a-la-integral` | 10 |
| B. Del número a su significado | Dada una integral en contexto y su valor, decidir qué afirma ese número. Distinguir lo acumulado del valor final, del promedio y del valor instantáneo al cierre del intervalo. Incluye el caso del resultado negativo y el del resultado cero. | `del-numero-a-su-significado` | 10 |
| C. Leer la notación | La escritura $\int_a^b f(t)\,dt$ leída como una oración (ronda 5, ver Ampliación): el bloque $f(t)\,dt$ es un producto con unidades, el aporte de un ratito; los límites son la ventana de la acumulación, en la unidad de la variable; el símbolo es una S estirada que viene de suma; y la variable interna se consume al sumar, así que el resultado es un número y no una función. Siempre en contexto, con la función nombrada por letra y unidad. | `leer-la-notacion` | 10 |

### `feedback_incorrect`, confusiones fuente

- **Integrar la cantidad en vez del ritmo**: dado $h(t)$ la altura, plantear $\int h$ para responder cuánto subió. Lo que se acumula es la **derivada**, el ritmo; integrar la altura no responde ninguna pregunta del enunciado.
- **Derivar de más**: plantear $\int f'$ cuando $f$ ya es el ritmo. Un solo escalón separa el ritmo de la cantidad, no dos.
- **Límites en la unidad equivocada**: con la variable en segundos, escribir $\int_0^1$ para "el primer minuto". Los límites se escriben en la unidad de la variable de integración.
- **Olvidar el valor inicial**: contestar con la integral sola cuando la pregunta pide el valor final y el punto de partida no era cero. La integral da el **cambio**; el valor final es el inicial más ese cambio.
- **Leer lo acumulado como promedio**: interpretar un resultado de $120$ con la velocidad en kilómetros por hora como "su velocidad promedio fue $120$". El promedio sería ese número dividido por el ancho del intervalo.
- **Leer lo acumulado como valor instantáneo final**: interpretar el total como el valor que la función toma al cerrar el intervalo.
- **Rechazar el resultado negativo**: sostener que hay un error de medición. El signo informa la dirección del cambio.

### Reglas específicas

- **Las opciones son integrales candidatas o frases de significado, nunca resultados numéricos** (regla 54, misma lógica que las `CLSF` de la unidad).
- **En sub-A al menos una opción por ítem es una expresión que no es una integral**, del tipo $f(b)-f(a)$ o $f(b)$, para que la decisión no se reduzca a comparar subíndices.
- **En sub-B el valor del número viene dado en el enunciado.** El estudiante nunca lo calcula.
- **La función se nombra con una letra y su unidad**, sin darle fórmula: acá no hay nada para evaluar, y una fórmula concreta invita a intentar resolver.
- **Las tres opciones de largo parejo** (regla 15). Es la trampa más fácil de caer en esta skill, porque la interpretación correcta tiende a necesitar más palabras que las incorrectas.

---

## Ampliación (ronda 5, ago-2026): sub-familias Essence of Calculus

Tres sub-familias nuevas inspiradas en la serie **Essence of Calculus** de 3Blue1Brown (capítulos 1, 8 y 9), pedidas para darle al estudiante momentos de comprensión genuina, no más práctica del mismo corte. Cada una entra dentro del target de 30 por skill, recuoteando las tablas.

**`congelar-el-ritmo` (GRAF, capítulos 1 y 8).** El hueco que cubre: el topic afirmaba que "el área acumula" pero el estudiante nunca confrontaba **por qué** eso se justifica cuando el ritmo varía. La familia trabaja la aproximación por ritmo congelado sin dibujar rectángulos (el renderer traza una función y un sombreado, nada más): el rectángulo se imagina y se compara contra la región sombreada visible. La sub-familia respeta al pie la regla dura existente: la idea de rebanar se cuenta en palabras y gráfico, la notación de sumatoria sigue prohibida.

**`la-velocidad-del-area` (GRAF, capítulo 8).** La revelación central de la serie, en versión cualitativa: el alto de la recta es la velocidad a la que engorda el área. Prepara el terreno para que Barrow, en `definite`, resulte casi obvio. Límites estrictos: no se nombra el TFC, no se nombra la primitiva, no se calcula nada. El ítem existente del mínimo en el cruce (sub-B) es pariente de esta familia y se queda donde está.

**`leer-la-notacion` (ESTR, capítulo 8).** La notación leída como oración: S estirada de suma, $f(t)\,dt$ como producto con unidades, límites como ventana, variable interna que se consume.

**Advertencia de coherencia con `definition`, obligatoria al escribir esta familia.** `definition/LEXI` enseña que $dx$ marca la variable de integración y advierte contra tratarlo como un número que se cancela. La lectura de acumulación dice que $f(t)\,dt$ **sí** es un producto. Las dos lecturas son correctas y conviven, pero servidas en orden aleatorio pueden chocar: por eso, todo ítem de esta familia que lea el diferencial como ancho **debe puentear explícitamente en su explicación** ("en la indefinida marca la variable; leído como acumulación, además es el ancho del ratito"), y ninguna puede validar la idea de que el diferencial se simplifica algebraicamente. El feedback de `definition/LEXI` se ajustó en espejo: el error señalado ahí es tratarlo como *un número suelto que se cancela*, no leerlo como ancho.

**Considerado y aparcado**: el valor promedio como "aplanar la curva" (capítulo 9). El rectángulo de igual área no se puede dibujar con el renderer actual, y la versión sin gráfico exige dividir total por ancho, que viola la regla dura de este topic. Queda anotado como candidato para el backfill de `definite`.

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 2 skills):**
- [ ] `feedback_incorrect` completo: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] **Ningún ítem se resuelve calculando**, ni siquiera un área geométrica simple
- [ ] Ninguna mención de tabla de integrales, sustitución, partes, Barrow ni TFC
- [ ] Todas las unidades nombradas en el enunciado, las del eje vertical y las del horizontal
- [ ] Contextos en registro Paenza, sin vocabulario de una sola carrera; tope de repetición del 30% por skill
- [ ] Explicaciones en 3 párrafos de prosa; sin viñetas, sin em-dash, sin humor
- [ ] `correct_index` variado; decimales con coma; montos con `\$`
- [ ] La apertura no repite lo que la fórmula o el gráfico ya muestran, ni nombra la respuesta

**GRAF:**
- [ ] 30 ejercicios; **exactamente 3 opciones** por ejercicio
- [ ] Distribución A/B/C/D respetada (10/10/5/5)
- [ ] `congelar-el-ritmo`: ningún rectángulo dibujado, ninguna sumatoria; el rectángulo se imagina contra la región sombreada
- [ ] `la-velocidad-del-area`: sin TFC, sin primitivas, sin Barrow; solo lectura del alto como velocidad del acumulado
- [ ] `graph_shade` presente en todo ítem que hable de un tramo
- [ ] `graph_view` cuadrado, mismo ancho que alto; sin `graph_free_aspect`; pendientes $|m| \leq 3$
- [ ] El eje horizontal visible en todos los gráficos, incluidos los de función negativa
- [ ] Ninguna opción es un número
- [ ] Al menos algunos ítems apuntan a la confusión entre ritmo que sube y cantidad que sube

**ESTR:**
- [ ] 30 ejercicios; **exactamente 3 opciones** por ejercicio
- [ ] Distribución A/B/C respetada (10/10/10)
- [ ] `leer-la-notacion`: toda lectura del diferencial como ancho lleva el puente con la lectura de `definition` en la explicación
- [ ] En sub-A, al menos una opción por ítem no es una integral
- [ ] En sub-B, el valor numérico siempre viene dado en el enunciado
- [ ] Ninguna función se define por fórmula, solo por letra y unidad
- [ ] Al menos algunos ítems cubren el valor inicial que hay que sumar, y al menos uno el resultado negativo
