# Prompt de refactor: white / functions / exponential (LEXI + FORM + GRAF)

> **CLSF archivado (jul-2026):** se sacó de este topic al podar a un máximo de 3 ítems (skills) por topic. Contenido preservado en `backend/content/archive/analisis/white/functions/exponential/CLSF.json`. **No generar CLSF para este topic en esta ronda ni en futuras**; si el resto de este prompt todavía menciona CLSF, es una referencia histórica/de contexto, no una instrucción vigente.

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de `definition`, `linear`, `quadratic` y/o `polynomial` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

## Contexto

`topic-context.md` de este topic ya tenía, de una auditoría programática anterior (sección **"Estado (auditoría jul-2026)"**), el detalle de lo que falta para alinear `exponential` con `authoring-context.md`: `feedback_incorrect` vacío en los 200 ejercicios, `\n\n` pegado a bloques `$$...$$`, em-dash/en-dash, explicaciones con viñetas, `explanation` bajo el mínimo de caracteres (el defecto más extendido del tema, GRAF casi entero), `correct_index` sesgado. Esa sección tiene el detalle línea por línea, no lo repito acá.

**Además**, durante una auditoría en vivo ejercicio por ejercicio (vía `/test`) se corrigieron 8 ejercicios puntuales que quedaron documentados en la sección **"Hallazgos de auditoría (ronda 1, jul-2026)"** de `topic-context.md`, con su `external_id`.

**Importante, leer con atención:** 5 de esos 8 hallazgos **no son defectos puntuales de `exponential`**, son las mismas reglas que ya se habían detectado como sistémicas en el refactor de `polynomial` (párrafos largos, opción correcta más larga/elaborada, `feedback_correct` con fórmula ancha, rótulos tipo `"Nota:"`, y límites/derivadas fuera de la frontera del cinturón). Que se repitan en un topic sin relación conceptual con `polynomial` confirma que es un **sesgo de la generación original de todo el curso**, no de un tema puntual. Aplicá estas 5 reglas al 100% de los 200 ejercicios, no solo a los 8 citados.

**No es una regeneración desde cero.** No reescribas enunciados, opciones ni la respuesta correcta salvo que lo pida explícitamente `topic-context.md` o rompan una regla de formato. Es una pasada de **formato, feedback y estilo**.

## Recordatorio prioritario, antes de generar un solo ejercicio

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto. Chequealas en cada ejercicio a medida que lo escribís, no solo al final:

1. **Paridad de opciones (reglas críticas 4 y 15).** Ninguna opción puede quedar como la única notablemente más larga/elaborada NI la única más corta/pelada que el resto; tampoco la única con un formato numérico distinto (entera vs. decimal, con vs. sin glosa aclaratoria). Si notás esa asimetría en cualquier ejercicio, igualá hacia el medio antes de seguir con el próximo.
2. **Estructura de párrafos y LaTeX.** Párrafos de `explanation`/`question` ≤200 caracteres (ideal ~100); 2+ fragmentos LaTeX inline sueltos en el mismo párrafo se dividen (regla 21); la fórmula central del enunciado va separada del texto en su propio `$$...$$`, nunca tejida inline (regla 18); cualquier derivación de 2+ pasos va vertical en `\begin{aligned}`, nunca encadenada en una sola línea horizontal, y cada renglón tiene que ser corto por sí solo.
3. **Aligned solo para derivaciones reales (regla 30, nueva de la última ronda).** Un `\begin{aligned}` con columna de `=` se reserva para una ecuación que se despeja o una expresión que se transforma paso a paso; nunca para listar datos o valores evaluados de forma independiente, esos van en prosa.
4. **Reintroducir la definición central en cada ejercicio (regla 31, nueva).** Si la pregunta depende de una fórmula/definición que no está explícita en el propio enunciado, se reintroduce con LaTeX centrado antes de la pregunta puntual; nunca asumirla vista en otro ejercicio de la sesión.
5. **Openers y puntuación (regla 32, nueva).** Un imperativo con objeto concreto ("Considerá la función") es cláusula completa y solo necesita el `:` antes del bloque `$$...$$`; un fragmento sin objeto propio ("Sabiendo que", "Para derivar", "En") no se arregla con `:`, se reescribe como cláusula completa. En ambos casos, variar la redacción ejercicio a ejercicio, nunca repetir la misma apertura como plantilla en toda una sub-familia.

## Leer antes de escribir una sola línea, en este orden

1. `backend/content/authoring-context.md` completo. Reglas más relevantes para esta ronda, además de las ya vigentes desde `definition`/`linear`/`quadratic`/`polynomial`:
   - **Regla crítica 4 (longitud/formato pareja entre opciones), extendida esta ronda**: además de longitud y glosas aclaratorias, ahora también cubre **formato numérico**. Si 3 opciones comparten un patrón (ej. todas decimales/fraccionarias menores a 1) y la correcta es la única con formato distinto (entera, mayor a 1), se delata igual aunque el string no sea más largo.
   - **Preferencia (no obligatoria) por fórmula centrada sobre LaTeX inline** en `explanation`, cuando la fórmula es el objeto central del razonamiento.
   - **Preferencia por notación LaTeX/simbólica sobre prosa en `options`.**
   - **Cada línea dentro de un `\begin{aligned}` tiene que ser corta por sí sola.**
   - **`feedback_correct` está sujeto a la regla de fórmulas anchas**: 1 oración corta, sin encadenar una derivación completa.
   - **Nunca invocar derivadas, límites ni integrales** para justificar una conclusión, aunque simplifique la explicación. Regla crítica 12. Este topic tiene un caso propio en `feedback_incorrect`/`explanation` a vigilar, ver hallazgos.
   - **Aclaración nueva sobre cadenas cortas de igualdades**: una cadena de 2+ igualdades que entra cómoda en una sola línea sin overflow (ej. `$$5^{x+2}/5^x = 5^{(x+2)-x} = 5^2 = 25$$`) NO necesita partirse en `aligned` ni en bloques verticales. El criterio es ancho/legibilidad, no la cantidad de signos `=`.
   - **Grilla 2×2**: límite ≤16 caracteres si la opción tiene LaTeX, ≤25 si es texto plano.
