# Prompt de refactor: analisis / brown / integrals / definite (GRAF + RESL)

Repo: `intervalo`. Branch de trabajo: `content-analisis-round2`. Antes de tocar nada, fijate si esa branch ya existe (local o en `origin`):
- Si **ya existe** (por ejemplo, porque ya se hizo el refactor de otro topic de `brown/integrals`, `violet/derivatives`, `blue/limits` o `white/functions` en ella), hacé checkout y seguí trabajando ahí, no crees una nueva ni la pises.
- Si **no existe**, creala desde `main` actualizado (`git checkout main && git pull && git checkout -b content-analisis-round2`).
No commitear directo a `main`.

> **Antes de arrancar**: leé `backend/content/generation-workflow.md`, el flujo completo de la ronda (ciclo por topic, validadores automáticos, criterios de commit). Este prompt es el detalle de UN topic dentro de ese flujo.

> **Alcance de la ronda 2 (importante):** en esta ronda **no se generan ejercicios nuevos**. Cada skill de este topic tiene **15 ejercicios de prueba** y el trabajo es **regenerarlos/corregirlos en el lugar** contra los hallazgos y todas las reglas, **sin agregar ni quitar ninguno**. Completar cada skill hasta 50 ejercicios es trabajo de la **ronda 3**, posterior y solo si la ronda 2 quedó validada. Donde más abajo este prompt diga "completar hasta 50", "ejercicios nuevos" o "los N ejercicios finales", interpretalo como esos 15 ejercicios existentes.

## Contexto

Este topic hoy tiene ejercicios de prueba (no los 50×2=100 de la meta). En la **ronda 2** solo se **regeneran y corrigen los 15 ejercicios de prueba que ya existen** por skill, sin agregar nuevos (ver el callout de alcance arriba). **Cierra el cinturón `brown`**: converge todas las técnicas de integración vistas evaluadas en un intervalo.

Una pre-revisión programática encontró, documentado en `topic-context.md` sección **"Hallazgos de auditoría (ronda 1, jul-2026)"**:
- **[YA CORREGIDO]** bug `\n\n$$` en los 30 ejercicios existentes, arreglado con un script mecánico antes de esta ronda.
- `GRAF#14`: `$$\text{integral definida (con signo)} \neq \text{área geométrica (siempre positiva)}$$` — cláusulas con aclaración entre paréntesis dentro de `\text{}`, viola la regla crítica 26.
- `GRAF#6`/`#7`: `\text{área arriba}`/`\text{área abajo}` como rótulos cortos dentro de `$$...$$`, más borderline pero preferible sacarlos a la prosa.
- `GRAF#9`/`#12`: opciones `["$0$", "$f(a)$", "No se puede determinar sin más datos"]` — la correcta (`$0$`) es la más corta por lejos frente a un distractor de 36 caracteres, reincidencia de la regla 4/15.
- `RESL`: 15/15 con `"Calculá"`, cláusula completa que solo necesita el `:`.

No hay reglas nuevas esta ronda: todo lo de arriba es reincidencia de reglas ya existentes (2, 4, 15, 26, 32), no candidatas a numeración nueva.

## Recordatorio prioritario, antes de generar un solo ejercicio

De todas las reglas de `authoring-context.md`, estas son las que más rompen la experiencia cuando se pasan por alto en esta unidad. Chequealas en cada ejercicio a medida que lo escribís, no solo al final:

1. **`\text{}` dentro de `$$...$$` solo con rótulos cortos, nunca cláusulas con aclaración entre paréntesis (regla 26, reincidencia confirmada en `GRAF#14`).** Mover cualquier aclaración tipo "(con signo)"/"(siempre positiva)" a la prosa que rodea la fórmula.
2. **Paridad de opciones (regla 4/15, reincidencia confirmada en `GRAF#9`/`#12`).** Una opción numérica corta (`$0$`) no puede quedar como la única mucho más breve que un distractor largo.
3. **Openers y puntuación (regla 32).** `"Calculá"` (`RESL`) es cláusula completa, solo necesita el `:` y variar la redacción.
4. **$+C$ prohibido en respuestas correctas** (a diferencia de los 3 topics anteriores): en definidas la constante se cancela al restar $F(b)-F(a)$. Aparece solo como distractor deliberado.

