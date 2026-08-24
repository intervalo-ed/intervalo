# Topic: Definición de función

Belt: `white`, Unit: `functions`, Topic: `definition`

Skills en este topic: `LEXI`, `CLSF`.

Este topic tiene 2 ítems (uno por skill): `LEXI`, `CLSF`.

## Hallazgos de auditoría (ronda 1, 13/7)

Revisión manual ejercicio por ejercicio vía `/test`. Los siguientes son ejemplos concretos de violaciones a `authoring-context.md` (terminología, vocabulario prohibido, notación de opciones, cortes de oración) encontradas en el contenido actual. **Todo el topic** (no solo los ejercicios citados) debe revisarse contra estas reglas al refactorizar, no únicamente los `external_id` listados abajo:

- **`white_definition_LEXI_39`**: la opción `"Cualquier precio entre 1000 y 2000"` está en prosa libre mientras el resto de las opciones son notación de conjunto (`$\{1000, 2000\}$`, etc.) — reescribir en notación equivalente (ej. `$[1000, 2000]$`) o un distractor conceptual distinto que mantenga el registro simbólico. La `explanation` de este ejercicio usaba "escupir" (prohibido) y tenía dos oraciones juntas en el párrafo de cierre sin separar (ver regla de "un párrafo, una oración").
- **`white_definition_CLSF_23`**: la opción `"Todos los reales"` rompe el registro simbólico frente a `$a \geq 0$`, `$a \neq 0$`, `$a > 100$` — reemplazar por `$\mathbb{R}$`. La `question` decía "regla" en vez de "función".
- **`white_definition_LEXI_36`**: la `explanation` usaba "fabricar" (prohibido) — reemplazar por "se define".
- **`white_definition_CLSF_30`**: `question` decía "regla" en vez de "función".
- **`white_definition_LEXI_25`**: el enunciado dejaba la oración abierta antes de la fórmula display en vez de cerrar con punto (ver regla "nunca cortar una oración a la mitad para insertar una fórmula") y usaba la expresión "regla matemática" (prohibida, usar "función").
- **`white_definition_CLSF_35`**: la `explanation` cerraba con "es un error habitual" — reemplazar por "una confusión común" / "un error común" (tono empático, no clínico).
- **`white_definition_LEXI_43`**: usaba "salida matemática" (prohibido) — usar "función" o simplemente "salida".
- **`white_definition_LEXI_15`**: usaba "procesa valores" y "regla" (ambos prohibidos) — usar "la función transforma [entradas] en [salidas]".
- **`white_definition_LEXI_30`**: la `explanation` usaba "aterrizan" (prohibido, metáfora informal) — reformular sin metáfora.
- **`white_definition_CLSF_43`**: distractores flojos ("imagen garantizada", "salidas declaradas por el modelo") y la función descrita como si fuera un actor en vez de una herramienta — revisar tono en toda `explanation` del topic: la función no "hace" cosas por sí misma, es un objeto que se aplica.
- **`white_definition_CLSF_34`**: la opción `"El conjunto de alumnos"` en prosa libre rompe el registro de conjunto (`$\{0, 1\}$`, `$\{2, 3, \dots, 10\}$`) frente al resto — usar notación de conjunto equivalente (`$\{\text{alumnos}\}$`) en vez de descripción textual.

**Regla transversal para el refactor:** revisar los 60 ejercicios (30 LEXI + 30 CLSF) contra `authoring-context.md` actualizado — terminología "función" (nunca "regla"), vocabulario prohibido (ver tabla en authoring-context.md), notación consistente dentro de cada `options`, ninguna oración cortada a la mitad por una fórmula display, y un párrafo por oración en `explanation`.

---

## LEXI, 30 ejercicios

### Distribución objetivo

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

