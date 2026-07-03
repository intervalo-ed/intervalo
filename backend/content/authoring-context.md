# Convenciones de autoría de ejercicios

Guía de campos, reglas de formato y convenciones de redacción de los ejercicios de Intervalo. Cada ejercicio es un objeto JSON dentro de un archivo `{SKILL}.json`.

> Tras editar ejercicios: `python seed_content.py --course <curso>` desde `backend/`. Si cambian las skills de un tema, regenerar el catálogo con `bun run scripts/sync-catalog.ts` desde `web/`.

---

## Reglas críticas, leer antes de escribir un solo ítem

Estas siete reglas son las que más se violan y las que más rompen el render o la coherencia. Ninguna es negociable.

1. **Negrita SOLO en `question` y `explanation`, NUNCA en `options`.** La regla se repite en la sección *Redacción del enunciado* con ejemplos.
2. **Bloques `$$...$$` van pegados con UN solo `\n`**, nunca `\n\n`. Ver sección *Formato de párrafos*.
3. **Primera mención de conceptos clave va en negrita en `question` y en `explanation`.** Aplica a `dominio`, `imagen`, `codominio`, `preimagen`, `unicidad` (y variantes como `único`/`única`). Solo la primera mención por campo.
4. **Si una opción lleva glosa aclaratoria, todas las opciones la llevan.** Si la correcta dice `$\{1,2,3,4\}$, las cantidades de bochas` y otra dice solo `$\{600,1200\}$`, se delata la respuesta.
5. **Sin adjetivos decorativos en enunciados** ("moderno", "automatizado", "eficiente"). Redacción al grano.
6. **NUNCA usar guion largo `—` (em-dash, U+2014) en ningún campo del ejercicio.** Ni en `question`, `options`, `feedback_correct`, `feedback_incorrect` o `explanation`. Usá `,` (coma), `:` (dos puntos), `;` (punto y coma) o `.` (punto) según corresponda. El guion medio `–` también prohibido en prosa (salvo rangos numéricos "2–4"). Solo el guion `-` común es válido, y solo uniendo palabras compuestas.
7. **El cierre de la `explanation` es una advertencia de la confusión típica o un consejo práctico, no un chiste.** Por defecto, la tercera parte señala el error clásico del concepto o da una pista para no volver a caer, en voz neutra, y **solo cuando aporta** (si no, la explicación cierra en la aplicación). El humor dejó de ser obligatorio: es **excepcional** y solo se admite como **analogía cotidiana exagerada** (una consecuencia práctica o escena burocrática absurda) enunciada en tono formal. Los antropomorfismos ("la raíz cuadrada detesta los negativos", "la regla se cansa de emitir respuestas") están **prohibidos en todo el campo**. Ver *Estructura de la explicación* para el detalle de las 3 partes.

---

## Campos del ejercicio

| Campo | Regla |
|-------|-------|
| `question` | enunciado. Ver formato de párrafos abajo. |
| `options` | **2–4 opciones**. Ver *Cardinalidad de opciones por skill* más abajo. |
| `correct_index` | índice (0–N) de la correcta. |
| `feedback_correct` | **corto**, 1 oración. |
| `feedback_incorrect` | **`array<string\|null>` paralelo a `options`**: un texto corto por distractor (índice correcto = `null`). Ver sección *Pistas de feedback_incorrect* más abajo. **Legacy:** en belts no refactorizados todavía es `""` (string vacío). |
| `explanation` | texto del botón "¿Por qué?". Párrafos cortos, ≤4 renglones en celular. Estructura de 3 partes: ver *Estructura de la explicación* más abajo. |
| `has_math` | `true` si hay LaTeX en cualquier campo. |
| `graph_fn`, `graph_view` | ver sección Gráficos. `null` si no hay gráfico. |
| `reviewed` | `false` hasta revisión manual. |

El `external_id` se infiere de la ruta del archivo (`{belt}_{topic}_{skill}_{NN}`) y **no va en el JSON**.

---

## Pistas de `feedback_incorrect`

**Qué es:** al elegir un distractor, el panel naranja muestra una pista corta y específica de *por qué esa opción es la confusión clásica que es*, sin revelar la respuesta correcta.

