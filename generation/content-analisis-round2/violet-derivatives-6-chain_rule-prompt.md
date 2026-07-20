# Prompt de refactor: analisis / violet / derivatives / chain_rule (ESTR + RESL)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de otro topic de `violet/derivatives`, `blue/limits` o `white/functions` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

> **Alcance de la ronda 2 (importante):** en esta ronda **no se generan ejercicios nuevos**. Cada skill de este topic tiene **15 ejercicios de prueba** y el trabajo es **regenerarlos/corregirlos en el lugar** contra los hallazgos y todas las reglas, **sin agregar ni quitar ninguno**. Completar cada skill hasta 50 ejercicios es trabajo de la **ronda 3**, posterior y solo si la ronda 2 quedó validada. Donde más abajo este prompt diga "completar hasta 50", "ejercicios nuevos" o "los N ejercicios finales", interpretalo como esos 15 ejercicios existentes.

## Contexto

Este topic hoy tiene ejercicios de prueba (no los 50×2=100 de la meta). En la **ronda 2** solo se **regeneran y corrigen los 15 ejercicios de prueba que ya existen** por skill, sin agregar nuevos (ver el callout de alcance arriba).

Una auditoría en vivo (`/test`) encontró, documentado en `topic-context.md` sección **"Hallazgos de auditoría (ronda 2, jul-2026)"**:
- `RESL_12`: la `explanation` alineaba con `=` en columna 3 líneas de un `\begin{aligned}` que en realidad eran datos evaluados de forma independiente ($h(\pi)=0$, $g'(h(\pi))=1$, $h'(\pi)=1$), no una cadena de transformación. **Este es el hallazgo que más claramente motivó la regla crítica 30**, nueva en `authoring-context.md` esta ronda.
- `RESL_14`: enunciado con 3 datos sueltos y la pregunta todo tejido inline en una sola oración; hubiese estado mejor con fórmula/datos centrados + 2 oraciones (antes/después).

**Esta ronda también agrega las reglas críticas 31 y 32** (originadas en `limit_definition`, aplican igual acá): reintroducir la definición central en cada ejercicio, y sin openers cortos genéricos antes de un bloque `$$...$$`.

## Recordatorio prioritario, antes de generar un solo ejercicio

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto en esta unidad. Chequealas en cada ejercicio a medida que lo escribís, no solo al final:

