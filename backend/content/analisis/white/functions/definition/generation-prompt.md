# Prompt de refactor: white / functions / definition (LEXI + CLSF)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe**, hacé checkout y segui trabajando ahí (no crees una nueva ni la pises).
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

## Contexto

Acabamos de auditar a mano los 100 ítems de este topic (`LEXI.json` + `CLSF.json`, 50 cada uno) jugándolos en el modo `/test` de la app. Encontramos violaciones sistemáticas de estilo y formalidad, y de paso actualizamos las convenciones globales de todo el curso en `authoring-context.md`. Este refactor aplica esas convenciones actualizadas a los 100 ítems de este topic puntual.

**No es una regeneración desde cero ni un cambio de distribución/cantidades.** La distribución por concepto (dominio, imagen, codominio, etc.) y las cantidades exactas de `topic-context.md` ya están bien y no se tocan. Es una pasada de **estilo, terminología y formato** sobre el contenido existente.

## Leer antes de escribir una sola línea, en este orden

**Nota de actualización:** este prompt se escribió en la ronda de auditoría de `definition`, antes de que el resto de la unidad (`linear` hasta `trigonometric`) se auditara y acumulara ~15 reglas críticas más en `authoring-context.md`. Cuando lo ejecutes, **leé `authoring-context.md` completo, no solo el resumen de abajo** — el resumen existe para que no dependas de memoria, pero el documento fuente manda si hay cualquier diferencia.

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen de todas las reglas críticas acumuladas a la fecha (con su número de regla entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de `dominio`/`imagen`/`codominio`/`preimagen`/`unicidad` en negrita (regla 3).
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - **Paridad de opciones, en ambos sentidos**: ni la única más larga/elaborada, ni la única más corta/menos elaborada (regla 4 y su extensión 15). También paridad de *formato numérico*.
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - **"Función", nunca "regla"**, salvo nombre propio ("regla del producto", "regla de la cadena") (regla 8).
   - **Nunca cortar una oración a la mitad con una fórmula display en el medio** (regla 9): el fragmento antes del `$$` cierra en punto o dos puntos, lo que sigue es oración nueva. Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - **Nunca invocar derivadas, límites ni integrales** para justificar una conclusión (regla 12). Confirmado como sesgo sistémico en `polynomial` → `exponential` → `logarithmic`.
   - Máximo 1 aclaración entre paréntesis/comillas por oración (regla 13).
   - **NUNCA usar los símbolos ✓/✗/✘** en ningún campo (regla 14).
   - **En un `\begin{aligned}`, nunca una línea de puro texto (`\text{...}`) sin `&`** si el resto de las líneas sí tienen `&` (regla 16). **Un `aligned` va SIEMPRE en `$$...$$`, nunca en `$...$` inline**, con un solo `\\` por salto de línea (regla 17b, bug de render real encontrado en `trigonometric`).
   - **Todo párrafo cierra con puntuación terminal** (regla 17).
   - La fórmula central del `question` va separada del texto, nunca tejida inline, sobre todo si es una fracción (regla 18).
   - Opciones compuestas no repiten la etiqueta de eje/variable si la pregunta ya fija el orden (regla 19).
   - En `options` con fracciones cortas para grilla 2×2, notación de barra (`1/3`) sobre `\frac`/`\dfrac` (regla 20).
   - 2+ fragmentos LaTeX inline en el mismo párrafo de `explanation` es señal de dividir el párrafo (regla 21).
   - En opciones `CLSF` que ya son una fórmula, sin nombre de familia entre paréntesis al lado (regla 22).
   - No restablecer en prosa, antes de la pregunta, rasgos de un gráfico que el gráfico ya muestra directamente (sección *Planteos de GRAF*, no aplica a este topic sin GRAF/graph_fn central, pero relevante si algún ítem usa gráfico).
   - Nueva sección **"Vocabulario: términos prohibidos y su reemplazo formal"**: tabla de palabras informales prohibidas ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual") y su reemplazo.
   - **Notación consistente dentro de un mismo `options`**: si una opción usa notación simbólica/LaTeX, ninguna otra puede ser prosa libre (ej. nunca `"Todos los reales"` al lado de `$a \geq 0$`; usar `$\mathbb{R}$`). Preferencia por LaTeX sobre prosa en general.
   - Fórmulas anchas: nunca encadenar igualdades largas en una fórmula, partir en `aligned`/bloques apilados; excepción: cadenas cortas que entran en una línea no necesitan partirse.
   - `feedback_correct`: 1 oración corta, sin encadenar una derivación completa.
   - Vocabulario prohibido, grilla 2×2 (≤16 con LaTeX, ≤25 texto plano), `explanation` ≥ 300 caracteres (no 250) con estructura de 3 partes.
2. `backend/content/gamification-context.md` — por qué se diseñan así los ejercicios (Core Drives, Sistema 1/2). Sin cambios, solo contexto.
3. `backend/content/analisis/course-context.md` — estado matemático del alumno en `white` (frontera: no existen límites, derivadas ni integrales todavía).
4. `backend/content/analisis/white/generation-instructions.md` — flujo, formato de output y el **checklist de self-critique**, ya incluye los checks de todas las reglas de arriba (constraints 1 a 41). No hace falta agregar checks adicionales, correlo completo.
5. `backend/content/analisis/white/functions/definition/topic-context.md` — este topic puntual. Tiene al final una sección **"Hallazgos de auditoría (ronda 1, 13/7)"** con 11 `external_id` concretos y qué violó cada uno. Son ejemplos, no la lista completa de lo que hay que corregir: la instrucción explícita ahí es revisar **los 100 ítems**, no solo esos 11. Las secciones "Distribución objetivo" de LEXI y CLSF ahora tienen una columna **Slug**: es el valor que va en el campo `tags` de cada ítem (ver siguiente punto).
6. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ítem lleva un campo nuevo `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución del punto anterior. Es contenido nuevo a agregar, no reemplaza nada existente.

## Objetivo

Refactorizar `backend/content/analisis/white/functions/definition/LEXI.json` y `CLSF.json` (50 ítems cada uno) para que cumplan:

- El checklist acumulado completo del punto 1 de arriba, en los 100 ítems, no solo en los 11 citados en `topic-context.md`.
- El checklist completo de `generation-instructions.md` (self-critique) — verificalo también, por si el contenido actual tiene regresiones previas a esta ronda.
- **Agregar `tags` a los 100 ítems.** Cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de `topic-context.md` (LEXI y CLSF, cada una con su propia tabla). No inventes slugs nuevos, usá los ya definidos en esas tablas.
- La distribución y cantidades exactas por concepto/sub-tipo definidas en `topic-context.md` (secciones "Distribución objetivo" de LEXI y CLSF) **no cambian**. Si al corregir estilo notás que algún ítem no encaja en su concepto asignado, señalalo en el resumen final en vez de reclasificarlo silenciosamente.

## Qué SI está fuera de alcance

- No agregues ni quites ítems (quedan 50 + 50).
- No cambies la distribución por concepto/sub-tipo.
- No toques otros topics ni otros belts.
- No modifiques `authoring-context.md`, `gamification-context.md`, `course-context.md` ni `generation-instructions.md` — ya están actualizados, son insumo de lectura.

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ítem.** Escribí en el chat (no en un archivo) el plan de qué vas a hacer: qué ítems de LEXI y CLSF tocás (idealmente todos los 100, uno por uno o agrupados por patrón de violación), qué regla de las 5 nuevas dispara cada cambio, y cómo pensás verificar al final. Si tenés dudas de alcance (por ejemplo, un ítem límite que no está claro si viola una regla), marcalas acá y segui, no te bloquees esperando respuesta.

**Paso 2 — Ejecutar el refactor** sobre `LEXI.json` y `CLSF.json` según el plan del paso 1.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist de self-critique de `generation-instructions.md` + el checklist acumulado completo ítem por ítem sobre los 100 ítems finales. Si algo falla, corregilo y volvé a revisar — no avances al commit con puntos rojos. Incluí el chequeo de `tags`: contá cuántos ítems tienen cada slug y verificá que coincide con la cantidad de la tabla de distribución.
2. Validá el formato con el seeder: desde `backend/`, `python -m seed_content --course analisis` (sin `--all`, para no tocar otros cursos) y revisá que no tire errores de validación sobre este topic. Si el repo tiene un modo dry-run documentado, preferilo; si no, correlo contra tu base local de prueba, no contra producción.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién cuando el checklist esté limpio y el seeder no tire errores, commiteá con mensaje tipo `refactor(analisis/white/definition): aplicar convenciones de terminología y formato (ronda 1)`.
5. En el mensaje del commit, resumí: cuántos ítems de cada `external_id` de la lista de hallazgos quedaron corregidos, y si encontraste algo adicional no listado que rompía alguna de las 5 reglas nuevas.