**Shape:** `array<string|null>` paralelo a `options`, mismo largo y mismo orden. El índice de `correct_index` es siempre `null`. Ejemplo con 4 opciones, correcta en índice 0:

```json
"options": ["$(-\\infty, 20]$", "$[0, 20]$", "$\\mathbb{R}$", "$[20, +\\infty)$"],
"correct_index": 0,
"feedback_incorrect": [
  null,
  "Estás restringiendo a alturas no negativas, pero la pregunta es por el rango matemático de la función, no por el contexto físico.",
  "$\\mathbb{R}$ sería la imagen si no hubiera vértice, pero acá $a<0$ sí limita los valores que toma la función.",
  "Esa cota mira para arriba del vértice, cuando con $a<0$ la parábola se abre hacia abajo."
]
```

**Reglas de redacción:**
- **Nombra el error, no la cura.** Señala la confusión específica (signo invertido, dominio↔imagen, contexto físico vs. matemático) sin decir cuál es la opción correcta ni dar el valor que faltaba.
- **NUNCA acusar al alumno en tercera persona.** Verbos como *"Confunde X con Y"*, *"Invierte los roles"*, *"Olvida el negativo"*, *"Interpreta mal"*, *"Ignora la restricción"* son inaceptables, suenan a diagnóstico frío del alumno. Reescribí así:
  - ❌ *"Confunde codominio con imagen."* → ✅ *"Esas son las notas ya obtenidas, es decir la imagen. El codominio es el conjunto teórico de llegada."*
  - ❌ *"Invierte la relación: el sueldo es la salida."* → ✅ *"El sueldo no se elige libremente, sale de aplicar la fórmula, así que es la variable dependiente."*
  - ❌ *"Falta un valor, elevar el $-5$ al cuadrado también da 25."* → ✅ *"Hay otra solución además del 5: elevar el $-5$ al cuadrado también da 25."*
  - Voces válidas: (a) **descriptiva del concepto** ("Ese es el codominio, no la imagen…"), (b) **segunda persona amable con tuteo** ("estás tomando…", "hay otra solución además…"). Nunca la voz *"[el alumno] confunde/invierte/olvida"*.
- **Corto:** 1 oración, ideal ≤ 2 renglones en celular. Es una pista para el segundo intento, no una mini-explicación, eso ya lo cubre `explanation`.
- **Sin pistas en cascada:** cada texto es autosuficiente para SU distractor; no asume que el usuario ya leyó la pista de otra opción.
- **Contenido típico de la pista según skill:**
  - `RESL`/`DERI`/`INTG` (cálculo): error de procedimiento, signo, regla mal aplicada, paso salteado, constante de integración olvidada.
  - `ESTR`/`CLSF` (conceptual): la condición que falta o se confundió, releer el concepto sin re-explicarlo entero.
  - `GRAF`: qué parte del gráfico releer, "fijate qué pasa a la izquierda del salto", sin nombrar el valor.
  - `APLI`: confusión entre el contexto cotidiano y el resultado matemático puro.
- **Migración:** los belts con `""` se completan al pasar por refactor; no hace falta backfill manual fuera de ese proceso.

---

## Cardinalidad de opciones por skill

**Regla general:** la cardinalidad depende del **tipo de respuesta**, no del skill:

- **Respuesta conceptual/textual** (nombre de concepto, categoría, descripción): **3 opciones** por defecto. Tres confusiones clásicas alcanzan.
- **Respuesta numérica corta** (un número, un conjunto chico, un intervalo, una expresión tipo `x ≥ 3`): **4 opciones**. Cuatro variantes del error de cálculo son cómodas de distinguir y **triggean la grilla 2×2** del frontend (que requiere 4 opciones + todas ≤35 caracteres).
- **Binario** (2 opciones): reservado para casos donde el criterio es genuinamente binario y no hay una tercera confusión plausible (ej. "¿cumple unicidad? Sí/No"). En LEXI y CLSF de definición esto es raro, casi siempre hay una tercera confusión.

**Regla mecánica:** si las respuestas son valores numéricos (`$5$`, `$\{1,2,3\}$`, `$x \geq 3$`) o expresiones cortas, hacé 4 opciones y verificá que todas quepan en ≤35 caracteres para que el frontend las renderice en grilla 2×2 compacta. Si la respuesta es un párrafo o una descripción, hacé 3 opciones (no van a entrar en grilla y quedan como lista vertical).

