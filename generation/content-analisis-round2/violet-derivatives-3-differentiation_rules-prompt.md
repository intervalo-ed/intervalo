# Prompt de refactor: analisis / violet / derivatives / differentiation_rules (FORM + ESTR + RESL)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de otro topic de `violet/derivatives`, `blue/limits` o `white/functions` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

> **Alcance de la ronda 2 (importante):** en esta ronda **no se generan ejercicios nuevos**. Cada skill de este topic tiene **15 ejercicios de prueba** y el trabajo es **regenerarlos/corregirlos en el lugar** contra los hallazgos y todas las reglas, **sin agregar ni quitar ninguno**. Completar cada skill hasta 50 ejercicios es trabajo de la **ronda 3**, posterior y solo si la ronda 2 quedó validada. Donde más abajo este prompt diga "completar hasta 50", "ejercicios nuevos" o "los N ejercicios finales", interpretalo como esos 15 ejercicios existentes.

## Contexto

Este topic reemplaza a `basic_rules` y hoy tiene ejercicios de prueba (no los 50×3=150 de la meta). En la **ronda 2** solo se **regeneran y corrigen los 15 ejercicios de prueba que ya existen** por skill, sin agregar nuevos (ver el callout de alcance arriba). `external_id` se regenera al reseedear (rompe progreso guardado en DB, ya asumido).

Una auditoría en vivo (`/test`) encontró, documentado en `topic-context.md` sección **"Hallazgos de auditoría (ronda 2, jul-2026)"**:
- `ESTR_05`: enunciado condensado en una sola oración cuando debería separarse en 2 párrafos (contexto del término dentro de una suma más grande + pregunta puntual).
- `ESTR_12`: patrón de apertura `"En\n$$f(x)=...$$\n¿pregunta?"` sin cerrar la oración antes del bloque, y la pregunta sin arrancar en mayúscula tras un cierre propio. **Esto originó la regla crítica 32**, nueva en `authoring-context.md` esta ronda.

**Esta ronda también agrega las reglas críticas 30 y 31** (originadas en otros topics de esta misma unidad, aplican igual acá): aligned solo para derivaciones reales, y reintroducir la definición central en cada ejercicio.

## Recordatorio prioritario, antes de generar un solo ejercicio

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto en esta unidad. Chequealas en cada ejercicio a medida que lo escribís, no solo al final:

1. **Sin openers cortos y genéricos (regla 32, nueva, reincidencia confirmada en `ESTR_12` de este topic).** Nunca abrir con `"En"` pegado directo a un bloque `$$...$$` sin cerrar la oración. La introducción es sustantiva, cierra en `.`/`:`, y la pregunta arranca después en mayúscula.
2. **Contexto + pregunta en párrafos separados cuando el término necesita situarse (reincidencia confirmada en `ESTR_05`).** Si el enunciado sitúa un término dentro de una expresión más grande, esa situación va en un párrafo propio antes de la pregunta puntual.
3. **Aligned solo para derivaciones reales (regla 30).** Nunca alinear con `=` datos o valores evaluados de forma independiente.
4. **Paridad de opciones (reglas críticas 4 y 15).** Ninguna opción puede quedar como la única notablemente más larga/elaborada NI la única más corta/pelada que el resto.

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen acumulado hasta la fecha (con la regla crítica entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de conceptos clave en negrita (regla 3): en este topic, `reglas de derivación`, `linealidad`, `regla de la potencia`, `regla de la constante`, `derivada elemental`.
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - Paridad de opciones en ambos sentidos (regla 4 y su extensión 15), también de formato numérico.
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - Nunca invocar conceptos fuera de la frontera del cinturón (regla 12): en este topic, nunca justificar una derivada elemental por límite, ni usar regla del producto/cociente/cadena (ver regla dura del topic).
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
   - Nunca enmarcar un ejercicio respecto de otro ejercicio de la sesión; todo ejercicio abstracto sitúa el concepto desde la primera oración (regla 24).
   - El concepto abstracto de la `explanation` justifica el porqué, no solo declara el qué (regla 25).
   - Un bloque `$$...$$` lleva solo símbolos y números, nunca una oración completa en español con `\text{...}` (regla 26).
   - Un límite lateral siempre lleva el punto de tendencia en el subíndice (regla 27, no aplica directo, este topic no usa laterales).
   - La fracción $\tfrac{0}{0}$ apilada nunca va tejida dentro de un párrafo de prosa (regla 28, no aplica directo, este topic no trabaja indeterminaciones).
   - En el desarrollo `aligned` de un límite, `\lim` se repite en TODAS las líneas (regla 29, no aplica directo, este topic no desarrolla límites).
   - **Regla 30 (nueva): un `aligned` con columna de `=` es solo para una ecuación que se despeja o una expresión que se transforma paso a paso, nunca para listar datos evaluados de forma independiente.**
   - **Regla 31 (nueva): todo ejercicio reintroduce la definición/fórmula central que usa, sin asumir que el alumno ya la vio en otro ejercicio.**
   - **Regla 32 (nueva, reincidencia confirmada en `ESTR_12` de este topic): sin openers cortos y genéricos pegados a un bloque `$$...$$` sin cerrar la oración.** Nada de `"En"` a secas antes de la fórmula.
   - Preferencia por fórmula centrada sobre LaTeX inline en `explanation` cuando la fórmula es el objeto central.
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options`.
   - Fórmulas anchas: nunca encadenar igualdades largas en una sola línea horizontal, partir en `\begin{aligned}` vertical; cada renglón corto por sí solo.
   - Grilla 2×2: ≤35 caracteres en `RESL` de este topic (ver cardinalidad propia).
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual", "escapar"/"escapa", "linealidad" a secas: siempre "múltiplo escalar" cuando se refiere al factor constante, distinto de la opción calificada `"Linealidad (suma/resta)"` de `ESTR` que sí puede mantenerse porque ya desambigua qué regla nombra).
   - `explanation` ≥ 300 caracteres, estructura de 3 partes (concepto abstracto con el porqué, aplicación paso a paso, cierre útil).
2. `backend/content/analisis/course-context.md` — estado matemático del alumno en `violet`.
3. `backend/content/analisis/violet/derivatives/differentiation_rules/topic-context.md` — este topic. Tiene la **regla dura de restricción** (fórmulas directas, nada de producto/cociente/cadena, nada por límite), la **distribución objetivo con `tags`** (FORM 35/15, ESTR 25/25, RESL 15/20/10/5), las **confusiones fuente** por skill, y **"Hallazgos de auditoría (ronda 2, jul-2026)"**.
4. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ejercicio lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `FORM.json`, `ESTR.json` y `RESL.json` de `backend/content/analisis/violet/derivatives/differentiation_rules/`:

- **Regenerar los 15 ejercicios de prueba por skill que ya existen** (sin agregar ni quitar; completar a 50 es la ronda 3), partiendo de los ejercicios de prueba existentes (trasladados del viejo `basic_rules`).
- **Corregir los ejercicios existentes** contra los hallazgos: separar `ESTR_05` en 2 párrafos (contexto + pregunta), reescribir la apertura de `ESTR_12` con una oración sustantiva antes del bloque `$$...$$`.
- **Respetar la regla dura de restricción** del topic: solo fórmulas directas, nada de producto/cociente/cadena, nada justificado por límite.
- **Cada ejercicio lleva `"tags": ["<slug>"]`** según la tabla de distribución de su skill. No inventar slugs nuevos.
- **`feedback_incorrect` completo** en los 15 ejercicios de prueba por skill.
- **`correct_index` variado**, no concentrado en un solo índice.

## Qué SI está fuera de alcance

- No toques otros topics de `violet/derivatives` ni otros belts.
- No modifiques `authoring-context.md`, `course-context.md` ni `topic-context.md` — son insumo de lectura.
- No relajes la regla dura de restricción del topic.

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ejercicio.** Escribí en el chat el plan: qué corrección aplica a cada ejercicio de prueba existente por sub-familia, qué pasa con los existentes, y cómo quedaría reescrito `ESTR_05` (2 párrafos) y `ESTR_12` (sin el opener corto) antes de escribir el resto.

**Paso 2 — Ejecutar** la generación/corrección sobre los 3 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist transversal + por skill de `topic-context.md` sobre los 15 ejercicios de prueba por skill. Prestá atención especial a: regla dura de restricción (cero tolerancia), regla 30 (aligned solo para derivaciones reales), regla 32 (sin openers cortos, reincidencia confirmada), `tags` completos y coincidentes con la tabla.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `feat(analisis/violet/differentiation_rules): regenerar ejercicios de prueba y reglas globales de la ronda`.
5. En el mensaje del commit, resumí: cuántos de los 15 ejercicios de prueba se corrigieron y por qué regla, y el conteo final por `tags` de cada skill.