| Concepto | Sub-tipo | Slug | Cantidad exacta |
|----------|----------|------|----------------:|
| Dominio | conjunto explícito o natural | `dominio` | 7 |
| Variable independiente / dependiente |, | `variable-indep-dep` | 6 |
| Imagen | como conjunto (¿cuál es el conjunto imagen?) | `imagen-conjunto` | 5 |
| Imagen | puntual (respecto de $x$, ¿qué es $f(x)$?) | `imagen-puntual` | 2 |
| Codominio |, | `codominio` | 6 |
| Preimagen | como cálculo (¿qué entradas dan $y$?) | `preimagen-calculo` | 3 |
| Preimagen | puntual (respecto de $f(x)=y$, ¿qué rol cumple $x$?) | `preimagen-puntual` | 1 |
| **Total** | | | **30** |

> **Unicidad salió de LEXI (ago-2026, junto con el archivado en CLSF).** Los 2 ítems de `unicidad` (cajero y termómetro) se **reemplazaron** por 2 de `codominio`, que pasó de 4 a 6. LEXI se mantiene en 30. El motivo: al archivarse el bloque de unicidad de CLSF, esos 2 quedaban enseñando un concepto que ningún otro ejercicio del topic reforzaba. Se eligió `codominio` como reemplazo porque era la cobertura más fina tras el archivado y porque codominio↔imagen es la confusión que la tabla de confusiones de abajo ya declara como central.

**Cantidades exactas, no aproximadas.** La Gem debe respetar exactamente estos números; no más ejercicios de imagen "porque salieron mejor".

**No hay bucket "contexto general".** Cada ejercicio debe encajar en uno de los conceptos de arriba. Si un ejercicio no encaja en ninguno, es porque no pertenece a este skill, descartalo, no lo forces.

**Sub-tipos de imagen y preimagen:**
- *Imagen como conjunto*: "Tomás $\{-2, -1, 0, 1, 2\}$ y elevás al cuadrado. ¿Cuál es el conjunto imagen?"
- *Imagen puntual*: "$f(x) = 2x$, $f(6) = 12$. Respecto del 6, ¿qué es el 12?", vocabulario de imagen aplicado a un caso puntual.
- *Preimagen como cálculo*: "$f(x) = x^2$. ¿Cuáles son las preimágenes de 9?"
- *Preimagen puntual*: "$V(x) = x^3$, $V(4) = 64$. Respecto de 64, ¿qué es el 4?", vocabulario de preimagen aplicado a un caso puntual.

Imagen, codominio y preimagen deben estar balanceados entre sí. Los ejercicios de estos tres conceptos son **cuantitativos y lógicos**: el alumno identifica el conjunto concreto, calcula las preimágenes de un valor, o distingue entre lo que la función "promete" (codominio) y lo que realmente produce (imagen). No generar ejercicios que sean puramente de vocabulario en abstracto ("¿qué es la imagen?").

### Unicidad: fuera del topic (ago-2026)

**El cupo de unicidad es 0, y no se repone.** Existía un cupo estricto de 2 ejercicios (cajero automático y termómetro) que era "obligatorio, no negociable"; esa regla queda derogada. El criterio de unicidad salió del curso entero: el bloque de CLSF se archivó y estos 2 de LEXI se reemplazaron por `codominio`.

No agregar ejercicios de "¿es función o no?", ni de "¿qué garantía te da la unicidad?", ni contextos del tipo app con dos precios o GPS con dos rutas. Si alguna ronda futura reabre el tema, es una decisión de producto que tiene que tomarse explícita, no un hueco a rellenar.

### Cardinalidad

Regla operativa por **tipo de respuesta** (ver `authoring-context.md`), no por skill:

- **Conceptual/textual** (nombrar el concepto, describirlo): **3 opciones**. Es el caso mayoritario de LEXI/definition.
- **Numérica corta** (un número, un conjunto chico, una preimagen calculada): **4 opciones**, todas ≤35 caracteres, para triggear la grilla 2×2 del front.
- **Binario (2 opciones)**: **excepcional**, ≤ 3 ejercicios en todo el archivo. Casi siempre hay una tercera confusión clásica que convierte un sí/no en una pregunta de 3. No usar binario como recurso por defecto: en masa la sesión se vuelve un juego de moneda.

Meta de distribución para las 30 LEXI: la mayoría en 3 opciones, los ejercicios de respuesta numérica en 4, prácticamente ningún binario.

### `feedback_incorrect`