2. `backend/content/gamification-context.md` — sin cambios en esta ronda, solo contexto.
3. `backend/content/analisis/course-context.md` — estado matemático del alumno en `white` (sin límites, derivadas ni integrales todavía). **Relevante en este topic**: `white_exponential_CLSF_38` usó notación de límite y `white_exponential_LEXI_22` usó la palabra "derivada"; revisar los 200 ejercicios por si hay más casos, sobre todo en explicaciones de comportamiento en $\pm\infty$.
4. `backend/content/analisis/white/generation-instructions.md` — flujo y checklist de self-critique, ya incluye los checks de todas las reglas nuevas hasta la fecha.
5. `backend/content/analisis/white/functions/exponential/topic-context.md` — este topic. Tiene la sección **"Auditoría de los 36 originales (junio 2026)"** y **"Estado (auditoría jul-2026)"** con el detalle programático, **"Confusiones fuente para `feedback_incorrect`, por skill"**, **"Hallazgos de auditoría (ronda 1, jul-2026)"** con los 8 `external_id` y la nota de sesgo sistémico, y la nueva sección **"Distribución objetivo, con `tags`"** con la tabla de sub-familias y su columna **Slug** para cada skill.
6. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ejercicio lleva un campo nuevo `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `LEXI.json`, `CLSF.json`, `FORM.json` y `GRAF.json` de `backend/content/analisis/white/functions/exponential/` (50 ejercicios cada uno, 200 en total):

- Aplicar las correcciones de `topic-context.md` sección "Estado (auditoría jul-2026)": completar `feedback_incorrect` en los 200 ejercicios (hoy vacío en todos), sacar `\n\n` pegado a bloques `$$...$$`, sacar em-dash/en-dash, reescribir explicaciones con viñetas a prosa de 3 partes, asegurar `explanation` ≥ 300 caracteres (foco especial en GRAF y FORM), rebalancear `correct_index`.
- Aplicar las 5 reglas confirmadas como sesgo sistémico (ver "Contexto" arriba) a los 200 ejercicios, no solo a los 8 `external_id` citados en "Hallazgos de auditoría".
- Aplicar la extensión de la regla crítica 4 (formato numérico de las opciones) y la aclaración de cadenas cortas de igualdades.
- **Agregar `tags` a los 200 ejercicios.** Cada ejercicio lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill (GRAF con sub-tablas por Tipo A/B/C). No inventes slugs nuevos.
- **Preservar la distribución objetivo** por concepto/sub-tipo de cada skill definida en `topic-context.md`. Si notás que algún ejercicio no encaja en su concepto asignado, señalalo en el resumen final en vez de reclasificarlo silenciosamente.
- **Revisar puntualmente** `white_exponential_LEXI_22` (usa "derivada" como parte del contenido correcto del ejercicio, no solo de la explicación) y decidir si reformular sin ese concepto o marcarlo como `[PENDIENTE]` para que el humano decida.

**Expectativa de alcance, importante:** los `external_id` de "Hallazgos de auditoría" salieron de revisar una muestra al azar de 8 ejercicios, no los 200. Sumado a que `feedback_incorrect` falta en el 100% de los ejercicios (ya documentado desde antes), y a que 5 de las reglas de esta ronda son sesgo confirmado en dos topics seguidos, es esperable que la **mayoría** de los 200 ejercicios necesiten alguna corrección. Presupuestá el tiempo en consecuencia.

## Qué SI está fuera de alcance

- No reescribas el contenido matemático (enunciado, opciones, respuesta correcta) salvo que lo pida `topic-context.md` o rompa una regla de formato/estilo.
- No agregues ni quites ejercicios (quedan 50 × 4 = 200).
- No cambies la distribución por concepto/sub-tipo.
- No toques otros topics ni otros belts.
- No modifiques `authoring-context.md`, `gamification-context.md`, `course-context.md`, `generation-instructions.md` ni `topic-context.md` — son insumo de lectura.

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ejercicio.** Escribí en el chat el plan: qué ejercicios de cada skill tocás, qué regla dispara cada cambio, y cómo vas a completar `feedback_incorrect` (hoy vacío en el 100%). Dado el volumen, puede convenir agrupar por patrón de violación en vez de listar ejercicio por ejercicio. Si tenés dudas de alcance, marcalas y seguí.

**Paso 2 — Ejecutar** el refactor sobre los 4 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist de self-critique de `generation-instructions.md` + el checklist transversal de `topic-context.md` ejercicio por ejercicio sobre los 200 ejercicios finales. Prestá atención especial a: derivadas/límites fuera de frontera, longitud/formato de opciones, `feedback_correct` con fórmulas anchas, rótulos tipo "Nota:". Incluí el chequeo de `tags`: contá cuántos ejercicios tienen cada slug por skill y verificá que coincide con la tabla de distribución.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `refactor(analisis/white/exponential): formato, feedback_incorrect y convenciones globales`.
5. En el mensaje del commit, resumí: cuántos ejercicios tenían `feedback_incorrect` vacío y quedaron completados, cuántos casos de las 5 reglas sistémicas encontraste y corregiste por tipo, y qué decidiste sobre `LEXI_22`.
