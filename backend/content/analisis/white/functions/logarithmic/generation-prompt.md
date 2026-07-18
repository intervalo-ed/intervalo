# Prompt de refactor: white / functions / logarithmic (LEXI + CLSF + FORM + GRAF)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de `definition`, `linear`, `quadratic`, `polynomial` y/o `exponential` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

## Contexto

`topic-context.md` de este topic ya tenía, de una auditoría programática anterior (sección **"Estado (auditoría jul-2026)"**), el detalle de lo que falta para alinear `logarithmic` con `authoring-context.md`: `feedback_incorrect` vacío en los 200 ítems, `\n\n` pegado a bloques `$$...$$` (más de la mitad de LEXI y FORM), em-dash/en-dash, explicaciones con viñetas, `explanation` bajo el mínimo de caracteres (GRAF casi entero), `correct_index` sesgado (GRAF el más desparejo del curso, 31/50 en el índice 3). Esa sección tiene el detalle línea por línea, no lo repito acá.

**Además**, durante una auditoría en vivo ítem por ítem (vía `/test`) se corrigieron 12 ítems puntuales que quedaron documentados en la sección **"Hallazgos de auditoría (ronda 1, jul-2026)"** de `topic-context.md`, con su `external_id`.

## Recordatorio prioritario, antes de generar un solo ítem

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto. Chequealas en cada ítem a medida que lo escribís, no solo al final:

1. **Paridad de opciones (reglas críticas 4 y 15).** Ninguna opción puede quedar como la única notablemente más larga/elaborada NI la única más corta/pelada que el resto; tampoco la única con un formato numérico distinto (entera vs. decimal, con vs. sin glosa aclaratoria). Si notás esa asimetría en cualquier ítem, igualá hacia el medio antes de seguir con el próximo.
2. **Estructura de párrafos y LaTeX.** Párrafos de `explanation`/`question` ≤200 caracteres (ideal ~100); 2+ fragmentos LaTeX inline sueltos en el mismo párrafo se dividen (regla 21); la fórmula central del enunciado va separada del texto en su propio `$$...$$`, nunca tejida inline (regla 18); cualquier derivación de 2+ pasos va vertical en `\begin{aligned}`, nunca encadenada en una sola línea horizontal, y cada renglón tiene que ser corto por sí solo.
3. **Aligned solo para derivaciones reales (regla 30, nueva de la última ronda).** Un `\begin{aligned}` con columna de `=` se reserva para una ecuación que se despeja o una expresión que se transforma paso a paso; nunca para listar datos o valores evaluados de forma independiente, esos van en prosa.
4. **Reintroducir la definición central en cada ítem (regla 31, nueva).** Si la pregunta depende de una fórmula/definición que no está explícita en el propio enunciado, se reintroduce con LaTeX centrado antes de la pregunta puntual; nunca asumirla vista en otro ítem de la sesión.
5. **Openers y puntuación (regla 32, nueva).** Un imperativo con objeto concreto ("Considerá la función") es cláusula completa y solo necesita el `:` antes del bloque `$$...$$`; un fragmento sin objeto propio ("Sabiendo que", "Para derivar", "En") no se arregla con `:`, se reescribe como cláusula completa. En ambos casos, variar la redacción ítem a ítem, nunca repetir la misma apertura como plantilla en toda una sub-familia.

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Este es el topic con más reglas globales acumuladas hasta la fecha (5 topics de auditoría antes que este), y la experiencia de las rondas anteriores es que los ítems más viejos siguen violando reglas de rondas tempranas que ya no se repiten en el feedback puntual porque se dan por sabidas. **Aplicá el checklist completo a los 200 ítems, no solo las reglas "nuevas" de esta ronda.** Resumen de todo lo acumulado hasta `logarithmic` (con la regla crítica correspondiente entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de `dominio`/`imagen`/`codominio`/`preimagen`/`unicidad` en negrita (regla 3).
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - **Paridad de opciones, en ambos sentidos**: ni la única más larga/elaborada, ni la única más corta/menos elaborada (regla 4 y su extensión 15). También paridad de *formato numérico* (una opción entera/decimal/fraccionaria que rompe el patrón del resto delata igual, sin ser más larga).
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Regla general:"`, `"Verificación:"`, `"Ojo:"` (regla 11). **Reincidente en este topic: `FORM_09` (dos rótulos en el mismo ítem), `LEXI_42`.**
   - **Nunca invocar derivadas, límites ni integrales** para justificar una conclusión, aunque simplifique la explicación (regla 12). **Tercera confirmación seguida como sesgo sistémico** (`polynomial` → `exponential` → `logarithmic`): en este topic, `LEXI_42` y `LEXI_10` usaron notación de límite ($\lim_{x\to0^+}$) para justificar la asíntota vertical, cuando alcanza con razonamiento intuitivo (elevar la base a exponentes cada vez más negativos da resultados cada vez más chicos, sin cota).
   - Máximo 1 aclaración entre paréntesis/comillas por oración (regla 13).
   - **NUNCA usar los símbolos ✓/✗/✘** en ningún campo (regla 14, agregada esta ronda tras encontrarla 3 veces en la muestra: `LEXI_20`, `FORM_05`, `GRAF_29`).
   - **En un `\begin{aligned}`, nunca una línea de puro texto (`\text{...}`) sin `&`** si el resto de las líneas sí tienen `&` (regla 16, agregada esta ronda, `FORM_06`).
   - **Todo párrafo cierra con puntuación terminal** (regla 17, agregada esta ronda, `FORM_05`).
   - Preferencia por fórmula centrada sobre LaTeX inline cuando la fórmula es el objeto central del razonamiento (sección *Modo inline vs. display*).
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options` (sección *Redacción del enunciado*).
   - Fórmulas anchas: nunca encadenar igualdades largas en una fórmula, partir en `aligned`/bloques apilados; excepción: cadenas cortas de igualdades que entran en una línea sin desbordar no necesitan partirse (ver ejemplo de `5^{x+2}/5^x` en la sección *Enumeraciones de valores calculados*). En este topic, `FORM_47` sí necesitaba partirse (4 igualdades con términos largos).
   - Cada línea de un `aligned` tiene que ser corta por sí sola, aunque el bloque completo esté en `aligned`.
   - `feedback_correct` sujeto a la misma regla de fórmulas anchas: 1 oración corta, sin encadenar una derivación completa.
   - Nunca usar flecha `→` en prosa (solo dentro de una fórmula) — reincidente en `GRAF_29`.
   - Grilla 2×2: ≤16 caracteres con LaTeX, ≤25 en texto plano.
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual").
2. `backend/content/gamification-context.md` — sin cambios en esta ronda, solo contexto.
3. `backend/content/analisis/course-context.md` — estado matemático del alumno en `white` (sin límites, derivadas ni integrales todavía). Especialmente relevante acá por la reincidencia de límites señalada arriba.
4. `backend/content/analisis/white/generation-instructions.md` — flujo y checklist de self-critique, ya incluye los checks de todas las reglas nuevas hasta la fecha (constraints 26 a 34).
5. `backend/content/analisis/white/functions/logarithmic/topic-context.md` — este topic. Tiene **"Auditoría de los 36 originales (junio 2026)"** y **"Estado (auditoría jul-2026)"** con el detalle programático, **"Confusiones fuente para `feedback_incorrect`, por skill"**, **"Hallazgos de auditoría (ronda 1, jul-2026)"** con los 12 `external_id`, **"Guías de contenido específicas de `logarithmic`"** (2 guías sobre profundidad conceptual, no formato) y **"Distribución objetivo, con `tags`"** con la tabla de sub-familias y su columna **Slug** para cada skill.
6. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `LEXI.json`, `CLSF.json`, `FORM.json` y `GRAF.json` de `backend/content/analisis/white/functions/logarithmic/` (50 ítems cada uno, 200 en total):

- Aplicar las correcciones de `topic-context.md` sección "Estado (auditoría jul-2026)": completar `feedback_incorrect` en los 200 ítems, sacar `\n\n` pegado a bloques `$$...$$`, sacar em-dash/en-dash, reescribir explicaciones con viñetas a prosa de 3 partes, asegurar `explanation` ≥ 300 caracteres, rebalancear `correct_index` (GRAF es prioridad, 31/50 en el índice 3 hoy).
- Aplicar el checklist acumulado completo del punto 1 de arriba a los 200 ítems, no solo a los 12 `external_id` citados en "Hallazgos de auditoría".
- Aplicar las 2 guías de contenido de `topic-context.md` (explicar el *por qué* del dominio del logaritmo; derivar propiedades desde la exponencial) donde corresponda, especialmente en `FORM` (dominio) y `LEXI` (propiedades algebraicas).
- **Agregar `tags` a los 200 ítems.** Cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill (GRAF con sub-tablas por Tipo A/B/C). No inventes slugs nuevos.
- **Preservar la distribución objetivo** por concepto/sub-tipo de cada skill definida en `topic-context.md`. Si notás que algún ítem no encaja en su concepto asignado, señalalo en el resumen final en vez de reclasificarlo silenciosamente.

**Expectativa de alcance, importante:** los `external_id` de "Hallazgos de auditoría" salieron de revisar una muestra al azar de 12 ítems, no los 200. Sumado a que `feedback_incorrect` falta en el 100% de los ítems y a que varias reglas ya están confirmadas como sesgo sistémico de toda la generación (no solo de este topic), es esperable que la **mayoría** de los 200 ítems necesiten alguna corrección. Presupuestá el tiempo en consecuencia.

## Qué SI está fuera de alcance

- No reescribas el contenido matemático (enunciado, opciones, respuesta correcta) salvo que lo pida `topic-context.md` o rompa una regla de formato/estilo/contenido de las listadas.
- No agregues ni quites ítems (quedan 50 × 4 = 200).
- No cambies la distribución por concepto/sub-tipo.
- No toques otros topics ni otros belts.
- No modifiques `authoring-context.md`, `gamification-context.md`, `course-context.md`, `generation-instructions.md` ni `topic-context.md` — son insumo de lectura.

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ítem.** Escribí en el chat el plan: qué ítems de cada skill tocás, qué regla dispara cada cambio, y cómo vas a completar `feedback_incorrect` (hoy vacío en el 100%). Dado el volumen, puede convenir agrupar por patrón de violación en vez de listar ítem por ítem. Si tenés dudas de alcance, marcalas y seguí.

**Paso 2 — Ejecutar** el refactor sobre los 4 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist de self-critique de `generation-instructions.md` + el checklist transversal de `topic-context.md` ítem por ítem sobre los 200 ítems finales. Prestá atención especial a: símbolos ✓/✗, paridad de opciones en ambos sentidos, `aligned` con líneas de texto suelto, puntuación terminal, límites/derivadas fuera de frontera, flechas en prosa. Incluí el chequeo de `tags`: contá cuántos ítems tienen cada slug por skill y verificá que coincide con la tabla de distribución.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `refactor(analisis/white/logarithmic): formato, feedback_incorrect y convenciones globales`.
5. En el mensaje del commit, resumí: cuántos ítems tenían `feedback_incorrect` vacío y quedaron completados, cuántos casos de cada regla del checklist acumulado encontraste y corregiste, y si aplicaste las 2 guías de contenido en algún ítem puntual.