**Guía por skill:**
- `ESTR`, `CLSF` (conceptual): **3 opciones por defecto.** Binario solo si el criterio es genuinamente sí/no y no hay tercera confusión.
- `LEXI` (léxico/recall): **3 opciones para conceptuales, 4 para numéricas**. Ver *topic-context.md* del tema.
- `GRAF` (lectura de gráfico): 3 cuando la propiedad leída es categórica; 4 cuando hay que elegir entre fórmulas o valores numéricos leídos del gráfico (grilla 2×2 si son cortos).
- `APLI` (aplicación/modelado): 3-4, las opciones son interpretaciones de contexto que compiten.
- `RESL`, `DERI`, `INTG` (cálculo): **4 sigue siendo el default**, porque acá la cantidad de errores de procedimiento clásicos sí sostiene 4 distractores reales. Si los 4 son numéricos cortos, se renderizan en grilla 2×2.

**Grilla 2×2 en frontend:** el componente activa layout `grid grid-cols-2` cuando `options.length === 4 && options.every(o => o.length <= 35)`. Aprovechá el compactado siempre que la respuesta lo permita.

**Precedente:** unicidad en `CLSF` reformulada como "¿esta regla cumple el criterio de unicidad?" con 2 opciones (Sí/No), caso raro de binario legítimo.

---

## Formato de Cálculo Numérico, grilla compacta 2×2

Para skills de cálculo (`RESL`, `DERI`, `INTG`) y para cualquier ítem de respuesta numérica corta, cuando las 4 opciones son valores numéricos o expresiones cortas, el front las presenta en una **grilla compacta 2×2** en vez de la lista vertical apilada.

**Estado: implementado.** El componente activa el layout `grid grid-cols-2` cuando `exercise.options.length === 4 && exercise.options.every(o => o.length <= 35)` (ver `web/src/app/(app)/session/[sessionId]/session-runner.tsx`, alrededor de la línea 293). Para aprovecharlo: 4 opciones, todas de ≤35 caracteres. Si alguna opción supera los 35 caracteres, el front cae a lista vertical.

**Nunca** metas HTML ni tablas dentro del string de `options` para forzar una grilla: el `options` es un array plano de strings y el layout lo decide el componente. Tu única palanca es la cardinalidad (4) y la longitud (≤35) de cada opción.

---

## Modo inline (`$`) vs. display (`$$`)

- **Inline (`$...$`)**: variables sueltas, coordenadas de un punto, o expresiones algebraicas elementales que no alteren la altura de línea (`$x$`, `$(3, 20)$`, `$a < 0$`).
- **Display (`$$...$$`)**: obligatorio para cualquier expresión densa, fracciones, límites con subíndices, derivadas, sumatorias, integrales. Aislarla en su propio bloque evita que KaTeX reduzca el tamaño de fuente en mobile.
- Regla rápida: si la expresión "tiene partes arriba y abajo de la línea base" (fracción, límite, sumatoria) → `$$`.

### Declaraciones de tipo de función `A : X \to Y`: extensión corta por diseño

Las declaraciones tipo `$$A : X \to Y$$` tienen que caber **en una sola línea en mobile** (~30 caracteres visibles como máximo). **NO** resolvés el overflow partiendo en dos líneas con `\begin{aligned}`: visualmente queda cortada y pierde la lectura natural "de A en X hacia Y". La solución correcta es **diseñar el ejercicio con conjuntos chicos desde el principio**.

**Regla operativa:** dominio y codominio con **2-4 elementos**, cada elemento **de 1-2 caracteres**. Preferir dígitos sueltos o letras cortas. Palabras largas (`\text{lunes},\dots,\text{domingo}`, `\text{laborable, feriado}`, números grandes tipo `15000, 20000, 25000, 30000`) están prohibidas dentro de la declaración.

❌ **Mal** (aunque conceptualmente correcto, no cabe):
```
$$V : \{\text{días}\} \to \{15000, 20000, 25000, 30000\}$$
```

