# Topic: limit_definition (Definición de derivada)

Belt: `violet`, Unit: `derivatives`, Topic: `limit_definition`

Skills en este topic: `LEXI`, `CLSF`, `GRAF`, `ESTR`. **50 ítems cada uno (200 en total)** al cerrar el refactor.

**Estado.** Los ejercicios viejos (`LEXI`, `CLSF`, `GRAF`, `ESTR`) se dejan tal cual en el folder por ahora; el refactor a la nueva distribución se hace en otro turno. Este doc especifica el alcance nuevo, las reglas duras de restricción y la distribución objetivo por skill.

Este es el **primer tópico** de la unidad de derivadas: cubre el concepto formal vía **límite del cociente incremental**, sin usar todavía las reglas prácticas de derivación.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** evaluar funciones en $x + h$, operar algebraicamente con polinomios (cuadrado de un binomio), calcular **límites**, diagnosticar la **indeterminación** $\tfrac{0}{0}$, reconocer la **continuidad** analítica y geométrica (todo el cinturón `blue`).
- **Lo que está aprendiendo acá:** la **anatomía del cociente incremental**, el límite cuando $h \to 0$, la **notación** de derivada ($f'$, $\tfrac{dy}{dx}$), el diagnóstico visual del **signo** de la derivada y el teorema que relaciona **diferenciabilidad con continuidad**.
- **Lo que NO sabe todavía:** ecuación de la **recta secante** o **tangente** (se delega al tópico siguiente, `geometric_interpretation`), reglas prácticas de derivación (potencia, producto, cociente, cadena), reglas para funciones elementales.

### Regla dura 1 (ESTR)

Todo cálculo de derivadas en `ESTR` debe justificarse **exclusivamente expandiendo el límite del cociente incremental**. Está **estrictamente prohibido** usar o mencionar atajos como:

- $(x^n)' = n x^{n-1}$
- $(c)' = 0$
- Regla del producto, cociente o cadena
- $(\sin x)' = \cos x$ u otras derivadas de funciones elementales

La resolución se hace paso a paso: (1) plantear el cociente incremental, (2) evaluar $f(x + h)$ y $f(x)$, (3) simplificar el numerador, (4) factorizar $h$, (5) cancelar y tomar el límite.

### Regla dura 2

**No se piden** ecuaciones de rectas tangentes ($y = mx + b$) ni el cálculo numérico de la pendiente de la secante en este tópico. Toda la geometría acá es de **diagnóstico visual** del signo o de la existencia de la derivada. Los cálculos de tangente pertenecen al tópico `geometric_interpretation`.

Los ítems que quiebren cualquiera de las reglas duras se descartan y se reescriben.

---

## Correcciones de formato transversales (los 4 skills)

Reglas de authoring que se aplican al escribir los 200 ítems:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`. KaTeX agrega su propio margen.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`: (a) concepto abstracto / regla, (b) desarrollo formal en `\begin{aligned}` si hay más de un paso algebraico, (c) cierre con advertencia técnica o consejo práctico. Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (prohibido estricto)**, sin antropomorfismos ni humor.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Voz descriptiva del error del distractor, en segunda persona amable ("olvidaste el término cruzado $2xh$ al expandir el binomio", "fijate que…"). Nunca "el alumno confunde…".
4. **Negrita en primera mención** de conceptos clave: **derivada**, **tasa de cambio instantánea**, **cociente incremental**, **diferenciable**, **continua**, **notación de Leibniz**, **notación de Lagrange**. Nunca negritas dentro de `options`.
5. **Variables inline** (`$x$`, `$h$`, `$a$`) en la prosa; display solo para expresiones completas.
6. **Ortotipografía**: decimales con **coma** (`4,3`). Sin nombres propios.
7. **`correct_index` variado**, no concentrado en un solo índice.

---

## `feedback_incorrect` en los 200 ítems

Completar con `array<string|null>` paralelo a `options`, `null` en el índice correcto. Voz descriptiva del concepto, en segunda persona amable. Una oración por distractor, autosuficiente.

---

## LEXI, 50 ítems

### Qué evalúa
Afianzar la **notación**, la **anatomía** de la fórmula del límite y la diferenciación conceptual de **tasa de cambio instantánea** vs. promedio.

### Cardinalidad
**Exactamente 3 opciones** por ítem.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Anatomía del límite | Diseccionar la fórmula $f'(a) = \lim_{h \to 0} \tfrac{f(a+h) - f(a)}{h}$: qué es $h$ (el incremento que tiende a $0$), qué son $a$ y $x$ (puntos fijos), por qué la sustitución directa produce $\tfrac{0}{0}$, qué representa el numerador y qué el denominador. | `anatomia-del-limite` | 20 |
| B. Tasa instantánea vs. promedio | Contraste puro: sin el límite es una **tasa promedio** (equivalente a la pendiente de la secante); con el límite pasa a ser la **tasa instantánea** (equivalente a la pendiente de la tangente). Ninguna cuenta. | `tasa-instantanea-vs-promedio` | 15 |
| C. Notación formal | Reconocer la **notación de Leibniz** $\tfrac{df}{dx}$, la **notación de Lagrange** $f'(x)$, la de Newton $\dot{f}$; distinguirlas de la variación finita $\tfrac{\Delta f}{\Delta x}$. | `notacion-formal-derivada` | 15 |

### `feedback_incorrect`, confusiones fuente
- **$h$ confundido con $x$**: pensar que "lo que tiende a $0$" es $x$ o $a$. Recordar: $h$ es el **incremento**; $a$ es el punto donde se calcula la derivada y queda fijo.
- **Sustitución directa admisible**: creer que se puede sustituir $h = 0$ directamente en el cociente y obtener $f'(a)$. Se obtiene $\tfrac{0}{0}$: es una **indeterminación** que se levanta simplificando el numerador y factorizando $h$.
- **$\Delta$ confundida con $d$**: dar $\tfrac{\Delta y}{\Delta x}$ como notación de derivada. La derivada usa $d$ (variación **infinitesimal**); $\Delta$ es variación finita, o sea, tasa promedio.
- **Notación de Lagrange con paréntesis mal ubicados**: dar $f(x)'$ en vez de $f'(x)$. El apóstrofe va sobre $f$, no sobre la expresión evaluada.
- **Tasa promedio nombrada como instantánea**: elegir "instantánea" para $\tfrac{f(b) - f(a)}{b - a}$ sin que aparezca el límite. Sin límite es promedio.

### Reglas específicas
- **Negrita en primera mención** de `derivada`, `tasa de cambio instantánea`, `cociente incremental`, `notación de Leibniz`, `notación de Lagrange`.
- Sub-A trabaja con la fórmula simbólica; ninguna cuenta numérica.
- Sub-C con opciones que muestran distintas notaciones, no en prosa.

---

## CLSF, 50 ítems

### Qué evalúa
Evaluar la **relación jerárquica entre diferenciabilidad y continuidad** sin hacer cálculos: implicaciones lógicas, contraejemplos clásicos, condiciones necesarias vs. suficientes.

### Cardinalidad
**Exactamente 3 opciones** por ítem.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Teorema diferenciabilidad ⇒ continuidad | Consolidar la implicación: **diferenciable ⇒ continua**, pero **continua ⇏ diferenciable**. Reconocer que una función con salto es no diferenciable **por** no ser continua. | `teorema-diferenciable-implica-continua` | 20 |
| B. Casos teóricos de no-diferenciabilidad | Clasificar por qué una función no es derivable en un punto: quiebre (laterales del cociente incremental difieren), salto (falla continuidad), tangente vertical (derivada infinita). Sin gráfico, con descripción analítica. | `casos-teoricos-no-diferenciabilidad` | 15 |
| C. El contraejemplo de $\|x\|$ | El caso paradigmático: $f(x) = \|x\|$ es continua en $x = 0$ pero no diferenciable ahí, porque el cociente incremental tiene laterales $-1$ y $+1$. Ítems que aíslen esta situación. | `contraejemplo-valor-absoluto` | 15 |

### `feedback_incorrect`, confusiones fuente
- **Implicación invertida**: sostener que "continua ⇒ diferenciable". El contraejemplo es $|x|$: continua en $0$, no derivable.
- **Quiebre confundido con salto**: llamar "salto" al pico de $|x|$ en $0$. Hay quiebre (laterales del cociente difieren) sin salto (la función sigue siendo continua).
- **Salto clasificado como continuo pero no diferenciable**: creer que una función con salto es "solo no diferenciable" en el punto. Un salto rompe la continuidad **y** la diferenciabilidad.
- **Función derivable en $x = 0$ para $|x|$**: dar $f'(0) = 0$ (por simetría) o $f'(0) = 1$. Los laterales del cociente incremental valen $-1$ y $+1$, así que el límite no existe.
- **Tangente vertical clasificada como diferenciable con pendiente infinita**: creer que $f'(a) = \infty$ es un valor legítimo. La derivada se define como un número real; $\pm\infty$ significa que la derivada **no existe**.

### Reglas específicas
- **Sin cálculos**; el trabajo es lógico / de clasificación teórica.
- **Textos exactos** en opciones para clasificar diferenciabilidad: `"Diferenciable"`, `"Continua pero no diferenciable"`, `"Discontinua"`, `"No se puede determinar"`.
- **Negrita en primera mención** de `diferenciable`, `continua`.

---

## GRAF, 50 ítems

### Qué evalúa
**Diagnóstico visual** del comportamiento de la derivada leyendo la gráfica de $f$: signo, ceros, y pérdida de diferenciabilidad.

### Cardinalidad
- **3 opciones** para preguntas categóricas (signo de $f'$, existencia de la derivada).
- **4 opciones** para respuestas numéricas cortas (valor de $x$ donde $f' = 0$, etc.).

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Signo de la derivada | Dada la curva, determinar si $f'(a)$ es positiva (la curva sube), negativa (baja) o cero (recta horizontal instantánea, vértice, meseta). | `signo-de-la-derivada-visual` | 20 |
| B. Identificación de ceros | Detectar visualmente **vértices**, **crestas** o **valles** como los puntos donde $f'$ se anula. Distractores: raíces de $f$ (donde $f = 0$, no donde $f' = 0$). | `identificacion-ceros-derivada` | 15 |
| C. Diagnóstico de esquinas y saltos | Marcar en qué punto la función **pierde la diferenciabilidad**: quiebre abrupto (pico tipo $|x|$), salto (discontinuidad), tangente vertical. | `diagnostico-esquinas-y-saltos` | 15 |

### `feedback_incorrect`, confusiones fuente
- **Signo invertido**: leer $f'(a) < 0$ en un tramo donde la curva sube. Recordar: sube ⇒ derivada positiva; baja ⇒ derivada negativa.
- **Cero de $f'$ confundido con raíz de $f$**: dar el $x$ donde la curva cruza el eje (raíz de $f$) cuando se pregunta dónde $f' = 0$. La derivada se anula en los vértices, no en los cortes con el eje.
- **Vértice suave confundido con quiebre**: en un mínimo suave (tipo parábola), decir que hay una esquina o pérdida de diferenciabilidad. Los vértices suaves son diferenciables con $f' = 0$; solo los picos angulares no lo son.
- **Salto clasificado como quiebre suave**: en una discontinuidad de salto, elegir "quiebre" (esquina). Un salto es una **discontinuidad**, así que la derivada tampoco existe, pero por continuidad y no por quiebre.
- **$f'(a) = 0$ leído como "no derivable"**: en un vértice suave con tangente horizontal, decir que la derivada no existe. Existe y vale $0$.

### Reglas específicas
- **Gráficos claros**, un solo comportamiento por ítem (una zona de subida, un vértice, un quiebre).
- **Vértices suaves como distractor** en sub-C (no son puntos de no-diferenciabilidad).
- Cuando la respuesta es un signo, opciones con textos exactos: `"Positiva"`, `"Negativa"`, `"Cero"`, `"No existe"`.
- **Sin pedir el valor numérico** de $f'(a)$; ese cálculo va en ESTR o en el tópico siguiente.
- `graph_view` cuadrado, escala 1:1 para no engañar visualmente sobre la pendiente.

---

## ESTR, 50 ítems

### Qué evalúa
Ejecutar la **secuencia algebraica** para calcular $f'(x)$ o $f'(a)$ **exclusivamente por definición**: plantear el cociente incremental, expandir, simplificar, factorizar $h$, cancelar y tomar el límite.

### Cardinalidad
**Exactamente 4 opciones** por ítem (grilla 2×2). Expresiones cortas (**$\leq 35$ caracteres**).

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Cuadráticas y el binomio | **Core del cálculo**. Derivar $f(x) = ax^2 + bx + c$ o casos particulares. Expandir $(x + h)^2 = x^2 + 2xh + h^2$, distribuir, no olvidar el **término cruzado** $2xh$, cancelar los términos sin $h$ del numerador, factorizar $h$ y evaluar el límite. | `cuadraticas-y-el-binomio` | 25 |
| B. Pasos intermedios del límite | Preguntas de **proceso**, no de resultado. Ejemplo: "tras expandir y cancelar los términos sin $h$, ¿qué factor común se extrae del numerador?" o "¿cuál es el numerador simplificado antes de tomar el límite?". | `pasos-intermedios-del-limite` | 15 |
| C. Lineales y constantes | Límites del tipo $\tfrac{5 - 5}{h} = 0$ (constantes) o $\tfrac{3(x + h) - 3x}{h} = \tfrac{3h}{h} = 3$ (lineales), donde $h$ se cancela de inmediato dando un resultado constante. Casos que introducen el método sin cálculo pesado. | `lineales-y-constantes-cociente` | 10 |

### `feedback_incorrect`, confusiones fuente
- **Término cruzado olvidado**: en $(x + h)^2$ dar $x^2 + h^2$ (olvidar el $2xh$). Es el error más costoso: sin el $2xh$ no hay cociente incremental correcto.
- **Cancelación prematura**: cancelar $h$ del cociente antes de simplificar el numerador, dando un resultado con $h$ todavía dentro.
- **Sustituir $h = 0$ sin cancelar**: llegar a $\tfrac{2xh + h^2}{h}$ y sustituir $h = 0$ obteniendo $\tfrac{0}{0}$ y responder "no existe". Hay que **factorizar** $h$ primero: $\tfrac{h(2x + h)}{h} = 2x + h$, y **luego** tomar el límite: $2x$.
- **Signo mal repartido**: en $f(x + h) - f(x)$ con $f(x) = -x^2$, dar $-x^2 - 2xh + h^2$ (mal distribuir el signo). $-(x + h)^2 = -x^2 - 2xh - h^2$.
- **Usar el atajo $(x^2)' = 2x$**: dar la respuesta $2x$ directamente sin desarrollar. El resultado es correcto, pero en este tópico la vía es **por definición**; el atajo se descarta.
- **Constante derivada como no nula**: dar $f'(x) = 5$ para $f(x) = 5$. El cociente incremental es $\tfrac{5 - 5}{h} = 0$: la derivada de una constante es $0$.
- **Coeficiente lineal ignorado**: para $f(x) = 3x$ dar $f'(x) = 1$ o $f'(x) = 3x$. El cociente $\tfrac{3(x+h) - 3x}{h} = \tfrac{3h}{h} = 3$.

### Reglas específicas
- **Sin atajos**: la explicación desarrolla los 5 pasos (plantear cociente → evaluar $f(x+h)$ → simplificar numerador → factorizar $h$ → tomar límite).
- **`\begin{aligned}` en la `explanation`** para el desarrollo paso a paso; una línea por paso.
- **Sub-A con cuadráticas simples**: coeficientes chicos ($|a|, |b|, |c| \leq 5$), sin fracciones, sin irracionales.
- **Sub-B con opciones que son expresiones intermedias** ($h(2x + h)$, $2x + h$, $2xh + h^2$), no valores finales.
- **Sub-C introductoria**: pensada para reforzar el método con casos donde el álgebra es mínima.
- **Ninguna función elemental** (seno, exponencial, log, raíz) — sus derivadas por definición son fuera de alcance para este cinturón. Solo polinomios de grado $\leq 2$.
- **Decimales con coma** (`4,3`).

---

## Hallazgos de auditoría (ronda 2, jul-2026)

Auditoría en vivo (`/test`) sobre ítems ya existentes, más un patrón dominante detectado al escanear los 4 archivos completos:

- **`LEXI_08`** (`ex_007`): el enunciado condensa contexto + pregunta en una sola oración larga ("Al tomar el límite cuando $h \to 0$ del cociente incremental... la tasa de cambio promedio se transforma en..."). Reescribir en **2 párrafos**: uno que sitúa el proceso, otro que hace la pregunta puntual con las mismas opciones.
- **`ESTR_11`** (`ex_055`) y **`LEXI_05`** (`ex_004`): ambos asumen que el alumno ya tiene presente la fórmula del cociente incremental de otro ítem de la sesión y arrancan directo en un tecnicismo derivado de ella (factorizar $h$ en $2xh+h^2$; qué representa el denominador $h$). **Violación de la regla crítica 31** (nueva esta ronda): reintroducir la definición $f'(a) = \lim_{h \to 0} \tfrac{f(a+h)-f(a)}{h}$ con su LaTeX centrado antes de la pregunta puntual, en los dos casos.
- **Patrón dominante confirmado en los 4 archivos completos** (no solo los 2 ítems de arriba): `ESTR` abre 12/15 ítems con la plantilla idéntica `"Calculé, por definición, la derivada de\n$$...$$"`. Es una cláusula completa (verbo + objeto), el problema es que **le falta el `:`** y se repite idéntica en los 12 ítems; agregar el `:` y variar la redacción alcanza, no hace falta reescribir el enunciado entero. `LEXI_01` abre con `"En la misma fórmula\n$$...$$"`: acá sí es un fragmento sin objeto propio, necesita reescribirse como cláusula completa. **Violación de la regla crítica 32** (nueva esta ronda) en ambos casos. Al completar hasta 50 ítems por skill, variar la redacción de apertura ítem a ítem y cerrar siempre con `:` los openers que ya son cláusulas completas.

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 4 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna mención de reglas prácticas de derivación (potencia, producto, cociente, cadena)
- [ ] Ninguna ecuación de recta tangente ni cálculo numérico de pendiente de secante (reservado para el tópico siguiente)
- [ ] Explicaciones en 3 párrafos de prosa; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios; variables inline en la prosa
- [ ] **Ningún ítem que dependa de la fórmula del cociente incremental la asume vista en otro ítem**: la reintroduce con LaTeX centrado antes de la pregunta puntual (regla crítica 31)
- [ ] **"Calculá, por definición, la derivada de" tiene el `:` antes del bloque `$$...$$`** (es cláusula completa, solo faltaba la puntuación); **"En la misma fórmula" está reescrito como cláusula completa** (fragmento sin objeto propio). Redacción variada ítem a ítem en ambos casos (regla crítica 32)
- [ ] **Ningún `\begin{aligned}` alinea con `=` datos evaluados de forma independiente**; esa alineación es solo para pasos reales de una misma derivación (regla crítica 30)

**LEXI:**
- [ ] 50 ítems; **exactamente 3 opciones** por ítem
- [ ] Distribución A/B/C respetada (20/15/15)
- [ ] Negrita en primera mención de `derivada`, `tasa de cambio instantánea`, `cociente incremental`, `notación de Leibniz`, `notación de Lagrange`

**CLSF:**
- [ ] 50 ítems; **exactamente 3 opciones** por ítem
- [ ] Distribución A/B/C respetada (20/15/15)
- [ ] Sin cálculos; solo lógica y clasificación teórica
- [ ] Textos exactos `"Diferenciable"`, `"Continua pero no diferenciable"`, `"Discontinua"`, `"No se puede determinar"` cuando aplique

**GRAF:**
- [ ] 50 ítems con `graph_fn` o gráfico embebido; `graph_view` cuadrado
- [ ] Distribución A/B/C respetada (20/15/15)
- [ ] Vértices suaves incluidos como distractor en sub-C
- [ ] Cardinalidad ajustada: 3 si categórica, 4 si numérica
- [ ] Ningún ítem pide el valor numérico de $f'(a)$

**ESTR:**
- [ ] 50 ítems; **exactamente 4 opciones** por ítem, cada opción $\leq 35$ caracteres
- [ ] Distribución A/B/C respetada (25/15/10)
- [ ] Todo desarrollo por definición del límite del cociente incremental; ningún atajo
- [ ] Solo polinomios de grado $\leq 2$; sin funciones elementales
- [ ] Explicaciones con `\begin{aligned}` mostrando los 5 pasos
