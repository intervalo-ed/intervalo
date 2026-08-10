# Topic: Fracciones

Belt: `white`, Unit: `aritmetica`, Topic: `fracciones`

Skills en este topic: `LEXI`, `ESTR`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `ESTR`, `RESL`.

Concepto: una **fracción** $\frac{a}{b}$ representa una parte de un todo, una razón entre dos cantidades o un operador multiplicativo (multiplicar por $\frac{a}{b}$ escala una magnitud). Es el primer topic de la unidad, punto de partida del curso completo: no asume ningún cinturón ni topic anterior.

**Alcance deliberado**: no se repasa la mecánica elemental (sumar fracciones con denominador común, multiplicar/dividir término a término, convertir a decimal), porque un estudiante universitario ya la domina y repasarla es fricción sin valor. Este topic ataca los puntos donde incluso un alumno que "ya sabe fracciones" se traba: fracciones compuestas (fracción de fracción), el signo en sus tres formas equivalentes, comparar sin pasar a decimal, elegir cuándo simplificar, y la potencia negativa de una fracción.

**Nota de referencia editorial**: los contextos de este topic (y en general de la unidad `aritmetica`) están inspirados en un informe de investigación pedagógica encargado para esta ronda, que releva ejemplos de Adrián Paenza (*Matemática... ¿estás ahí?*), Jordan Ellenberg (*How Not to Be Wrong*), Steven Strogatz (*The Joy of x*) y la corriente de Educación Matemática Realista (Freudenthal). **Corrección de calibración aplicada tras revisar el informe**: varios ejemplos originales del informe eran demasiado técnicos (jerga específica de ciencias de la computación como clasificadores Naive Bayes, el estándar IEEE 754, MapReduce), lo cual excluye a estudiantes de otras carreras del curso (ingeniería, matemática). Los contextos de abajo están ya recalibrados a **registro "Paenza"**: físicos, concretos, cotidianos, entendibles sin formación previa de una carrera puntual, con a lo sumo un guiño STEM liviano nunca gatekeeper. Ver regla 43 de `authoring-context.md`.

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Identificar una fracción compuesta (numerador y/o denominador es a su vez una fracción) | 5 | `identificar-fraccion-compuesta` | Reconocer visualmente cuándo una expresión es una fracción de fracción, distinta de una fracción simple | Estructura $\dfrac{a/b}{c/d}$, distinguir de $\dfrac{a}{b}$ simple |
| Reconocer las formas equivalentes del signo en una fracción | 5 | `signo-equivalente` | Identificar que $-\frac{a}{b}$, $\frac{a}{-b}$ y $\frac{-a}{b}$ son la misma cantidad | Regla de signos del cociente, dónde puede "vivir" el signo negativo |
| Distinguir si una fracción está simplificada (MCD entre numerador y denominador) | 5 | `fraccion-simplificada` | Reconocer si numerador y denominador comparten un factor común, sin necesariamente calcularlo | MCD, factor común, noción de "fracción irreducible" |
| **Total** | **15** | | | |

---

## ESTR, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Elegir si simplificar antes o después de operar | 5 | `elegir-simplificar-antes-despues` | Decidir la estrategia que evita arrastrar números grandes en una cadena de operaciones con fracciones | Factor común entre términos no adyacentes, anticipar el costo de cada camino |
| Elegir método de comparación entre dos fracciones sin pasar a decimal | 5 | `elegir-metodo-comparacion` | Elegir entre producto cruzado, común denominador o comparación directa según la estructura de las fracciones dadas | Producto cruzado, denominador común, cuándo cada método es más directo |
| Elegir el orden de resolución en una fracción compuesta con varios niveles | 5 | `elegir-orden-fraccion-compuesta` | Decidir qué nivel de una fracción compuesta resolver primero para minimizar pasos | Jerarquía de resolución interna, identificar el nivel más profundo |
| **Total** | **15** | | | |

