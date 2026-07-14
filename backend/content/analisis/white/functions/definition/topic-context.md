# Topic: Definición de función

Belt: `white`, Unit: `functions`, Topic: `definition`

Skills en este topic: `LEXI`, `CLSF`.

## Hallazgos de auditoría (ronda 1, 13/7)

Revisión manual ítem por ítem vía `/test`. Los siguientes son ejemplos concretos de violaciones a `authoring-context.md` (terminología, vocabulario prohibido, notación de opciones, cortes de oración) encontradas en el contenido actual. **Todo el topic** (no solo los ítems citados) debe revisarse contra estas reglas al refactorizar, no únicamente los `external_id` listados abajo:

- **`white_definition_LEXI_39`**: la opción `"Cualquier precio entre 1000 y 2000"` está en prosa libre mientras el resto de las opciones son notación de conjunto (`$\{1000, 2000\}$`, etc.) — reescribir en notación equivalente (ej. `$[1000, 2000]$`) o un distractor conceptual distinto que mantenga el registro simbólico. La `explanation` de este ítem usaba "escupir" (prohibido) y tenía dos oraciones juntas en el párrafo de cierre sin separar (ver regla de "un párrafo, una oración").
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

**Regla transversal para el refactor:** revisar los 100 ítems (50 LEXI + 50 CLSF) contra `authoring-context.md` actualizado — terminología "función" (nunca "regla"), vocabulario prohibido (ver tabla en authoring-context.md), notación consistente dentro de cada `options`, ninguna oración cortada a la mitad por una fórmula display, y un párrafo por oración en `explanation`.

---

## LEXI, 50 ítems

### Distribución objetivo

| Concepto | Sub-tipo | Cantidad exacta |
|----------|----------|----------------:|
| Dominio | conjunto explícito o natural | 12 |
| Variable independiente / dependiente |, | 9 |
| Imagen | como conjunto (¿cuál es el conjunto imagen?) | 8 |
| Imagen | puntual (respecto de $x$, ¿qué es $f(x)$?) | 4 |
| Codominio |, | 6 |
| Preimagen | como cálculo (¿qué entradas dan $y$?) | 5 |
| Preimagen | puntual (respecto de $f(x)=y$, ¿qué rol cumple $x$?) | 2 |
| Unicidad (cupo estricto, ver abajo) |, | 4 |
| **Total** | | **50** |

**Cantidades exactas, no aproximadas.** La Gem debe respetar exactamente estos números; no más ítems de imagen o unicidad "porque salieron mejor".

**No hay bucket "contexto general".** Cada ítem debe encajar en uno de los conceptos de arriba. Si un ítem no encaja en ninguno, es porque no pertenece a este skill, descartalo, no lo forces.

**Sub-tipos de imagen y preimagen:**
- *Imagen como conjunto*: "Tomás $\{-2, -1, 0, 1, 2\}$ y elevás al cuadrado. ¿Cuál es el conjunto imagen?"
- *Imagen puntual*: "$f(x) = 2x$, $f(6) = 12$. Respecto del 6, ¿qué es el 12?", vocabulario de imagen aplicado a un caso puntual.
- *Preimagen como cálculo*: "$f(x) = x^2$. ¿Cuáles son las preimágenes de 9?"
- *Preimagen puntual*: "$V(x) = x^3$, $V(4) = 64$. Respecto de 64, ¿qué es el 4?", vocabulario de preimagen aplicado a un caso puntual.

Imagen, codominio y preimagen deben estar balanceados entre sí. Los ítems de estos tres conceptos son **cuantitativos y lógicos**: el alumno identifica el conjunto concreto, calcula las preimágenes de un valor, o distingue entre lo que la función "promete" (codominio) y lo que realmente produce (imagen). No generar ítems que sean puramente de vocabulario en abstracto ("¿qué es la imagen?").

### Unicidad, cupo estricto: 4 ítems, ni más ni menos

**OBLIGATORIO, no negociable.** Distribución fija dentro del cupo de 4 ítems:

- **2 ítems tipo "utilidad práctica"** (obligatorios): uno de cajero automático que muestra dos saldos distintos según quién consulta, y uno de termómetro que da dos lecturas simultáneas del mismo ambiente. La pregunta debe ser del tipo "¿qué garantía te da la unicidad acá?" o "¿qué pasaría si esta regla no fuera función?", NO "¿cumple la unicidad?".
- **2 ítems tipo "¿es función o no?" clásicos**: uno que sí lo sea (un contexto donde se respeta unicidad) y uno que no (un contexto donde una entrada tiene dos salidas).

**Contextos adicionales aceptables si hace falta variar**: app que asigna dos precios al mismo producto según el momento; GPS que calcula dos rutas de distancia distinta para el mismo origen y destino. Pero los dos de cajero+termómetro son obligatorios.

Los ítems de contraejemplo repetitivo ("dos descuentos al mismo producto", "dos asientos al mismo pasajero", "dos casilleros al mismo socio") **NO se generan más de una vez**. Un solo ítem clásico de "una entrada con dos salidas" alcanza.

### Cardinalidad

Regla operativa por **tipo de respuesta** (ver `authoring-context.md`), no por skill:

- **Conceptual/textual** (nombrar el concepto, describirlo): **3 opciones**. Es el caso mayoritario de LEXI/definition.
- **Numérica corta** (un número, un conjunto chico, una preimagen calculada): **4 opciones**, todas ≤35 caracteres, para triggear la grilla 2×2 del front.
- **Binario (2 opciones)**: **excepcional**, ≤ 3 ítems en todo el archivo. Casi siempre hay una tercera confusión clásica que convierte un sí/no en una pregunta de 3. No usar binario como recurso por defecto: en masa la sesión se vuelve un juego de moneda.

Meta de distribución para las 50 LEXI: la mayoría en 3 opciones, los ítems de respuesta numérica en 4, prácticamente ningún binario.

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
| Unicidad | unicidad tomada como inyectividad | "Eso describe inyectividad (cada salida viene de una sola entrada); la unicidad pide que cada entrada tenga una sola salida." |

### Reglas específicas de este topic

**Negrita en primera mención.** En `question` y `explanation`, envolver en `**negrita**` la primera aparición de: `**dominio**`, `**imagen**`, `**codominio**`, `**preimagen**`, `**unicidad**` (y variantes como "único", "una sola salida" cuando refieren al concepto de unicidad). Solo la primera mención por campo, no repetir.

**Sin pistas delatoras.** Si la opción correcta necesita una glosa para ser inequívoca, dar una glosa equivalente a TODAS las opciones, no solo a la correcta. Si ninguna la necesita, ninguna la lleva.

**Variedad de apertura en `explanation`.** Alternar entre:
- Definición formal: "El **dominio** es el conjunto de entradas que la regla transforma."
- Pregunta retórica: "¿Qué conjunto le 'entra' a la función? Eso es el **dominio**."
- Contraejemplo: "¿Qué pasaría si el **dominio** incluyera un valor que la regla no puede procesar? La función estaría indefinida ahí."

No repetir la misma estructura de apertura en ítems consecutivos del mismo concepto.

**Cierre de la `explanation`.** Por defecto, la tercera parte es una **advertencia sobre la confusión típica** del concepto o un **consejo práctico**, en voz neutra, y solo cuando aporta:
- Dominio: "No lo confundas con la imagen: el dominio son las entradas, no las salidas."
- Imagen vs. codominio: "El codominio es lo que la función podría alcanzar; la imagen, lo que realmente alcanza."
- Preimagen: "Preimagen de $k$ no es $f(k)$: es qué entrada produce $k$, no qué produce $k$."
- Unicidad: "Ojo, unicidad no es inyectividad: acá miramos que cada entrada dé una sola salida, no al revés."

El **humor es excepcional** (una minoría de los 50 ítems) y solo como **analogía cotidiana exagerada** en tono formal, del tipo escena burocrática o consecuencia práctica absurda ("Un registro que le asigna dos expedientes al mismo trámite no tiene un error de tipeo: tiene un problema de unicidad."). **Nunca antropomorfismos** ("la raíz detesta los negativos") ni chistes externos. Si no hay advertencia pertinente ni analogía que cierre bien, terminá en la aplicación.

**Contextos cotidianos válidos.** Precios de productos, notas de alumnos, tarifas de transporte, temperaturas, puntos de fidelidad, asignación de turnos o lockers, cantidades de bochas/porciones, consumo de datos. Sin nombres propios, usar roles genéricos ("un vendedor", "una empresa", "un remis", "un colegio").