Requerido. Array del mismo largo que `options`, `null` en `correct_index`. 1 oración por distractor.

**Confusiones típicas por concepto.** La columna derecha describe la confusión que origina el distractor, **no es el texto literal del `feedback_incorrect`**. Al redactar la pista, traducila a voz descriptiva del concepto o segunda persona amable con tuteo. **Nunca** arranques con "Confunde…", "Invierte…", "Olvida…" (ver `authoring-context.md` §Pistas de feedback_incorrect y Constraint 15). Ejemplo de traducción en la última columna.

| Concepto preguntado | Confusión que origina el distractor | Ejemplo de pista (voz correcta) |
|---------------------|-------------------------------------|---------------------------------|
| Dominio | dominio tomado como imagen, como codominio, o como la fórmula | "Ese es el conjunto de salidas, no las entradas que la regla procesa." |
| Imagen | imagen tomada como codominio (lo declarado vs. lo realmente alcanzado), o como dominio | "Ese es el conjunto declarado de llegada; la imagen son solo los valores que la función realmente toma." |
| Codominio | codominio tomado como imagen | "Esos son los valores efectivamente alcanzados (la imagen); el codominio es el conjunto declarado de salidas posibles." |
| Preimagen de k | preimagen tomada como f(k), o como codominio restringido | "Ese es el valor que sale al evaluar en k; la preimagen es lo que entra para obtener k." |
| Variable independiente | entrada y salida intercambiadas | "La variable independiente es la que elegís libremente, la entrada; la otra sale de aplicar la regla." |
| Variable dependiente | entrada y salida intercambiadas | "Esa es la que elegís libremente; la dependiente es la que resulta de aplicar la regla." |

### Reglas específicas de este topic

**Negrita en primera mención.** En `question` y `explanation`, envolver en `**negrita**` la primera aparición de: `**dominio**`, `**imagen**`, `**codominio**`, `**preimagen**`, `**unicidad**` (y variantes como "único", "una sola salida" cuando refieren al concepto de unicidad). Solo la primera mención por campo, no repetir.

**Sin pistas delatoras.** Si la opción correcta necesita una glosa para ser inequívoca, dar una glosa equivalente a TODAS las opciones, no solo a la correcta. Si ninguna la necesita, ninguna la lleva.

**Variedad de apertura en `explanation`.** Alternar entre:
- Definición formal: "El **dominio** es el conjunto de entradas que la regla transforma."
- Pregunta retórica: "¿Qué conjunto le 'entra' a la función? Eso es el **dominio**."
- Contraejemplo: "¿Qué pasaría si el **dominio** incluyera un valor que la regla no puede procesar? La función estaría indefinida ahí."

No repetir la misma estructura de apertura en ejercicios consecutivos del mismo concepto.

**Cierre de la `explanation`.** Por defecto, la tercera parte es una **advertencia sobre la confusión típica** del concepto o un **consejo práctico**, en voz neutra, y solo cuando aporta:
- Dominio: "No lo confundas con la imagen: el dominio son las entradas, no las salidas."
- Imagen vs. codominio: "El codominio es lo que la función podría alcanzar; la imagen, lo que realmente alcanza."
- Preimagen: "Preimagen de $k$ no es $f(k)$: es qué entrada produce $k$, no qué produce $k$."
- Codominio declarado vs. alcanzado: "Que la función no use todos los valores declarados no achica el codominio; eso solo describe su imagen."

El **humor es excepcional** (una minoría de los 30 ejercicios) y solo como **analogía cotidiana exagerada** en tono formal, del tipo escena burocrática o consecuencia práctica absurda ("Un registro que le asigna dos expedientes al mismo trámite no tiene un error de tipeo: tiene un problema de unicidad."). **Nunca antropomorfismos** ("la raíz detesta los negativos") ni chistes externos. Si no hay advertencia pertinente ni analogía que cierre bien, terminá en la aplicación.

**Contextos cotidianos válidos.** Precios de productos, notas de alumnos, tarifas de transporte, temperaturas, puntos de fidelidad, asignación de turnos o lockers, cantidades de bochas/porciones, consumo de datos. Sin nombres propios, usar roles genéricos ("un vendedor", "una empresa", "un remis", "un colegio").

