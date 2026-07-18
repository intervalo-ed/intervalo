# Prompt de refactor: white / functions / polynomial (LEXI + CLSF + FORM + GRAF)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de `definition`, `linear` y/o `quadratic` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

## Contexto

`topic-context.md` de este topic ya tenía, de una auditoría programática anterior (sección **"Estado (auditoría jul-2026)"**), el detalle de lo que falta para alinear `polynomial` con `authoring-context.md`: (1) `feedback_incorrect` faltante o duplicado ilegítimo del `feedback_correct` en los 200 ítems, (2) `\n\n` pegado a bloques `$$...$$`, (3) em-dash/en-dash, (4) explicaciones con viñetas, (5) `explanation` bajo el mínimo de caracteres, (6) `correct_index` sesgado (GRAF es el más urgente). Esa sección tiene el detalle línea por línea, no lo repito acá.

**Además**, durante una auditoría en vivo ítem por ítem (vía `/test`) se corrigieron 11 ítems puntuales que quedaron documentados en la sección **"Hallazgos de auditoría (ronda 1, jul-2026)"** de `topic-context.md`, con su `external_id`. Esos hallazgos son la evidencia concreta de patrones que **aparecen en todo el topic**, no solo en esos ítems: hay que revisar los 200 contra las mismas reglas, no solo los citados. La sección **"Correcciones de formato transversales de esta ronda"**, justo debajo, lista los 7 patrones concretos como checklist explícito.

**No es una regeneración desde cero.** No reescribas enunciados, opciones ni la respuesta correcta salvo que lo pida explícitamente `topic-context.md` o rompan una regla de formato. Es una pasada de **formato, feedback y estilo**.

## Recordatorio prioritario, antes de generar un solo ítem

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto. Chequealas en cada ítem a medida que lo escribís, no solo al final:

1. **Paridad de opciones (reglas críticas 4 y 15).** Ninguna opción puede quedar como la única notablemente más larga/elaborada NI la única más corta/pelada que el resto; tampoco la única con un formato numérico distinto (entera vs. decimal, con vs. sin glosa aclaratoria). Si notás esa asimetría en cualquier ítem, igualá hacia el medio antes de seguir con el próximo.
2. **Estructura de párrafos y LaTeX.** Párrafos de `explanation`/`question` ≤200 caracteres (ideal ~100); 2+ fragmentos LaTeX inline sueltos en el mismo párrafo se dividen (regla 21); la fórmula central del enunciado va separada del texto en su propio `$$...$$`, nunca tejida inline (regla 18); cualquier derivación de 2+ pasos va vertical en `\begin{aligned}`, nunca encadenada en una sola línea horizontal, y cada renglón tiene que ser corto por sí solo.
3. **Aligned solo para derivaciones reales (regla 30, nueva de la última ronda).** Un `\begin{aligned}` con columna de `=` se reserva para una ecuación que se despeja o una expresión que se transforma paso a paso; nunca para listar datos o valores evaluados de forma independiente, esos van en prosa.
4. **Reintroducir la definición central en cada ítem (regla 31, nueva).** Si la pregunta depende de una fórmula/definición que no está explícita en el propio enunciado, se reintroduce con LaTeX centrado antes de la pregunta puntual; nunca asumirla vista en otro ítem de la sesión.
5. **Openers y puntuación (regla 32, nueva).** Un imperativo con objeto concreto ("Considerá la función") es cláusula completa y solo necesita el `:` antes del bloque `$$...$$`; un fragmento sin objeto propio ("Sabiendo que", "Para derivar", "En") no se arregla con `:`, se reescribe como cláusula completa. En ambos casos, variar la redacción ítem a ítem, nunca repetir la misma apertura como plantilla en toda una sub-familia.

## Leer antes de escribir una sola línea, en este orden

