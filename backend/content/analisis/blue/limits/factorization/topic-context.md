# Topic: factorization (Factorización)

Belt: `blue`, Unit: `limits`, Topic: `factorization`

Skills en este topic: `LEXI`, `RESL`. **50 ítems cada uno (100 en total)** al cerrar el refactor.

**Estado.** Este tópico reemplaza a `factorizacion` (rename ES→EN). La carpeta fue renombrada (`blue/limits/factorization/`) y los `external_id` se van a regenerar en la próxima seed (`blue_factorization_lexi_01…`), lo que rompe el progreso guardado en DB — asumido y aceptado. Los ejercicios viejos (`LEXI`, `ESTR`, `RESL`) se dejan tal cual en el folder por ahora; el refactor a la nueva distribución se hace en otro turno.

Este doc especifica el alcance nuevo, las reglas duras de restricción y la distribución objetivo por skill.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** **sustitución directa**, diagnóstico de la **indeterminación** $\tfrac{0}{0}$, concepto general de **límite** (tópico `definition`).
- **Lo que está aprendiendo acá:** identidades de **diferencia de cuadrados** ($a^2 - b^2 = (a-b)(a+b)$), **trinomio cuadrado perfecto** ($a^2 \pm 2ab + b^2 = (a \pm b)^2$), **extracción de factor común**, factorización de **trinomios** $x^2 + bx + c$ (encontrar dos números que sumen $b$ y multipliquen $c$), y el **teorema del factor** para cancelar expresiones con el factor problemático.
- **Lo que NO sabe todavía:** regla de L'Hôpital, derivadas, racionalización con conjugados complejos, división de polinomios (Ruffini más allá del teorema del factor).

### Regla dura de restricción

**Está prohibido** usar o mencionar en enunciados, opciones, feedback y explicaciones:

- **Regla de L'Hôpital**.
- **Derivadas** en cualquier forma.
- **Racionalización con conjugados** (esa técnica vive en el tópico `rationalization`).
- **División polinómica extensa** (Ruffini más allá del simple $(x - a)$ cuando ya se conoce la raíz).

La única herramienta permitida para salvar la indeterminación $\tfrac{0}{0}$ en este tópico es la **factorización polinómica** seguida de **cancelación del factor común** $(x - a)$.

Los ítems que quiebren esta regla se descartan y se reescriben.

---

**Nota para cuando se audite este topic**: ver `course-context.md` sección "Refuerzo de intuición en `blue`" (agregada en la auditoría de `lateral_limits`/`infinite_limits`): las `explanation` de toda la unidad `limits` suman 1-2 párrafos de intuición general de la noción de límite en juego, no solo la resolución del caso puntual. Sumarlo al checklist de este topic al cerrarlo.

---

## Correcciones de formato transversales (los 2 skills)