---

## CLSF, 21 ejercicios

### Distribución objetivo

**CLSF es el skill de aplicación: identificar y calcular sobre casos concretos.** Se apoya en el vocabulario que LEXI define y lo pone a trabajar. Todo el skill es de **identificación**: calcular o distinguir el conjunto concreto en un caso dado (cuál es el dominio de esta $f$, cuál es su conjunto imagen, qué valores excluye el dominio natural, cuáles son las preimágenes de $k$).

> **El bloque de unicidad se archivó (ago-2026, feedback de testeo 485).** Las dos sub-familias que preguntaban "¿esta asignación define una función?" —`unicidad-rota-disfrazada` (4) y `trampa-inyectividad` (5)— salieron del curso por decisión de producto: **el criterio de unicidad dejó de considerarse relevante para el alumno de esta unidad.** Los 9 ítems están en `backend/content/archive/analisis/white/functions/definition/CLSF.json` con su `id` original preservado, así que esos ids quedan quemados y no se reusan (la asignación de ids nuevos es `max(sufijos)+1`, nunca el primer hueco libre). CLSF pasó de 30 a 21 y **no hay que reponer los 9**: el objetivo del skill es 21.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

| Categoría | Slug | Cantidad |
|-----------|------|----------|
| **Dominio**: identificar el conjunto de entradas en un caso concreto | `dominio-identificacion` | 4 |
| **Dominio natural**: restricción algebraica (división, raíz, combinadas) | `dominio-natural` | 6 |
| **Imagen / conjunto imagen**: salidas alcanzadas vs. codominio | `imagen-identificacion` | 5 |
| **Codominio**: distinguir del conjunto imagen | `codominio-identificacion` | 2 |
| **Preimagen**: calcular preimágenes / distinguir de la imagen | `preimagen-identificacion` | 4 |
| **Total** | | **21** |

**No duplicar LEXI.** El límite: **LEXI define/reconoce el término** ("¿qué es el dominio?", "¿qué representa este conjunto?"), en general 2-3 opciones y registro definicional. **CLSF identifica o calcula el conjunto concreto** ("¿cuál es el dominio de esta $f$?", "¿cuáles son las preimágenes del 0?"), computacional. Si un ejercicio se resuelve solo sabiendo la definición sin mirar el caso, es LEXI, no CLSF.

**Fuera de alcance de `white`.** No incluir inyectiva/sobreyectiva/biyectiva como clasificación explícita (se agenda para un topic posterior con codominio bien trabajado).

### Cardinalidad

- **Identificación**: **4 opciones**, cuando hay 4 confusiones genuinamente distintas (p. ej. dominio ↔ imagen ↔ codominio + una espuria). Si solo hay 3 confusiones reales, usá 3 y no rellenes con un absurdo delator.
- **Layout:** con 3 opciones el front usa lista vertical; la grilla 2×2 se activa solo con exactamente 4 opciones, todas ≤35 caracteres (ver `session-runner.tsx`). No fuerces el largo para "caer en grilla".

### `feedback_incorrect` para CLSF

Array paralelo a `options`, `null` en el índice correcto, mismo largo que `options`. Voz descriptiva del concepto, nunca acusatoria ("confunde X con Y" está prohibido).

**En identificación:** cada distractor nombra qué conjunto se agarró en su lugar ("Ese es el codominio, las salidas posibles, no las efectivamente alcanzadas."; "Ese es el conjunto de salidas; el dominio son las entradas."; "El 600 es lo que se reparte, no una cota inferior para las personas.").

### Reglas específicas para CLSF

**Identificar sobre el caso, no recitar la definición.** Todo ejercicio de identificación debe obligar a mirar los datos concretos (el conjunto, la fórmula, la restricción) para responder; si se contesta de memoria con la definición, movelo a LEXI.