---

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Resolver una fracción compuesta hasta el resultado final | 5 | `resl-fraccion-compuesta` | Calcular completamente una fracción de fracción, simplificando al final | División de fracciones ("invertir y multiplicar" aplicado a nivel compuesto) |
| Resolver una operación combinada con fracciones de distinto signo | 5 | `resl-signos-combinados` | Operar una cadena corta de fracciones con signos mixtos sin perder ninguno en el camino | Regla de signos en suma/resta/producto de fracciones encadenadas |
| Calcular la potencia de una fracción, incluido exponente negativo | 5 | `resl-potencia-fraccion` | Calcular $\left(\frac{a}{b}\right)^n$ y, con exponente negativo, invertir la fracción antes de elevarla | $\left(\frac{a}{b}\right)^{-n} = \left(\frac{b}{a}\right)^n$, reintroducida en cada ejercicio que la usa (regla crítica 31) |
| **Total** | **15** | | | |

**Cardinalidad**: preferencia editorial de este topic, **4 opciones para prácticamente todo** (`LEXI`, `ESTR` y `RESL`), no el default de 3 para conceptual/textual del resto del curso. Cuando las 4 opciones de un ítem son fracciones cortas entre sí (`LEXI`/clasificación), usar `\dfrac{x}{y}` apilada en las 4 por altura uniforme (regla 20); cuando son textos/estrategias (`ESTR`) no aplica la restricción de ancho, van como lista. `RESL` sigue siendo numérico corto → 4 opciones de barra `x/y`, ancho ≤12 en grilla 2×2.

**Nota de orden (self-contained por diseño)**: `Fracciones` es el primer topic de la unidad, antes de `Potenciación`. La sub-familia `resl-potencia-fraccion` no asume que el alumno ya vio la tabla formal de propiedades de la potenciación: cada ejercicio reintroduce la regla del exponente negativo desde cero (regla crítica 31), apoyándose solo en la noción pre-universitaria de "elevar a una potencia" como multiplicación repetida, que el alumno ya trae.

---

## Contextos variados

**Registro Paenza, no jerga técnica de nicho** (ver nota editorial arriba). Preferir siempre lo físico y cotidiano; el guiño STEM es condimento, no requisito para entender el enunciado.

- **Fracción de fracción**: repartir un tanque de agua o un lote de mercadería en etapas sucesivas (se usa una fracción del total para una cosa, y de lo que queda se aparta otra fracción para otra). De una producción de piezas se separa una fracción para control de calidad, y de esa muestra se separa otra fracción para un ensayo puntual.
- **Comparación sin decimales**: dos recetas de cocina con distinta proporción de un ingrediente (¿cuál lleva relativamente más azúcar?), dos mezclas o aleaciones con distinta concentración, dos descuentos fraccionarios en una oferta.
- **Fracciones negativas**: variación de temperatura a lo largo del día, saldo de una cuenta corriente tras un depósito y un retiro, cambio en el nivel de un tanque o represa, diferencia de tiempo entre dos trayectos (uno más rápido, uno más lento) expresada como fracción de hora.
- **Potencia negativa de una fracción**: la altura de rebote de una pelota que en cada rebote conserva solo una fracción de la altura anterior (preguntar la altura inicial conociendo la de varios rebotes después, "yendo hacia atrás"); la concentración de una tintura o de un café que se diluye a la mitad en cada paso; un medicamento cuyo efecto se reduce en una fracción constante cada cierto tiempo.
- **Elegir orden / simplificar antes o después**: repartir un pago o una herencia entre varios socios en fracciones sucesivas, un presupuesto que se reparte en capítulos y sub-capítulos.

