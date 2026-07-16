# Prompt de refactor: white / functions / rational (LEXI + CLSF + FORM + GRAF)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de `definition`, `linear`, `quadratic`, `polynomial`, `exponential` y/o `logarithmic` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

## Contexto

`topic-context.md` de este topic tiene, de una auditoría programática anterior (sección **"Estado (auditoría jul-2026)"**), el detalle de lo que falta para alinear `rational` con `authoring-context.md`: `feedback_incorrect` vacío en los 200 ítems, `explanation` bajo el mínimo de caracteres (el defecto dominante, GRAF prácticamente entero), `correct_index` con el sesgo más extremo de toda la unidad (84-86% de los ítems con la correcta en el índice 0, en los 4 skills). Esa sección tiene el detalle línea por línea, no lo repito acá.

**Además**, durante una auditoría en vivo ítem por ítem (vía `/test`) se corrigieron 15 ítems puntuales que quedaron documentados en la sección **"Hallazgos de auditoría (ronda 1, jul-2026)"** de `topic-context.md`, con su `external_id`. El hallazgo más importante de esta ronda es **nuevo**: la fórmula central del enunciado (`question`) no puede ir tejida inline dentro de la pregunta, sobre todo si es una fracción, tiene que ir en su propio bloque `$$...$$` centrado. Apareció en 6 de los 15 ítems corregidos (40% del batch), así que tratalo como default a revisar en los 200 ítems, no como algo puntual. También se detectó un **ítem roto** (`CLSF_39`, la pregunta no coincide con ninguna opción dada), a corregir/regenerar.

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Este es el topic con más reglas globales acumuladas hasta la fecha (6 topics de auditoría antes que este), y la experiencia de las rondas anteriores es que los ítems más viejos siguen violando reglas de rondas tempranas que ya no se repiten en el feedback puntual porque se dan por sabidas. **Aplicá el checklist completo a los 200 ítems, no solo las reglas "nuevas" de esta ronda.** Resumen de todo lo acumulado hasta `rational` (con la regla crítica correspondiente entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de `dominio`/`imagen`/`codominio`/`preimagen`/`unicidad` en negrita (regla 3).
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - **Paridad de opciones, en ambos sentidos**: ni la única más larga/elaborada, ni la única más corta/menos elaborada (regla 4 y su extensión 15). También paridad de *formato numérico* (una opción entera/decimal/fraccionaria que rompe el patrón del resto delata igual, sin ser más larga).
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Regla general:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - **Nunca invocar derivadas, límites ni integrales** para justificar una conclusión, aunque simplifique la explicación (regla 12). Confirmado como sesgo sistémico en `polynomial` → `exponential` → `logarithmic`; no apareció en la muestra corregida de `rational` pero auditá los 200 ítems igual, no asumas que este topic está libre solo porque no salió en el batch de feedback puntual.
   - Máximo 1 aclaración entre paréntesis/comillas por oración (regla 13).
   - **NUNCA usar los símbolos ✓/✗/✘** en ningún campo (regla 14).
   - **En un `\begin{aligned}`, nunca una línea de puro texto (`\text{...}`) sin `&`** si el resto de las líneas sí tienen `&` (regla 16).
   - **Todo párrafo cierra con puntuación terminal** (regla 17).
   - **Nueva esta ronda — regla 18: la fórmula central del `question` va separada del texto, nunca tejida inline, sobre todo si es una fracción.** Si hay dos fórmulas en el mismo enunciado, cada una en su propia oración/bloque, nunca juntas en una línea. Este es el hallazgo con más peso de la ronda de `rational` (6/15 ítems del batch).
   - **Nueva esta ronda — regla 19: opciones compuestas no repiten la etiqueta de eje/variable si la pregunta ya fija el orden** (ej. no hace falta "Eje $X$: ...; eje $Y$: ..." si la pregunta ya pidió ambos en ese orden).
   - **Nueva esta ronda: en GRAF/CLSF con gráfico, no restablecer en prosa antes de la pregunta rasgos que el gráfico ya muestra directamente** (distinto del contexto cotidiano real, que sigue siendo obligatorio cuando aplica). Ver sección *Planteos de GRAF* en `authoring-context.md`.
   - Preferencia por fórmula centrada sobre LaTeX inline cuando la fórmula es el objeto central del razonamiento, tanto en `explanation` (preferencia de estilo) como en `question` (regla crítica, ver punto anterior).
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options` (sección *Redacción del enunciado*).
   - Fórmulas anchas: nunca encadenar igualdades largas en una fórmula, partir en `aligned`/bloques apilados; excepción: cadenas cortas de igualdades que entran en una línea sin desbordar no necesitan partirse.
   - Cada línea de un `aligned` tiene que ser corta por sí sola, aunque el bloque completo esté en `aligned`.
   - `feedback_correct` sujeto a la misma regla de fórmulas anchas: 1 oración corta, sin encadenar una derivación completa.
   - Nunca usar flecha `→` en prosa (solo dentro de una fórmula).
   - Grilla 2×2: ≤16 caracteres con LaTeX, ≤25 en texto plano.
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual").
   - `explanation` ≥ 300 caracteres (no 250, umbral corregido tras `polynomial`), estructura de 3 partes.
2. `backend/content/gamification-context.md` — sin cambios en esta ronda, solo contexto.
3. `backend/content/analisis/course-context.md` — estado matemático del alumno en `white` (sin límites, derivadas ni integrales todavía).
4. `backend/content/analisis/white/generation-instructions.md` — flujo y checklist de self-critique, ya incluye los checks de todas las reglas nuevas hasta la fecha (constraints 26 a 37).
5. `backend/content/analisis/white/functions/rational/topic-context.md` — este topic. Tiene **"Estado (auditoría jul-2026)"** con el detalle programático, **"Confusiones fuente para `feedback_incorrect`, por skill"**, **"Hallazgos de auditoría (ronda 1, jul-2026)"** con los 15 `external_id` (incluido el ítem roto `CLSF_39`) y **"Distribución objetivo, con `tags`"** con la tabla de sub-familias y su columna **Slug** para cada skill (GRAF con sub-tablas por Tipo A/B/C).
6. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `LEXI.json`, `CLSF.json`, `FORM.json` y `GRAF.json` de `backend/content/analisis/white/functions/rational/` (50 ítems cada uno, 200 en total):

- Aplicar las correcciones de `topic-context.md` sección "Estado (auditoría jul-2026)": completar `feedback_incorrect` en los 200 ítems, asegurar `explanation` ≥ 300 caracteres con estructura de 3 partes, rebalancear `correct_index` (los 4 skills están sesgados al índice 0, prioridad máxima de esta unidad).
- Aplicar el checklist acumulado completo del punto 1 de arriba a los 200 ítems, no solo a los 15 `external_id` citados en "Hallazgos de auditoría".
- **Corregir el ítem roto `CLSF_39`**: la pregunta pide la función con imagen $\mathbb{R}$ pero ninguna opción tiene esa imagen. Reescribir la pregunta, las opciones, o ambas, para que sean consistentes.
- **Agregar `tags` a los 200 ítems.** Cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill (GRAF con sub-tablas por Tipo A/B/C). No inventes slugs nuevos.
- **Preservar la distribución objetivo** por concepto/sub-tipo de cada skill definida en `topic-context.md`. Si notás que algún ítem no encaja en su concepto asignado, señalalo en el resumen final en vez de reclasificarlo silenciosamente.

**Expectativa de alcance, importante:** los `external_id` de "Hallazgos de auditoría" salieron de revisar una muestra de 15 ítems, no los 200. Sumado a que `feedback_incorrect` falta en el 100% de los ítems, a que `correct_index` está sesgado casi al extremo en los 4 skills, y a que el hallazgo de fórmula-inline-en-question apareció en el 40% de la muestra corregida, es esperable que la **gran mayoría** de los 200 ítems necesiten alguna corrección. Presupuestá el tiempo en consecuencia.

## Qué SI está fuera de alcance

- No reescribas el contenido matemático (enunciado, opciones, respuesta correcta) salvo que lo pida `topic-context.md`, rompa una regla de formato/estilo/contenido de las listadas, o sea el caso puntual roto (`CLSF_39`).
- No agregues ni quites ítems (quedan 50 × 4 = 200).
- No cambies la distribución por concepto/sub-tipo.
- No toques otros topics ni otros belts.
- No modifiques `authoring-context.md`, `gamification-context.md`, `course-context.md`, `generation-instructions.md` ni `topic-context.md` — son insumo de lectura.

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ítem.** Escribí en el chat el plan: qué ítems de cada skill tocás, qué regla dispara cada cambio, y cómo vas a completar `feedback_incorrect` (hoy vacío en el 100%). Dado el volumen, puede convenir agrupar por patrón de violación en vez de listar ítem por ítem. Si tenés dudas de alcance, marcalas y seguí.

**Paso 2 — Ejecutar** el refactor sobre los 4 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist de self-critique de `generation-instructions.md` + el checklist transversal de `topic-context.md` ítem por ítem sobre los 200 ítems finales. Prestá atención especial a: fórmula central del `question` separada (no tejida inline), símbolos ✓/✗, paridad de opciones en ambos sentidos, opciones compuestas sin etiquetas redundantes, preámbulo de GRAF/CLSF sin restablecer rasgos ya visibles del gráfico, `aligned` con líneas de texto suelto, puntuación terminal, límites/derivadas fuera de frontera. Incluí el chequeo de `tags`: contá cuántos ítems tienen cada slug por skill y verificá que coincide con la tabla de distribución.
2. Validá el formato con el seeder: desde `backend/`, `python -m seed_content --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `refactor(analisis/white/rational): formato, feedback_incorrect y convenciones globales`.
5. En el mensaje del commit, resumí: cuántos ítems tenían `feedback_incorrect` vacío y quedaron completados, cuántos casos de cada regla del checklist acumulado encontraste y corregiste, si `CLSF_39` quedó resuelto, y cómo.
