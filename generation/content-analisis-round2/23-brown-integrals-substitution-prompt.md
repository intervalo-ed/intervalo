# Prompt de refactor: analisis / brown / integrals / substitution (ESTR + RESL)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de otro topic de `brown/integrals`, `violet/derivatives`, `blue/limits` o `white/functions` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

> **Alcance de la ronda 2 (importante):** en esta ronda **no se generan ítems nuevos**. Cada skill de este topic tiene **15 ítems de prueba** y el trabajo es **regenerarlos/corregirlos en el lugar** contra los hallazgos y todas las reglas, **sin agregar ni quitar ninguno**. Completar cada skill hasta 50 ítems es trabajo de la **ronda 3**, posterior y solo si la ronda 2 quedó validada. Donde más abajo este prompt diga "completar hasta 50", "ítems nuevos" o "los N ítems finales", interpretalo como esos 15 ítems existentes.

## Contexto

Este topic hoy tiene ítems de prueba (no los 50×2=100 de la meta). En la **ronda 2** solo se **regeneran y corrigen los 15 ítems de prueba que ya existen** por skill, sin agregar nuevos (ver el callout de alcance arriba). Introduce el primer método de integración (cambio de variable / $u$-sub).

Una pre-revisión programática encontró, documentado en `topic-context.md` sección **"Hallazgos de auditoría (ronda 1, jul-2026)"**:
- **[YA CORREGIDO]** bug `\n\n$$` en los 30 ítems existentes, arreglado con un script mecánico antes de esta ronda.
- `ESTR`: 8/15 con `"Para resolver\n$$...$$\n..."`, que **corta una sola oración con la fórmula en el medio** (regla crítica 9), mismo patrón que en `parts`.
- `RESL`: 15/15 con `"Calculá"`, cláusula completa que solo necesita el `:`.

No hay reglas nuevas esta ronda: todo lo de arriba es reincidencia de reglas ya existentes (2, 9, 32), no candidatas a numeración nueva.

## Recordatorio prioritario, antes de generar un solo ítem

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto en esta unidad. Chequealas en cada ítem a medida que lo escribís, no solo al final:

1. **`$$...$$` pegado con un solo `\n` (regla 2).** El bug de `\n\n$$` ya se corrigió en los ítems existentes; no reintroducirlo en los nuevos.
2. **Openers y puntuación (regla 32/9, reincidencia confirmada).** `"Para resolver"` (`ESTR`) corta la oración con la fórmula en el medio (regla 9): reescribir con cierre propio antes del bloque. `"Calculá"` (`RESL`) es cláusula completa, solo necesita el `:` y variar la redacción.
3. **Toda respuesta correcta vuelve a la variable $x$**, nunca queda expresada en $u$. Regla dura del topic.
4. **$+C$ obligatorio** en toda respuesta correcta y toda opción de `RESL`; $\ln|·|$ con valor absoluto siempre.

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen acumulado hasta la fecha (con la regla crítica entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de conceptos clave en negrita (regla 3): en este topic, `integración por sustitución`, `cambio de variable`, `diferencial`, `función compuesta`.
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2). **Bug confirmado y corregido en los 30 ítems existentes**; no reintroducirlo.
   - Paridad de opciones en ambos sentidos (regla 4 y su extensión 15), también de formato numérico.
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - **Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Reincidencia confirmada en `ESTR` (`"Para resolver"`, 8/15 ítems): reescribir con cierre propio.**
   - Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - Nunca invocar conceptos fuera de la frontera del cinturón (regla 12): en este topic, nada de integración por partes, integral definida, Barrow, áreas, TFC ni sustitución trigonométrica (ver regla dura del topic).
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
   - Nunca enmarcar un ítem respecto de otro ítem de la sesión; todo ítem abstracto sitúa el concepto desde la primera oración (regla 24).
   - El concepto abstracto de la `explanation` justifica el porqué, no solo declara el qué (regla 25).
   - Un bloque `$$...$$` lleva solo símbolos y números, nunca una oración completa en español con `\text{...}` (regla 26).
   - Un límite lateral siempre lleva el punto de tendencia en el subíndice (regla 27, no aplica, este topic no usa límites).
   - La fracción $\tfrac{0}{0}$ apilada nunca va tejida dentro de un párrafo de prosa (regla 28, no aplica directo).
   - En el desarrollo `aligned` de un límite, `\lim` se repite en TODAS las líneas (regla 29, no aplica, ver en cambio regla 30).
   - **Un `aligned` con columna de `=` es solo para una ecuación que se despeja o una expresión que se transforma paso a paso, nunca para listar datos evaluados de forma independiente (regla 30).** En este topic, cuidado en la identificación de $u$ y $du$: si son datos sueltos antes del reemplazo, van en prosa, no alineados con `=` junto al cálculo real.
   - Todo ítem reintroduce la definición/fórmula central que usa, sin asumir que el alumno ya la vio en otro ítem (regla 31). En este topic aplica a $\int f(g(x))g'(x)\,dx = \int f(u)\,du$ misma.
   - **Openers y puntuación (regla 32, reincidencia confirmada en `ESTR` y `RESL`).** `"Calculá"` (`RESL`) es cláusula completa: solo le falta el `:`. `"Para resolver"` (`ESTR`) es más grave, corta la oración con la fórmula (ver regla 9).
   - Preferencia por fórmula centrada sobre LaTeX inline en `explanation` cuando la fórmula es el objeto central.
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options`.
   - Fórmulas anchas: nunca encadenar igualdades largas en una sola línea horizontal, partir en `\begin{aligned}` vertical; cada renglón corto por sí solo.
   - Grilla 2×2: ≤35 caracteres en `RESL` (ver cardinalidad propia).
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual", "escapar"/"escapa").
   - `explanation` ≥ 300 caracteres, estructura de 3 partes (concepto abstracto con el porqué, aplicación paso a paso, cierre útil).
2. `backend/content/analisis/course-context.md` — estado matemático del alumno en `brown`.
3. `backend/content/analisis/brown/integrals/substitution/topic-context.md` — este topic. Tiene la **regla dura de restricción** (solo sustitución + tabla + linealidad, nada de partes/definidas/sustitución trigonométrica, techo de $u$ hasta grado 2 o trascendente simple), la **distribución objetivo con `tags`** (ESTR 25/25, RESL 25/25), las **confusiones fuente** por skill, y **"Hallazgos de auditoría (ronda 1, jul-2026)"**.
4. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `ESTR.json` y `RESL.json` de `backend/content/analisis/brown/integrals/substitution/`:

- **Regenerar los 15 ítems de prueba por skill que ya existen** (sin agregar ni quitar; completar a 50 es la ronda 3), partiendo de los ítems de prueba existentes.
- **Corregir los ítems existentes** contra los hallazgos: reescribir `"Para resolver"` sin cortar la oración con la fórmula, agregar `:` a `"Calculá"`, variar la redacción ítem a ítem en ambas skills.
- **Respetar la regla dura de restricción** del topic: solo sustitución + tabla + linealidad, nada de partes/integral definida/Barrow/áreas/TFC/sustitución trigonométrica, $u$ hasta grado 2 o trascendente simple, respuesta final siempre en $x$, $+C$ y $\ln|·|$ con valor absoluto siempre.
- **Cada ítem lleva `"tags": ["<slug>"]`** según la tabla de distribución de su skill. No inventar slugs nuevos.
- **`feedback_incorrect` completo** en los 15 ítems de prueba por skill.
- **`correct_index` variado**, no concentrado en un solo índice.

## Qué SI está fuera de alcance

- No toques otros topics de `brown/integrals` ni otros belts.
- No modifiques `authoring-context.md`, `course-context.md` ni `topic-context.md` — son insumo de lectura.
- No relajes la regla dura de restricción del topic (nada de partes, definidas, sustitución trigonométrica, ni $u$ de grado 3+).

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ítem.** Escribí en el chat el plan: qué corrección aplica a cada ítem de prueba existente por sub-familia, qué pasa con los existentes, y cómo quedaría reescrito un ítem de `ESTR` con `"Para resolver"` (sin cortar la oración) antes de escribir el resto.

**Paso 2 — Ejecutar** la generación/corrección sobre los 2 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist transversal + por skill de `topic-context.md` sobre los 15 ítems de prueba por skill. Prestá atención especial a: regla dura de restricción (cero tolerancia), `$$...$$` con un solo `\n`, regla 9 (sin oraciones cortadas por la fórmula), regla 32 (openers con `:` y redacción variada), respuesta siempre en $x$, $+C$ y $\ln|·|$ con valor absoluto, `tags` completos y coincidentes con la tabla.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `feat(analisis/brown/substitution): regenerar ítems de prueba y correcciones de la ronda`.
5. En el mensaje del commit, resumí: cuántos de los 15 ítems de prueba se corrigieron y por qué regla, y el conteo final por `tags` de cada skill.
