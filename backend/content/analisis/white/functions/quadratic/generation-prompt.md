# Prompt de refactor: white / functions / quadratic (LEXI + CLSF + FORM + GRAF)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de `definition` y/o `linear` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

## Contexto

`topic-context.md` de este topic documenta que los 200 ítems (LEXI, CLSF, FORM, GRAF, 50 cada uno) están **validados en contenido** (enunciado, opciones, respuesta correcta) pero necesitan: (1) `feedback_incorrect` faltante o mal resuelto en 175/200 ítems, (2) correcciones de formato de estilo viejo (viñetas, em-dash, `\n\n` pegado a bloques display, `correct_index` sesgado), (3) preservar la distribución objetivo de cada skill. Esa sección ya tiene el detalle línea por línea, no lo repito acá.

**Además**, durante una auditoría en vivo ítem por ítem (vía `/test`) se corrigieron ~11 ítems puntuales que quedaron documentados en la sección **"Hallazgos de auditoría (ronda 1, jul-2026)"** de `topic-context.md`, con su `external_id`. Esos hallazgos son la evidencia concreta de patrones que **aparecen en todo el topic**, no solo en esos ítems: hay que revisar los 200 contra las mismas reglas, no solo los citados.

**No es una regeneración desde cero.** No reescribas enunciados, opciones ni la respuesta correcta salvo que lo pida explícitamente `topic-context.md` o rompan una regla de formato. Es una pasada de **formato, feedback y estilo**.

## Leer antes de escribir una sola línea, en este orden

