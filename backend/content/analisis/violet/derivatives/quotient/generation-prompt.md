# Prompt de refactor: analisis / violet / derivatives / quotient (ESTR + RESL)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de `limit_definition` u otro topic de `violet/derivatives`, `blue/limits` o `white/functions` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

> **Alcance de la ronda 2 (importante):** en esta ronda **no se generan ítems nuevos**. Cada skill de este topic tiene **15 ítems de prueba** y el trabajo es **regenerarlos/corregirlos en el lugar** contra los hallazgos y todas las reglas, **sin agregar ni quitar ninguno**. Completar cada skill hasta 50 ítems es trabajo de la **ronda 3**, posterior y solo si la ronda 2 quedó validada. Donde más abajo este prompt diga "completar hasta 50", "ítems nuevos" o "los N ítems finales", interpretalo como esos 15 ítems existentes.

## Contexto

Este topic hoy tiene ítems de prueba (no los 50×2=100 de la meta). En la **ronda 2** solo se **regeneran y corrigen los 15 ítems de prueba que ya existen** por skill, sin agregar nuevos (ver el callout de alcance arriba). Además, `external_id` se regenera al reseedear (rompe progreso guardado en DB, ya asumido).

Una auditoría en vivo (`/test`) encontró, documentado en `topic-context.md` sección **"Hallazgos de auditoría (ronda 2, jul-2026)"**:
- `ESTR_04`/`ESTR_05`: la opción correcta llevaba `"Múltiplo escalar (linealidad)"`, un paréntesis aclaratorio que la delataba frente a las demás sin glosa. Ya corregido el texto prescripto en `topic-context.md` a `"Múltiplo escalar"` sin paréntesis.
- `RESL_10`/`RESL_12`: opciones numéricas rellenas con `"solamente"` de forma asimétrica frente a otras con 2 valores.

Esto no originó reglas nuevas (son reincidencias de las reglas críticas 4 y 15, ya existentes), pero es la evidencia concreta de que hay que auditar el 100% de los ítems contra esas reglas, no confiar en que sean puntuales.

**Esta ronda también agrega 3 reglas nuevas al snowball general** (originadas en otros topics de esta misma unidad, aplican igual acá): regla 30 (aligned solo para derivaciones reales), regla 31 (reintroducir la definición central en cada ítem) y regla 32 (sin openers cortos genéricos antes de un bloque `$$...$$`).

## Recordatorio prioritario, antes de generar un solo ítem

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto en esta unidad. Chequealas en cada ítem a medida que lo escribís, no solo al final:

