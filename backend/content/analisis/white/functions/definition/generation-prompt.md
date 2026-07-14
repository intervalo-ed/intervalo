# Prompt de refactor: white / functions / definition (LEXI + CLSF)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe**, hacé checkout y segui trabajando ahí (no crees una nueva ni la pises).
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

## Contexto

Acabamos de auditar a mano los 100 ítems de este topic (`LEXI.json` + `CLSF.json`, 50 cada uno) jugándolos en el modo `/test` de la app. Encontramos violaciones sistemáticas de estilo y formalidad, y de paso actualizamos las convenciones globales de todo el curso en `authoring-context.md`. Este refactor aplica esas convenciones actualizadas a los 100 ítems de este topic puntual.

**No es una regeneración desde cero ni un cambio de distribución/cantidades.** La distribución por concepto (dominio, imagen, codominio, etc.) y las cantidades exactas de `topic-context.md` ya están bien y no se tocan. Es una pasada de **estilo, terminología y formato** sobre el contenido existente.

## Leer antes de escribir una sola línea, en este orden

1. `backend/content/authoring-context.md` — convenciones globales de redacción, actualizado hoy con:
   - Regla crítica 8: **"función", nunca "regla"** como sinónimo del objeto matemático (reservar "regla" solo para nombres propios: "regla del producto", "regla de la cadena").
   - Regla crítica 9 + sección *Redacción del enunciado* → *Sin preámbulos colgantes*: **nunca cortar una oración a la mitad** para insertar una fórmula display en el medio. El fragmento antes del `$$` cierra en punto o dos puntos; lo que sigue después es oración nueva, no la continuación de la misma oración.
   - Nueva sección **"Vocabulario: términos prohibidos y su reemplazo formal"**: tabla completa de palabras informales prohibidas ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual") y su reemplazo.
   - Nueva regla en *Redacción del enunciado*: **notación consistente dentro de un mismo `options`** — si una opción usa notación simbólica/LaTeX, ninguna otra puede ser prosa libre (ej. nunca `"Todos los reales"` al lado de `$a \geq 0$`; usar `$\mathbb{R}$`).
   - Nueva regla en *Estructura de la explicación*: **un párrafo, una oración** — dentro de cada una de las 3 partes de `explanation`, si hace falta una segunda oración va en párrafo aparte (`\n\n`), nunca las dos juntas.
2. `backend/content/gamification-context.md` — por qué se diseñan así los ejercicios (Core Drives, Sistema 1/2). Sin cambios hoy, solo contexto.
3. `backend/content/analisis/course-context.md` — estado matemático del alumno en `white` (frontera: no existen límites, derivadas ni integrales todavía).
4. `backend/content/analisis/white/generation-instructions.md` — flujo, formato de output y el **checklist de self-critique** (sección "Self-critique, obligatorio antes de entregar"). Es agnóstico de modelo/interfaz (sirve igual para una Gem de Gemini que para vos trabajando directo sobre el repo): negrita en primera mención, `feedback_incorrect` sin acusar, `correct_index` balanceado, cardinalidad por tipo de respuesta, sin em-dash, sin nombres propios, etc. **Ese checklist todavía no incluye las 5 reglas nuevas del punto 1** (terminología, vocabulario prohibido, notación de opciones, corte de oración, un párrafo una oración) — agregalas vos como checks adicionales al correrlo.
5. `backend/content/analisis/white/functions/definition/topic-context.md` — este topic puntual. Tiene al final una sección **"Hallazgos de auditoría (ronda 1, 13/7)"** con 11 `external_id` concretos y qué violó cada uno. Son ejemplos, no la lista completa de lo que hay que corregir: la instrucción explícita ahí es revisar **los 100 ítems**, no solo esos 11.

## Objetivo

Refactorizar `backend/content/analisis/white/functions/definition/LEXI.json` y `CLSF.json` (50 ítems cada uno) para que cumplan:

- Las 5 reglas nuevas de `authoring-context.md` (punto 1 arriba), en los 100 ítems, no solo en los 11 citados en `topic-context.md`.
- El checklist completo de `generation-instructions.md` (self-critique), que ya cubría todo lo demás (negrita, formato de párrafos, `feedback_incorrect`, cardinalidad, `correct_index` balanceado, etc.) — verificalo también, por si el contenido actual tiene regresiones previas a esta ronda.
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
1. Corré el checklist de self-critique de `generation-instructions.md` + las 5 reglas nuevas ítem por ítem sobre los 100 ítems finales. Si algo falla, corregilo y volvé a revisar — no avances al commit con puntos rojos.
2. Validá el formato con el seeder: desde `backend/`, `python -m seed_content --course analisis` (sin `--all`, para no tocar otros cursos) y revisá que no tire errores de validación sobre este topic. Si el repo tiene un modo dry-run documentado, preferilo; si no, correlo contra tu base local de prueba, no contra producción.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién cuando el checklist esté limpio y el seeder no tire errores, commiteá con mensaje tipo `refactor(analisis/white/definition): aplicar convenciones de terminología y formato (ronda 1)`.
5. En el mensaje del commit, resumí: cuántos ítems de cada `external_id` de la lista de hallazgos quedaron corregidos, y si encontraste algo adicional no listado que rompía alguna de las 5 reglas nuevas.