---

## CLSF, 50 ítems

### Distribución objetivo

**CLSF es el skill de aplicación: identificar y calcular sobre casos concretos.** Se apoya en el vocabulario que LEXI define y lo pone a trabajar. Dos bloques:

- **~15 de unicidad ("¿es función?")**, acotados a los dos casos que de verdad enseñan: **unicidad rota disfrazada** en contexto (no la tabla obvia de "una entrada con dos salidas") y **trampa de inyectividad** (dos entradas comparten salida y eso NO rompe la función). Este bloque entrena la confusión central unicidad↔inyectividad; los casos de unicidad rota explícita y evidente ya no se repiten en masa.
- **~35 de identificación**, calcular o distinguir el conjunto concreto en un caso dado: cuál es el dominio de esta $f$, cuál es su conjunto imagen, qué valores excluye el dominio natural, cuáles son las preimágenes de $k$.

| Categoría | Cantidad |
|-----------|----------|
| Unicidad **rota disfrazada** en contexto cotidiano ("¿es función?") | ~7 |
| **Trampa de inyectividad**: sí es función aunque dos entradas compartan salida | ~8 |
| **Dominio**: identificar el conjunto de entradas en un caso concreto | ~6 |
| **Dominio natural**: restricción algebraica (división, raíz, combinadas) | ~10 |
| **Imagen / conjunto imagen**: salidas alcanzadas vs. codominio | ~9 |
| **Codominio**: distinguir del conjunto imagen | ~4 |
| **Preimagen**: calcular preimágenes / distinguir de la imagen | ~6 |
| **Total** | **50** |

**No duplicar LEXI.** El límite: **LEXI define/reconoce el término** ("¿qué es el dominio?", "¿qué representa este conjunto?"), en general 2-3 opciones y registro definicional. **CLSF identifica o calcula el conjunto concreto** ("¿cuál es el dominio de esta $f$?", "¿cuáles son las preimágenes del 0?"), computacional. Si un ítem se resuelve solo sabiendo la definición sin mirar el caso, es LEXI, no CLSF.

**Fuera de alcance de `white`.** No incluir inyectiva/sobreyectiva/biyectiva como clasificación explícita (se agenda para un topic posterior con codominio bien trabajado). La inyectividad aparece únicamente como *distractor* en el bloque de unicidad, y siempre descrita, nunca nombrada.

### Cardinalidad

- **Unicidad ("¿es función?")**: **3 opciones, no binario Sí/No.** El binario en masa vuelve la sesión un juego de moneda (ver `authoring-context.md` §Cardinalidad y regla anti-binario). Reformulá el sí/no como tres respuestas que integran el porqué:
  - **Cuando NO es función** (correcta = negativa con razón correcta): `No, hay una entrada con dos salidas` (correcta) · `Sí, cada entrada tiene una sola salida` (afirmativa falsa) · `No, dos salidas distintas vienen de la misma entrada` u otra negativa con razón espuria.
  - **Cuando SÍ es función** (correcta = afirmativa): `Sí, cada entrada tiene una sola salida` (correcta) · `No, dos entradas comparten la misma salida` (negativa con la confusión de inyectividad: describila, NO uses la palabra "inyectividad") · `No, la salida se repite` u otra negativa espuria.
  - El alumno no solo decide si es función, sino que discrimina **por qué**, y la confusión inyectividad↔unicidad queda como distractor central.
- **Identificación**: **4 opciones**, cuando hay 4 confusiones genuinamente distintas (p. ej. dominio ↔ imagen ↔ codominio + una espuria). Si solo hay 3 confusiones reales, usá 3 y no rellenes con un absurdo delator.
- **Layout:** con 3 opciones el front usa lista vertical; la grilla 2×2 se activa solo con exactamente 4 opciones, todas ≤35 caracteres (ver `session-runner.tsx`). No fuerces el largo para "caer en grilla".

### `feedback_incorrect` para CLSF

Array paralelo a `options`, `null` en el índice correcto, mismo largo que `options` (3 en unicidad, 4 en identificación). Voz descriptiva del concepto, nunca acusatoria ("confunde X con Y" está prohibido).