**Nota de actualización:** este prompt se escribió antes de que el resto de los topics (`polynomial` hasta `trigonometric`) acumularan ~12 reglas críticas más en `authoring-context.md`. Cuando lo ejecutes, **leé `authoring-context.md` completo, no solo el resumen de abajo**.

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen de todas las reglas críticas acumuladas a la fecha (con su número de regla entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de conceptos clave en negrita donde `topic-context.md` lo marque (regla 3).
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - **Paridad de opciones, en ambos sentidos**: ni la única más larga/elaborada, ni la única más corta/menos elaborada (regla 4 y su extensión 15). También paridad de *formato numérico*.
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - **Nunca invocar derivadas, límites ni integrales** para justificar una conclusión (regla 12). Confirmado como sesgo sistémico en `polynomial` → `exponential` → `logarithmic`; auditá los 200 ítems de `quadratic` contra esta regla igual, no asumas que está libre.
   - Máximo 1 aclaración entre paréntesis/comillas por oración (regla 13).
   - **NUNCA usar los símbolos ✓/✗/✘** en ningún campo (regla 14).
   - **En un `\begin{aligned}`, nunca una línea de puro texto sin `&`** si el resto de las líneas sí tienen `&` (regla 16). **Un `aligned` va SIEMPRE en `$$...$$`, nunca en `$...$` inline**, con un solo `\\` por salto de línea (regla 17b, bug de render real encontrado en `trigonometric`, auditá los `aligned` de `GRAF`/`FORM` de este topic por las dudas).
   - **Todo párrafo cierra con puntuación terminal** (regla 17).
   - La fórmula central del `question` va separada del texto, nunca tejida inline, sobre todo si es una fracción (regla 18).
   - Opciones compuestas no repiten la etiqueta de eje/variable si la pregunta ya fija el orden (regla 19).
   - En `options` con fracciones cortas para grilla 2×2, notación de barra (`1/3`) sobre `\frac`/`\dfrac` (regla 20).
   - 2+ fragmentos LaTeX inline en el mismo párrafo de `explanation` es señal de dividir el párrafo (regla 21).
   - En opciones `CLSF` que ya son una fórmula, sin nombre de familia entre paréntesis al lado (regla 22).
   - No restablecer en prosa, antes de la pregunta, rasgos de un gráfico que el gráfico ya muestra directamente (sección *Planteos de GRAF*); relevante en `GRAF` de este topic.
   - **Grilla 2×2**: límite ≤16 caracteres si la opción tiene LaTeX, ≤25 si es texto plano. Ojo con `\;` en pares ordenados, preferí espacio común.
   - **Fórmulas anchas, nunca scroll horizontal**: nunca encadenar varias igualdades largas en una sola fórmula ni meter una expansión de varios términos inline. Partir en varios bloques `$$...$$` cortos.
   - **Fórmula display sin puntuación de cierre antes, y minúscula después**: el fragmento previo a un `$$...$$` cierra en `.` o `:`, la primera palabra después va en mayúscula.
   - `explanation` ≥ 300 caracteres (no 250), párrafos ≤200 caracteres. `feedback_incorrect` ideal 1 oración, 2 máximo.
2. `backend/content/gamification-context.md` — por qué se diseñan así los ejercicios. Sin cambios en esta ronda, solo contexto.
3. `backend/content/analisis/course-context.md` — estado matemático del alumno en `white` (sin límites, derivadas ni integrales todavía).
4. `backend/content/analisis/white/generation-instructions.md` — flujo y el checklist de self-critique, ya incluye los checks de todas las reglas de arriba (constraints 1 a 41). No hace falta agregar checks adicionales, correlo completo.
5. `backend/content/analisis/white/functions/quadratic/topic-context.md` — este topic. Tiene la sección **"Correcciones de `explanation` de esta ronda, checklist explícito"** con los 9 patrones concretos de corrección aplicados durante la auditoría (léela entera, es la guía más directa para esta ronda), la sección **"Hallazgos de auditoría"** con los `external_id` puntuales ya corregidos como referencia de ejemplo, la sección **"Correcciones de formato transversales"** con los defectos sistémicos detectados por skill, y las secciones "Distribución objetivo"/"Arquetipos de pregunta" por skill con la distribución a preservar (ahora con columna **Slug**, ver siguiente punto) y el detalle de `feedback_incorrect` faltante.
6. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ítem lleva un campo nuevo `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill (punto anterior). Campo nuevo a agregar, no reemplaza nada existente.

## Objetivo

Sobre `LEXI.json`, `CLSF.json`, `FORM.json` y `GRAF.json` de `backend/content/analisis/white/functions/quadratic/` (50 ítems cada uno, 200 en total):

- Aplicar las correcciones de formato listadas en `topic-context.md` (sección "Correcciones de formato transversales" + las específicas de cada skill).
- Completar/corregir `feedback_incorrect` en los 200 ítems siguiendo las reglas de *Pistas de `feedback_incorrect`* de `authoring-context.md` (voz descriptiva o segunda persona amable, nunca acusatoria; ideal 1 oración, 2 máximo; ideal ≤2 renglones, hasta 3 bien, 4 tope absoluto).
- **Agregar `tags` a los 200 ítems.** Cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill (cada una de las 4 skills tiene su propia tabla en `topic-context.md`). No inventes slugs nuevos, usá los ya definidos.
- Aplicar las reglas globales nuevas del punto 1 de la sección anterior a los 200 ítems, no solo a los ya señalados en "Hallazgos de auditoría".
- **Preservar la distribución objetivo** por concepto/sub-tipo de cada skill definida en `topic-context.md`. Si al corregir formato notás que algún ítem no encaja en su concepto asignado, señalalo en el resumen final en vez de reclasificarlo silenciosamente.

**Expectativa de alcance, importante:** los `external_id` de "Hallazgos de auditoría" en `topic-context.md` salieron de revisar una muestra al azar, no los 200 ítems. Los patrones que aparecieron ahí (párrafos de `explanation` demasiado largos, dos puntos usados como nexo de cláusula en vez de coma/punto, rótulo+dos puntos al abrir un párrafo, fórmula display sin puntuación de cierre antes seguida de minúscula, negrita faltante en primera mención de conceptos clave) fueron sistemáticos en esa muestra. Es esperable que la **mayoría** de las 200 `explanation` necesiten alguna reescritura de párrafos por estas reglas, no es un ajuste cosmético sobre un puñado de ítems: presupuestá el tiempo del refactor en consecuencia.

## Qué SI está fuera de alcance

- No reescribas el contenido matemático (enunciado, opciones, respuesta correcta) salvo que lo pida `topic-context.md` o rompa una regla de formato/estilo.
- No agregues ni quites ítems (quedan 50 × 4 = 200).
- No cambies la distribución por concepto/sub-tipo.
- No toques otros topics ni otros belts.
- No modifiques `authoring-context.md`, `gamification-context.md`, `course-context.md`, `generation-instructions.md` ni `topic-context.md` — son insumo de lectura.

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ítem.** Escribí en el chat el plan: qué ítems de cada skill tocás, qué regla dispara cada cambio (de `topic-context.md` o de las nuevas globales), y cómo vas a completar/corregir `feedback_incorrect`. Si tenés dudas de alcance, marcalas y seguí, no te bloquees esperando respuesta.

**Paso 2 — Ejecutar** el refactor sobre los 4 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist de self-critique de `generation-instructions.md` + el checklist acumulado completo ítem por ítem sobre los 200 ítems finales. Prestá atención especial al patrón de fórmula-display-sin-puntuación-antes / minúscula-después, y a fórmulas anchas fuera de párrafo. Incluí el chequeo de `tags`: contá cuántos ítems tienen cada slug por skill y verificá que coincide con la cantidad de la tabla de distribución. Si algo falla, corregí y volvé a revisar.
2. Validá el formato con el seeder: desde `backend/`, `python -m seed_content --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `refactor(analisis/white/quadratic): formato, feedback_incorrect y convenciones globales`.
5. En el mensaje del commit, resumí: cuántos ítems de cada skill tenían `feedback_incorrect` vacío/mal resuelto y quedaron completados, qué correcciones de formato de `topic-context.md` se aplicaron, cuántos casos del patrón fórmula-display-sin-puntuación encontraste y corregiste, y si algún `graph_fn` de GRAF excedía `|a| > 0.5` o tenía raíces fuera del `graph_view`.
