# Prompt de refactor: analisis / blue / limits / rationalization (LEXI + RESL)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de `definition`, `lateral_limits`, `infinite_limits`, `continuity` o `factorization` de `blue/limits`, o cualquier topic de `white/functions`, en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

> **Alcance de la ronda 2 (importante):** en esta ronda **no se generan ejercicios nuevos**. Cada skill de este topic tiene **15 ejercicios de prueba** y el trabajo es **regenerarlos/corregirlos en el lugar** contra los hallazgos y todas las reglas, **sin agregar ni quitar ninguno**. Completar cada skill hasta 50 ejercicios es trabajo de la **ronda 3**, posterior y solo si la ronda 2 quedó validada. Donde más abajo este prompt diga "completar hasta 50", "ejercicios nuevos" o "los N ejercicios finales", interpretalo como esos 15 ejercicios existentes.

## Contexto

Igual que los otros topics de `blue/limits`, este topic hoy tiene ejercicios de prueba (15 por skill, no los 50 de la meta). En la **ronda 2** solo se **regeneran y corrigen los 15 ejercicios de prueba que ya existen** por skill, sin agregar nuevos (ver el callout de alcance arriba). **`LEXI.json` y `RESL.json` ya existen** con 15 ejercicios de prueba cada uno.

Una auditoría en vivo (`/test`) encontró, documentado en `topic-context.md` sección **"Hallazgos de auditoría (ronda 1, jul-2026)"**:
- `RESL_05`, `RESL_02`, `RESL_01`: el primer renglón del desarrollo `aligned` (multiplicación por el conjugado + resultado simplificado en la misma línea) desborda el ancho de pantalla en mobile.
- **Revisión completa de los 15 ejercicios de prueba de `RESL`** (no solo los señalados en la corrección): 4 de los 15 superan el tope de números chicos ($c \leq 5$), no solo `RESL_05`. Uno de sub-A con $c=7$ y dos de sub-B con $c=6$ y $c=7$ también hay que bajarlos.
- Un ejercicio de sub-A usa un desplazamiento $\pm1$ dentro de la raíz ($\sqrt{x-1}-2$ con tendencia $x\to5$), que agrega aritmética gratuita sin aportar nada conceptual. **Motivó una regla nueva**: nunca $\pm1$ como desplazamiento, tendencia $x\to0$ como default.
- `LEXI_14`: la palabra "liberar" en la opción correcta no convence (reemplazada por "exponer"), y la `explanation` teje $\tfrac{0}{0}$ apilado dentro de un párrafo de prosa, **recurrencia de la regla crítica 28** (ya establecida en `factorization`).

**Tres ajustes concretos de esta ronda**, ya reflejados en `topic-context.md`:
1. **Tope explícito $c \leq 5$** para los radicandos de `RESL` (nunca $\sqrt{36}=6$ ni mayor) — afecta a **4 de los 15 ejercicios existentes**.
2. **Nunca $\pm1$ como desplazamiento dentro de la raíz**; sub-A y sub-B usan por default el patrón $\sqrt{x+c^2}-c$ con **tendencia $x\to0$**, sin ningún paso de aritmética intermedio. Tendencias no nulas quedan para una minoría avanzada, nunca con desplazamiento $\pm1$.
3. **El planteo de la multiplicación por el conjugado va en su propio renglón del `aligned`**, separado de su resultado ya simplificado (ver `authoring-context.md` sección *Fórmulas anchas* → *Caso particular: multiplicar por un factor*, nueva esta ronda).

## Recordatorio prioritario, antes de generar un solo ejercicio

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto. Chequealas en cada ejercicio a medida que lo escribís, no solo al final:

1. **Paridad de opciones (reglas críticas 4 y 15).** Ninguna opción puede quedar como la única notablemente más larga/elaborada NI la única más corta/pelada que el resto; tampoco la única con un formato numérico distinto (entera vs. decimal, con vs. sin glosa aclaratoria). Si notás esa asimetría en cualquier ejercicio, igualá hacia el medio antes de seguir con el próximo.
2. **Estructura de párrafos y LaTeX.** Párrafos de `explanation`/`question` ≤200 caracteres (ideal ~100); 2+ fragmentos LaTeX inline sueltos en el mismo párrafo se dividen (regla 21); la fórmula central del enunciado va separada del texto en su propio `$$...$$`, nunca tejida inline (regla 18); cualquier derivación de 2+ pasos va vertical en `\begin{aligned}`, nunca encadenada en una sola línea horizontal, y cada renglón tiene que ser corto por sí solo.
3. **Aligned solo para derivaciones reales (regla 30, nueva de la última ronda).** Un `\begin{aligned}` con columna de `=` se reserva para una ecuación que se despeja o una expresión que se transforma paso a paso; nunca para listar datos o valores evaluados de forma independiente, esos van en prosa.
4. **Reintroducir la definición central en cada ejercicio (regla 31, nueva).** Si la pregunta depende de una fórmula/definición que no está explícita en el propio enunciado, se reintroduce con LaTeX centrado antes de la pregunta puntual; nunca asumirla vista en otro ejercicio de la sesión.
5. **Openers y puntuación (regla 32, nueva).** Un imperativo con objeto concreto ("Considerá la función") es cláusula completa y solo necesita el `:` antes del bloque `$$...$$`; un fragmento sin objeto propio ("Sabiendo que", "Para derivar", "En") no se arregla con `:`, se reescribe como cláusula completa. En ambos casos, variar la redacción ejercicio a ejercicio, nunca repetir la misma apertura como plantilla en toda una sub-familia.

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen acumulado hasta la fecha (con la regla crítica entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de conceptos clave en negrita (regla 3): en este topic, `racionalización`, `conjugado`, `diferencia de cuadrados`, `indeterminación`.
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2).
   - Paridad de opciones en ambos sentidos (regla 4 y su extensión 15), también de formato numérico.
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6), **estrictamente prohibido en este topic**.
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8).
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9). Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - **Nunca invocar L'Hôpital, derivadas, raíces cúbicas, raíces anidadas ni conjugados complejos** (regla 12 general + regla dura de restricción propia de este topic).
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
   - Nunca enmarcar un ejercicio respecto de otro ejercicio de la sesión; todo ejercicio abstracto sitúa el concepto desde la primera oración (regla 24).
   - El concepto abstracto de la `explanation` justifica el porqué, no solo declara el qué (regla 25).
   - **Cada `explanation` suma 1-2 párrafos de intuición general de la noción de límite en juego** (ver `course-context.md` §Refuerzo de intuición en `blue`).
   - Un bloque `$$...$$` lleva solo símbolos y números, nunca una oración completa en español con `\text{...}` (regla 26).
   - Un límite lateral siempre lleva el punto de tendencia en el subíndice (regla 27, no aplica directo, este topic no usa laterales).
   - **La fracción $\tfrac{0}{0}$ apilada nunca va tejida dentro de un párrafo de prosa** (regla 28); si hace falta nombrarla en una oración, usar la forma horizontal `0/0`. **Reincidencia confirmada en `LEXI_14` de este topic.**
   - En el desarrollo `aligned` de un límite, `\lim_{x \to a}` se repite en todas las líneas, nunca solo en la primera (regla 29, aplica igual acá: cada línea de la racionalización mantiene el `\lim` explícito, no solo el álgebra suelta).
   - **Caso particular de fórmulas anchas (nuevo esta ronda): el planteo de multiplicar por el conjugado va en su propio renglón, separado del resultado ya simplificado.** Ver ejemplo en `authoring-context.md`. Reincidencia confirmada en los 3 ejercicios de `RESL` de este topic.
   - **Nunca $\pm1$ como desplazamiento dentro de la raíz (nuevo esta ronda, específico de este topic): sub-A y sub-B usan por default $\sqrt{x+c^2}-c$ con tendencia $x\to0$.** Tendencias no nulas (y desplazamientos que no sean $c^2$) quedan para una minoría avanzada, y ahí tampoco se usa $\pm1$.
   - **Tope $c \leq 5$ en todos los radicandos de `RESL` (específico de este topic): 4 de los 15 ejercicios de prueba lo superaban, corregir todos, no solo los señalados en la auditoría.**
   - Preferencia por fórmula centrada sobre LaTeX inline en `explanation` cuando la fórmula es el objeto central.
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options`.
   - Grilla 2×2: ≤16 caracteres con LaTeX, ≤25 en texto plano.
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual", "escapar"/"escapa").
   - `explanation` ≥ 300 caracteres, estructura de 3 partes (concepto abstracto con el porqué + intuición, aplicación paso a paso, cierre útil).
2. `backend/content/analisis/course-context.md` — estado matemático del alumno en `blue`, y la sección **"Refuerzo de intuición en `blue`"**.
3. `backend/content/analisis/blue/limits/rationalization/topic-context.md` — este topic. Tiene la **regla dura de restricción**, la **distribución objetivo con `tags`** (LEXI 15/15/10/10, RESL 20/20/10, sin cambios de proporciones esta ronda), el **tope $c \leq 5$** para radicandos, las **confusiones fuente** por skill, y **"Hallazgos de auditoría (ronda 1, jul-2026)"**.
4. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ejercicio lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `LEXI.json` y `RESL.json` de `backend/content/analisis/blue/limits/rationalization/` (15 ejercicios de prueba cada uno hoy):

- **Regenerar los 15 ejercicios de prueba por skill que ya existen** (sin agregar ni quitar; completar a 50 es la ronda 3), partiendo de los 15 ejercicios de prueba existentes de cada uno.
- **Corregir los ejercicios existentes de `RESL`** con el patrón de renglón ancho (`RESL_01`, `RESL_02`, `RESL_05`, y cualquier otro con el mismo patrón): separar el planteo de la multiplicación por el conjugado de su resultado en renglones distintos del `aligned`.
- **Bajar a $c \leq 5$ los 4 ejercicios de `RESL` que superan el tope** (uno con $c=6$ en sub-A, y dos con $c=6$/$c=7$ en sub-B, además del ya señalado `RESL_05`).
- **Reescribir el ejercicio de sub-A con desplazamiento $\pm1$** ($\sqrt{x-1}-2$ con tendencia $x\to5$) al patrón default $\sqrt{x+c^2}-c$ con tendencia $x\to0$.
- **Corregir `LEXI_14`**: cambiar "liberar" por "exponer" en la opción correcta, y sacar la fracción $\tfrac{0}{0}$ apilada del párrafo de prosa (usar `0/0` horizontal).
- **Cada ejercicio lleva `"tags": ["<slug>"]`** según la tabla de distribución de su skill. No inventar slugs nuevos.
- **`feedback_incorrect` completo** en los 15 ejercicios de prueba por skill.
- **`correct_index` variado**, no concentrado en un solo índice.

## Qué SI está fuera de alcance

- No toques otros topics de `blue/limits` ni otros belts.
- No modifiques `authoring-context.md`, `course-context.md` ni `topic-context.md` — son insumo de lectura.
- No relajes la regla dura de restricción del topic (nada de L'Hôpital, derivadas, raíces cúbicas, raíces anidadas, conjugados complejos).

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ejercicio.** Escribí en el chat el plan: qué corrección aplica a cada ejercicio de prueba existente por sub-familia, qué pasa con los 15 existentes de cada uno, y cómo queda reescrito uno de los ejercicios de `RESL` con el renglón de la multiplicación separado y otro con $c\leq5$/sin desplazamiento $\pm1$, antes de aplicarlo al resto.

**Paso 2 — Ejecutar** la generación/corrección sobre los 2 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist transversal + por skill de `topic-context.md` sobre los 15 ejercicios de prueba por skill. Prestá atención especial a: regla dura de restricción (cero tolerancia), tope $c \leq 5$ en **todos** los radicandos de `RESL` (verificar los 50, no solo los señalados), ningún desplazamiento $\pm1$ dentro de la raíz, el planteo de la multiplicación en su propio renglón, regla 28 ($0/0$ nunca apilado en prosa), regla 29 (`\lim_{x\to a}` en cada línea), `tags` completos y coincidentes con la tabla.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `feat(analisis/blue/rationalization): regenerar ejercicios de prueba y reglas globales de la ronda`.
5. En el mensaje del commit, resumí: cuántos ejercicios por skill, cuántos existentes se corrigieron y por qué regla, y el conteo final por `tags` de cada skill.