1. **Paridad de opciones (reglas críticas 4 y 15).** Ninguna opción puede quedar como la única notablemente más larga/elaborada NI la única más corta/pelada que el resto; tampoco la única con glosa aclaratoria entre paréntesis o relleno textual ("solamente") que las demás no llevan. **Reincidencia confirmada en este mismo topic**, ver Contexto arriba.
2. **Estructura de párrafos y LaTeX.** Párrafos de `explanation`/`question` ≤200 caracteres (ideal ~100); 2+ fragmentos LaTeX inline sueltos en el mismo párrafo se dividen (regla 21); la fórmula central del enunciado va separada del texto en su propio `$$...$$`, nunca tejida inline (regla 18); cualquier derivación de 2+ pasos va vertical en `\begin{aligned}`, nunca encadenada en una sola línea horizontal.
3. **Aligned solo para derivaciones reales (regla 30, nueva).** Nunca alinear con `=` datos o valores evaluados de forma independiente (ej. $u(a)=0$, $v'(a)=1$ como líneas sueltas); esa alineación es solo para una ecuación que se despeja o una expresión que se transforma paso a paso.
4. **Sin openers cortos y genéricos (regla 32, nueva).** Nunca abrir con `"Sabiendo que"`, `"Para derivar"` pegado directo a un bloque `$$...$$` sin cerrar la oración. La introducción es sustantiva, varía ítem a ítem, cierra en `.`/`:`, y la pregunta arranca después en mayúscula. **Confirmado como patrón dominante en este topic** (todo `RESL` abre con `"Sabiendo que"`, la mitad de `ESTR` con `"Para derivar"`).

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen acumulado hasta la fecha (con la regla crítica entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de conceptos clave en negrita (regla 3): en este topic, `regla del cociente`, `numerador`, `denominador`.
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - **Paridad de opciones en ambos sentidos (regla 4 y su extensión 15), también de formato numérico. Sin paréntesis aclaratorio ni relleno tipo "solamente" en ninguna opción — reincidencia confirmada en este topic (`ESTR_04`/`ESTR_05`, `RESL_10`/`RESL_12`).**
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - Nunca invocar conceptos fuera de la frontera del cinturón (regla 12): en este topic, nunca justificar la regla del cociente por límite (se toma como fórmula conocida), ni usar regla de la cadena (ver regla dura del topic).
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
   - Nunca enmarcar un ítem respecto de otro ítem de la sesión; todo ítem abstracto sitúa el concepto desde la primera oración (regla 24): aplica sobre todo a sub-D de `RESL` (datos abstractos).
   - El concepto abstracto de la `explanation` justifica el porqué, no solo declara el qué (regla 25).
   - Un bloque `$$...$$` lleva solo símbolos y números, nunca una oración completa en español con `\text{...}` (regla 26).
   - Un límite lateral siempre lleva el punto de tendencia en el subíndice (regla 27, no aplica directo, este topic no usa laterales).
   - La fracción $\tfrac{0}{0}$ apilada nunca va tejida dentro de un párrafo de prosa; usar la forma horizontal `0/0` (regla 28, no aplica directo, este topic no trabaja indeterminaciones).
   - En el desarrollo `aligned` de un límite, `\lim` se repite en TODAS las líneas (regla 29, no aplica directo, este topic no desarrolla límites, ver en cambio la regla 30 más abajo).
   - **Regla 30 (nueva): un `aligned` con columna de `=` es solo para una ecuación que se despeja o una expresión que se transforma paso a paso, nunca para listar datos evaluados de forma independiente** (ej. $u(a)$, $v(a)$, $u'(a)$, $v'(a)$ sueltos antes de aplicar la fórmula).
   - **Regla 31 (nueva): todo ítem reintroduce la definición/fórmula central que usa, sin asumir que el alumno ya la vio en otro ítem.** En este topic aplica a la fórmula de la regla del cociente misma: si un ítem de `RESL` la da por conocida sin nunca haberla escrito en el propio ítem, conviene citarla al menos una vez en la `explanation`.
   - **Regla 32 (nueva, confirmada como patrón dominante en este topic): sin openers cortos y genéricos pegados a un bloque `$$...$$` sin cerrar la oración.** Nada de `"Sabiendo que"` ni `"Para derivar"` repetidos como plantilla en todo un skill. Variar la redacción ítem a ítem.
   - Preferencia por fórmula centrada sobre LaTeX inline en `explanation` cuando la fórmula es el objeto central.
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options`.
   - Fórmulas anchas: nunca encadenar igualdades largas en una sola línea horizontal, partir en `\begin{aligned}` vertical; cada renglón corto por sí solo.
   - Grilla 2×2: ≤35 caracteres en `RESL` de este topic (ver cardinalidad propia).
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual", "escapar"/"escapa", y **"linealidad" a secas: siempre "múltiplo escalar", reincidencia confirmada en este topic**).
   - `explanation` ≥ 300 caracteres, estructura de 3 partes (concepto abstracto con el porqué, aplicación paso a paso, cierre útil).
2. `backend/content/analisis/course-context.md` — estado matemático del alumno en `violet`.
3. `backend/content/analisis/violet/derivatives/quotient/topic-context.md` — este topic. Tiene la **regla dura de restricción** (nada de regla de la cadena, cocientes anidados, denominador nulo, contextos cotidianos en RESL), la **distribución objetivo con `tags`** (ESTR 25/25, RESL 15/15/10/10), las **confusiones fuente** por skill, y **"Hallazgos de auditoría (ronda 2, jul-2026)"**.
4. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `ESTR.json` y `RESL.json` de `backend/content/analisis/violet/derivatives/quotient/`:

- **Regenerar los 15 ítems de prueba por skill que ya existen** (sin agregar ni quitar; completar a 50 es la ronda 3), partiendo de los ítems de prueba existentes.
- **Corregir los ítems existentes** contra los hallazgos: sacar el paréntesis `"(linealidad)"` de las opciones correctas afectadas, sacar el relleno `"solamente"` de las opciones numéricas afectadas, variar/cerrar correctamente las aperturas con el patrón de plantilla corta.
- **Respetar la regla dura de restricción** del topic: nada de regla de la cadena, cocientes anidados, denominador nulo en el punto de evaluación, contextos cotidianos en RESL.
- **Cada ítem lleva `"tags": ["<slug>"]`** según la tabla de distribución de su skill. No inventar slugs nuevos.
- **`feedback_incorrect` completo** en los 15 ítems de prueba por skill.
- **`correct_index` variado**, no concentrado en un solo índice.

## Qué SI está fuera de alcance

- No toques otros topics de `violet/derivatives` ni otros belts.
- No modifiques `authoring-context.md`, `course-context.md` ni `topic-context.md` — son insumo de lectura.
- No relajes la regla dura de restricción del topic.

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ítem.** Escribí en el chat el plan: qué corrección aplica a cada ítem de prueba existente por sub-familia, qué pasa con los existentes, y cómo quedaría reescrita la opción de `ESTR_04`/`ESTR_05` sin el paréntesis y una apertura de `RESL` sin el opener corto, antes de escribir el resto.

**Paso 2 — Ejecutar** la generación/corrección sobre los 2 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist transversal + por skill de `topic-context.md` sobre los 15 ítems de prueba por skill. Prestá atención especial a: regla dura de restricción (cero tolerancia), paridad de opciones sin paréntesis/relleno (reincidencia confirmada), regla 30 (aligned solo para derivaciones reales), regla 32 (sin openers cortos), `tags` completos y coincidentes con la tabla.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `feat(analisis/violet/quotient): regenerar ítems de prueba y reglas globales de la ronda`.
5. En el mensaje del commit, resumí: cuántos de los 15 ítems de prueba se corrigieron y por qué regla, y el conteo final por `tags` de cada skill.