**Dominio natural: una sola restricción por ítem, nunca combinada.** *(Corregido tras la auditoría de P1, ver más abajo: "combinación de ambas" fue el origen del ítem con peor P1 de todo el topic.)* Cubrir las restricciones típicas por separado: denominador ≠ 0, radicando ≥ 0 (par), raíz de índice impar sin restricción, y la restricción de contexto. **Nunca combinar dos reglas algebraicas en el mismo ítem** (ej. $1/\sqrt{x}$, que exige radicando ≥ 0 Y denominador ≠ 0 a la vez): CLSF es reconocimiento, un cálculo compuesto pertenece a otra instancia, no a este topic. Si el radicando resta la variable (`√(5-x)`), preferir la forma que no exige invertir el signo de una desigualdad (`√(x-5)`) salvo que ese paso de álgebra sea deliberadamente el contenido del ítem. **Cuando la restricción es de contexto** (no comprar kilos negativos, una velocidad no puede ser negativa), decirlo explícito en el enunciado ("$k$ representa un peso, no puede ser negativo") en vez de dejar que el alumno infiera que "dominio natural" cambió de significado: en la misma sub-familia, unos ítems lo usan en sentido puramente algebraico y otros en sentido físico, y sin la aclaración es indistinguible cuál se está pidiendo. Variá para no repetir siempre la división.

**Índice abstracto: nombrar la correspondencia.** *(Nuevo tras la auditoría de P1.)* Cuando el dominio o codominio es un conjunto de índices `{1,...,n}` que representa entidades con nombre propio en el contexto (vendedores, preguntas, salas), la prosa dice explícito que están numeradas ("numera sus 6 salas", "numeradas del 1 al 3"), nunca lo deja solo en la notación formal `V:{1,...,12}→{0,...,500}`. Sin ese puente, el alumno tiene que inferir la correspondencia índice↔entidad antes de poder razonar sobre el dominio, y eso mide lectura, no el concepto.

**Sin nombres propios.** Usar roles genéricos (un socio, un alumno, un producto), nunca nombres de persona. El ejercicio del DNI/persona debe decir "una persona", no un nombre.

---

## Checklist del topic, verificar antes de adjuntar el JSON

Además del checklist global del `generation-instructions.md`, verificá lo específico de este topic:

**LEXI:**
- [ ] 30 ejercicios exactos
- [ ] Distribución: 7 dominio, 6 var indep/dep, 5 imagen conjunto, 2 imagen puntual, 6 codominio, 3 preimagen cálculo, 1 preimagen puntual
- [ ] Ningún ejercicio de unicidad ni de "¿es función o no?": el concepto salió del topic (ago-2026)
- [ ] Ningún ejercicio de imagen/codominio/preimagen es puramente definicional en abstracto, todos identifican, calculan o distinguen conjuntos concretos
- [ ] Variedad de apertura en las `explanation`: proporción similar de pregunta retórica, contraejemplo y definición formal entre los que queden

**CLSF:**
- [ ] 21 ejercicios exactos
- [ ] Distribución: 4 dominio, 6 dominio natural, 5 imagen/conjunto imagen, 2 codominio, 4 preimagen
- [ ] Ningún ejercicio de "¿esta asignación define una función?": el bloque de unicidad se archivó (ago-2026), no se repone
- [ ] Todo ejercicio obliga a mirar el caso concreto; ninguno se resuelve solo con la definición (si sí, es LEXI)
- [ ] NINGÚN ejercicio de inyectiva/sobreyectiva/biyectiva como clasificación
- [ ] 4 opciones (o 3 si no hay 4 confusiones reales), sin relleno absurdo delator
- [ ] `feedback_incorrect` en TODOS los ejercicios, array del mismo largo que `options`, `null` en el correcto
- [ ] `correct_index` variado, no siempre 0
- [ ] Sin nombres propios en ningún ejercicio (revisar el del DNI/persona)

---

## Auditoría ronda 9 (feedback de testeo 467, ago-2026)

La ronda 7 arregló **de qué** hablaba la apertura (del comportamiento, no de la tipografía) pero no **que describiera**. El enunciado quedó haciendo el análisis y entregando el diagnóstico terminado: `"El punto de tendencia anula las dos partes de la fracción. La función no está definida ahí, pero sí se acerca a un número."` son tres conclusiones que el estudiante tendría que sacar, y le dejan solo la aritmética.