1. `backend/content/authoring-context.md` completo. Además de las reglas ya vigentes desde `definition`/`linear`/`quadratic`, esta ronda agregó **5 reglas nuevas**, todas encontradas auditando `polynomial` en vivo:
   - **Preferencia (no obligatoria) por fórmula centrada sobre LaTeX inline** en `explanation`, cuando la fórmula es el objeto central del razonamiento (la función del ítem, un resultado intermedio). Sección *Modo inline vs. display*.
   - **Preferencia por notación LaTeX/simbólica sobre prosa en `options`**, no solo para evitar mezcla de registro: ante la duda, LaTeX gana. Sección *Redacción del enunciado* → *Notación consistente*.
   - **Cada línea dentro de un `\begin{aligned}` tiene que ser corta por sí sola.** Pasar a `aligned` resuelve amontonar varias asignaciones, no una sola línea cuyo lado derecho ya es ancho (una expansión de varios términos). Si un paso individual es largo, sumá un paso intermedio o simplificá. Sección *Enumeraciones de valores calculados*.
   - **`feedback_correct` está sujeto a la misma regla de fórmulas anchas** que `explanation`/`question`. Como debe ser 1 oración corta y no puede partirse en pasos, la solución es dejar solo la relación/resultado final ahí y mover cualquier derivación a `explanation`. Sección *Fórmulas anchas*.
   - **Nunca invocar derivadas, límites ni integrales** (ni ningún concepto fuera de la frontera matemática del cinturón) para justificar una conclusión, aunque simplifique la explicación. En `white` no existen todavía: usar evaluación en puntos, comportamiento en extremos por grado/signo del coeficiente principal, o lectura directa del gráfico. Regla crítica 12.
   - **Grilla 2×2**: límite **≤16 caracteres si la opción tiene LaTeX**, **≤25 si es texto plano**.
   - **Fórmulas anchas, nunca scroll horizontal**: nunca encadenar varias igualdades largas en una sola fórmula. Partir la derivación en varios bloques `$$...$$` cortos, apilados sin texto si el paso se entiende solo, o con una frase corta de transición si hace falta narrar.
