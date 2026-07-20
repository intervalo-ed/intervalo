# Prompt de refactor: analisis / violet / derivatives / geometric_interpretation (LEXI + GRAF + ESTR)

> **RESL archivado (jul-2026):** se sacó de este topic al podar a un máximo de 3 ítems (skills) por topic. Contenido preservado en `backend/content/archive/analisis/violet/derivatives/geometric_interpretation/RESL.json`. **No generar RESL para este topic en esta ronda ni en futuras**; si el resto de este prompt todavía menciona RESL, es una referencia histórica/de contexto, no una instrucción vigente.

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de otro topic de `violet/derivatives`, `blue/limits` o `white/functions` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

> **Alcance de la ronda 2 (importante):** en esta ronda **no se generan ejercicios nuevos**. Cada skill de este topic tiene **15 ejercicios de prueba** y el trabajo es **regenerarlos/corregirlos en el lugar** contra los hallazgos y todas las reglas, **sin agregar ni quitar ninguno**. Completar cada skill hasta 50 ejercicios es trabajo de la **ronda 3**, posterior y solo si la ronda 2 quedó validada. Donde más abajo este prompt diga "completar hasta 50", "ejercicios nuevos" o "los N ejercicios finales", interpretalo como esos 15 ejercicios existentes.

## Contexto

Este topic hoy tiene ejercicios de prueba (no los 50×4=200 de la meta). En la **ronda 2** solo se **regeneran y corrigen los 15 ejercicios de prueba que ya existen** por skill, sin agregar nuevos (ver el callout de alcance arriba).

No hubo ejercicios puntuales de este topic en el archivo de correcciones de esta ronda, pero el escaneo de los 4 archivos existentes (documentado en `topic-context.md` sección **"Hallazgos de auditoría (ronda 2, jul-2026)"**) confirma el mismo **patrón dominante de apertura corta** encontrado en el resto de la unidad: `RESL` abre con `"La recta tangente a una función en cierto punto es"` y `"Sabiendo que"`; `LEXI` con `"En la ecuación punto-pendiente..."`; `ESTR` con `"Sabiendo que"`. Ninguno cierra la oración antes del bloque `$$...$$`. Esto es una instancia más de la regla crítica 32, nueva en `authoring-context.md` esta ronda.

**Esta ronda también agrega las reglas críticas 30 y 31** (originadas en otros topics de esta misma unidad, aplican igual acá): aligned solo para derivaciones reales, y reintroducir la definición central en cada ejercicio.

## Recordatorio prioritario, antes de generar un solo ejercicio

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto en esta unidad. Chequealas en cada ejercicio a medida que lo escribís, no solo al final:

1. **Sin openers cortos y genéricos (regla 32, nueva, confirmado como patrón dominante en este topic).** Nunca abrir con `"La recta tangente a una función en cierto punto es"`, `"Sabiendo que"`, `"En la ecuación punto-pendiente"` pegado directo a un bloque `$$...$$` sin cerrar la oración. La introducción es sustantiva, varía ejercicio a ejercicio, cierra en `.`/`:`, y la pregunta arranca después en mayúscula.
2. **Aligned solo para derivaciones reales (regla 30, nueva).** Nunca alinear con `=` datos o valores evaluados de forma independiente.
3. **Reintroducir la definición central en cada ejercicio (regla 31, nueva).** Este topic gira en torno a la fórmula punto-pendiente $y = f'(a)(x-a) + f(a)$: cualquier ejercicio que la necesite para plantear su pregunta la reintroduce con LaTeX centrado.
4. **Paridad de opciones (reglas críticas 4 y 15).** Ninguna opción puede quedar como la única notablemente más larga/elaborada NI la única más corta/pelada que el resto.

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen acumulado hasta la fecha (con la regla crítica entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de conceptos clave en negrita (regla 3): en este topic, `recta tangente`, `recta secante`, `pendiente`, `punto de tangencia`, `aproximación lineal`, `paralelismo`, `Teorema del Valor Medio`.
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - Paridad de opciones en ambos sentidos (regla 4 y su extensión 15), también de formato numérico.
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - Nunca invocar conceptos fuera de la frontera del cinturón (regla 12): en este topic, nunca usar reglas prácticas de derivación ni funciones elementales (sin, cos, exp, log, √), ver regla dura 1 del topic.
   - Máximo 1 aclaración entre paréntesis/comillas por oración (regla 13).
   - NUNCA usar los símbolos ✓/✗/✘ en ningún campo (regla 14).
   - En un `\begin{aligned}`, nunca una línea de puro texto sin `&` si el resto de las líneas sí tienen `&` (regla 16).
   - Todo párrafo cierra con puntuación terminal (regla 17).
   - Un `\begin{aligned}` va SIEMPRE en `$$...$$`, nunca en `$...$` inline, con un solo `\\` por salto de línea (regla 17b).
   - La fórmula central del `question` va separada del texto, nunca tejida inline, sobre todo si es una fracción (regla 18).
   - Opciones compuestas no repiten la etiqueta de eje/variable si la pregunta ya fija el orden (regla 19).
   - En `options` con fracciones cortas de grilla 2×2, preferir notación de barra (`1/3`) sobre `\frac`/`\dfrac` (regla 20).
   - 2+ fragmentos LaTeX inline en el mismo párrafo de `explanation` es señal de dividir el párrafo (regla 21).
   - En opciones `CLSF` que ya son una fórmula, no agregar el nombre de familia entre paréntesis (regla 22, no aplica, este topic no tiene `CLSF`, ver regla dura 2 del topic).
   - Nunca enmarcar un ejercicio respecto de otro ejercicio de la sesión; todo ejercicio abstracto sitúa el concepto desde la primera oración (regla 24): aplica sobre todo a `LEXI` sub-A/C.
   - El concepto abstracto de la `explanation` justifica el porqué, no solo declara el qué (regla 25).
   - Un bloque `$$...$$` lleva solo símbolos y números, nunca una oración completa en español con `\text{...}` (regla 26).
   - Un límite lateral siempre lleva el punto de tendencia en el subíndice (regla 27, no aplica directo, este topic no usa laterales).
   - La fracción $\tfrac{0}{0}$ apilada nunca va tejida dentro de un párrafo de prosa (regla 28, no aplica directo, este topic no trabaja indeterminaciones).
   - En el desarrollo `aligned` de un límite, `\lim` se repite en TODAS las líneas (regla 29, no aplica directo, este topic no desarrolla límites, ver en cambio regla 30).
   - **Regla 30 (nueva): un `aligned` con columna de `=` es solo para una ecuación que se despeja o una expresión que se transforma paso a paso, nunca para listar datos evaluados de forma independiente.**
   - **Regla 31 (nueva): todo ejercicio reintroduce la definición/fórmula central que usa, sin asumir que el alumno ya la vio en otro ejercicio.** En este topic aplica a la fórmula punto-pendiente $y = f'(a)(x-a) + f(a)$.
   - **Regla 32 (nueva, confirmada como patrón dominante en este topic): sin openers cortos y genéricos pegados a un bloque `$$...$$` sin cerrar la oración.** Nada de `"La recta tangente a una función en cierto punto es"` ni `"Sabiendo que"` repetidos como plantilla.
   - Preferencia por fórmula centrada sobre LaTeX inline en `explanation` cuando la fórmula es el objeto central.
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options`.
   - Fórmulas anchas: nunca encadenar igualdades largas en una sola línea horizontal, partir en `\begin{aligned}` vertical; cada renglón corto por sí solo.
   - Grilla 2×2: ≤35 caracteres en `ESTR` de este topic (ver cardinalidad propia).
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual", "escapar"/"escapa", "linealidad" a secas).
   - `explanation` ≥ 300 caracteres, estructura de 3 partes (concepto abstracto con el porqué, aplicación paso a paso, cierre útil).
2. `backend/content/analisis/course-context.md` — estado matemático del alumno en `violet`.
3. `backend/content/analisis/violet/derivatives/geometric_interpretation/topic-context.md` — este topic. Tiene las **2 reglas duras de restricción** (solo lineales/cuadráticas o datos numéricos dados, sin `CLSF`), la **distribución objetivo con `tags`** por skill, las **confusiones fuente** por skill, y **"Hallazgos de auditoría (ronda 2, jul-2026)"**.
4. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ejercicio lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `LEXI.json`, `GRAF.json`, `ESTR.json` y `RESL.json` de `backend/content/analisis/violet/derivatives/geometric_interpretation/`:

- **Regenerar los 15 ejercicios de prueba por skill que ya existen** (sin agregar ni quitar; completar a 50 es la ronda 3), partiendo de los ejercicios de prueba existentes.
- **Corregir los ejercicios existentes** contra el patrón de apertura corta: variar la redacción ejercicio a ejercicio y cerrar siempre la oración introductoria antes del bloque `$$...$$`.
- **Respetar las 2 reglas duras de restricción**: solo funciones lineales/cuadráticas o datos numéricos dados (nada de funciones elementales ni reglas prácticas de derivación), y sin `CLSF` en este topic.
- **Cada ejercicio lleva `"tags": ["<slug>"]`** según la tabla de distribución de su skill. No inventar slugs nuevos.
- **`feedback_incorrect` completo** en los 15 ejercicios de prueba por skill.
- **`correct_index` variado**, no concentrado en un solo índice.

## Qué SI está fuera de alcance

- No toques otros topics de `violet/derivatives` ni otros belts.
- No modifiques `authoring-context.md`, `course-context.md` ni `topic-context.md` — son insumo de lectura.
- No relajes ninguna de las 2 reglas duras de restricción del topic.
- No agregues `CLSF` a este topic.

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ejercicio.** Escribí en el chat el plan: qué corrección aplica a cada ejercicio de prueba existente por sub-familia, qué pasa con los existentes, y cómo quedaría reescrita una apertura de cada skill (`LEXI`, `RESL`, `ESTR`) sin el opener corto, con redacción variada, antes de escribir el resto.

**Paso 2 — Ejecutar** la generación/corrección sobre los 4 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist transversal + por skill de `topic-context.md` sobre los 15 ejercicios de prueba por skill. Prestá atención especial a: las 2 reglas duras (cero tolerancia), regla 30 (aligned solo para derivaciones reales), regla 31 (fórmula punto-pendiente reintroducida en cada ejercicio que la necesite), regla 32 (sin openers cortos, redacción variada, confirmado como patrón dominante en este topic), `tags` completos y coincidentes con la tabla.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `feat(analisis/violet/geometric_interpretation): regenerar ejercicios de prueba y reglas globales de la ronda`.
5. En el mensaje del commit, resumí: cuántos de los 15 ejercicios de prueba se corrigieron y por qué regla, y el conteo final por `tags` de cada skill.
