# Prompt de refactor: white / functions / linear (LEXI + CLSF + FORM + GRAF)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de `definition` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

## Contexto

`topic-context.md` de este topic ya documentaba, desde antes de esta ronda, que los 200 ítems (LEXI, CLSF, FORM, GRAF, 50 cada uno) están **validados en contenido** (enunciado, opciones, respuesta correcta) pero necesitan: (1) correcciones de formato del estilo viejo, (2) agregar `feedback_incorrect` que hoy está vacío (`""`) en los 200 ítems, (3) preservar la distribución objetivo de cada skill. Esa sección ya tiene el detalle línea por línea, no la repito acá.

**Además**, desde el refactor de `definition` (ronda anterior) se actualizaron varias convenciones globales en `authoring-context.md` que también aplican acá. Este refactor de `linear` tiene que aplicar **ambas cosas**: lo que ya pedía `topic-context.md` + las convenciones globales nuevas.

**No es una regeneración desde cero.** No reescribas enunciados, opciones ni la respuesta correcta salvo que lo pida explícitamente `topic-context.md` o rompan una regla de formato. Es una pasada de **formato, feedback y estilo**.

## Leer antes de escribir una sola línea, en este orden

**Nota de actualización:** este prompt se escribió temprano en la auditoría de la unidad, antes de que el resto de los topics (`quadratic` hasta `trigonometric`) acumularan ~15 reglas críticas más en `authoring-context.md`. Cuando lo ejecutes, **leé `authoring-context.md` completo, no solo el resumen de abajo**.

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen de todas las reglas críticas acumuladas a la fecha (con su número de regla entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de conceptos clave en negrita (regla 3, para este topic aplica menos por no ser `definition`, pero verificá igual si `topic-context.md` marca algún término).
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - **Paridad de opciones, en ambos sentidos**: ni la única más larga/elaborada, ni la única más corta/menos elaborada (regla 4 y su extensión 15). También paridad de *formato numérico*.
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - **Nunca invocar derivadas, límites ni integrales** para justificar una conclusión (regla 12). Confirmado como sesgo sistémico en `polynomial` → `exponential` → `logarithmic`.
   - Máximo 1 aclaración entre paréntesis/comillas por oración (regla 13).
   - **NUNCA usar los símbolos ✓/✗/✘** en ningún campo (regla 14).
   - **En un `\begin{aligned}`, nunca una línea de puro texto sin `&`** si el resto de las líneas sí tienen `&` (regla 16). **Un `aligned` va SIEMPRE en `$$...$$`, nunca en `$...$` inline**, con un solo `\\` por salto de línea (regla 17b, bug de render real encontrado en `trigonometric`).
   - **Todo párrafo cierra con puntuación terminal** (regla 17).
   - La fórmula central del `question` va separada del texto, nunca tejida inline, sobre todo si es una fracción (regla 18).
   - Opciones compuestas no repiten la etiqueta de eje/variable si la pregunta ya fija el orden (regla 19).
   - En `options` con fracciones cortas para grilla 2×2, notación de barra (`1/3`) sobre `\frac`/`\dfrac` (regla 20).
   - 2+ fragmentos LaTeX inline en el mismo párrafo de `explanation` es señal de dividir el párrafo (regla 21).
   - En opciones `CLSF` que ya son una fórmula, sin nombre de familia entre paréntesis al lado (regla 22).
   - No restablecer en prosa, antes de la pregunta, rasgos de un gráfico que el gráfico ya muestra directamente (sección *Planteos de GRAF*); relevante en `GRAF` de este topic.
   - **Largo de párrafo**: máximo ~200 caracteres, ideal ~100. **Extensión mínima de `explanation`**: 300 caracteres totales (no 250).
   - **Grilla 2×2**: ≤16 caracteres si la opción tiene LaTeX, ≤25 si es texto plano. Relevante en `FORM` y `GRAF`. Ojo con `\;` en pares ordenados, preferí espacio común.
   - **Pendiente máxima en gráficos**: `|m| ≤ 2`. Relevante para `GRAF` y cualquier `graph_fn` lineal: verificá que ningún `graph_fn` existente exceda `|m| = 2`; si lo excede, rediseñá el ejercicio con una pendiente más chica.
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual"). Notación consistente/preferencia por LaTeX en `options`.
2. `backend/content/gamification-context.md` — por qué se diseñan así los ejercicios. Sin cambios en esta ronda, solo contexto.
3. `backend/content/analisis/course-context.md` — estado matemático del alumno en `white` (sin límites, derivadas ni integrales todavía).
4. `backend/content/analisis/white/generation-instructions.md` — flujo y el checklist de self-critique, ya incluye los checks de todas las reglas de arriba (constraints 1 a 41). No hace falta agregar checks adicionales, correlo completo.
5. `backend/content/analisis/white/functions/linear/topic-context.md` — este topic. Tiene la sección **"Correcciones de formato transversales (los 4 skills)"** con los defectos sistémicos detectados, y las secciones por skill con la distribución objetivo a preservar (ahora con columna **Slug**, ver siguiente punto) y el detalle de `feedback_incorrect` faltante.
6. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ítem lleva un campo nuevo `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de cada skill (punto anterior). Campo nuevo a agregar, no reemplaza nada existente.

## Objetivo

Sobre `LEXI.json`, `CLSF.json`, `FORM.json` y `GRAF.json` de `backend/content/analisis/white/functions/linear/` (50 ítems cada uno, 200 en total):

- Aplicar las correcciones de formato listadas en `topic-context.md` (sección "Correcciones de formato transversales" + las específicas de cada skill).
- Completar `feedback_incorrect` en los 200 ítems (hoy `""` en todos), siguiendo las reglas de *Pistas de `feedback_incorrect`* de `authoring-context.md` (voz descriptiva o segunda persona amable, nunca acusatoria).
- **Agregar `tags` a los 200 ítems.** Cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill (cada una de las 4 skills tiene su propia tabla en `topic-context.md`). No inventes slugs nuevos, usá los ya definidos.
- Aplicar el checklist acumulado completo del punto 1 de la sección anterior a los 200 ítems, no solo a los que ya ibas a tocar por otro motivo.
- **Preservar la distribución objetivo** por concepto/sub-tipo de cada skill definida en `topic-context.md`. Si al corregir formato notás que algún ítem no encaja en su concepto asignado, señalalo en el resumen final en vez de reclasificarlo silenciosamente.

## Qué SI está fuera de alcance

- No reescribas el contenido matemático (enunciado, opciones, respuesta correcta) salvo que lo pida `topic-context.md` o rompa una regla de formato/estilo.
- No agregues ni quites ítems (quedan 50 × 4 = 200).
- No cambies la distribución por concepto/sub-tipo.
- No toques otros topics ni otros belts.
- No modifiques `authoring-context.md`, `gamification-context.md`, `course-context.md`, `generation-instructions.md` ni `topic-context.md` — son insumo de lectura.

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ítem.** Escribí en el chat el plan: qué ítems de cada skill tocás, qué regla dispara cada cambio (de `topic-context.md` o de las nuevas globales), y cómo vas a completar `feedback_incorrect` en los que hoy están vacíos. Si tenés dudas de alcance, marcalas y seguí, no te bloquees esperando respuesta.

**Paso 2 — Ejecutar** el refactor sobre los 4 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist de self-critique de `generation-instructions.md` + el checklist acumulado completo ítem por ítem sobre los 200 ítems finales. Si algo falla, corregí y volvé a revisar. Incluí el chequeo de `tags`: contá cuántos ítems tienen cada slug por skill y verificá que coincide con la cantidad de la tabla de distribución.
2. Validá el formato con el seeder: desde `backend/`, `python -m seed_content --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `refactor(analisis/white/linear): formato, feedback_incorrect y convenciones globales`.
5. En el mensaje del commit, resumí: cuántos ítems de cada skill tenían `feedback_incorrect` vacío y quedaron completados, qué correcciones de formato de `topic-context.md` se aplicaron, y si encontraste algún `graph_fn` con pendiente `|m| > 2` que hubo que rediseñar.