**En unicidad:**
- **Distractor afirmativo cuando NO es función:** describir el conflicto, "Acá una misma entrada produce dos salidas, y eso rompe la condición de función."
- **Distractor negativo con la confusión de inyectividad cuando SÍ es función:** "Que dos entradas distintas compartan la misma salida no rompe la condición de función: la unicidad mira que cada entrada tenga una sola salida, no al revés." (Describí el concepto sin usar la palabra "inyectividad".)
- **Distractor negativo con razón espuria:** nombrar por qué esa razón no invalida la función ("Que una salida se repita, o que sobren elementos del codominio, no contradice la definición de función.").

**En identificación:** cada distractor nombra qué conjunto se agarró en su lugar ("Ese es el codominio, las salidas posibles, no las efectivamente alcanzadas."; "Ese es el conjunto de salidas; el dominio son las entradas."; "El 600 es lo que se reparte, no una cota inferior para las personas.").

### Reglas específicas para CLSF

**Unicidad ≠ inyectividad, es el eje del bloque de unicidad.** La confusión central que entrena es creer que "dos entradas con la misma salida" rompe la función. No la rompe. Describí el concepto sin nombrar "inyectividad" (fuera del alcance de `white`): hablá de "cada entrada, una sola salida" y "al revés".

**Identificar sobre el caso, no recitar la definición.** Todo ítem de identificación debe obligar a mirar los datos concretos (el conjunto, la fórmula, la restricción) para responder; si se contesta de memoria con la definición, movelo a LEXI.

**Dominio natural.** Cubrir las restricciones típicas: denominador ≠ 0, radicando ≥ 0, combinación de ambas, y la restricción de contexto (no comprar kilos negativos, al menos una persona). Variá para no repetir siempre la división.

**Sin nombres propios.** Usar roles genéricos (un socio, un alumno, un producto), nunca nombres de persona. El ítem del DNI/persona debe decir "una persona", no un nombre.

---

## Checklist del topic, verificar antes de adjuntar el JSON

Además del checklist global del `generation-instructions.md`, verificá lo específico de este topic:

**LEXI:**
- [ ] 50 ítems exactos
- [ ] Distribución: 12 dominio, 9 var indep/dep, 8 imagen conjunto, 4 imagen puntual, 6 codominio, 5 preimagen cálculo, 2 preimagen puntual, 4 unicidad
- [ ] El ítem del cajero automático (dos saldos) está presente
- [ ] El ítem del termómetro (dos lecturas simultáneas) está presente
- [ ] Solo 1 ítem clásico de "una entrada con dos salidas" (no repetir el patrón)
- [ ] Ningún ítem de imagen/codominio/preimagen es puramente definicional en abstracto, todos identifican, calculan o distinguen conjuntos concretos
- [ ] Variedad de apertura en las `explanation`: al menos 5 arrancan con pregunta retórica, al menos 5 con contraejemplo, resto con definición formal

**CLSF:**
- [ ] 50 ítems exactos
- [ ] Distribución: ~15 de unicidad (~7 rota disfrazada + ~8 trampa de inyectividad) + ~35 de identificación (~6 dominio, ~10 dominio natural, ~9 imagen/conjunto imagen, ~4 codominio, ~6 preimagen)
- [ ] Los ~15 de unicidad son SOLO rota disfrazada o trampa de inyectividad; ningún caso obvio de "una entrada con dos salidas" en tabla explícita
- [ ] Todo ítem de identificación obliga a mirar el caso concreto; ninguno se resuelve solo con la definición (si sí, es LEXI)
- [ ] NINGÚN ítem de inyectiva/sobreyectiva/biyectiva como clasificación (solo como distractor descrito en unicidad)
- [ ] Los 15 de unicidad tienen 3 opciones (afirmativa + negativa correcta + negativa con confusión), no binario Sí/No
- [ ] Los 35 de identificación tienen 4 opciones (o 3 si no hay 4 confusiones reales), sin relleno absurdo delator
- [ ] `feedback_incorrect` en TODOS los ítems, array del mismo largo que `options`, `null` en el correcto
- [ ] Balance en unicidad: no todas "Sí" ni todas "No"
- [ ] `correct_index` variado, no siempre 0
- [ ] La palabra "inyectividad" NO aparece en options ni feedback (se describe el concepto)
- [ ] Sin nombres propios en ningún ítem (revisar el del DNI/persona)