✅ **Bien** (reescribir el contexto para que la extensión sea chica):
```
$$P : \{1, 2, 3\} \to \{0, 1, 2\}$$   (examen de 3 preguntas puntuadas 0/1/2)
$$f : \{bn, co\} \to \{50, 150\}$$    (fotocopias b/n vs. color)
$$S : \{1, 2, 3\} \to \{r, a, v\}$$   (semáforo)
$$E : \{1, 2, 3\} \to \{S, N\}$$      (encuesta sí/no)
```

**Contextos válidos con extensiones cortas**:
- Encuesta binaria (S/N), (Sí/No), (0/1) → 2 elementos.
- Semáforo (r/a/v), (V/N/A) → 3 elementos.
- Clasificación par/impar (P/I), positivo/negativo/cero.
- Puntaje de examen (0/1/2), (mal/regular/bien).
- Categorías cortas con letras (A/B/C).

**Prohibido dentro de `$$A : X \to Y$$`**:
- Palabras completas envueltas en `\text{}`.
- Elipsis `\dots` con extremos largos (`\{15000, \dots, 30000\}`, si necesitás elipsis, la extensión ya es larga; usá conjuntos concretos chicos).
- Números de 4+ dígitos.

Si el ejercicio realmente exige un contexto con muchas o largas etiquetas, **describilo en prosa antes** y usá una variable neutra para la declaración: "Una liga clasifica jugadores por edad" + `$$K : E \to C$$` con la explicación en prosa. Pero eso ya es un ejercicio más avanzado; en LEXI/CLSF de definición preferí siempre la extensión corta.

### Enumeraciones de valores calculados: SIEMPRE vertical

**NUNCA** listar varios valores calculados en una sola línea display con `\quad` o `\qquad` separadores. En mobile la línea se corta o overflowa.

❌ **Mal** (se sale de la pantalla en mobile):
```
$$(-3)^2 = 9, \quad (-1)^2 = 1, \quad 0^2 = 0, \quad 1^2 = 1, \quad 3^2 = 9$$
```

✅ **Bien** (uno debajo del otro, alineados por `=`):
```
$$\begin{aligned} (-3)^2 &= 9 \\ (-1)^2 &= 1 \\ 0^2 &= 0 \\ 1^2 &= 1 \\ 3^2 &= 9 \end{aligned}$$
```

**Regla:** dos o más asignaciones/evaluaciones (`f(x) = y`, `x^2 = k`, `x \mapsto v`) en el mismo bloque display → **obligatorio** `\begin{aligned}...\end{aligned}` con `&=` como punto de alineación y `\\` entre líneas. Aplica también cuando son solo 2 valores unidos por `\text{y}`: usar `aligned` en vez de `1000 \quad \text{y} \quad 2000`.

**Excepción:** una sola igualdad o expresión (`f(3) = 27`, `x^2 = 25`) va en su propio bloque display sin `aligned`.

---

## Negrita: dos usos distintos

1. **En `incorrecta`/`falsa`/inversiones de la consigna**: anti-error de lectura. La palabra puede perderse en un escaneo rápido y el usuario termina respondiendo lo contrario. No es una concesión a la facilidad cognitiva, es evitar un error de parsing del enunciado antes de razonar el contenido.
2. **La restricción crítica del cierre del enunciado** (condicionantes de dominio, inversiones sintácticas que le dan el peso lógico final) **NO se negrita.** Ahí la fricción es deseada, es lo que obliga a abandonar la lectura automática y entrar en pensamiento analítico.

En síntesis: negritar lo que se puede perder por accidente; no negritar lo que se quiere que cueste a propósito.

---

## Formato de párrafos

`MathText` usa `whitespace-pre-line`, así que `\n` = salto de línea y `\n\n` = línea en blanco.

- **Entre dos párrafos de prosa** (dos ideas completas) → `\n\n` (línea en blanco). Aplica tanto a `question` como a `explanation`.
- **Pegado a una fórmula centrada `$$...$$`** (antes o después) → un solo `\n`. La fórmula pertenece a la oración que la rodea y KaTeX displayMode ya agrega margen vertical.

**Ejemplos:**

❌ Mal, doble salto rodeando la fórmula:
```
Al elevar al cuadrado se obtiene\n\n$$0^2 = 0, \quad (\pm 1)^2 = 1$$\n\nLas salidas distintas son $\{0, 1\}$.
```

