# Prompt de refactor: analisis / blue / limits / lateral_limits (LEXI + GRAF + RESL)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de `definition` de `blue/limits`, o de cualquier topic de `white/functions`, en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

> **Alcance de la ronda 2 (importante):** en esta ronda **no se generan ejercicios nuevos**. Cada skill de este topic tiene **15 ejercicios de prueba** y el trabajo es **regenerarlos/corregirlos en el lugar** contra los hallazgos y todas las reglas, **sin agregar ni quitar ninguno**. Completar cada skill hasta 50 ejercicios es trabajo de la **ronda 3**, posterior y solo si la ronda 2 quedó validada. Donde más abajo este prompt diga "completar hasta 50", "ejercicios nuevos" o "los N ejercicios finales", interpretalo como esos 15 ejercicios existentes.

## Contexto

Igual que `definition`, este topic hoy tiene ejercicios de prueba (no los 50×3=150 de la meta). En la **ronda 2** solo se **regeneran y corrigen los 15 ejercicios de prueba que ya existen** por skill, sin agregar nuevos (ver el callout de alcance arriba).

Una auditoría en vivo (`/test`) encontró, documentado en `topic-context.md` sección **"Hallazgos de auditoría (ronda 1, jul-2026)"**:
- `LEXI_10`: 2 fórmulas inline en el mismo párrafo de `explanation` (regla 21).
- `LEXI_13`: la sub-familia D de LEXI (sumar dos laterales) no tenía ningún gancho interpretativo. **Reenfocada** a pedir el **tamaño del salto** ($\lim^+ - \lim^-$), que sí tiene una lectura concreta. Misma redefinición en la sub-familia C de GRAF.
- `LEXI_03`: un enunciado se enmarcaba respecto de "un caso más exigente" (comparación con otro ejercicio) y no situaba el concepto antes del tecnicismo. Esto originó la **regla crítica 24, nueva en `authoring-context.md`** (dos partes: nunca comparar contra otro ejercicio de la sesión, y todo ejercicio abstracto sitúa el concepto —función, límite, límite lateral— desde la primera oración).
- `LEXI_09`: distractor con cláusula "porque..." de más, y una fórmula central con 3 igualdades encadenadas en una sola línea horizontal (ilegible en mobile). Comparar contra `GRAF_08` del mismo topic, que hizo bien el desarrollo vertical con `aligned`, como ejemplo modelo.

## Recordatorio prioritario, antes de generar un solo ejercicio

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto. Chequealas en cada ejercicio a medida que lo escribís, no solo al final:

1. **Paridad de opciones (reglas críticas 4 y 15).** Ninguna opción puede quedar como la única notablemente más larga/elaborada NI la única más corta/pelada que el resto; tampoco la única con un formato numérico distinto (entera vs. decimal, con vs. sin glosa aclaratoria). Si notás esa asimetría en cualquier ejercicio, igualá hacia el medio antes de seguir con el próximo.
2. **Estructura de párrafos y LaTeX.** Párrafos de `explanation`/`question` ≤200 caracteres (ideal ~100); 2+ fragmentos LaTeX inline sueltos en el mismo párrafo se dividen (regla 21); la fórmula central del enunciado va separada del texto en su propio `$$...$$`, nunca tejida inline (regla 18); cualquier derivación de 2+ pasos va vertical en `\begin{aligned}`, nunca encadenada en una sola línea horizontal, y cada renglón tiene que ser corto por sí solo.
3. **Aligned solo para derivaciones reales (regla 30, nueva de la última ronda).** Un `\begin{aligned}` con columna de `=` se reserva para una ecuación que se despeja o una expresión que se transforma paso a paso; nunca para listar datos o valores evaluados de forma independiente, esos van en prosa.
4. **Reintroducir la definición central en cada ejercicio (regla 31, nueva).** Si la pregunta depende de una fórmula/definición que no está explícita en el propio enunciado, se reintroduce con LaTeX centrado antes de la pregunta puntual; nunca asumirla vista en otro ejercicio de la sesión.
5. **Openers y puntuación (regla 32, nueva).** Un imperativo con objeto concreto ("Considerá la función") es cláusula completa y solo necesita el `:` antes del bloque `$$...$$`; un fragmento sin objeto propio ("Sabiendo que", "Para derivar", "En") no se arregla con `:`, se reescribe como cláusula completa. En ambos casos, variar la redacción ejercicio a ejercicio, nunca repetir la misma apertura como plantilla en toda una sub-familia.

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen acumulado hasta la fecha (con la regla crítica entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de conceptos clave en negrita (regla 3): en este topic, `límites laterales`, `límite bilateral`, `teorema de existencia`, `salto`, `hueco`.
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - **Paridad de opciones, en ambos sentidos** (regla 4 y su extensión 15), también de formato numérico.
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - **Nunca invocar factorización, racionalización, L'Hôpital, límites al infinito, asíntotas verticales ni derivadas** (regla 12 general + regla dura de restricción propia de este topic). En `GRAF`, ningún gráfico con ramas que se disparan al infinito.
   - Máximo 1 aclaración entre paréntesis/comillas por oración (regla 13).
   - NUNCA usar los símbolos ✓/✗/✘ en ningún campo (regla 14).
   - En un `\begin{aligned}`, nunca una línea de puro texto sin `&` si el resto de las líneas sí tienen `&` (regla 16).
   - Todo párrafo cierra con puntuación terminal (regla 17).
   - Un `\begin{aligned}` va SIEMPRE en `$$...$$`, nunca en `$...$` inline, con un solo `\\` por salto de línea (regla 17b).
   - La fórmula central del `question` va separada del texto, nunca tejida inline, sobre todo si es una fracción (regla 18).
   - Opciones compuestas no repiten la etiqueta de eje/variable si la pregunta ya fija el orden (regla 19).
   - En `options` con fracciones cortas de grilla 2×2, preferir notación de barra (`1/3`) sobre `\frac`/`\dfrac` (regla 20).
   - **2+ fragmentos LaTeX inline en el mismo párrafo de `explanation` es señal de dividir el párrafo (regla 21). Reincidencia confirmada en `LEXI_10` de este topic.**
   - En opciones `CLSF` que ya son una fórmula, no agregar el nombre de familia entre paréntesis (regla 22, no aplica, este topic no tiene `CLSF`).
   - **Regla 24 (nueva, originada en la auditoría de este mismo topic): nunca enmarcar un ejercicio respecto de otro ejercicio de la sesión** ("un caso más exigente", "a diferencia del anterior"), **y todo ejercicio abstracto de LEXI sitúa el concepto (`límite`, `límite lateral`) desde la primera oración**, antes del tecnicismo, variando la redacción de apertura ejercicio a ejercicio. No aplica a `RESL` (ya sitúa el concepto con la función a trozos dada) ni a `GRAF` (ya lo sitúa con el gráfico).
   - **Regla 27 (nueva, encontrada en la auditoría de `continuity` pero reincidente en 4 ejercicios de este mismo topic, ya corregidos): un límite lateral SIEMPRE lleva el punto de tendencia en el subíndice** (`\lim_{x \to a^-}`/`\lim_{x \to a^+}`), **nunca `\lim^-`/`\lim^+` sueltos** sin decir a qué valor tiende $x$. No reintroducirlo al generar los ejercicios que faltan.
   - **Regla 25: el concepto abstracto de la `explanation` justifica el porqué, no solo declara el qué.** En este topic aplica sobre todo al **teorema de existencia** (por qué hace falta que ambos laterales coincidan, no solo que el enunciado lo declare) y a la **independencia con $f(a)$** (por qué el bilateral no depende del valor puntual).
   - Preferencia por fórmula centrada sobre LaTeX inline en `explanation` cuando la fórmula es el objeto central.
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options`.
   - **Fórmulas anchas: nunca encadenar 3+ igualdades en una sola línea horizontal, partir en `\begin{aligned}` vertical.** Reincidencia confirmada en `LEXI_09` de este topic (contrastar contra `GRAF_08`, que lo hizo bien).
   - Grilla 2×2: ≤16 caracteres con LaTeX, ≤25 en texto plano.
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual").
   - `explanation` ≥ 300 caracteres, estructura de 3 partes (concepto abstracto con el porqué, aplicación paso a paso, cierre útil).
   - **`feedback_incorrect`: corto, sin mini-explicación tras la coma.** Reincidencia confirmada en `LEXI_09`.
2. `backend/content/analisis/course-context.md` — estado matemático del alumno en `blue`.
3. `backend/content/analisis/blue/limits/lateral_limits/topic-context.md` — este topic. Tiene la **regla dura de restricción**, la **distribución objetivo con `tags`** (LEXI 15/15/10/10 con D reenfocada a `tamano-del-salto`, GRAF 20/15/15 con C reenfocada a `tamano-del-salto-visual`, RESL 20/20/10), las **confusiones fuente** por skill, y **"Hallazgos de auditoría (ronda 1, jul-2026)"**.
4. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ejercicio lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `LEXI.json`, `GRAF.json` y `RESL.json` de `backend/content/analisis/blue/limits/lateral_limits/`:

- **Regenerar los 15 ejercicios de prueba por skill que ya existen** (sin agregar ni quitar; completar a 50 es la ronda 3), partiendo de los ejercicios de prueba existentes.
- **Corregir los ejercicios existentes** contra los hallazgos de auditoría: dividir párrafos con 2+ inline (`LEXI_10`), reescribir `LEXI_03` sin marco comparativo y con el concepto situado desde el inicio, recortar el distractor de `LEXI_09` y pasar su fórmula central a `\begin{aligned}` vertical.
- **Redistribuir/reescribir la sub-familia D de LEXI y C de GRAF** al nuevo foco de "tamaño del salto" (resta con lectura real), no una suma sin motivo.
- **Cada ejercicio lleva `"tags": ["<slug>"]`** según la tabla de distribución de su skill. No inventar slugs nuevos.
- **`feedback_incorrect` completo** en los 15 ejercicios de prueba por skill.
- **`correct_index` variado**, no concentrado en un solo índice.

## Qué SI está fuera de alcance

- No toques otros topics de `blue/limits` ni otros belts.
- No modifiques `authoring-context.md`, `course-context.md` ni `topic-context.md` — son insumo de lectura.
- No relajes la regla dura de restricción del topic (nada de factorización, racionalización, L'Hôpital, límites al infinito, asíntotas verticales, derivadas).

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ejercicio.** Escribí en el chat el plan: qué corrección aplica a cada ejercicio de prueba existente por sub-familia, qué pasa con los existentes, y 2-3 ejemplos de cómo quedaría un ejercicio de "tamaño del salto" (D de LEXI y C de GRAF) antes de escribir el resto.

**Paso 2 — Ejecutar** la generación/corrección sobre los 3 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist transversal + por skill de `topic-context.md` sobre los 15 ejercicios de prueba por skill. Prestá atención especial a: regla dura de restricción (cero tolerancia), regla 24 (sin marco comparativo, concepto situado desde el inicio en LEXI abstracto), regla 25 (porqué, no solo qué) en teorema de existencia e independencia con $f(a)$, regla 27 (todo lateral con el punto de tendencia en el subíndice), **cada `explanation` con 1-2 párrafos de intuición general de la noción de límite en juego** (ver `course-context.md` §Refuerzo de intuición en `blue`; en la sub-familia "tamaño del salto" el párrafo específico ya está indicado en `topic-context.md`), ningún desarrollo con 3+ igualdades horizontales, sub-familia D/C reenfocada a tamaño del salto, `tags` completos y coincidentes con la tabla.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `feat(analisis/blue/lateral_limits): completar 150 ejercicios, reenfoque de tamaño del salto y reglas globales`.
5. En el mensaje del commit, resumí: cuántos de los 15 ejercicios de prueba se corrigieron y por qué regla, y el conteo final por `tags` de cada skill.