De ahí sale la **regla 61** de `authoring-context.md`: el sujeto de la primera oración es el objeto o una intención (`"Una función…"`, `"Un límite…"`, `"Se quiere…"`), va **una sola oración**, y no se reporta el resultado de ningún paso que el estudiante podría dar. La regla 59 sigue vigente contra la fórmula desnuda; la 61 la acota para que el enunciado no razone en su lugar.

Pasada de voz narrativa sobre las aperturas que tenían una propiedad de sujeto (`"El denominador de esta función…"`, `"El interior de este logaritmo…"`, `"El coeficiente principal es…"`). Son 56 en toda la unidad, heredadas de la misma ronda 6 que produjo el problema en `limites`.

**Los preámbulos `"Dada la función:"` / `"Sea la función:"` no se tocaron**: tienen el objeto de sujeto y la sección *Sin preámbulos colgantes* los admite explícitamente.

---

## Auditoría de datos de producción, CLSF (P1, ago-2026)

Informe completo: https://claude.ai/code/artifact/c4a538cf-2993-43f1-aefe-288eba3e5913.
Métrica **P1** = % de respuestas resueltas al primer intento (`quality_score = 5`), no
`is_correct` (que es "≤3 intentos" y no discrimina). **Banda de calibración: 55-77%,
centro 61%**, sacada de cruzar 183 votos de la encuesta con el P1 medido.

`white/definition/CLSF` es la unidad más transitada de toda la plataforma (443
respuestas, 148 usuarios) y medía **52% de P1**. Se leyeron los 30 ítems con su
contenido real cruzados contra su P1 individual (n chico en casi todos, 2 a 12; tratar
como pista de diagnóstico, no como veredicto estadístico).

**Ronda 1, 8 ítems corregidos:** `#12, #14, #15, #17, #19, #21, #22, #30`. Los
hallazgos sistémicos quedaron en las reglas de arriba ("una sola restricción" y
"nombrar el índice"). Detalle puntual:

| # | P1 antes (n) | Qué se hizo |
|---|---|---|
| 14 | 0% (3, 67% agotó) | Combinaba raíz+denominador; reemplazado por raíz de índice impar (regla nueva) |
| 21 | 0% (4) | Único ítem con dominio infinito (ℤ) de toda la sub-familia; reemplazado por dominio finito enumerable |
| 15 | 38% (8, 38% agotó) | "Dominio natural" contextual sin avisar; la restricción física ahora es explícita en el enunciado |
| 19 | 29% (7, 29% agotó) | Mismo problema que #15, mismo criterio |
| 17 | 33% (9) | Exigía invertir el signo de una desigualdad (álgebra, no CLSF); radicando reescrito para despeje directo |
| 12 | 29% (7) | Índice `{1,2,3}` sin nombrar como "preguntas numeradas"; agregado a la prosa |
| 22 | 33% (6, reporte de usuario) | La correcta decía "Conjunto unitario" (jerga no establecida); cambiada a `$\{7\}$`, igual que la explicación ya decía |
| 30 | 17% (6) | Formato negativo con 3 permutaciones casi idénticas; reescrito en positivo con una sola distractora real (dirección invertida) |

**Explícitamente fuera de esta ronda**, evidencia más floja o sin diagnóstico firme
todavía, quedan para una ronda 2:

- `#4` (carta/plato, 20%, n=5): aislado dentro de `unicidad-rota-disfrazada`, que en el
  resto anda bien (67-75%); sin hipótesis de qué lo distingue de `#1-3`.
- `#7`, `#8` (`trampa-inyectividad`, 40% cada uno, n=5): moderadamente bajos, sin
  patrón claro frente a `#5,6,9` que sí están en banda.
- `#11` (vendedores, 33%, n=6): mismo hallazgo del índice sin nombrar que `#12`; se
  puede resolver con la misma regla ya escrita arriba cuando llegue la ronda 2.
- `#24`, `#26`, `#27`, `#28`: bajo banda (38%, 20%, 50%, 50%) con n=5-8, sin
  diagnóstico propio todavía.