✅ Bien, un solo salto pegado a la fórmula:
```
Al elevar al cuadrado se obtiene\n$$0^2 = 0, \quad (\pm 1)^2 = 1$$\nLas salidas distintas son $\{0, 1\}$.
```

✅ Bien, párrafo en blanco entre dos ideas de prosa (sin fórmula en el medio):
```
Una función transforma cada entrada en una única salida.\n\nAcá el 9 podría transformarse en 3 o en $-3$.
```

### Planteos de GRAF: contexto en dos párrafos

En enunciados con gráfico, separar el **contexto** en dos párrafos cuando hay dos oraciones distintas (situación + qué muestra el gráfico), y la **pregunta** en un tercer párrafo:

```
Un remis cobra una tarifa fija al subir al auto, más un monto por kilómetro recorrido.

La gráfica muestra el costo total, en cientos de pesos, según los kilómetros.

¿Qué representa el valor donde la recta toca el eje vertical?
```

---

## Redacción del enunciado

- **Sin paréntesis para aclaraciones en el enunciado.** Si una aclaración es imprescindible, integrala como oración propia. No la resuelvas con muletillas "es decir…" / "o sea…" / "esto es…" (prohibidas en `question`, ver *Preguntas directas* más abajo) ni con guion (em-dash y en-dash prohibidos, ver regla crítica 6). Los `:` de notación matemática sí van, pero dentro de LaTeX.
- **Evitá dos puntos `:` en la prosa del cuerpo**: preferir `.` o `,`. **Excepción**: un `:` de cierre para introducir una fórmula display es válido y recomendado (`Consideremos la función:` antes de `$$...$$`), ver *Sin preámbulos colgantes* más abajo.
- **"transforma"**: referirse a la función como "la regla que transforma [entradas] en [salidas]". NUNCA usar la flecha `A → B` en prosa (solo en la fórmula centrada).
- **Situación cotidiana concreta + pregunta puntual** (no "¿qué significa X?").
- **Estructura de embudo invertido**: contexto liviano → objeto matemático aislado en `$$` → restricción/pregunta final. Cada capa reduce en volumen pero aumenta en abstracción.
- **Contexto y pregunta en párrafos separados**: cuando el enunciado tiene una oración de contexto seguida de la pregunta, separarlas con `\n\n`.
  - ❌ `El costo incluye costo fijo más costo por unidad. ¿Qué familia?`
  - ✅ `Una fábrica tiene un costo fijo de \$5000 más \$10 por cada unidad producida.\n\n¿Qué familia de función modela el costo total de producción?`
- **Ejercicios de comparación entre dos objetos matemáticos**: siempre incluir las fórmulas concretas en el enunciado, no solo la referencia abstracta.
  - ❌ `Entre dos parábolas, ¿cuál se ve más abierta?`
  - ✅ `Considerá las dos parábolas\n$$p(x) = 0{,}2x^2 - 3$$\n$$q(x) = 4x^2 - 3$$\n¿Cuál de las dos se ve más abierta?`
- **Sin preámbulos colgantes antes de una fórmula display**: prohibido abrir el enunciado con un fragmento de 1-3 palabras sin verbo, seguido de un `$$...$$`. Queda un texto suelto arriba del bloque que no cierra ninguna idea. Reescribí con una frase completa que introduzca la fórmula.
  - ❌ `La regla\n$$r(x) = \frac{1}{x^2 - 9}$$\n¿Qué valores no están en el dominio?`
  - ✅ `Una función racional está dada por\n$$r(x) = \frac{1}{x^2 - 9}$$\n¿Qué valores no están en el dominio?`
  - ✅ `Considerá la función\n$$r(x) = \frac{1}{x^2 - 9}$$\n¿Qué valores no están en el dominio?`
  - Fragmentos aceptables antes de `$$`: frases que terminan en `:` (`Consideremos la función:`), imperativas cortas con verbo (`Analizá la función`), o frases descriptivas completas (`Una función lineal modela el costo`). Sustantivos sueltos como `La regla`, `La función`, `El modelo` no cuentan como frase.