## Leer antes de escribir una sola línea, en este orden

1. **`backend/content/authoring-context.md` completo, sin saltear secciones.** Resumen acumulado hasta la fecha (con la regla crítica entre paréntesis):
   - Negrita solo en `question`/`explanation`, nunca en `options` (regla 1). Primera mención de conceptos clave en negrita (regla 3): en este topic, `integral definida`, `Regla de Barrow`, `Teorema Fundamental del Cálculo`, `área neta`, `límites de integración`.
   - `$$...$$` pegado con UN solo `\n`, nunca `\n\n` (regla 2). **Bug confirmado y corregido en los 30 ejercicios existentes**; no reintroducirlo.
   - **Paridad de opciones en ambos sentidos (regla 4 y su extensión 15). Reincidencia confirmada en `GRAF#9`/`#12`**: la correcta (`$0$`, 3 caracteres) no puede quedar como la única mucho más corta que un distractor de 36 caracteres.
   - Sin adjetivos decorativos (regla 5). Sin em-dash `—` ni en-dash `–` (regla 6).
   - Cierre de `explanation` es advertencia/consejo, humor excepcional y solo como analogía cotidiana formal, nunca antropomorfismo (regla 7).
   - "Función", nunca "regla", salvo nombre propio (regla 8). "Regla de Barrow" es nombre propio válido tal cual.
   - Nunca cortar una oración a la mitad con una fórmula display en el medio (regla 9).
   - Mayúscula al iniciar oración, incluso tras fórmula display (regla 10).
   - Nunca abrir un párrafo con rótulo tipo `"Nota:"`, `"Verificación:"`, `"Ojo:"` (regla 11).
   - Nunca invocar conceptos fuera de la frontera del cinturón (regla 12): en este topic, nada de áreas entre curvas, análisis de funciones ni optimización con integrales (fuera del alcance del curso, ver regla dura del topic).
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
   - Nunca enmarcar un ejercicio respecto de otro ejercicio de la sesión; todo ejercicio abstracto sitúa el concepto desde la primera oración (regla 24): aplica a `GRAF` sub-B (propiedades de los límites).
   - El concepto abstracto de la `explanation` justifica el porqué, no solo declara el qué (regla 25).
   - **Un bloque `$$...$$` lleva solo símbolos y números, nunca una oración completa en español con `\text{...}` (regla 26). Reincidencia confirmada en `GRAF#14`**: sacar las aclaraciones entre paréntesis a la prosa, dejar solo el rótulo corto dentro del bloque si hace falta.
   - Un límite lateral siempre lleva el punto de tendencia en el subíndice (regla 27, no aplica, este topic no usa límites laterales).
   - La fracción $\tfrac{0}{0}$ apilada nunca va tejida dentro de un párrafo de prosa (regla 28, no aplica directo).
   - En el desarrollo `aligned` de un límite, `\lim` se repite en TODAS las líneas (regla 29, no aplica, ver en cambio regla 30).
   - Un `aligned` con columna de `=` es solo para una ecuación que se despeja o una expresión que se transforma paso a paso, nunca para listar datos evaluados de forma independiente (regla 30).
   - Todo ejercicio reintroduce la definición/fórmula central que usa, sin asumir que el alumno ya la vio en otro ejercicio (regla 31). En este topic aplica a $\int_a^b f(x)\,dx = F(b)-F(a)$ (Barrow) misma.
   - **Openers y puntuación (regla 32).** `"Calculá"` (`RESL`) es cláusula completa: solo le falta el `:` y variar la redacción (hoy 100% idéntica en los 15 ejercicios).
   - Preferencia por fórmula centrada sobre LaTeX inline en `explanation` cuando la fórmula es el objeto central.
   - Preferencia por notación LaTeX/simbólica sobre prosa en `options`.
   - Fórmulas anchas: nunca encadenar igualdades largas en una sola línea horizontal, partir en `\begin{aligned}` vertical; cada renglón corto por sí solo.
   - Grilla 2×2: ≤35 caracteres en `RESL` y en ejercicios numéricos de `GRAF` (ver cardinalidad propia).
   - Vocabulario prohibido ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual", "escapar"/"escapa").
   - `explanation` ≥ 300 caracteres, estructura de 3 partes (concepto abstracto con el porqué, aplicación paso a paso, cierre útil).
