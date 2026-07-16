# Prompt de refactor: white / functions / trigonometric (LEXI + CLSF + FORM + GRAF)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de `definition`, `linear`, `quadratic`, `polynomial`, `exponential`, `logarithmic` y/o `rational` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

## Contexto

`topic-context.md` de este topic tiene, de una auditoría programática anterior (sección **"Estado (auditoría jul-2026)"**), el detalle de lo que falta: `feedback_incorrect` vacío en los 200 ítems (único pendiente estructural grande, este es el topic más limpio de formato de toda la unidad), antropomorfismo del seno/coseno localizado en LEXI y CLSF (lista de ítems con el texto exacto a reescribir), algunos defectos menores puntuales, y `correct_index` con sesgo moderado (menor que el resto de la unidad, pero corregible).

**Además, ya se reparó en esta sesión (antes de este prompt) un bug crítico de render**: 58 ítems tenían `\begin{aligned}...\end{aligned}` envuelto en `$...$` inline en vez de `$$...$$`, con el comando de salto de línea `\\` duplicado. Esto hacía que el campo entero se mostrara como LaTeX crudo sin renderizar. **Ya está reparado en disco y reseedeado, no es parte de tu trabajo, pero mantené la regla al tocar cualquier `aligned` existente** (ver punto 1 abajo, regla 17b/38).