- **Preguntas directas, sin muletillas de aclaración**: prohibido colgar "es decir…", "o sea…", "esto es…" después de la pregunta principal para reformularla en palabras simples. Si la primera formulación es clara, la aclaración sobra; si no es clara, reescribí la primera formulación directamente. Las muletillas de aclaración regalan la respuesta o inflan el enunciado sin agregar información.
  - ❌ `¿Cuál es la preimagen del 0, es decir qué número entra para que salga 0?`
  - ✅ `¿Cuál es la preimagen del 0?`
  - ❌ `¿En qué semana el saldo llega a cero, es decir queda saldada la deuda?`
  - ✅ `¿En qué semana el saldo llega a cero?`
  - ❌ `Un bien pierde el 10% de su valor cada año, es decir, se multiplica por 0,9 año a año.`
  - ✅ `Un bien pierde el 10% de su valor cada año.` (traducir a multiplicador es parte del problema)
- **Preguntas directas, no formalizadas**: si la pregunta apunta a etiquetar un rol matemático (imagen/preimagen, variable dependiente/independiente, dominio/codominio), redactala de forma coloquial y directa: **"¿Qué sería el X respecto del Y en este caso?"** o **"¿Qué sería el total P en este caso?"**. Prohibido "¿qué rótulo formal se le da?", "¿qué nombre formal recibe?", "¿qué clasificación formal cumple?", "¿qué rol formal asume?". La palabra "formal" en el enunciado es un olor a redacción académica pesada, casi siempre reemplazable por "¿qué sería?".
  - ❌ `¿Qué rótulo formal, como imagen o dominio, le corresponde al 1210?`
  - ✅ `¿Qué sería el 1210 respecto del 1000 en este caso?`
  - ❌ `Entre imagen y preimagen, ¿qué rol asume el 4 respecto del 64?`
  - ✅ `¿Qué sería el 4 respecto del 64 en este caso?`
- **Preguntas auto-contenidas, nunca telegráficas**: la pregunta debe nombrar la magnitud concreta que se evalúa.
  - ❌ `¿Qué familia?`
  - ✅ `¿Qué familia de función describe el sueldo total en función de las ventas?`
- **Negrita en consignas invertidas**: si la consigna pregunta por la opción que NO cumple algo (`¿cuál es incorrecta?`, `¿cuál es falsa?`), envolver esa palabra clave en `**negrita**`.
  - ❌ `¿Cuál de estas afirmaciones es incorrecta?`
  - ✅ `¿Cuál de estas afirmaciones es **incorrecta**?`
  - Aplica a `falsa`/`falso`/`no cumple`/`no es cierta`. No aplica a `correcta`/`verdadera` en consignas afirmativas estándar.
- **Distractores = confusiones clásicas** (inyectividad, codominio↔imagen, dominio↔imagen, cardinalidad, etc.).
- **Distractores del mismo orden de magnitud que la correcta.** Si la respuesta correcta es `$a = 5$`, un distractor `$a = 185$` (que sale de evaluar $C(35)$ en vez de despejar) se descarta a ojo por gut-check: el alumno no razona, solo mira que "es demasiado grande" y lo descarta. Un distractor efectivo requiere hacer el cálculo mal, no rechazarlo por tamaño. **Regla operativa**: si un distractor numérico está a más de ~3-5× de la correcta, reescribilo como un error aritmético plausible del mismo orden.
  - ❌ Correcta `$a = 5$`, distractor `$a = 185$` (viene de $C(35) = 5 \cdot 35 + 10$). Ratio 37×, gut-check trivial.
  - ✅ Correcta `$a = 5$`, distractor `$a = 6$` (viene de restar el coeficiente $5$ en vez del término independiente $10$: $35 - 5 = 30$, $30/5 = 6$). Ratio 1.2×, hay que hacer el cálculo para descartarlo.
  - ❌ Correcta `$\pm 5$`, distractor `$625$` (viene de evaluar $f(25) = 25^2$). Ratio 125×.
  - ✅ Correcta `$\pm 5$`, distractor `$\pm 12{,}5$` (dividir entre 2 en vez de sacar raíz). Ratio 2.5×.
  - **Excepción**: cuando la confusión clásica intrínsecamente produce magnitud distinta (ej. confundir "8%" con "8" y con "1,08" en base exponencial), el distractor grande es válido porque el error viene de una lectura errónea del enunciado, no de un cálculo. Ahí el gut-check no ayuda.
