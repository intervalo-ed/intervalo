# Prompt de refactor: analisis / violet / derivatives / limit_definition (LEXI + CLSF + GRAF + ESTR)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de cualquier topic de `blue/limits` o `white/functions` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

> **Alcance de la ronda 2 (importante):** en esta ronda **no se generan ejercicios nuevos**. Cada skill de este topic tiene **15 ejercicios de prueba** y el trabajo es **regenerarlos/corregirlos en el lugar** contra los hallazgos y todas las reglas, **sin agregar ni quitar ninguno**. Completar cada skill hasta 50 ejercicios es trabajo de la **ronda 3**, posterior y solo si la ronda 2 quedó validada. Donde más abajo este prompt diga "completar hasta 50", "ejercicios nuevos" o "los N ejercicios finales", interpretalo como esos 15 ejercicios existentes.

## Contexto

Este topic hoy tiene ejercicios de prueba (15 por skill, no los 50×4=200 de la meta). En la **ronda 2** solo se **regeneran y corrigen los 15 ejercicios de prueba que ya existen** por skill, sin agregar nuevos (ver el callout de alcance arriba).

Una auditoría en vivo (`/test`) encontró, documentado en `topic-context.md` sección **"Hallazgos de auditoría (ronda 2, jul-2026)"**:
- `LEXI_08`: enunciado condensado en una sola oración larga en vez de 2 párrafos (contexto + pregunta).
- `ESTR_11` y `LEXI_05`: asumen que el alumno ya vio la fórmula del cociente incremental en otro ejercicio de la sesión, y arrancan directo en un tecnicismo derivado de ella.
- **Patrón dominante en los 4 archivos completos**: `ESTR` abre 12/15 ejercicios con la plantilla idéntica `"Calculé, por definición, la derivada de\n$$...$$"` sin cerrar nunca la oración; `LEXI_01` abre con `"En la misma fórmula\n$$...$$"`, mismo problema. Esto originó las reglas críticas 31 y 32, nuevas en `authoring-context.md` esta ronda.

**Esta ronda también agrega la regla crítica 30** (nueva en `authoring-context.md`): un `\begin{aligned}` con columna de `=` se reserva para una ecuación que se despeja o una expresión que se transforma paso a paso, nunca para listar datos/valores evaluados de forma independiente (hallazgo del topic `product`, ver más abajo el resumen transversal de la unidad).

## Recordatorio prioritario, antes de generar un solo ejercicio

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto en esta unidad. Chequealas en cada ejercicio a medida que lo escribís, no solo al final:

1. **Paridad de opciones (reglas críticas 4 y 15).** Ninguna opción puede quedar como la única notablemente más larga/elaborada NI la única más corta/pelada que el resto; tampoco la única con glosa aclaratoria entre paréntesis o relleno textual ("solamente") que las demás no llevan.
2. **Estructura de párrafos y LaTeX.** Párrafos de `explanation`/`question` ≤200 caracteres (ideal ~100); 2+ fragmentos LaTeX inline sueltos en el mismo párrafo se dividen (regla 21); la fórmula central del enunciado va separada del texto en su propio `$$...$$`, nunca tejida inline (regla 18); cualquier derivación de 2+ pasos va vertical en `\begin{aligned}`, nunca encadenada en una sola línea horizontal.
3. **Aligned solo para derivaciones reales (regla 30, nueva).** Nunca alinear con `=` datos o valores evaluados de forma independiente; esa alineación es solo para una ecuación que se despeja o una expresión que se transforma paso a paso.
4. **Reintroducir la definición central en cada ejercicio (regla 31, nueva).** Este topic gira entero en torno a la fórmula $f'(a) = \lim_{h \to 0} \tfrac{f(a+h)-f(a)}{h}$: cualquier ejercicio que la necesite para plantear su pregunta la reintroduce con LaTeX centrado, nunca la asume vista en otro ejercicio.
5. **Openers y puntuación (regla 32, nueva).** `"Calculá, por definición, la derivada de"` y `"Considerá la función"` son cláusulas completas (verbo + objeto): en este topic el problema no es la estructura, es que **falta el `:`** antes del bloque `$$...$$` y se repiten como plantilla idéntica en 12/15 ejercicios de `ESTR`. En cambio `"En la misma fórmula"` (`LEXI_01`) es un fragmento sin objeto propio: agregarle `:` no lo arregla, hay que reescribirlo como cláusula completa. En todos los casos: agregar el `:` faltante donde corresponda, variar la redacción ejercicio a ejercicio, y la pregunta arranca después en mayúscula.

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen acumulado hasta la fecha (con la regla crítica entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de conceptos clave en negrita (regla 3): en este topic, `derivada`, `tasa de cambio instantánea`, `cociente incremental`, `diferenciable`, `continua`, `notación de Leibniz`, `notación de Lagrange`.
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - Paridad de opciones en ambos sentidos (regla 4 y su extensión 15), también de formato numérico. **Reincidencia confirmada en `quotient` de esta unidad**: paréntesis aclaratorio solo en la opción correcta y relleno con "solamente" asimétrico en opciones numéricas — ninguno de los dos aporta distracción real, sacarlos en vez de repetirlos en las demás.
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - Nunca invocar conceptos fuera de la frontera del cinturón (regla 12): en este topic específicamente, **nunca usar reglas prácticas de derivación** (potencia, producto, cociente, cadena) ni derivadas de funciones elementales, es la regla dura 1 propia del topic (ver `topic-context.md`).
   - Máximo 1 aclaración entre paréntesis/comillas por oración (regla 13).
   - NUNCA usar los símbolos ✓/✗/✘ en ningún campo (regla 14).
   - En un `\begin{aligned}`, nunca una línea de puro texto sin `&` si el resto de las líneas sí tienen `&` (regla 16).
   - Todo párrafo cierra con puntuación terminal (regla 17).
   - Un `\begin{aligned}` va SIEMPRE en `$$...$$`, nunca en `$...$` inline, con un solo `\\` por salto de línea (regla 17b).
   - La fórmula central del `question` va separada del texto, nunca tejida inline, sobre todo si es una fracción (regla 18).
   - Opciones compuestas no repiten la etiqueta de eje/variable si la pregunta ya fija el orden (regla 19).
   - En `options` con fracciones cortas de grilla 2×2, preferir notación de barra (`1/3`) sobre `\frac`/`\dfrac` (regla 20).
   - 2+ fragmentos LaTeX inline en el mismo párrafo de `explanation` es señal de dividir el párrafo (regla 21).
   - En opciones `CLSF` que ya son una fórmula, no agregar el nombre de familia entre paréntesis (regla 22): aplica directo a este topic, la sub-familia de clasificación teórica.
   - Nunca enmarcar un ejercicio respecto de otro ejercicio de la sesión; todo ejercicio abstracto sitúa el concepto desde la primera oración (regla 24): aplica sobre todo a `LEXI` y `CLSF`, que son puramente conceptuales.
   - El concepto abstracto de la `explanation` justifica el porqué, no solo declara el qué (regla 25).
   - Un bloque `$$...$$` lleva solo símbolos y números, nunca una oración completa en español con `\text{...}` (regla 26).
   - Un límite lateral siempre lleva el punto de tendencia en el subíndice (regla 27, no aplica directo en este topic salvo que aparezca algún caso de laterales del cociente incremental en `CLSF` sub-C).
   - La fracción $\tfrac{0}{0}$ apilada nunca va tejida dentro de un párrafo de prosa; usar la forma horizontal `0/0` (regla 28): aplica al mencionar la indeterminación del cociente incremental en `LEXI` sub-A.
   - En el desarrollo `aligned` de un límite, `\lim_{h \to 0}` se repite en TODAS las líneas, nunca solo en la primera (regla 29): aplica directo a `ESTR`.
   - **Regla 30 (nueva): un `aligned` con columna de `=` es solo para una ecuación que se despeja o una expresión que se transforma paso a paso, nunca para listar datos evaluados de forma independiente.**
   - **Regla 31 (nueva, la más relevante de este topic): todo ejercicio reintroduce la definición/fórmula central que usa, sin asumir que el alumno ya la vio en otro ejercicio.** En `limit_definition` esto significa: cualquier `ESTR`/`LEXI` que trabaje sobre pasos derivados del cociente incremental (factorizar $h$, simplificar el numerador, etc.) reintroduce primero $f'(a) = \lim_{h \to 0} \tfrac{f(a+h)-f(a)}{h}$ centrada.
   - **Regla 32 (nueva, confirmada como sesgo sistémico en los 4 archivos de este topic).** `"Calculá, por definición, la derivada de"` es cláusula completa, solo le falta el `:` antes del bloque `$$...$$` (falta en 12/15 ejercicios de `ESTR`). `"En la misma fórmula"` (`LEXI_01`) es un fragmento sin objeto propio, necesita reescribirse entero. En ambos casos, variar la redacción ejercicio a ejercicio en vez de repetir la misma plantilla.
   - Preferencia por fórmula centrada sobre LaTeX inline en `explanation` cuando la fórmula es el objeto central.
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options`.
   - Fórmulas anchas: nunca encadenar igualdades largas en una sola línea horizontal, partir en `\begin{aligned}` vertical; cada renglón corto por sí solo.
   - Grilla 2×2: ≤16 caracteres con LaTeX, ≤25 en texto plano; en `ESTR` de este topic, ≤35 caracteres por ser expresiones algebraicas (ver cardinalidad propia del topic).
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual", "escapar"/"escapa", y **"linealidad" a secas, siempre "múltiplo escalar"** — no aplica directo a este topic pero mantenerlo presente).
   - `explanation` ≥ 300 caracteres, estructura de 3 partes (concepto abstracto con el porqué, aplicación paso a paso, cierre útil).
2. `backend/content/analisis/course-context.md` — estado matemático del alumno en `violet` (ya vio todo `blue`: límites, continuidad, indeterminaciones; no vio nada de derivadas todavía salvo lo que este topic define).
3. `backend/content/analisis/violet/derivatives/limit_definition/topic-context.md` — este topic. Tiene las **2 reglas duras de restricción** (solo por definición en `ESTR`, sin rectas tangentes todavía), la **distribución objetivo con `tags`** por skill, las **confusiones fuente** por skill, y **"Hallazgos de auditoría (ronda 2, jul-2026)"**.
4. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ejercicio lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `LEXI.json`, `CLSF.json`, `GRAF.json` y `ESTR.json` de `backend/content/analisis/violet/derivatives/limit_definition/`:

- **Regenerar los 15 ejercicios de prueba por skill que ya existen** (sin agregar ni quitar; completar a 50 es la ronda 3), partiendo de los 15 ejercicios de prueba existentes en cada uno.
- **Corregir los ejercicios existentes** contra los hallazgos: reescribir `LEXI_08` en 2 párrafos (contexto + pregunta), reintroducir la fórmula del cociente incremental en `ESTR_11` y `LEXI_05` antes de su pregunta puntual, y variar/cerrar correctamente la apertura de los ejercicios con el patrón de plantilla corta (12/15 de `ESTR`, `LEXI_01`).
- **Respetar las 2 reglas duras de restricción**: nada de reglas prácticas de derivación en `ESTR`, nada de rectas tangentes/pendiente de secante numérica en ningún skill.
- **Cada ejercicio lleva `"tags": ["<slug>"]`** según la tabla de distribución de su skill. No inventar slugs nuevos.
- **`feedback_incorrect` completo** en los 15 ejercicios de prueba por skill.
- **`correct_index` variado**, no concentrado en un solo índice.

## Qué SI está fuera de alcance

- No toques otros topics de `violet/derivatives` ni otros belts.
- No modifiques `authoring-context.md`, `course-context.md` ni `topic-context.md` — son insumo de lectura.
- No relajes ninguna de las 2 reglas duras de restricción del topic.
- No adelantes contenido del topic siguiente (`geometric_interpretation`): nada de ecuación de recta tangente ni cálculo numérico de pendiente de secante.

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ejercicio.** Escribí en el chat el plan: qué corrección aplica a cada ejercicio de prueba existente por sub-familia, qué pasa con los 15 existentes de cada uno, y cómo quedaría reescrito `LEXI_08` (2 párrafos) y uno de los ejercicios de `ESTR` con el patrón de opener corto (con una apertura sustantiva y variada) antes de escribir el resto.

**Paso 2 — Ejecutar** la generación/corrección sobre los 4 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist transversal + por skill de `topic-context.md` sobre los 15 ejercicios de prueba por skill. Prestá atención especial a: las 2 reglas duras (cero tolerancia), regla 30 (aligned solo para derivaciones reales), regla 31 (fórmula del cociente incremental reintroducida en cada ejercicio que la necesite), regla 32 (sin openers cortos, redacción variada), `tags` completos y coincidentes con la tabla.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `feat(analisis/violet/limit_definition): regenerar ejercicios de prueba y reglas globales de la ronda`.
5. En el mensaje del commit, resumí: cuántos de los 15 ejercicios de prueba se corrigieron y por qué regla, y el conteo final por `tags` de cada skill.
