# Topic: Logaritmos

Belt: `white`, Unit: `aritmetica`, Topic: `logarithms`

Skills en este topic: `LEXI`, `FORM`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `FORM`, `RESL`.

Concepto: el **logaritmo** en base $b$ de un número $x$ es el exponente al que hay que elevar $b$ para obtener $x$: $\log_b(x) = y \iff b^y = x$. Cuarto topic de la unidad, después de `Radicales`: el logaritmo es la otra operación inversa de la potenciación (la raíz despeja la base, el logaritmo despeja el exponente), pero cada ejercicio reintroduce esta relación desde cero (regla crítica 31), sin asumir que el alumno recuerda las propiedades de potencia de otro ítem.

**Nota de referencia editorial, contextos STEM tipo Paenza**: el logaritmo es, de las operaciones de esta unidad, la que tiene la conexión más directa e intuitiva con escalas reales que el alumno ya conoce de nombre, aunque no las haya calculado nunca. Se usan cuatro anclas, elegidas por ser escalas logarítmicas genuinas (no un adorno narrativo sobre un cálculo cualquiera) y de cultura general, sin exigir formación previa de ninguna carrera puntual:

- **Escala de Richter (sismología)**: la magnitud de un sismo es $\log_{10}$ de la razón entre la energía liberada y un nivel de referencia. Es la escala logarítmica más citada fuera de un aula, y deja intuir de entrada por qué existen los logaritmos: comprimir números enormes en una escala manejable.
- **Decibeles (acústica)**: el nivel de un sonido también se mide con $\log_{10}$ de una razón de intensidades. Sirve especialmente para ilustrar la propiedad del producto (combinar dos fuentes o etapas de amplificación) y la de la potencia (repetir la misma amplificación varias veces seguidas).
- **pH (química)**: la escala de acidez es $-\log_{10}$ de la concentración de iones. Se menciona como referencia cultural en las notas, sin usarla como ancla de ningún ejercicio de esta ronda (el signo negativo agrega una capa que no aporta a lo que este topic quiere enseñar).
- **Cantidad de cifras de un número**: una curiosidad muy citada por Adrián Paenza es que el logaritmo en base $10$ de un número permite estimar cuántas cifras tiene sin escribirlo entero. Se documenta como contexto disponible para rondas futuras.

`LEXI` y `FORM` pueden quedar en abstracto por diseño (excepción intencional de la regla 43): ahí el objetivo es reconocer una definición o elegir una estrategia general, no aplicarla a un caso puntual. Aun así, sus `explanation` pueden sumar una nota breve con la escala real detrás del concepto, sin convertir la pregunta en un problema contextualizado. `RESL` sí va siempre anclado a Richter o decibeles (ver tabla de sub-familias).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Identificar base y argumento en una expresión logarítmica | 5 | `identificar-base-argumento` | Reconocer qué rol cumple cada número en $\log_b(x)$ | Vocabulario base/argumento, distinguir del resultado (el logaritmo en sí) |
| Reconocer para qué argumento un logaritmo no está definido | 5 | `reconocer-log-no-definido` | Identificar que el argumento de un logaritmo debe ser positivo | Dominio del logaritmo, paralelo con la raíz de índice par de un negativo (`Radicales`) |
| Razonar por qué es válida una propiedad de los logaritmos, no solo nombrarla | 5 | `reconocer-propiedad-de-logaritmos` | Dado un paso como $\log_2(8\cdot4)=\log_2(8)+\log_2(4)$, elegir la justificación intuitiva correcta (no el nombre de la propiedad): la conexión con la propiedad de potencias equivalente vista en Potenciación | Producto/cociente/potencia de logaritmos como traducción directa de la propiedad de potencias correspondiente; distractores que representan justificaciones plausibles pero falsas (coincidencia numérica puntual, regla inventada sin relación con potencias), no nombres de otras propiedades |
| **Total** | **15** | | | |

---

## FORM, 19 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Elegir qué propiedad corresponde aplicar primero en una expresión combinada | 5 | `elegir-propiedad-de-logaritmos-primero` | Decidir con qué parte de una expresión con producto y cociente dentro del argumento conviene empezar | Jerarquía de resolución cuando hay producto y cociente combinados dentro del logaritmo |
| Elegir cómo reescribir una ecuación logarítmica como potencia para despejar la incógnita | 5 | `elegir-reescritura-log-a-potencia` | Decidir la reescritura correcta ($\log_b(x)=y \to x=b^y$) frente a reescrituras plausibles pero erróneas | $\log_b(x)=y \iff b^y=x$, despejar el argumento a partir del logaritmo |
| Elegir aplicar la propiedad de la potencia antes de calcular | 5 | `elegir-propiedad-potencia` | Decidir que conviene aplicar $\log_b(x^n)=n\log_b(x)$ antes de calcular una potencia grande | $\log_b(x^n) = n\log_b(x)$, evitar calcular la potencia completa cuando el logaritmo simplifica antes |
| **Con tabla** (`table`, modo `cell`): la tabla traduce igualdades entre forma logarítmica y forma exponencial, y deja una celda vacía | 4 | `traduccion-desde-tabla` | Completar la traducción que falta, identificando qué papel cumple cada uno de los tres números en cada forma | $b^{n} = x \iff \log_{b}(x) = n$; base, argumento y valor del logaritmo contra base, resultado y exponente |
| **Total** | **19** | | | |