- **Sin pistas en las opciones**: la opción correcta no debe llevar una glosa aclaratoria entre paréntesis que las distractoras no tengan, delata la respuesta.
  - ❌ `Lineal (constante)` → ✅ `Lineal`
- **"Cuadrática" y "Polinómica" no pueden convivir en la misma grilla**: si la respuesta correcta es `Cuadrática`, ninguna opción puede ser `Polinómica de grado N` (porque toda cuadrática es un polinomio → ambigüedad). Elegir distractor de familia claramente distinta. La regla aplica en espejo: si la correcta es `Polinómica`, no ofrecer `Cuadrática`.
- El cierre de la explicación es advertencia/consejo por defecto; humor solo excepcional (analogía cotidiana exagerada, nunca antropomorfismo). Ver *Estructura de la explicación*.
- **Sin nombres propios**: usar roles genéricos, "un vendedor", "una empresa", "un estudiante", "un puesto de limonada", "un remis", etc.
- **Dos fórmulas en un mismo enunciado**: nunca poner dos funciones en la misma línea display con `\qquad`, en mobile se corta. Usar dos bloques `$$` separados:
  - ❌ `$$f(x) = 3x^2 + 1 \qquad g(x) = 0{,}5x^2 + 1$$`
  - ✅ `$$f(x) = 3x^2 + 1$$\n$$g(x) = 0{,}5x^2 + 1$$`
- **Fórmulas largas**: mostrar solo la forma final simplificada en el enunciado. El paso intermedio puede ir en la explicación.
  - ❌ `$$I(p) = p(80 + 4(10 - p)) = p(120 - 4p)$$`
  - ✅ `$$I(p) = 120p - 4p^2$$`
- **Opciones "Otra/Otra2/Otra3"**: marcador de ejercicio incompleto. Nunca reseedear con opciones placeholder.
- **Nunca mezcles decimales con coma dentro de conjuntos.** En español los decimales se escriben con coma (`4,3`) y los conjuntos separan elementos con coma (`{a, b, c}`). Si mezclás ambos en la misma opción, se vuelve ilegible: `$\{4{,}3, 6{,}7, 6{,}2\}$` parece un conjunto de 6 números, no de 3 decimales.
  - ❌ `$\{4{,}3, 6{,}7, 6{,}2, 8{,}8, 8{,}1\}$` (¿5 decimales o 10 enteros?).
  - ✅ Elegí valores enteros para la función. Si el ejercicio requiere colapso o repetición de valores, usá contextos con salidas naturales enteras (precios en pesos, cantidades, puntos, edades) en vez de forzar decimales.
  - Si es indispensable usar decimales dentro de un conjunto, usar punto (`4.3`) o separar visualmente con punto y coma (`$\{4{,}3;\; 6{,}7;\; 6{,}2\}$`). Preferí evitar la situación antes que resolverla con puntuación exótica.

---

## LaTeX y signo `$`

- Inline: `$...$`. Display centrado: `$$...$$`.
- **Dinero**: el signo de pesos en prosa va **escapado** como `\$` (en el JSON: `\\$`). Si se usa `$` sin escapar para un monto, KaTeX lo toma como delimitador de fórmula y empareja con el siguiente `$`, rompiendo el render.
  - ❌ `es decir $400. ... a $200 cada uno`
  - ✅ `es decir \$400. ... a \$200 cada uno`
  - `MathText` soporta `\$` como pesos literal; ver `web/src/components/math-text.tsx`.

---

## Gráficos (`graph_fn`, `graph_view`)

El componente `web/src/components/math-graph.tsx` renderiza con **relación de aspecto 1:1** (misma escala px/unidad en ambos ejes) y grilla cuadrada dinámica.

- **Pendientes legibles a 1:1**: `|m| ≤ 3`. Con 1:1, `m=3 → 71°`, todavía legible cuadrito a cuadrito. Pendientes grandes (ej. `m=15`) salen casi verticales e ilegibles.
- **`graph_view` cuadrado**: `[xmin, xmax, ymin, ymax]` con `xRange ≈ yRange`. Los puntos clave deben caer dentro de la vista.
- Si un contexto cotidiano exige magnitudes dispares, **rediseñar el ejercicio** con números chicos en vez de romper el 1:1.