2. `backend/content/analisis/course-context.md` — estado matemático del alumno en `brown`.
3. `backend/content/analisis/brown/integrals/definite/topic-context.md` — este topic. Tiene la **regla dura de restricción** (solo Barrow sobre una función vs. eje $x$, nada de áreas entre curvas/análisis de funciones/optimización, $+C$ **prohibido** en respuestas correctas), la **distribución objetivo con `tags`** (GRAF 25/25, RESL 25/25), las **confusiones fuente** por skill, y **"Hallazgos de auditoría (ronda 1, jul-2026)"**.
4. `backend/content/authoring-context.md` sección **"Etiquetas (tags)"**: cada ejercicio lleva `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill.

## Objetivo

Sobre `GRAF.json` y `RESL.json` de `backend/content/analisis/brown/integrals/definite/`:

- **Regenerar los 15 ejercicios de prueba por skill que ya existen** (sin agregar ni quitar; completar a 50 es la ronda 3), partiendo de los ejercicios de prueba existentes.
- **Corregir los ejercicios existentes** contra los hallazgos: sacar las aclaraciones entre paréntesis del `\text{}` de `GRAF#14` (mover a la prosa), ajustar la paridad de longitud de `GRAF#9`/`#12`, agregar `:` a los openers de `RESL` y variar la redacción.
- **Respetar la regla dura de restricción** del topic: solo Barrow sobre una función vs. eje $x$, nada de áreas entre curvas/análisis de funciones/optimización (fuera del alcance del curso), $+C$ **prohibido** en respuestas correctas (aparece solo como distractor deliberado), sustitución con límites actualizados o retorno a $x$.
- **Cada ejercicio lleva `"tags": ["<slug>"]`** según la tabla de distribución de su skill. No inventar slugs nuevos.
- **`feedback_incorrect` completo** en los 15 ejercicios de prueba por skill.
- **`correct_index` variado**, no concentrado en un solo índice.

## Qué SI está fuera de alcance

- No toques otros topics de `brown/integrals` ni otros belts.
- No modifiques `authoring-context.md`, `course-context.md` ni `topic-context.md` — son insumo de lectura.
- No relajes la regla dura de restricción del topic (nada de áreas entre curvas, análisis de funciones, optimización, ni ningún tema fuera del alcance del curso).

## Cómo proceder: planificar, ejecutar, commitear

**Paso 1 — Plan, antes de tocar un solo ejercicio.** Escribí en el chat el plan: qué corrección aplica a cada ejercicio de prueba existente por sub-familia, qué pasa con los existentes, y cómo quedaría reescrito `GRAF#14` (sin aclaraciones entre paréntesis dentro del `\text{}`) y `GRAF#9`/`#12` (opciones con paridad ajustada) antes de escribir el resto.

**Paso 2 — Ejecutar** la generación/corrección sobre los 2 archivos según el plan.

**Paso 3 — Commit solo si todo salió bien.** Antes de commitear:
1. Corré el checklist transversal + por skill de `topic-context.md` sobre los 15 ejercicios de prueba por skill. Prestá atención especial a: regla dura de restricción (cero tolerancia, especialmente $+C$ prohibido en correctas), `$$...$$` con un solo `\n`, regla 26 (sin cláusulas con paréntesis dentro de `\text{}`), paridad de opciones, regla 32 (openers con `:` y redacción variada), `tags` completos y coincidentes con la tabla.
2. Validá el formato con el seeder: desde `backend/`, `python seed_content.py --course analisis` (sin `--all`) y revisá que no tire errores sobre este topic.
3. Si el seeder tira error o el checklist no cierra, **no commitees**: arreglá primero y repetí la validación.
4. Recién con el checklist limpio y el seeder sin errores, commiteá con mensaje tipo `feat(analisis/brown/definite): regenerar ejercicios de prueba y correcciones de la ronda`.
5. En el mensaje del commit, resumí: cuántos de los 15 ejercicios de prueba se corrigieron y por qué regla, y el conteo final por `tags` de cada skill.