**`traduccion-desde-tabla` llena un hueco medido del topic.** Antes de esta ronda la dirección **exponencial → logarítmica** tenía **un solo ejercicio en los 45** del topic (`LEXI` #3); las otras cinco traducciones iban todas en la dirección contraria. Dos de estos cuatro ítems van de potencia a logaritmo, y dos al revés, así que la sub-familia queda equilibrada en los dos sentidos.

El formato viene de un precedente verificado: la **tabla de dos columnas `Forma logarítmica | Forma exponencial`** del cuadernillo de ingreso de UTN FRRQ. La celda vacía **no cae siempre en la última fila**, para que la tarea no se resuelva mirando solo el renglón de abajo.

---

## RESL, 17 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Calcular un logaritmo a partir de una razón de intensidad (escala de Richter) | 5 | `resl-escala-richter` | Calcular $\log_{10}$ de una razón dada hasta el resultado final | Definición de logaritmo como exponente, escala de Richter |
| Combinar la propiedad del producto para calcular un logaritmo de una amplificación en dos etapas distintas | 5 | `resl-propiedad-producto` | Calcular el logaritmo de un producto de dos factores distintos sumando sus logaritmos por separado | $\log_b(x\cdot y) = \log_b(x)+\log_b(y)$, escala de decibeles |
| Aplicar la propiedad de la potencia para calcular el logaritmo de una misma amplificación repetida varias veces | 5 | `resl-propiedad-potencia` | Calcular el logaritmo de una potencia multiplicando el logaritmo de la base por el exponente | $\log_b(x^n) = n\log_b(x)$, escala de decibeles con etapas idénticas |
| **Con tabla** (`table`, modo `cell`): la tabla desglosa por cuánto multiplica cada etapa y deja vacía la fila del resultado | 2 | `etapas-desde-tabla` | Combinar tres pasos leyendo el desglose, incluido uno que divide | Propiedad del producto con tres factores; un factor menor que $1$ aporta un logaritmo negativo, así que resta |
| **Total** | **17** | | | |

**El coeficiente $10$ de la escala de decibeles se aplica solo cuando el ítem lo pide, y eso es deliberado.** En `resl-propiedad-producto`, cuatro ítems preguntan directamente *"¿cuánto vale el $\log_{10}$ del factor total?"* y uno solo (#9) pide el nivel en decibeles con su $10\log_{10}$. No es una inconsistencia de la sub-familia: lo que se está ejercitando es la **propiedad del producto**, y los decibeles son el contexto que le da sentido físico, no la cuenta que se pide siempre. La prueba de que la distinción es contenido y no descuido está en el `feedback_incorrect` de #6, que diagnostica exactamente el error de aplicar el coeficiente cuando no corresponde: *"como si la fórmula llevara el coeficiente de decibeles, que acá no corresponde"*.

**Por eso no hay que "unificar" los cinco aplicando $10\log_{10}$ en todos.** Hacerlo destruiría ese distractor, volvería las cuatro respuestas múltiplos de $10$ (más fáciles de adivinar) y dejaría a #9 sin nada que lo distinga. La regla operativa: **el enunciado dice explícitamente cuál de las dos cantidades se pide**, y nunca se asume que "nivel en decibeles" y "logaritmo del factor" son lo mismo.

**Cardinalidad**: preferencia editorial de esta unidad (igual que `Fracciones`, `Potenciación` y `Radicales`), **4 opciones para prácticamente todo** (`LEXI`, `FORM` y `RESL`).

**Nota de orden (self-contained por diseño)**: `Logaritmos` viene después de `Radicales`, y comparte con `Potenciación` la relación $\log_b(x)=y \iff b^y=x$, pero ningún ejercicio asume que el alumno recuerda las propiedades de potencia de otro ítem: cada ejercicio reintroduce lo que necesita desde cero (regla crítica 31).

---

## Contextos variados

**Registro Paenza, con anclaje STEM real** (ver nota editorial arriba y regla 43 de `authoring-context.md`). `LEXI` y `FORM` pueden quedar en abstracto por diseño; `RESL` siempre en contexto concreto, anclado a Richter o decibeles según la sub-familia.

- **Escala de Richter**: la magnitud $M$ de un sismo se define como $\log_{10}$ de la razón entre su intensidad $I$ y una intensidad de referencia $I_0$: $M = \log_{10}(I/I_0)$. Usar razones que sean potencias exactas de $10$ (10, 100, 1000, etc.) para que el cálculo dé un número entero manejable.
- **Decibeles y amplificación de una señal**: el nivel de un sonido en decibeles también usa $\log_{10}$ de una razón de intensidades. Combinar dos etapas de amplificación con factores *distintos* (ej. $\times 100$ y $\times 1000$) ilustra la propiedad del producto; repetir la *misma* amplificación varias veces seguidas (ej. $\times 10$ en cada una de $4$ etapas idénticas) ilustra la propiedad de la potencia.
- **Notas disponibles para rondas futuras** (no usadas como ancla en esta ronda, documentadas para variar el contexto al escalar a 15 ejercicios por skill): pH de una solución ($-\log_{10}$ de la concentración de iones), cantidad de cifras de un número grande a partir de su logaritmo en base $10$.

Ningún experimento supera ~30% de los ítems de una misma sub-familia (misma regla que rige en el resto del curso).

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Base y argumento | Confundir la base del logaritmo con su resultado, o el argumento con el resultado |
| Logaritmo no definido | Pensar que un argumento negativo o cero puede tener logaritmo, ignorando la restricción de dominio |
| Propiedad aplicada en un paso dado | Confundir la propiedad del producto (suma) con la del cociente (resta) o con la de la potencia (multiplica por el exponente) |
| Propiedad primero en expresión combinada | Aplicar el cociente antes de simplificar un producto que aparece en el numerador o denominador del argumento |
| Reescritura de log a potencia | Despejar el argumento sumando o restando el logaritmo en vez de reescribir la ecuación como una potencia |
| Propiedad de la potencia | Calcular la potencia completa dentro del argumento en vez de aplicar $\log_b(x^n)=n\log_b(x)$ antes |
| Escala de Richter / decibeles | Sumar las razones de intensidad en vez de multiplicarlas antes de aplicar el logaritmo, o viceversa |

---

## Reglas específicas del topic

- **Bases enteras chicas** (por defecto 2, 3, 5 o 10) y **argumentos que sean potencias exactas de la base** para que el resultado sea siempre un entero manejable a mano. La condición que importa es la segunda: **otra base entera chica es admisible cuando el argumento sigue siendo una potencia exacta de ella y el ítem gana algo con esa base**. Caso vigente: `elegir-propiedad-potencia` usa 10, 2, 3, 5 y **7**, una base distinta por ítem, justamente para que la sub-familia no enseñe que la propiedad depende de la base; el resultado sigue siendo entero, que es lo que la regla protege. Fuera de ese caso, mantenerse en las cuatro por defecto.
- **`RESL` siempre en contexto concreto** (Richter o decibeles, ver tabla de arriba); `LEXI` y `FORM` pueden quedar en abstracto por diseño (excepción intencional de la regla 43), aunque su `explanation` puede sumar una nota breve con la escala real detrás del concepto.
- **Cada ejercicio reintroduce la fórmula o regla que usa** (regla crítica 31): especialmente crítico en `elegir-reescritura-log-a-potencia` y `resl-propiedad-potencia`.
- **Todo resultado final de `RESL` es un número entero**, salvo que una sub-familia futura lo diseñe explícitamente con decimales.
- **No usar base $10$ implícita**: siempre escribir $\log_{10}(...)$ con el subíndice explícito, nunca $\log(...)$ sin base, para no asumir una convención que el alumno todavía no vio formalizada.
- **Toda propiedad de logaritmos se justifica con su propiedad de potencias equivalente, nunca solo se declara y se aplica** (regla 44 reforzada, ver `authoring-context.md`): producto de logaritmos ↔ producto de potencias de igual base (suma exponentes), potencia de un logaritmo ↔ potencia de una potencia (multiplica exponentes). `LEXI`/`FORM` que nombran o eligen una propiedad reintroducen esta conexión en su `explanation`, no solo el resultado mecánico.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún contexto exige conocimiento previo de una carrera puntual (registro Paenza, sin jerga de nicho)
- [ ] Toda base entera chica con argumento que sea potencia exacta de esa base (por defecto 2, 3, 5 o 10; otra base solo si el ítem gana algo con ella y el resultado sigue siendo entero)
- [ ] Todo resultado final de `RESL` es un número entero
- [ ] `elegir-reescritura-log-a-potencia` y `resl-propiedad-potencia` reintroducen su regla desde cero, sin asumir que el alumno la recuerda de otro ejercicio
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: 4 opciones en `LEXI`/`FORM`/`RESL` (preferencia de esta unidad)
- [ ] Todo $\log_{10}$ lleva el subíndice explícito, nunca `\log` sin base
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