### Qué lee cada GRAF por tema

| Tema | Foco del gráfico |
|------|------------------|
| `linear` | pendiente (signo/magnitud), ordenada al origen, raíz |
| `quadratic` | vértice, eje de simetría, raíces, concavidad |
| `polynomial` | grado/paridad por forma, raíces, extremos |
| `exponential` | crecimiento/decrecimiento, corte en $(0,1)$, asíntota horizontal |
| `logarithmic` | dominio $(0,\infty)$, corte en $(1,0)$, asíntota vertical |

---

## Estructura de la explicación (`explanation`)

Cada campo `explanation` sigue una estructura de **tres partes**:

1. **Concepto abstracto**: la fórmula, regla o propiedad general que aplica.
2. **Aplicación al ejemplo**: desglose paso a paso del caso concreto. Cuando hay dos o más pasos de álgebra o sustitución, usar el bloque alineado:
   ```
   $$\begin{aligned}
   \text{LHS} \\
   &= \text{paso 1} \\
   &= \text{resultado}
   \end{aligned}$$
   ```
3. **Cierre útil** (cuando aporte): por defecto, una oración que advierte sobre la **confusión o el error típico** del concepto, o da un **consejo práctico** para no volver a caer, en voz neutra. El humor es **excepcional**: solo si surge naturalmente una **analogía cotidiana exagerada** (una consecuencia práctica o escena burocrática absurda) enunciada en tono formal, nunca antropomorfismos ni un chiste externo. Si no hay una advertencia pertinente ni una analogía que cierre bien, terminá en la aplicación: un cierre forzado resta.

**Extensión mínima:** las tres partes juntas deben superar los 250 caracteres. Una sola oración de resultado no es una explicación. Cuando el cierre no va, compensá con más detalle en el concepto o la aplicación.

**Errores frecuentes:**
- Poner solo el resultado de la cuenta sin explicar el concepto general.
- Forzar humor donde no cierra: si no surge una analogía natural, la parte 3 va como advertencia/consejo o directamente no va.
- Cerrar con un antropomorfismo o un chiste externo al tema (prohibido, ver regla crítica 7).
- Usar la cadena horizontal `A = B = C = D` para derivaciones largas, usar `\begin{aligned}` vertical en su lugar.

---

## Bugs conocidos / pendientes técnicos

- **[CORREGIDO] Render de `$` de pesos**: montos con `$` sin escapar rompían KaTeX. Solución: `\$` en contenido + soporte de escape en `MathText`. Verificar que ningún ejercicio nuevo use `$` sin escapar para dinero.
- Las **sesiones cachean** el contenido del ejercicio al construirse (`session_store.py`), en memoria. Tras reseedear, las sesiones ya abiertas siguen con el snapshot viejo; arrancar una sesión nueva para ver cambios.

---

## Resumen operativo, repetir mentalmente antes de cada ítem

Cinco NUNCA y cinco SIEMPRE. Están duplicadas arriba a propósito, para que también estén disponibles al final del documento (donde el modelo suele buscarlas antes de generar).

**NUNCA:**
- NUNCA usar `**...**` dentro de `options`.
- NUNCA usar `\n\n` pegado a un bloque `$$...$$`.
- NUNCA agregar glosa solo a la opción correcta.
- NUNCA usar nombres propios (usar roles genéricos).
- NUNCA inflar el enunciado con adjetivos decorativos.
- NUNCA meter antropomorfismos ni chistes externos; el cierre es advertencia/consejo, y el humor (excepcional) va como analogía cotidiana formal.

**SIEMPRE:**
- SIEMPRE `\n\n` entre contexto y pregunta.
- SIEMPRE `\n$$...$$\n` (un solo salto) rodeando fórmulas display.
- SIEMPRE `**dominio**`, `**imagen**`, `**codominio**`, `**preimagen**`, `**unicidad**` en su primera mención en `question` y en `explanation`.
- SIEMPRE `feedback_incorrect` como array del mismo largo que `options`, con `null` en el índice correcto.
- SIEMPRE `\$` para pesos (en JSON: `\\$`).