Reglas de authoring que se aplican al escribir los 100 ítems:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`: (a) concepto algebraico aplicado, (b) desarrollo formal paso a paso usando `\begin{aligned}` (factorización → cancelación → sustitución), (c) cierre técnico formal. Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (estrictamente prohibido en todo el contenido)**, sin humor.
3. **Economía del feedback**: `feedback_correct` debe ser conciso (una frase). **No** volcar todo el desarrollo matemático ahí; la resolución paso a paso va en `explanation` con `\begin{aligned}`.
4. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Voz descriptiva del error del distractor, en segunda persona amable ("estás tomando…", "fijate que…"). Nunca "el alumno confunde…".
5. **Negrita en primera mención** de conceptos clave: **factorización**, **indeterminación**, **diferencia de cuadrados**, **trinomio cuadrado perfecto**, **factor común**, **teorema del factor**. Nunca negritas dentro de `options`.
6. **Carga cognitiva**: coeficientes chicos, raíces **enteras** (evitar fracciones o irracionales que saturen la memoria de trabajo). El objetivo es evaluar el álgebra de límites, no aritmética pesada.
7. **Ortotipografía**: decimales con **coma** (`4,3`). Usar "valor" para coordenadas de $x$ y "función" en lugar de "curva" / "trazo" / "gráfico" cuando se habla del objeto matemático.
8. **`correct_index` variado**, no concentrado en un solo índice.

---

## `feedback_incorrect` en los 100 ítems

Completar con `array<string|null>` paralelo a `options`, `null` en el índice correcto. Voz descriptiva del concepto, en segunda persona amable. Una oración por distractor, autosuficiente.

---

## LEXI, 50 ítems

### Qué evalúa
Reconocimiento visual de **estructuras polinómicas** (formas típicas de factoreo) y afianzamiento de la **lógica de cancelación** detrás del método. Este skill no calcula límites completos: se enfoca en la identificación del caso y en la teoría del teorema del factor.

### Cardinalidad
**Exactamente 3 opciones** por ítem.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Identificación de casos de factoreo | Dada una expresión como $x^2 - 16$ o $x^2 + 6x + 9$, clasificarla (diferencia de cuadrados, trinomio cuadrado perfecto, factor común, trinomio general) o elegir su forma factorizada correcta. | `identificacion-casos-factoreo` | 15 |
| B. Teorema del factor | Asociar $\tfrac{0}{0}$ en $x = a$ con la existencia obligatoria del factor $(x - a)$ tanto en el numerador como en el denominador. La cancelación de ese factor es lo que salva la indeterminación. | `teorema-del-factor` | 15 |
| C. Naturaleza de la indeterminación | Consolidar que $\tfrac{0}{0}$ no es un valor ($\neq 1$, $\neq 0$, $\neq \infty$), sino un **indicador** de que existe un factor común cancelable. | `naturaleza-indeterminacion` | 10 |
| D. Racionalización vs factorización | Distinguir cuándo corresponde factorizar y cuándo racionalizar. Regla operativa: **si aparece una raíz cuadrada**, la técnica correcta es racionalización, no factorización (el tópico siguiente). | `racionalizacion-vs-factorizacion` | 10 |

### `feedback_incorrect`, confusiones fuente
- **Diferencia de cuadrados con signo suma**: elegir $(x - 4)(x + 4)$ para $x^2 + 16$. Recordar: la diferencia de cuadrados requiere signo menos entre los dos cuadrados; $x^2 + 16$ no factoriza en $\mathbb{R}$.
- **Trinomio cuadrado perfecto mal identificado**: en $x^2 + 5x + 4$ elegir $(x + 2)^2 + 1$ o similar. El TCP tiene la forma $x^2 \pm 2ab + b^2$ con doble producto exacto; $5x$ no es doble producto de $x$ y $2$.
- **Factor común mal extraído**: en $2x^2 + 6x$ elegir $2(x^2 + 6x)$ (olvidar sacar la $x$) o $x(2x + 6)$ (dejar el $2$ dentro). Extraer el máximo común divisor completo.
- **Teorema del factor invertido**: pensar que $\tfrac{0}{0}$ en $x = 2$ obliga a que aparezca el factor $(x + 2)$. Es $(x - a)$ con el signo opuesto al valor de tendencia.
- **$\tfrac{0}{0}$ leído como valor**: dar $0$, $1$ o $\infty$ como resultado de $\tfrac{0}{0}$. Recordar: es indeterminación, obliga a cambiar de técnica.
- **Racionalización elegida sin raíces**: proponer multiplicar por el conjugado cuando el enunciado no tiene ninguna raíz cuadrada. La racionalización es específica para expresiones con radicales.

### Reglas específicas
- **Negrita en primera mención** de `factorización`, `indeterminación`, `diferencia de cuadrados`, `trinomio cuadrado perfecto`, `factor común`, `teorema del factor`.
- Sub-A puede pedir "clasificá el caso" o "elegí la factorización correcta"; no mezclar los dos formatos en el mismo enunciado.
- **Textos exactos** en opciones de clasificación: `"Diferencia de cuadrados"`, `"Trinomio cuadrado perfecto"`, `"Factor común"`, `"Trinomio general"`, `"No factoriza en R"`.

---

## RESL, 50 ítems

### Qué evalúa
Ejecutar la **factorización**, **cancelar** el factor problemático $(x - a)$ y **evaluar** el límite resultante por sustitución directa.

### Cardinalidad
**Exactamente 4 opciones** por ítem (grilla 2×2). Valores numéricos cortos (**$\leq 35$ caracteres**).

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Diferencia de cuadrados y factor común | Límites que requieren una **sola transformación** básica. Ejemplos: $\lim_{x \to 2} \tfrac{x^2 - 4}{x - 2}$; $\lim_{x \to 0} \tfrac{x^2 + 3x}{x}$. | `diferencia-cuadrados-factor-comun` | 20 |
| B. Factorización de trinomios | Límites donde numerador o denominador es un trinomio $x^2 + bx + c$. Requiere encontrar los dos números que sumados dan $b$ y multiplicados dan $c$. | `factorizacion-trinomios` | 20 |
| C. Cancelación múltiple | Límites que exigen factorizar **tanto** el numerador **como** el denominador para hallar y cancelar el factor común. Ejemplo: $\lim_{x \to 3} \tfrac{x^2 - 9}{x^2 - 5x + 6}$. | `cancelacion-multiple` | 10 |

### `feedback_incorrect`, confusiones fuente
- **Cancelación mal aplicada**: cancelar $x$ de $\tfrac{x^2 + 3x}{x}$ como si fuera $\tfrac{x^2 + 3\cancel{x}}{\cancel{x}} = x^2 + 3$. La cancelación es un **factor común** en toda la expresión, no en un solo término: $\tfrac{x(x+3)}{x} = x + 3$.
- **Signo en la factorización de trinomio**: para $x^2 - 5x + 6$ dar $(x - 2)(x + 3)$ en vez de $(x - 2)(x - 3)$. Los dos números deben sumar $-5$ y multiplicar $+6$: ambos son negativos.
- **No cancelar antes de sustituir**: sustituir $x = a$ sin cancelar, seguir con $\tfrac{0}{0}$ y dar "no existe". Recordar: la factorización sirve exactamente para poder cancelar y luego sustituir.
- **Sustituir mal después de cancelar**: en $\lim_{x \to 2} (x + 2) = 4$, dar $2$ (sustituir en el factor cancelado en vez del cociente simplificado).
- **Signo de la raíz mal leído**: en $\tfrac{0}{0}$ cuando $x \to 3$, buscar el factor $(x + 3)$. Es $(x - 3)$: el signo dentro va opuesto al valor de tendencia.
- **Factorizar solo el numerador cuando también toca el denominador**: en cancelación múltiple, quedarse con la forma $\tfrac{(x-3)(x+3)}{x^2 - 5x + 6}$ y sustituir. Hay que factorizar también el denominador para poder cancelar.
- **Coeficiente principal ignorado**: en $2x^2 - 8$ factorizar como $(x - 2)(x + 2)$ olvidando el $2$: es $2(x - 2)(x + 2)$.

### Reglas específicas
- **Cociente con indeterminación $\tfrac{0}{0}$** obligatorio en el enunciado (verificar por sustitución directa). Si la sustitución da un valor finito, el ejercicio va al tópico `definition`, no acá.
- **Coeficientes chicos y raíces enteras**: números en la escala $[-10, 10]$ para trinomios; evitar coeficientes principales distintos de $\pm 1$ salvo casos explícitos de factor común.
- **Explicaciones con `\begin{aligned}`** mostrando: diagnóstico de indeterminación → factorización → cancelación → sustitución. Una línea por paso.
- **Cada línea del `aligned` mantiene `\lim_{x \to a}` explícito** (regla crítica 29 de `authoring-context.md`), incluidas las líneas intermedias de simplificación algebraica; nunca dejarlo caer después de la primera línea ni reemplazarlo por `\xrightarrow{}` en el paso final.
- **Ninguna aplicación de L'Hôpital**; ninguna racionalización.
- **Resultado numérico final** en las opciones (nunca una expresión sin evaluar).
- **Decimales con coma** (`4,3`).
- **$\tfrac{0}{0}$ nunca apilado dentro de un párrafo de prosa** (regla crítica 28): al nombrarlo en una oración ("la sustitución directa da 0/0"), usar la forma horizontal simple, sin `\dfrac`/`\frac`.

---

## Hallazgos de auditoría (ronda 1, jul-2026)

Corrección puntual del usuario sobre ítems de prueba de este topic (`correciones_analisis_limites_factorizacion_1.md`), aplicar al regenerar:

- **`LEXI_15`**: la palabra "salvar" está de más ("...ya no alcanza para salvar una indeterminación"), redundante y coloquial; recortar a algo tipo "...ya no resuelve una indeterminación". Además, la `explanation` mete texto en español dentro de un bloque `$$...$$` (`\text{la factorización ya no alcanza}`), **violación directa de la regla crítica 26**. También en el `question`, la fracción $\tfrac{0}{0}$ queda tejida inline en la misma oración de la pregunta; mejor una oración más formal en el enunciado, y la fórmula del límite igualada a $0/0$ en su propio bloque `$$...$$` separado (extensión de la regla crítica 18 a este patrón).
- **`RESL_02`, `RESL_09`** (y 3 ítems más de `RESL` con el mismo patrón): el desarrollo en `\begin{aligned}` deja caer el `\lim_{x \to a}` después de la primera línea y usa una flecha `\xrightarrow{x \to a}` en el paso final en vez de mantener el límite explícito. **Motivó la regla crítica 29, nueva en `authoring-context.md`**: todas las líneas del desarrollo mantienen `\lim_{x \to a}` explícito, hasta el resultado final. También motivó la **regla crítica 28**: la fracción $\tfrac{0}{0}$ tejida inline en la prosa ("da $\dfrac{0}{0}$") debería ir en su forma horizontal simple `0/0`, sin LaTeX apilado.
- **Ítem de diferencia de cuadrados (LEXI, sin `external_id` visible en la captura)**: sugerencia estructural de reordenar la `explanation`: presentar primero la identidad abstracta (ya está), una oración de transición, y luego el desarrollo en 3 líneas de `aligned` (expresión original → paso intermedio → forma factorizada) en vez de 2 líneas. Aplicar esta estructura de 3 pasos al regenerar los ítems de este patrón.
- **`LEXI_08`**: el enunciado tiene 2 oraciones completas sin separar en párrafos (`\n\n`); separarlas al regenerar.

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 2 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna mención de L'Hôpital, derivadas ni racionalización como método aplicado acá
- [ ] Explicaciones en 3 párrafos de prosa; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `feedback_correct` conciso (una frase); desarrollo completo en `explanation` con `\begin{aligned}`
- [ ] `correct_index` variado
- [ ] Coeficientes chicos, raíces enteras; sin nombres propios
- [ ] Decimales con coma
- [ ] **Ningún bloque `$$...$$` mete una oración completa en español vía `\text{...}`** (regla crítica 26)
- [ ] **Ninguna fracción $\tfrac{0}{0}$ apilada tejida en un párrafo de prosa** (regla crítica 28); en texto corrido usar `0/0`
- [ ] **Todo desarrollo en `aligned` mantiene `\lim_{x\to a}` explícito en cada línea** (regla crítica 29), nunca solo en la primera ni reemplazado por `\xrightarrow{}`
- [ ] Cada `explanation` suma 1-2 párrafos de intuición general de la noción de límite en juego (ver `course-context.md` §Refuerzo de intuición en `blue`)
- [ ] La fórmula del límite igualada a $0/0$, cuando se menciona en el enunciado, va separada del texto en su propio bloque `$$...$$` (extensión de la regla crítica 18, ver hallazgo `LEXI_15`)

**LEXI:**
- [ ] 50 ítems; **exactamente 3 opciones** por ítem
- [ ] Distribución A/B/C/D respetada (15/15/10/10)
- [ ] Negrita en primera mención de `factorización`, `indeterminación`, `diferencia de cuadrados`, `trinomio cuadrado perfecto`, `factor común`, `teorema del factor`
- [ ] Textos exactos en opciones de clasificación (`"Diferencia de cuadrados"`, `"Trinomio cuadrado perfecto"`, `"Factor común"`, `"Trinomio general"`, `"No factoriza en R"`)
- [ ] Explicaciones de "diferencia de cuadrados" con desarrollo de 3 líneas (expresión original → paso intermedio → forma factorizada) y una oración de transición antes del bloque (ver hallazgo)

**RESL:**
- [ ] 50 ítems; **exactamente 4 opciones** por ítem, cada opción $\leq 35$ caracteres
- [ ] Distribución A/B/C respetada (20/20/10)
- [ ] Todo enunciado presenta $\tfrac{0}{0}$ por sustitución directa (verificado)
- [ ] Explicaciones con la secuencia diagnóstico → factorización → cancelación → sustitución
- [ ] Ningún resultado dejado como expresión sin evaluar
- [ ] Ninguna aplicación de L'Hôpital ni racionalización