1. **Aligned solo para derivaciones reales (regla 30, nueva, el hallazgo que la motivó salió de este mismo topic, `RESL_12`).** Nunca alinear con `=` datos o valores evaluados de forma independiente ($h(a)=0$, $g'(h(a))=1$ como líneas sueltas); esa alineación es solo para una ecuación que se despeja o una expresión que se transforma paso a paso.
2. **Enunciados con datos abstractos: fórmula/datos centrados + 2 oraciones, no todo inline (reincidencia confirmada en `RESL_14`).**
3. **Openers y puntuación (regla 32, nueva).** `"Considerá la función"` es una cláusula completa (verbo + objeto), solo le falta el `:` antes del bloque `$$...$$`, no hace falta reescribirla. En cambio `"Sabiendo que"` es un fragmento sin objeto propio: agregarle `:` no lo arregla, hay que reescribirlo como cláusula completa. En los dos casos, variar la redacción ejercicio a ejercicio en vez de repetir la misma apertura.
4. **Paridad de opciones (reglas críticas 4 y 15).** Ninguna opción puede quedar como la única notablemente más larga/elaborada NI la única más corta/pelada que el resto.

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen acumulado hasta la fecha (con la regla crítica entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de conceptos clave en negrita (regla 3): en este topic, `regla de la cadena`, `función compuesta`, `capa exterior`, `capa interior`.
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - Paridad de opciones en ambos sentidos (regla 4 y su extensión 15), también de formato numérico.
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - Nunca invocar conceptos fuera de la frontera del cinturón (regla 12): en este topic, nunca justificar la regla de la cadena por límite (ver regla dura del topic).
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
   - Nunca enmarcar un ejercicio respecto de otro ejercicio de la sesión; todo ejercicio abstracto sitúa el concepto desde la primera oración (regla 24): aplica sobre todo a sub-C de `RESL` (datos abstractos).
   - El concepto abstracto de la `explanation` justifica el porqué, no solo declara el qué (regla 25).
   - Un bloque `$$...$$` lleva solo símbolos y números, nunca una oración completa en español con `\text{...}` (regla 26).
   - Un límite lateral siempre lleva el punto de tendencia en el subíndice (regla 27, no aplica directo, este topic no usa laterales).
   - La fracción $\tfrac{0}{0}$ apilada nunca va tejida dentro de un párrafo de prosa (regla 28, no aplica directo, este topic no trabaja indeterminaciones).
   - **Regla 30 (nueva, el hallazgo más claro que la motivó salió de este mismo topic): un `aligned` con columna de `=` es solo para una ecuación que se despeja o una expresión que se transforma paso a paso, nunca para listar datos evaluados de forma independiente. Reincidencia confirmada en `RESL_12`.**
   - **Regla 31 (nueva): todo ejercicio reintroduce la definición/fórmula central que usa, sin asumir que el alumno ya la vio en otro ejercicio.** En este topic aplica a la fórmula $(g \circ h)'(x) = g'(h(x)) \cdot h'(x)$ misma.
   - **Regla 32 (nueva): un imperativo con objeto concreto (`"Considerá la función"`) solo necesita el `:` antes del bloque `$$...$$`; un fragmento sin objeto propio (`"Sabiendo que"`) necesita reescribirse como cláusula completa, el `:` no lo arregla.** En ambos casos, variar la redacción ejercicio a ejercicio, no repetir la misma apertura como plantilla.
   - Preferencia por fórmula centrada sobre LaTeX inline en `explanation` cuando la fórmula es el objeto central.
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options`.
   - Fórmulas anchas: nunca encadenar igualdades largas en una sola línea horizontal, partir en `\begin{aligned}` vertical; cada renglón corto por sí solo.
   - Grilla 2×2: ≤35 caracteres en `RESL` de este topic (ver cardinalidad propia).
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual", "escapar"/"escapa", y "linealidad" a secas: siempre "múltiplo escalar" en las opciones de `ESTR` que nombran este planteo, ya corregido en el texto exacto prescripto de `topic-context.md`).
   - `explanation` ≥ 300 caracteres, estructura de 3 partes (concepto abstracto con el porqué, aplicación paso a paso, cierre útil).
2. `backend/content/analisis/course-context.md` — estado matemático del alumno en `violet`.
3. `backend/content/analisis/violet/derivatives/chain_rule/topic-context.md` — este topic. Tiene la **regla dura de restricción** (máximo 2 capas, nada de interior compuesta por producto/cociente no trivial, contextos cotidianos en RESL), la **distribución objetivo con `tags`** (ESTR 25/25, RESL 20/20/10), las **confusiones fuente** por skill, y **"Hallazgos de auditoría (ronda 2, jul-2026)"**.
4. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ejercicio lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `ESTR.json` y `RESL.json` de `backend/content/analisis/violet/derivatives/chain_rule/`:

- **Regenerar los 15 ejercicios de prueba por skill que ya existen** (sin agregar ni quitar; completar a 50 es la ronda 3), partiendo de los ejercicios de prueba existentes.
- **Corregir los ejercicios existentes** contra los hallazgos: reescribir `RESL_12` separando datos evaluados (en prosa) del cálculo real (en su propio `aligned`), reescribir `RESL_14` con fórmula/datos centrados + 2 oraciones en vez de todo inline.
- **Respetar la regla dura de restricción** del topic: máximo 2 capas, interior con argumento elemental o lineal simple, nada de contextos cotidianos en RESL.
- **Cada ejercicio lleva `"tags": ["<slug>"]`** según la tabla de distribución de su skill. No inventar slugs nuevos.
- **`feedback_incorrect` completo** en los 15 ejercicios de prueba por skill.
- **`correct_index` variado**, no concentrado en un solo índice.

## Qué SI está fuera de alcance

- No toques otros topics de `violet/derivatives` ni otros belts.
- No modifiques `authoring-context.md`, `course-context.md` ni `topic-context.md` — son insumo de lectura.
- No relajes la regla dura de restricción del topic (máximo 2 capas, sin excepciones).

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ejercicio.** Escribí en el chat el plan: qué corrección aplica a cada ejercicio de prueba existente por sub-familia, qué pasa con los existentes, y cómo quedaría reescrito `RESL_12` (datos en prosa, cálculo real en su propio `aligned`) y `RESL_14` (fórmula/datos centrados + 2 oraciones) antes de escribir el resto.

**Paso 2 — Ejecutar** la generación/corrección sobre los 2 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist transversal + por skill de `topic-context.md` sobre los 15 ejercicios de prueba por skill. Prestá atención especial a: regla dura de restricción (máximo 2 capas, cero tolerancia), regla 30 (aligned solo para derivaciones reales, reincidencia confirmada), regla 32 (sin openers cortos), `tags` completos y coincidentes con la tabla.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `feat(analisis/violet/chain_rule): regenerar ejercicios de prueba y reglas globales de la ronda`.
5. En el mensaje del commit, resumí: cuántos de los 15 ejercicios de prueba se corrigieron y por qué regla, y el conteo final por `tags` de cada skill.
