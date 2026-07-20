# Prompt de refactor: analisis / blue / limits / infinite_limits (LEXI + GRAF + RESL)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de `definition` o `lateral_limits` de `blue/limits`, o cualquier topic de `white/functions`, en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

> **Alcance de la ronda 2 (importante):** en esta ronda **no se generan ítems nuevos**. Cada skill de este topic tiene **15 ítems de prueba** y el trabajo es **regenerarlos/corregirlos en el lugar** contra los hallazgos y todas las reglas, **sin agregar ni quitar ninguno**. Completar cada skill hasta 50 ítems es trabajo de la **ronda 3**, posterior y solo si la ronda 2 quedó validada. Donde más abajo este prompt diga "completar hasta 50", "ítems nuevos" o "los N ítems finales", interpretalo como esos 15 ítems existentes.

## Contexto

Igual que `definition` y `lateral_limits`, este topic hoy tiene ítems de prueba (no los 50×3=150 de la meta). En la **ronda 2** solo se **regeneran y corrigen los 15 ítems de prueba que ya existen** por skill, sin agregar nuevos (ver el callout de alcance arriba).

Una auditoría en vivo (`/test`) encontró, documentado en `topic-context.md` sección **"Hallazgos de auditoría (ronda 1, jul-2026)"**:
- `GRAF_15`: enunciado y explicación se referían a "el ítem anterior" — violación directa de la regla crítica 24 en dos campos del mismo ítem.
- `RESL_07`: un renglón final de `\begin{aligned}` encadenaba 2 igualdades en vez de partir en un tercer renglón.
- `GRAF_08`: uso de la palabra "escapa" para divergencia, ahora prohibida.
- 2 capturas: bloques `$$...$$` con una oración completa en español metida vía `\text{...}`, desbordando en mobile. **Esto originó la regla crítica 26, nueva en `authoring-context.md` esta ronda.**

## Recordatorio prioritario, antes de generar un solo ítem

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto. Chequealas en cada ítem a medida que lo escribís, no solo al final:

1. **Paridad de opciones (reglas críticas 4 y 15).** Ninguna opción puede quedar como la única notablemente más larga/elaborada NI la única más corta/pelada que el resto; tampoco la única con un formato numérico distinto (entera vs. decimal, con vs. sin glosa aclaratoria). Si notás esa asimetría en cualquier ítem, igualá hacia el medio antes de seguir con el próximo.
2. **Estructura de párrafos y LaTeX.** Párrafos de `explanation`/`question` ≤200 caracteres (ideal ~100); 2+ fragmentos LaTeX inline sueltos en el mismo párrafo se dividen (regla 21); la fórmula central del enunciado va separada del texto en su propio `$$...$$`, nunca tejida inline (regla 18); cualquier derivación de 2+ pasos va vertical en `\begin{aligned}`, nunca encadenada en una sola línea horizontal, y cada renglón tiene que ser corto por sí solo.
3. **Aligned solo para derivaciones reales (regla 30, nueva de la última ronda).** Un `\begin{aligned}` con columna de `=` se reserva para una ecuación que se despeja o una expresión que se transforma paso a paso; nunca para listar datos o valores evaluados de forma independiente, esos van en prosa.
4. **Reintroducir la definición central en cada ítem (regla 31, nueva).** Si la pregunta depende de una fórmula/definición que no está explícita en el propio enunciado, se reintroduce con LaTeX centrado antes de la pregunta puntual; nunca asumirla vista en otro ítem de la sesión.
5. **Openers y puntuación (regla 32, nueva).** Un imperativo con objeto concreto ("Considerá la función") es cláusula completa y solo necesita el `:` antes del bloque `$$...$$`; un fragmento sin objeto propio ("Sabiendo que", "Para derivar", "En") no se arregla con `:`, se reescribe como cláusula completa. En ambos casos, variar la redacción ítem a ítem, nunca repetir la misma apertura como plantilla en toda una sub-familia.

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen acumulado hasta la fecha (con la regla crítica entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de conceptos clave en negrita (regla 3): en este topic, `límites al infinito`, `límites infinitos`, `asíntota horizontal`, `asíntota vertical`, `dominancia`, `divergencia`.
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - Paridad de opciones en ambos sentidos (regla 4 y su extensión 15), también de formato numérico.
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - **Nunca invocar L'Hôpital, derivadas, integrales, factorización ni racionalización** (regla 12 general + regla dura de restricción propia de este topic: todo se resuelve por análisis de signos o dominancia de grados/familias).
   - Máximo 1 aclaración entre paréntesis/comillas por oración (regla 13).
   - NUNCA usar los símbolos ✓/✗/✘ en ningún campo (regla 14).
   - En un `\begin{aligned}`, nunca una línea de puro texto sin `&` si el resto de las líneas sí tienen `&` (regla 16).
   - Todo párrafo cierra con puntuación terminal (regla 17).
   - Un `\begin{aligned}` va SIEMPRE en `$$...$$`, nunca en `$...$` inline, con un solo `\\` por salto de línea (regla 17b).
   - La fórmula central del `question` va separada del texto, nunca tejida inline, sobre todo si es una fracción (regla 18).
   - Opciones compuestas no repiten la etiqueta de eje/variable si la pregunta ya fija el orden (regla 19).
   - En `options` con fracciones cortas de grilla 2×2, preferir notación de barra (`1/3`) sobre `\frac`/`\dfrac` (regla 20).
   - 2+ fragmentos LaTeX inline en el mismo párrafo de `explanation` es señal de dividir el párrafo (regla 21).
   - En opciones `CLSF` que ya son una fórmula, no agregar el nombre de familia entre paréntesis (regla 22, no aplica, este topic no tiene `CLSF`).
   - **Regla 24: nunca enmarcar un ítem respecto de otro ítem de la sesión, y todo ítem abstracto sitúa el concepto desde la primera oración. Reincidencia confirmada y agravada en `GRAF_15` de este topic (dos campos del mismo ítem, `question` y `explanation`).**
   - **Regla 27: un límite lateral SIEMPRE lleva el punto de tendencia en el subíndice** (`\lim_{x \to a^-}`/`\lim_{x \to a^+}`), **nunca `\lim^-`/`\lim^+` sueltos**. No aplica a límites al infinito ($x \to \pm\infty$, que no llevan superíndice de dirección), pero sí a cualquier límite infinito direccional ($x \to a^-$/$x \to a^+$ con resultado $\pm\infty$) de la sub-familia C de RESL.
   - **Regla 25: el concepto abstracto de la `explanation` justifica el porqué, no solo declara el qué.** En este topic aplica sobre todo a por qué $\infty-\infty$ es indeterminación (no se cancela por parecerse en notación, depende de qué tan rápido crece cada término) y por qué la dominancia de familias es válida sin importar el grado del polinomio.
   - Preferencia por fórmula centrada sobre LaTeX inline en `explanation` cuando la fórmula es el objeto central.
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options`.
   - **Fórmulas anchas: nunca encadenar igualdades largas en una sola línea horizontal, partir en `\begin{aligned}` vertical. Cada renglón del `aligned` tiene que ser corto por sí solo: si un paso individual sigue siendo largo (2 igualdades en el mismo renglón), partirlo en un renglón más. Reincidencia confirmada en `RESL_07` de este topic.**
   - **Regla 26 (nueva, originada en la auditoría de este mismo topic): un bloque `$$...$$` lleva solo símbolos, números y notación matemática, nunca una oración completa en español metida con `\text{...}`.** Las palabras van en la prosa que rodea la fórmula. Reincidencia confirmada en 2 ítems de este topic (dominancia exponencial vs. polinómica, y $\infty-\infty$).
   - Grilla 2×2: ≤16 caracteres con LaTeX, ≤25 en texto plano.
   - **Vocabulario prohibido**: "escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual", y **"escapar"/"escapa" (nuevo, reemplazar por "diverge", "crece sin cota", "tiende a $\pm\infty$"), reincidencia confirmada en `GRAF_08` de este topic.**
   - `explanation` ≥ 300 caracteres, estructura de 3 partes (concepto abstracto con el porqué, aplicación paso a paso, cierre útil).
2. `backend/content/analisis/course-context.md` — estado matemático del alumno en `blue`.
3. `backend/content/analisis/blue/limits/infinite_limits/topic-context.md` — este topic. Tiene la **regla dura de restricción**, la nota de que el topic cubre **dos ideas distintas** (límites al infinito con resultado $L$, y límites infinitos con resultado $\pm\infty$), la **distribución objetivo con `tags`** (LEXI 15/15/10/10, GRAF 20/15/15, RESL 20/10/20), las **confusiones fuente** por skill, y **"Hallazgos de auditoría (ronda 1, jul-2026)"**.
4. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ítem lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `LEXI.json`, `GRAF.json` y `RESL.json` de `backend/content/analisis/blue/limits/infinite_limits/`:

- **Regenerar los 15 ítems de prueba por skill que ya existen** (sin agregar ni quitar; completar a 50 es la ronda 3), partiendo de los ítems de prueba existentes.
- **Corregir los ítems existentes** contra los hallazgos de auditoría: reescribir `GRAF_15` autocontenido (sin referencia a otro ítem), partir el renglón largo de `RESL_07` en un paso más, reemplazar "escapa" en `GRAF_08`, y reescribir cualquier `$$...$$` con `\text{}` de oración completa (rehaciendo la fórmula solo con símbolos y moviendo las palabras a la prosa).
- **Cada ítem lleva `"tags": ["<slug>"]`** según la tabla de distribución de su skill. No inventar slugs nuevos.
- **`feedback_incorrect` completo** en los 15 ítems de prueba por skill.
- **`correct_index` variado**, no concentrado en un solo índice.

## Qué SI está fuera de alcance

- No toques otros topics de `blue/limits` ni otros belts.
- No modifiques `authoring-context.md`, `course-context.md` ni `topic-context.md` — son insumo de lectura.
- No relajes la regla dura de restricción del topic (nada de L'Hôpital, derivadas, integrales, factorización, racionalización como método).

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ítem.** Escribí en el chat el plan: qué corrección aplica a cada ítem de prueba existente por sub-familia, qué pasa con los existentes, y cómo quedaría reescrito `GRAF_15` (autocontenido) y uno de los ítems con `\text{}` de oración completa (solo símbolos en la fórmula, palabras en la prosa) antes de escribir el resto.

**Paso 2 — Ejecutar** la generación/corrección sobre los 3 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist transversal + por skill de `topic-context.md` sobre los 15 ítems de prueba por skill. Prestá atención especial a: regla dura de restricción (cero tolerancia), regla 24 (sin referencias entre ítems, ni en `question` ni en `explanation`), regla 25 (porqué, no solo qué) en indeterminaciones y dominancia, regla 27 (laterales de la sub-C de RESL con punto de tendencia en el subíndice), **cada `explanation` con 1-2 párrafos de intuición general de la noción de límite en juego** (ver `course-context.md` §Refuerzo de intuición en `blue`), regla 26 (nada de `\text{}` con oración completa en un display), ningún renglón de `aligned` con 2+ igualdades, sin "escapar"/"escapa", `tags` completos y coincidentes con la tabla.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `feat(analisis/blue/infinite_limits): regenerar ítems de prueba y reglas globales de la ronda`.
5. En el mensaje del commit, resumí: cuántos de los 15 ítems de prueba se corrigieron y por qué regla, y el conteo final por `tags` de cada skill.
