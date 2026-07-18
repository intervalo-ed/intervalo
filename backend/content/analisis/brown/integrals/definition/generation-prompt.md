# Prompt de refactor: analisis / brown / integrals / definition (LEXI + FORM + ESTR)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de cualquier topic de `violet/derivatives`, `blue/limits`, `white/functions` o de otro topic de `brown/integrals` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

> **Alcance de la ronda 2 (importante):** en esta ronda **no se generan ítems nuevos**. Cada skill de este topic tiene **15 ítems de prueba** y el trabajo es **regenerarlos/corregirlos en el lugar** contra los hallazgos y todas las reglas, **sin agregar ni quitar ninguno**. Completar cada skill hasta 50 ítems es trabajo de la **ronda 3**, posterior y solo si la ronda 2 quedó validada. Donde más abajo este prompt diga "completar hasta 50", "ítems nuevos" o "los N ítems finales", interpretalo como esos 15 ítems existentes.

## Contexto

Este topic hoy tiene ítems de prueba (no los 50×3=150 de la meta). En la **ronda 2** solo se **regeneran y corrigen los 15 ítems de prueba que ya existen** por skill, sin agregar nuevos (ver el callout de alcance arriba). Es la puerta de entrada al cinturón `brown`.

Una pre-revisión programática (script propio, sin corrección puntual todavía) encontró, documentado en `topic-context.md` sección **"Hallazgos de auditoría (ronda 1, jul-2026)"**:
- **[YA CORREGIDO]** bug `\n\n$$` en los 45 ítems existentes, arreglado con un script mecánico antes de esta ronda.
- `FORM`: 15/15 ítems abren con `"Considerá la integral"`, cláusula completa que solo necesita el `:` (regla 32).
- `ESTR`: 15/15 abren con `"Antes de resolver\n$$...$$\n¿qué paso previo conviene dar?"`, que **corta una sola oración con la fórmula en el medio** (regla crítica 9, más grave que un simple opener).
- `LEXI`: varias aperturas incompletas (`"En la notación"`, `"En"`, `"Al escribir"`) que sí necesitan reescritura completa.
- `ESTR`: opciones con ratio de longitud alto (`[23, 51, 21]`).

No hay reglas nuevas esta ronda: todo lo de arriba es reincidencia de reglas ya existentes (2, 4, 9, 15, 32), no candidatas a numeración nueva.

## Recordatorio prioritario, antes de generar un solo ítem

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto en esta unidad. Chequealas en cada ítem a medida que lo escribís, no solo al final:

1. **`$$...$$` pegado con un solo `\n` (regla 2).** El bug de `\n\n$$` ya se corrigió en los ítems existentes; no reintroducirlo en los nuevos.
2. **Openers y puntuación (regla 32, reincidencia confirmada).** `"Considerá la integral"` es cláusula completa, solo necesita el `:`. `"Antes de resolver"` corta la oración con la fórmula en el medio (regla 9): reescribir con cierre propio antes del bloque y la pregunta en su propia oración después.
3. **Paridad de opciones (reglas críticas 4 y 15).** Ninguna opción puede quedar como la única notablemente más larga/elaborada NI la única más corta/pelada que el resto.
4. **"Linealidad" es vocabulario correcto acá, no prohibido.** La entrada de `authoring-context.md` banea "linealidad" solo como nombre de estrategia en `options` de `violet/derivatives`; en este topic es el nombre legítimo de la propiedad del operador integral, usalo en prosa sin reemplazarlo.

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen acumulado hasta la fecha (con la regla crítica entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de conceptos clave en negrita (regla 3): en este topic, `integral indefinida`, `antiderivada`, `primitiva`, `integrando`, `diferencial`, `constante de integración`, `linealidad`.
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2). **Bug confirmado y corregido en los 45 ítems existentes de este topic**; no reintroducirlo.
   - Paridad de opciones en ambos sentidos (regla 4 y su extensión 15). **Reincidencia confirmada en `ESTR`** (ratio de longitud `[23, 51, 21]`).
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - **Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Reincidencia confirmada en `ESTR` (`"Antes de resolver"`, 15/15 ítems): reescribir con cierre propio.**
   - Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - Nunca invocar conceptos fuera de la frontera del cinturón (regla 12): en este topic, nunca ejecutar la regla de la potencia para integrar ni ningún cálculo final (ver regla dura del topic).
   - Máximo 1 aclaración entre paréntesis/comillas por oración (regla 13).
   - NUNCA usar los símbolos ✓/✗/✘ en ningún campo (regla 14).
   - En un `\begin{aligned}`, nunca una línea de puro texto sin `&` si el resto de las líneas sí tienen `&` (regla 16).
   - Todo párrafo cierra con puntuación terminal (regla 17).
   - Un `\begin{aligned}` va SIEMPRE en `$$...$$`, nunca en `$...$` inline, con un solo `\\` por salto de línea (regla 17b).
   - La fórmula central del `question` va separada del texto, nunca tejida inline, sobre todo si es una fracción (regla 18).
   - Opciones compuestas no repiten la etiqueta de eje/variable si la pregunta ya fija el orden (regla 19).
   - En `options` con fracciones cortas de grilla 2×2, preferir notación de barra (`1/3`) sobre `\frac`/`\dfrac` (regla 20).
   - 2+ fragmentos LaTeX inline en el mismo párrafo de `explanation` es señal de dividir el párrafo (regla 21).
   - En opciones `CLSF` que ya son una fórmula, no agregar el nombre de familia entre paréntesis (regla 22, no aplica, este topic no tiene `CLSF`).
   - Nunca enmarcar un ítem respecto de otro ítem de la sesión; todo ítem abstracto sitúa el concepto desde la primera oración (regla 24): aplica sobre todo a `LEXI` puramente conceptual.
   - El concepto abstracto de la `explanation` justifica el porqué, no solo declara el qué (regla 25).
   - Un bloque `$$...$$` lleva solo símbolos y números, nunca una oración completa en español con `\text{...}` (regla 26).
   - Un límite lateral siempre lleva el punto de tendencia en el subíndice (regla 27, no aplica, este topic no usa límites).
   - La fracción $\tfrac{0}{0}$ apilada nunca va tejida dentro de un párrafo de prosa (regla 28, no aplica directo).
   - En el desarrollo `aligned` de un límite, `\lim` se repite en TODAS las líneas (regla 29, no aplica, este topic no desarrolla límites).
   - Un `aligned` con columna de `=` es solo para una ecuación que se despeja o una expresión que se transforma paso a paso, nunca para listar datos evaluados de forma independiente (regla 30).
   - Todo ítem reintroduce la definición/fórmula central que usa, sin asumir que el alumno ya la vio en otro ítem (regla 31). En este topic aplica a la notación $\int f(x)\,dx = F(x)+C$ misma en `FORM`/`ESTR`.
   - **Openers y puntuación (regla 32).** `"Considerá la integral"` es cláusula completa (verbo + objeto): solo le falta el `:` antes del bloque `$$...$$`, no hace falta reescribirla. `"Antes de resolver"` es más grave, corta la oración con la fórmula en el medio (ver regla 9). En ambos casos, variar la redacción ítem a ítem.
   - Preferencia por fórmula centrada sobre LaTeX inline en `explanation` cuando la fórmula es el objeto central.
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options`.
   - Fórmulas anchas: nunca encadenar igualdades largas en una sola línea horizontal, partir en `\begin{aligned}` vertical; cada renglón corto por sí solo.
   - Grilla 2×2: ≤35 caracteres en ítems numéricos de este topic (ver cardinalidad por skill).
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual", "escapar"/"escapa"). **"Linealidad" NO está prohibida acá**: es el nombre correcto de la propiedad del operador integral, distinto del contexto de `violet/derivatives` donde competía como nombre de estrategia con "múltiplo escalar".
   - `explanation` ≥ 300 caracteres, estructura de 3 partes (concepto abstracto con el porqué, aplicación paso a paso, cierre útil).
2. `backend/content/analisis/course-context.md` — estado matemático del alumno en `brown`.
3. `backend/content/analisis/brown/integrals/definition/topic-context.md` — este topic. Tiene la **regla dura de restricción** (sin ejecutar el cálculo integral final, sin integral definida/sustitución/partes), la **distribución objetivo con `tags`** (LEXI 25/25, FORM 25/25, ESTR 25/25), las **confusiones fuente** por skill, y **"Hallazgos de auditoría (ronda 1, jul-2026)"**.
4. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `LEXI.json`, `FORM.json` y `ESTR.json` de `backend/content/analisis/brown/integrals/definition/`:

- **Regenerar los 15 ítems de prueba por skill que ya existen** (sin agregar ni quitar; completar a 50 es la ronda 3), partiendo de los ítems de prueba existentes.
- **Corregir los ítems existentes** contra los hallazgos: agregar `:` a los openers de `FORM` que ya son cláusula completa, reescribir los de `ESTR` (`"Antes de resolver"`) que cortan la oración con la fórmula, reescribir las aperturas incompletas de `LEXI`, y ajustar la paridad de longitud de las opciones señaladas.
- **Respetar la regla dura de restricción** del topic: sin ejecutar la regla de la potencia para integrar, sin integral definida/sustitución/partes ni como método ni como distractor razonable, siempre con $+C$ en toda primitiva mostrada.
- **Cada ítem lleva `"tags": ["<slug>"]`** según la tabla de distribución de su skill. No inventar slugs nuevos.
- **`feedback_incorrect` completo** en los 15 ítems de prueba por skill.
- **`correct_index` variado**, no concentrado en un solo índice.

## Qué SI está fuera de alcance

- No toques otros topics de `brown/integrals` ni otros belts.
- No modifiques `authoring-context.md`, `course-context.md` ni `topic-context.md` — son insumo de lectura.
- No relajes la regla dura de restricción del topic (nada de cálculo integral final, integral definida, sustitución, partes).

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ítem.** Escribí en el chat el plan: qué corrección aplica a cada ítem de prueba existente por sub-familia, qué pasa con los existentes, y cómo quedaría reescrito uno de los ítems de `ESTR` (`"Antes de resolver"` sin cortar la oración) y uno de `LEXI` (apertura incompleta reescrita) antes de escribir el resto.

**Paso 2 — Ejecutar** la generación/corrección sobre los 3 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist transversal + por skill de `topic-context.md` sobre los 15 ítems de prueba por skill. Prestá atención especial a: regla dura de restricción (cero tolerancia), `$$...$$` con un solo `\n` (no reintroducir el bug corregido), regla 9 (ningún opener corta la oración con la fórmula), regla 32 (openers con `:` y redacción variada), paridad de opciones, `tags` completos y coincidentes con la tabla.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `feat(analisis/brown/definition): regenerar ítems de prueba y correcciones de la ronda`.
5. En el mensaje del commit, resumí: cuántos de los 15 ítems de prueba se corrigieron y por qué regla, y el conteo final por `tags` de cada skill.