Durante una auditoría en vivo ítem por ítem (vía `/test`) se corrigieron 10 ítems puntuales adicionales, documentados en la sección **"Hallazgos de auditoría (ronda 1, jul-2026)"** de `topic-context.md`, con su `external_id`. Esta ronda originó **3 reglas nuevas**: preferir notación de barra (`1/3`) sobre `\frac`/`\dfrac` en opciones cortas de grilla 2×2 (regla 20), un umbral concreto de 2+ fragmentos LaTeX inline por párrafo como señal de dividir (regla 21), y no agregar el nombre de familia entre paréntesis junto a una opción `CLSF` que ya es una fórmula (regla 22).

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Este es el topic con más reglas globales acumuladas hasta la fecha (7 topics de auditoría antes que este). **Aplicá el checklist completo a los 200 ítems, no solo las reglas "nuevas" de esta ronda.** Resumen de todo lo acumulado hasta `trigonometric` (con la regla crítica correspondiente entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de `dominio`/`imagen`/`codominio`/`preimagen`/`unicidad` en negrita (regla 3).
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - **Paridad de opciones, en ambos sentidos**: ni la única más larga/elaborada, ni la única más corta/menos elaborada (regla 4 y su extensión 15). También paridad de *formato numérico*.
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, **nunca antropomorfismo** (regla 7). **Reincidencia fuerte en este topic**: LEXI y CLSF personifican seno/coseno con rasgos humanos ("el seno llega tarde a la fiesta", "el seno pesimista"), ver la lista completa de `external_id` en `topic-context.md` sección "Estado (auditoría jul-2026)", punto 2. Reescribir a advertencia neutra, nombrando la diferencia real (ej. "el coseno arranca en su máximo, el seno arranca en cero").
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Regla general:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - **Nunca invocar derivadas, límites ni integrales** para justificar una conclusión (regla 12). Confirmado como sesgo sistémico en `polynomial` → `exponential` → `logarithmic`; no apareció en la muestra corregida de `trigonometric` ni `rational`, pero auditá los 200 ítems igual.
   - Máximo 1 aclaración entre paréntesis/comillas por oración (regla 13).
   - **NUNCA usar los símbolos ✓/✗/✘** en ningún campo (regla 14). **Reincidencia en este topic**: `GRAF_38` y `GRAF_32` de la muestra corregida.
   - **En un `\begin{aligned}`, nunca una línea de puro texto (`\text{...}`) sin `&`** si el resto de las líneas sí tienen `&` (regla 16).
   - **Todo párrafo cierra con puntuación terminal** (regla 17).
   - **Un `\begin{aligned}` va SIEMPRE en `$$...$$`, nunca en `$...$` inline, con un solo `\\` por salto de línea** (regla 17b). Ya reparado en este topic (58 ítems), pero si generás o tocás cualquier bloque `aligned` nuevo, esta regla aplica igual.
   - La fórmula central del `question` va separada del texto, nunca tejida inline, sobre todo si es una fracción (regla 18). **2ª confirmación cross-topic** (`rational` → `trigonometric`, ítem `GRAF_47` de la muestra).
   - Opciones compuestas no repiten la etiqueta de eje/variable si la pregunta ya fija el orden (regla 19).
   - **Nueva esta ronda — regla 20: en `options` con fracciones cortas para grilla 2×2, preferir notación de barra (`1/3`) sobre `\frac{1}{3}`/`\dfrac{1}{3}`**, para que todas las opciones midan parejo.
   - **Nueva esta ronda — regla 21: 2+ fragmentos LaTeX inline en el mismo párrafo de `explanation` es señal de dividir el párrafo.** No acumules fórmulas `$...$` sueltas en la misma oración, separá en párrafos o subí la fórmula central a `$$...$$`.
   - **Nueva esta ronda — regla 22: en opciones `CLSF` que ya son una fórmula, no agregues el nombre de familia entre paréntesis al lado** (ej. no `"$C(t)=A\cos(Bt)+D$ (trigonométrica)"`, la fórmula ya lo dice).
   - No restablecer en prosa, antes de la pregunta, rasgos de un gráfico que el gráfico ya muestra directamente (sección *Planteos de GRAF*).
   - Preferencia por fórmula centrada sobre LaTeX inline en `explanation` cuando la fórmula es el objeto central.
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options` (con la excepción puntual de la regla 20 para fracciones cortas de grilla).
   - Fórmulas anchas: nunca encadenar igualdades largas en una fórmula, partir en `aligned`/bloques apilados; excepción: cadenas cortas que entran en una línea no necesitan partirse.
   - Cada línea de un `aligned` tiene que ser corta por sí sola.
   - `feedback_correct` sujeto a la misma regla de fórmulas anchas: 1 oración corta.
   - Nunca usar flecha `→` en prosa.
   - Grilla 2×2: ≤16 caracteres con LaTeX, ≤25 en texto plano.
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual").
   - `explanation` ≥ 300 caracteres, estructura de 3 partes.
2. `backend/content/gamification-context.md` — sin cambios en esta ronda, solo contexto.
3. `backend/content/analisis/course-context.md` — estado matemático del alumno en `white`.
4. `backend/content/analisis/white/generation-instructions.md` — flujo y checklist de self-critique, ya incluye los checks de todas las reglas nuevas hasta la fecha (constraints 26 a 41).
5. `backend/content/analisis/white/functions/trigonometric/topic-context.md` — este topic. Tiene **"Estado (auditoría jul-2026)"** (con la lista completa de antropomorfismos a reescribir), **"Confusiones fuente para `feedback_incorrect`, por skill"**, **"Hallazgos de auditoría (ronda 1, jul-2026)"** con los 10 `external_id` + la nota del bug de render ya reparado, y **"Distribución objetivo, con `tags`"** con la tabla de sub-familias y su columna **Slug** para cada skill (GRAF con sub-tablas por Tipo A/B/C). También tiene notas de **convención de notación** (`\operatorname{sen}(x)` en texto vs `sin(x)` en `graph_fn`) y **grilla del eje x en π vs decimal** según si `graph_fn` tiene `pi` — no romper esa convención al tocar `graph_fn`.
6. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `LEXI.json`, `CLSF.json`, `FORM.json` y `GRAF.json` de `backend/content/analisis/white/functions/trigonometric/` (50 ítems cada uno, 200 en total):

- Completar `feedback_incorrect` en los 200 ítems (único vacío estructural del topic).
- Reescribir los cierres antropomórficos de LEXI y CLSF listados en `topic-context.md` (sección "Estado", punto 2) a advertencia/consejo neutro, sin personificación.
- Aplicar el checklist acumulado completo del punto 1 de arriba a los 200 ítems, no solo a los `external_id` citados en "Hallazgos de auditoría".
- Corregir los defectos menores puntuales listados en "Estado" punto 3 (glue `\n\n$$`, em-dash, viñetas).
- Rebalancear `correct_index` (sesgo moderado, menor que el resto de la unidad, pero corregible hacia ~{0:12,1:13,2:12,3:13}).
- **Agregar `tags` a los 200 ítems.** Cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill (GRAF con sub-tablas por Tipo A/B/C). No inventes slugs nuevos.
- **Preservar la distribución objetivo** por concepto/sub-tipo de cada skill definida en `topic-context.md`. Si notás que algún ítem no encaja en su concepto asignado, señalalo en el resumen final en vez de reclasificarlo silenciosamente.
- **No toques la convención de notación** (`\operatorname{sen}(x)` en texto, `sin(x)`/`cos(x)` en `graph_fn`, nunca `sen` en `graph_fn`) ni la lógica de grilla π-vs-decimal documentada en `topic-context.md`.

**Expectativa de alcance:** este es el topic más limpio de formato de toda la unidad (sin `\n\n$$` extendido, sin em-dash sistemático, sin explicaciones cortas). El foco principal es `feedback_incorrect` (100% vacío) y los antropomorfismos puntuales, no una reescritura masiva de `explanation`. Aun así, auditá igual los 200 ítems contra el checklist acumulado completo.

## Qué SI está fuera de alcance

- No reescribas el contenido matemático (enunciado, opciones, respuesta correcta) salvo que lo pida `topic-context.md` o rompa una regla de formato/estilo/contenido de las listadas.
- No agregues ni quites ítems (quedan 50 × 4 = 200).
- No cambies la distribución por concepto/sub-tipo.
- No toques otros topics ni otros belts.
- No modifiques `authoring-context.md`, `gamification-context.md`, `course-context.md`, `generation-instructions.md` ni `topic-context.md` — son insumo de lectura.

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ítem.** Escribí en el chat el plan: qué ítems de cada skill tocás, qué regla dispara cada cambio, y cómo vas a completar `feedback_incorrect` (hoy vacío en el 100%). Listá explícitamente los antropomorfismos a reescribir con su reemplazo propuesto.

**Paso 2 — Ejecutar** el refactor sobre los 4 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist de self-critique de `generation-instructions.md` + el checklist transversal de `topic-context.md` ítem por ítem sobre los 200 ítems finales. Prestá atención especial a: antropomorfismo (cero tolerancia), símbolos ✓/✗, `\begin{aligned}` siempre en `$$`, notación de barra en opciones de grilla, párrafos con 2+ inline sueltos, nombre de familia redundante en opciones `CLSF`. Incluí el chequeo de `tags`: contá cuántos ítems tienen cada slug por skill y verificá que coincide con la tabla de distribución.
2. Validá el formato con el seeder: desde `backend/`, `python -m seed_content --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `refactor(analisis/white/trigonometric): formato, feedback_incorrect y convenciones globales`.
5. En el mensaje del commit, resumí: cuántos ítems tenían `feedback_incorrect` vacío y quedaron completados, cuántos antropomorfismos reescribiste, y cuántos casos de cada regla del checklist acumulado encontraste y corregiste.
