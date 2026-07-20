# Prompt de refactor: analisis / blue / limits / definition (LEXI + RESL)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de `definition`/`linear`/`quadratic`/`polynomial`/`exponential`/`logarithmic`/`rational`/`trigonometric` de `white/functions` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

> **Alcance de la ronda 2 (importante):** en esta ronda **no se generan ítems nuevos**. Cada skill de este topic tiene **15 ítems de prueba** y el trabajo es **regenerarlos/corregirlos en el lugar** contra los hallazgos y todas las reglas, **sin agregar ni quitar ninguno**. Completar cada skill hasta 50 ítems es trabajo de la **ronda 3**, posterior y solo si la ronda 2 quedó validada. Donde más abajo este prompt diga "completar hasta 50", "ítems nuevos" o "los N ítems finales", interpretalo como esos 15 ítems existentes.

## Contexto

Este es el primer topic de la unidad `blue/limits` que pasa por esta auditoría. A diferencia de los topics de `white/functions` (que ya tenían 50 ítems por skill y se refactorizaban), acá hoy solo existen **15 ítems de prueba por skill** (30 en total, de una meta de 50+50=100). El trabajo es **completar la generación** hasta la meta, no solo refactorizar lo existente, aplicando desde el arranque las reglas que en `white/functions` se fueron descubriendo ítem por ítem.

Una auditoría en vivo (`/test`) sobre los 15 ítems de LEXI y RESL encontró, documentado en `topic-context.md` sección **"Hallazgos de auditoría (ronda 1, jul-2026)"**:
- Un bug de espaciado en `\begin{aligned}` (renglones con distinta altura quedaban con gap desparejo). **Ya reparado a nivel global** en `web/src/components/math-text.tsx`, no requiere nada en el contenido.
- RESL con la fórmula a calcular pegada al texto en vez de separada y centrada (extensión de la regla crítica 18 a ítems que dan datos previos + una fórmula a evaluar).
- LEXI con 2 opciones correctas demasiado largas (regla crítica 4/15).
- Un ítem de LEXI sin ninguna mención explícita a que se trate de un límite, quedando ambiguo.

Además, esta ronda **redefine la sub-familia A de LEXI** (antes "naturaleza de la aproximación", ahora "lectura de la notación, partes de la fórmula") y **le sube el peso relativo** en la distribución (de 15 a 20 de 50), bajando levemente B/C/D para compensar. También agrega una exigencia transversal nueva: **las explicaciones tienen que justificar el porqué, no solo declarar el qué** (regla crítica 25, nueva en `authoring-context.md` esta ronda), particularmente en el diagnóstico de indeterminaciones, la independencia $L$ vs. $f(a)$, y las condiciones de sustitución directa.

## Recordatorio prioritario, antes de generar un solo ítem

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto. Chequealas en cada ítem a medida que lo escribís, no solo al final:

1. **Paridad de opciones (reglas críticas 4 y 15).** Ninguna opción puede quedar como la única notablemente más larga/elaborada NI la única más corta/pelada que el resto; tampoco la única con un formato numérico distinto (entera vs. decimal, con vs. sin glosa aclaratoria). Si notás esa asimetría en cualquier ítem, igualá hacia el medio antes de seguir con el próximo.
2. **Estructura de párrafos y LaTeX.** Párrafos de `explanation`/`question` ≤200 caracteres (ideal ~100); 2+ fragmentos LaTeX inline sueltos en el mismo párrafo se dividen (regla 21); la fórmula central del enunciado va separada del texto en su propio `$$...$$`, nunca tejida inline (regla 18); cualquier derivación de 2+ pasos va vertical en `\begin{aligned}`, nunca encadenada en una sola línea horizontal, y cada renglón tiene que ser corto por sí solo.
3. **Aligned solo para derivaciones reales (regla 30, nueva de la última ronda).** Un `\begin{aligned}` con columna de `=` se reserva para una ecuación que se despeja o una expresión que se transforma paso a paso; nunca para listar datos o valores evaluados de forma independiente, esos van en prosa.
4. **Reintroducir la definición central en cada ítem (regla 31, nueva).** Si la pregunta depende de una fórmula/definición que no está explícita en el propio enunciado, se reintroduce con LaTeX centrado antes de la pregunta puntual; nunca asumirla vista en otro ítem de la sesión.
5. **Openers y puntuación (regla 32, nueva).** Un imperativo con objeto concreto ("Considerá la función") es cláusula completa y solo necesita el `:` antes del bloque `$$...$$`; un fragmento sin objeto propio ("Sabiendo que", "Para derivar", "En") no se arregla con `:`, se reescribe como cláusula completa. En ambos casos, variar la redacción ítem a ítem, nunca repetir la misma apertura como plantilla en toda una sub-familia.

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen de todo lo acumulado hasta la fecha (con la regla crítica entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de conceptos clave en negrita (regla 3); en este topic aplica a `límite`, `tendencia`, `aproximación`, `sustitución directa`, `indeterminación`, `continuidad` (ver `topic-context.md`).
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - **Paridad de opciones, en ambos sentidos**: ni la única más larga/elaborada, ni la única más corta/menos elaborada (regla 4 y su extensión 15). También paridad de *formato numérico* (todas decimales o todas enteras, no una sola distinta).
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - **Nunca invocar factorización, racionalización, límites laterales/al infinito, L'Hôpital ni derivadas** (regla 12 general + regla dura de restricción propia de este topic, ver `topic-context.md`). Este topic tiene su **propia frontera más estricta que el resto de `white`**: ni siquiera derivadas o técnicas de límites más avanzadas que la sustitución directa.
   - Máximo 1 aclaración entre paréntesis/comillas por oración (regla 13).
   - NUNCA usar los símbolos ✓/✗/✘ en ningún campo (regla 14).
   - En un `\begin{aligned}`, nunca una línea de puro texto sin `&` si el resto de las líneas sí tienen `&` (regla 16).
   - Todo párrafo cierra con puntuación terminal (regla 17).
   - Un `\begin{aligned}` va SIEMPRE en `$$...$$`, nunca en `$...$` inline, con un solo `\\` por salto de línea (regla 17b).
   - La fórmula central del `question` va separada del texto, nunca tejida inline, sobre todo si es una fracción (regla 18). **Este topic extiende la regla** a ítems que dan datos previos ("$\lim f(x)=6$ y $\lim g(x)=0$") seguidos de la fórmula a evaluar: la fórmula a calcular va en su propio bloque `$$...$$`, no pegada a la oración de datos.
   - Opciones compuestas no repiten la etiqueta de eje/variable si la pregunta ya fija el orden (regla 19).
   - En `options` con fracciones cortas de grilla 2×2, preferir notación de barra (`1/3`) sobre `\frac`/`\dfrac` (regla 20).
   - 2+ fragmentos LaTeX inline en el mismo párrafo de `explanation` es señal de dividir el párrafo (regla 21).
   - En opciones `CLSF` que ya son una fórmula, no agregar el nombre de familia entre paréntesis (regla 22, no aplica directo a este topic que no tiene `CLSF`, pero mantenerla presente si en algún ítem de RESL aparece una clasificación disfrazada de valor).
   - **Regla 24 (nueva, de la auditoría de `lateral_limits`, aplica igual acá): nunca enmarcar un ítem respecto de otro ítem de la sesión** ("un caso más exigente", "a diferencia del anterior"), **y todo ítem abstracto de LEXI sitúa el concepto (`límite`, `límite lateral`) desde la primera oración**, antes del tecnicismo. Variar la redacción de apertura ítem a ítem, no repetir la misma frase en toda una sub-familia. No aplica a RESL (ya sitúa el concepto con la función/datos dados).
   - **Nueva esta ronda — regla 25: el concepto abstracto de la `explanation` justifica el porqué, no solo declara el qué.** Ver el detalle completo y los 3 ejemplos resueltos (indeterminación, independencia, condiciones de sustitución) en `topic-context.md` sección "El porqué, no solo el qué". Es la corrección de mayor peso de esta ronda para este topic.
   - No restablecer en prosa, antes de la pregunta, rasgos de un gráfico que el gráfico ya muestra directamente (no aplica, este topic no tiene `GRAF`).
   - Preferencia por fórmula centrada sobre LaTeX inline en `explanation` cuando la fórmula es el objeto central.
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options`.
   - Fórmulas anchas: nunca encadenar igualdades largas en una fórmula, partir en `aligned`/bloques apilados; excepción: cadenas cortas que entran en una línea no necesitan partirse.
   - Grilla 2×2: ≤16 caracteres con LaTeX, ≤25 en texto plano.
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual").
   - `explanation` ≥ 300 caracteres, estructura de 3 partes (concepto abstracto con el porqué, aplicación paso a paso, cierre útil).
2. `backend/content/analisis/course-context.md` — estado matemático del alumno en `blue`: ya sabe todo `white` (funciones, dominio, imagen) más la noción intuitiva de límite; **todavía no** existen derivada ni integral.
3. `backend/content/analisis/blue/limits/definition/topic-context.md` — este topic. Tiene la **regla dura de restricción** (qué técnicas están prohibidas), la **distribución objetivo con `tags`** (LEXI 20/12/9/9, RESL 15/15/10/10), la sección **"El porqué, no solo el qué"** con los 4 ejemplos resueltos por sub-familia, las **confusiones fuente** de `feedback_incorrect` por skill, y **"Hallazgos de auditoría (ronda 1, jul-2026)"**.
4. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `LEXI.json` y `RESL.json` de `backend/content/analisis/blue/limits/definition/`:

- **Regenerar los 15 ítems de prueba por skill que ya existen** (sin agregar ni quitar; completar a 50 es la ronda 3), partiendo de los 15 existentes de cada uno.
- **Aplicar la nueva distribución de LEXI (20/12/9/9)** desde el arranque: los 15 ítems existentes ya se pueden re-tagear según dónde caen en la tabla nueva (la mayoría cae en A, B o D según el panorama ya revisado), ; completar cada sub-familia hasta la meta es trabajo de la ronda 3.
- **Mantener la distribución de RESL (15/15/10/10)** sin cambios de peso, solo completar hasta 50.
- **Corregir los 15 existentes** contra los hallazgos de auditoría: separar fórmula+datos en RESL (regla 18 extendida), recortar las 2 opciones largas de LEXI, reescribir el ítem sin contexto de límite explícito, y aplicar el porqué (regla 25) a las explicaciones que hoy solo declaran el resultado.
- **Cada ítem nuevo y cada ítem existente retocado lleva `"tags": ["<slug>"]`** según la tabla de distribución de su skill. No inventar slugs nuevos.
- **`feedback_incorrect` completo** en los 15 ítems de prueba por skill: array paralelo a `options`, `null` en el correcto, voz descriptiva en segunda persona amable (nunca acusatoria).
- **`correct_index` variado**, no concentrado en un solo índice.

## Qué SI está fuera de alcance

- No toques otros topics de `blue/limits` (`continuity`, `factorization`, `infinite_limits`, `lateral_limits`, `rationalization`) ni otros belts.
- No modifiques `authoring-context.md`, `course-context.md` ni `topic-context.md` — son insumo de lectura (ya están actualizados con lo acordado en esta sesión).
- No relajes la regla dura de restricción del topic (nada de factorización, racionalización, límites laterales/al infinito, L'Hôpital, derivadas), aunque simplifique redactar un ítem.

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ítem.** Escribí en el chat el plan: qué corrección aplica a cada ítem de prueba existente por sub-familia, qué pasa con los 15 existentes (cuáles se retaggean tal cual, cuáles se corrigen), y 2-3 ejemplos de cómo se vería el "porqué" en una explicación de C (indeterminación) antes de escribir las 9 completas.

**Paso 2 — Ejecutar** la generación/corrección sobre los 2 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist transversal + por skill de `topic-context.md` sobre los 15 ítems de prueba por skill. Prestá atención especial a: regla dura de restricción (cero tolerancia), regla 25 (porqué, no solo qué) en las 3 sub-familias señaladas, **cada `explanation` con 1-2 párrafos de intuición general de la noción de límite en juego** (ver `course-context.md` §Refuerzo de intuición en `blue`), distribución LEXI 20/12/9/9 y RESL 15/15/10/10 exacta, `tags` completos y coincidentes con la tabla.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `feat(analisis/blue/definition): completar 100 ítems, nueva distribución LEXI y refuerzo de porqué`.
5. En el mensaje del commit, resumí: cuántos de los 15 ítems de prueba se corrigieron y por qué regla, y el conteo final por `tags` de cada skill.