2. `backend/content/gamification-context.md` — por qué se diseñan así los ejercicios. Sin cambios en esta ronda, solo contexto.
3. `backend/content/analisis/course-context.md` — estado matemático del alumno en `white` (sin límites, derivadas ni integrales todavía). **Especialmente relevante en este topic**: uno de los hallazgos de auditoría fue una `explanation` que usó una derivada para justificar monotonía; verificá que ninguno de los 200 ítems invoque conceptos fuera de esta frontera.
4. `backend/content/analisis/white/generation-instructions.md` — flujo y el checklist de self-critique. Ya incluye los checks de las 5 reglas nuevas de este punto 1 (agregados esta ronda) y el de `tags` (punto 6 más abajo).
5. `backend/content/analisis/white/functions/polynomial/topic-context.md` — este topic. Tiene la sección **"Estado (auditoría jul-2026)"** con el detalle programático de `feedback_incorrect`/formato/`correct_index` por skill, la sección **"Confusiones fuente para `feedback_incorrect`, por skill"**, la sección **"Hallazgos de auditoría (ronda 1, jul-2026)"** con los 11 `external_id` de ejemplo, la sección **"Correcciones de formato transversales de esta ronda"** con los 7 patrones como checklist, y la nueva sección **"Distribución objetivo, con `tags`"** con la tabla de sub-familias y su columna **Slug** para cada skill (ver siguiente punto).
6. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ítem lleva un campo nuevo `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill (punto anterior). Campo nuevo a agregar, no reemplaza nada existente.

## Objetivo

Sobre `LEXI.json`, `CLSF.json`, `FORM.json` y `GRAF.json` de `backend/content/analisis/white/functions/polynomial/` (50 ítems cada uno, 200 en total):

- Aplicar las correcciones de `topic-context.md` sección "Estado (auditoría jul-2026)": completar/reescribir `feedback_incorrect` en los 200 ítems (`array<string|null>` paralelo a `options`, nunca duplicado/parafraseo de `feedback_correct`), sacar `\n\n` pegado a bloques `$$...$$`, sacar em-dash/en-dash, reescribir explicaciones con viñetas a prosa de 3 partes, asegurar `explanation` ≥ 300 caracteres, rebalancear `correct_index` (GRAF es el más urgente, ver conteo actual en `topic-context.md`).
- Aplicar los 7 patrones de "Correcciones de formato transversales de esta ronda" a los 200 ítems, no solo a los 11 `external_id` citados en "Hallazgos de auditoría".
- Aplicar las 5 reglas globales nuevas del punto 1 de la sección anterior a los 200 ítems.
- **Agregar `tags` a los 200 ítems.** Cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill (cada una de las 4 skills tiene su propia tabla en `topic-context.md`, GRAF con sub-tablas por Tipo A/B/C). No inventes slugs nuevos, usá los ya definidos.
- **Preservar la distribución objetivo** por concepto/sub-tipo de cada skill definida en `topic-context.md`. Si al corregir formato notás que algún ítem no encaja en su concepto asignado, señalalo en el resumen final en vez de reclasificarlo silenciosamente.

**Expectativa de alcance, importante:** los `external_id` de "Hallazgos de auditoría" salieron de revisar una muestra al azar de 11 ítems, no los 200. Los patrones que aparecieron ahí (LaTeX inline en vez de centrado, derivaciones encadenadas sin partir, derivada usada fuera de frontera, glosas aclaratorias solo en la opción correcta, `feedback_correct` con fórmula ancha) fueron sistemáticos en esa muestra. Es esperable que la **mayoría** de las 200 `explanation` necesiten alguna reescritura por estas reglas, sumado a lo ya identificado en "Estado (auditoría jul-2026)" (que es aún más extenso: `feedback_incorrect` falta en más de 165/200 ítems). Presupuestá el tiempo del refactor en consecuencia, es el topic con más volumen de corrección pendiente hasta ahora.

## Qué SI está fuera de alcance

- No reescribas el contenido matemático (enunciado, opciones, respuesta correcta) salvo que lo pida `topic-context.md` o rompa una regla de formato/estilo.
- No agregues ni quites ítems (quedan 50 × 4 = 200).
- No cambies la distribución por concepto/sub-tipo.
- No toques otros topics ni otros belts.
- No modifiques `authoring-context.md`, `gamification-context.md`, `course-context.md`, `generation-instructions.md` ni `topic-context.md` — son insumo de lectura.

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ítem.** Escribí en el chat el plan: qué ítems de cada skill tocás, qué regla dispara cada cambio (de `topic-context.md` o de las nuevas globales), y cómo vas a completar/corregir `feedback_incorrect`. Dado el volumen (`feedback_incorrect` falta en la mayoría de los 200), puede convenir agrupar por patrón de violación en vez de listar ítem por ítem. Si tenés dudas de alcance, marcalas y seguí, no te bloquees esperando respuesta.

**Paso 2 — Ejecutar** el refactor sobre los 4 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist de self-critique de `generation-instructions.md` (ya incluye las 5 reglas nuevas de esta ronda) + el checklist transversal de `topic-context.md` ítem por ítem sobre los 200 ítems finales. Prestá atención especial a: derivadas/límites/integrales fuera de frontera, `feedback_correct` con fórmulas anchas, líneas individuales de `aligned` que igual desbordan. Incluí el chequeo de `tags`: contá cuántos ítems tienen cada slug por skill y verificá que coincide con la cantidad de la tabla de distribución.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `refactor(analisis/white/polynomial): formato, feedback_incorrect y convenciones globales`.
5. En el mensaje del commit, resumí: cuántos ítems de cada skill tenían `feedback_incorrect` vacío/duplicado y quedaron completados, cuántos casos de LaTeX inline se pasaron a centrado, cuántos casos de derivadas/límites fuera de frontera encontraste y corregiste, y si algún `graph_fn` de GRAF quedó con raíces o extremos fuera del `graph_view`.