Ningún experimento supera ~30% de los ítems de una misma sub-familia (misma regla que rige en el resto del curso).

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Fracción compuesta | Multiplicar numerador y denominador del nivel externo por separado en vez de aplicar "invertir y multiplicar" al nivel interno primero |
| Signo de una fracción | Creer que $\frac{a}{-b}$ y $\frac{-a}{b}$ son cantidades distintas, o que el signo negativo "no puede" estar en el denominador |
| Fracción simplificada | Confundir "no tiene factores comunes obvios" con "está simplificada", sin verificar el MCD real |
| Comparación sin decimal | Comparar solo numeradores o solo denominadores por separado, ignorando la relación entre ambos |
| Simplificar antes/después | Multiplicar todo primero y recién ahí buscar el factor común, arrastrando números innecesariamente grandes |
| Potencia negativa de fracción | Aplicar el exponente negativo solo al numerador o solo al denominador, en vez de invertir la fracción completa |
| Operación con signos combinados | Perder un signo negativo al pasar de un paso al siguiente en una cadena de operaciones |

---

## Reglas específicas del topic

- **Numeradores y denominadores enteros chicos** (2 a 12 en valor absoluto) para que el cálculo sea manejable a mano y de cabeza.
- **Todo resultado final va simplificado**, salvo que el ejercicio pida explícitamente identificar si algo está simplificado (sub-familia `fraccion-simplificada`, donde mostrar una fracción sin simplificar es el punto del ejercicio).
- **`RESL` siempre en contexto concreto** (ver tabla de arriba); `LEXI` y `ESTR` pueden quedar en abstracto por diseño (excepción intencional de la regla 43), salvo que un contexto aporte claridad sin alargar el enunciado.
- **Cada ejercicio reintroduce la fórmula o regla que usa** (regla crítica 31): especialmente crítico en `resl-potencia-fraccion` por la nota de orden de arriba.
- **Decimales con coma** si aparecen en algún resultado intermedio, notación rioplatense (ver `course-context.md`). Preferir que todo quede en fracción, evitar forzar una conversión a decimal salvo que el contexto lo pida (ej. comparar con una medida dada en decimal).
- **Excepción documentada a la regla 18 (fórmula central tejida inline)**: en este topic, casi todos los valores en juego son fracciones, así que una fracción-dato mencionada de paso en una oración (ej. "un descuento de $3/8$", "tarda $3/4$ de hora menos") **no** es "la fórmula central" que la regla 18 protege, es una cantidad más de la escena. El validador la marca como WARNING igual (heurística ciega al contexto): no hace falta aislar cada una en su propio `$$...$$`, eso rompería la prosa en una cadena de bloques ilegible. Reservar `$$...$$` para: la fracción compuesta cuando es el objeto literal de la pregunta, una identidad/regla general que se introduce por primera vez, y cualquier derivación de 2+ pasos.
- **Notación horizontal en prosa (regla 20 extendida, ver `authoring-context.md`)**: toda fracción simple mencionada al pasar en `question`, `feedback_*` o `explanation` usa barra `x/y`, nunca `\dfrac{x}{y}` apilada, que rompe el interlineado. `\dfrac` se reserva para bloques `$$...$$` aislados y para `options` cuando el set completo son fracciones cortas entre sí (regla 20). Una fracción compuesta mencionada en prosa (no en `$$...$$`) se escribe `(a/b)/c` con paréntesis, nunca apilada.

## Checklist del topic

- [ ] Ningún contexto exige conocimiento previo de una carrera puntual (registro Paenza, sin jerga de nicho)
- [ ] Todo numerador/denominador es entero, valor absoluto entre 2 y 12
- [ ] Todo resultado final está simplificado, salvo en `fraccion-simplificada`
- [ ] `resl-potencia-fraccion` reintroduce la regla del exponente negativo desde cero, sin asumir `Potenciación`
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: 4 opciones en `LEXI`/`ESTR`/`RESL` (preferencia de este topic); `RESL` y `LEXI`-fracciones ≤12 de ancho en grilla 2×2
- [ ] Fracciones simples en prosa (`question`/`feedback_*`/`explanation`) van en barra `x/y`, nunca `\dfrac` apilada fuera de un bloque `$$...$$`
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
