# Topic: limit_definition (Definición de derivada)

Belt: `violet`, Unit: `derivatives`, Topic: `limit_definition`

Skills en este topic: `LEXI`, `GRAF`. **30 ejercicios cada uno (60 en total)** al cerrar el refactor.

> **CLSF archivado (jul-2026):** se sacó de este topic al podar a un máximo de 3 ítems (skills) por topic. Contenido preservado en `backend/content/archive/analisis/violet/derivatives/limit_definition/CLSF.json`. No generar CLSF para este topic en rondas futuras; el resto de este documento puede seguir mencionando CLSF en registros de auditoría históricos, que quedan como referencia, no como guía de generación.

> **ESTR archivado (ago-2026):** se sacó de este topic por decisión pedagógica: pedir el cálculo completo de una derivada expandiendo el límite del cociente incremental como ejercicio mental de opción múltiple no tiene sentido (la expansión del binomio, la cancelación y el límite no se pueden razonar de cabeza sin papel, y la opción correcta se termina adivinando). Contenido preservado en `backend/content/archive/analisis/violet/derivatives/limit_definition/ESTR.json`. No generar ESTR para este topic en rondas futuras. El cupo no se redistribuye (mismo criterio que los archivados anteriores). Las menciones históricas de ESTR en los registros de auditoría de este doc quedan como referencia, no como guía de generación.

**Estado.** Los ejercicios viejos (`LEXI`, `CLSF`, `GRAF`, `ESTR`) se dejan tal cual en el folder por ahora; el refactor a la nueva distribución se hace en otro turno. Este doc especifica el alcance nuevo, las reglas duras de restricción y la distribución objetivo por skill.

Este es el **primer tópico** de la unidad de derivadas: cubre el concepto formal vía **límite del cociente incremental**, sin usar todavía las reglas prácticas de derivación.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** evaluar funciones en $x + h$, operar algebraicamente con polinomios (cuadrado de un binomio), calcular **límites**, diagnosticar la **indeterminación** $\tfrac{0}{0}$, reconocer la **continuidad** analítica y geométrica (todo el cinturón `blue`).
- **Lo que está aprendiendo acá:** la **anatomía del cociente incremental**, el límite cuando $h \to 0$, la **notación** de derivada ($f'$, $\tfrac{dy}{dx}$), el diagnóstico visual del **signo** de la derivada y el teorema que relaciona **diferenciabilidad con continuidad**.
- **Lo que NO sabe todavía:** ecuación de la **recta secante** o **tangente** (se delega al tópico siguiente, `geometric_interpretation`), reglas prácticas de derivación (potencia, producto, cociente, cadena), reglas para funciones elementales.

### Regla dura 1

En todo el topic está **estrictamente prohibido** usar o mencionar atajos de derivación, en cualquier campo:

- $(x^n)' = n x^{n-1}$
- $(c)' = 0$
- Regla del producto, cociente o cadena
- $(\sin x)' = \cos x$ u otras derivadas de funciones elementales

Toda justificación se apoya en el concepto de límite del cociente incremental, nunca en reglas prácticas (que pertenecen a topics posteriores). (Esta regla nació para el skill ESTR, hoy archivado, pero la prohibición de mencionar atajos sigue vigente para LEXI y GRAF.)

### Regla dura 2

**No se piden** ecuaciones de rectas tangentes ($y = mx + b$) ni el cálculo numérico de la pendiente de la secante en este tópico. Toda la geometría acá es de **diagnóstico visual** del signo o de la existencia de la derivada. Los cálculos de tangente pertenecen al tópico `geometric_interpretation`.

Los ejercicios que quiebren cualquiera de las reglas duras se descartan y se reescriben.

---

## Correcciones de formato transversales (los 2 skills activos; CLSF y ESTR archivados, ver notas arriba)

Reglas de authoring que se aplican al escribir los 60 ejercicios:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`. KaTeX agrega su propio margen.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`: (a) concepto abstracto / regla, (b) desarrollo formal en `\begin{aligned}` si hay más de un paso algebraico, (c) cierre con advertencia técnica o consejo práctico. Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (prohibido estricto)**, sin antropomorfismos ni humor.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Voz descriptiva del error del distractor, en segunda persona amable ("olvidaste el término cruzado $2xh$ al expandir el binomio", "fijate que…"). Nunca "el alumno confunde…".
4. **Negrita en primera mención** de conceptos clave: **derivada**, **tasa de cambio instantánea**, **cociente incremental**, **diferenciable**, **continua**, **notación de Leibniz**, **notación de Lagrange**. Nunca negritas dentro de `options`.
5. **Variables inline** (`$x$`, `$h$`, `$a$`) en la prosa; display solo para expresiones completas.
6. **Ortotipografía**: decimales con **coma** (`4,3`). Sin nombres propios.
7. **`correct_index` variado**, no concentrado en un solo índice.

---

## `feedback_incorrect` en los 60 ejercicios

Completar con `array<string|null>` paralelo a `options`, `null` en el índice correcto. Voz descriptiva del concepto, en segunda persona amable. Una oración por distractor, autosuficiente.

---

## LEXI, 15 ejercicios

### Qué evalúa
Afianzar la **notación**, la **anatomía** de la fórmula del límite y la diferenciación conceptual de **tasa de cambio instantánea** vs. promedio.

### Cardinalidad
**Exactamente 3 opciones** por ejercicio.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Anatomía del límite | Diseccionar la fórmula $f'(a) = \lim_{h \to 0} \tfrac{f(a+h) - f(a)}{h}$: qué es $h$ (el incremento que tiende a $0$), qué son $a$ y $x$ (puntos fijos), por qué la sustitución directa produce $\tfrac{0}{0}$, qué representa el numerador y qué el denominador. | `anatomia-del-limite` | 6 |
| B. Tasa instantánea vs. promedio | Contraste puro: sin el límite es una **tasa promedio** (equivalente a la pendiente de la secante); con el límite pasa a ser la **tasa instantánea** (equivalente a la pendiente de la tangente). Ninguna cuenta. | `tasa-instantanea-vs-promedio` | 5 |
| C. Notación formal | Reconocer la **notación de Leibniz** $\tfrac{df}{dx}$, la **notación de Lagrange** $f'(x)$, la de Newton $\dot{f}$; distinguirlas de la variación finita $\tfrac{\Delta f}{\Delta x}$. | `notacion-formal-derivada` | 4 |

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

## GRAF, 15 ejercicios

### Qué evalúa
**Diagnóstico visual** del comportamiento de la derivada leyendo la gráfica de $f$: signo, ceros, y pérdida de diferenciabilidad.

### Cardinalidad
- **3 opciones** para preguntas categóricas (signo de $f'$, existencia de la derivada).
- **4 opciones** para respuestas numéricas cortas (valor de $x$ donde $f' = 0$, etc.).

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Signo de la derivada | Dada la curva, determinar si $f'(a)$ es positiva (la curva sube), negativa (baja) o cero (recta horizontal instantánea, vértice, meseta). | `signo-de-la-derivada-visual` | 6 |
| B. Identificación de ceros | Detectar visualmente **vértices**, **crestas** o **valles** como los puntos donde $f'$ se anula. Distractores: raíces de $f$ (donde $f = 0$, no donde $f' = 0$). | `identificacion-ceros-derivada` | 5 |
| C. Diagnóstico de esquinas y saltos | Marcar en qué punto la función **pierde la diferenciabilidad**: quiebre abrupto (pico tipo $ | x | $), salto (discontinuidad), tangente vertical. | `diagnostico-esquinas-y-saltos` | 4 |

### `feedback_incorrect`, confusiones fuente
- **Signo invertido**: leer $f'(a) < 0$ en un tramo donde la curva sube. Recordar: sube ⇒ derivada positiva; baja ⇒ derivada negativa.
- **Cero de $f'$ confundido con raíz de $f$**: dar el $x$ donde la curva cruza el eje (raíz de $f$) cuando se pregunta dónde $f' = 0$. La derivada se anula en los vértices, no en los cortes con el eje.
- **Vértice suave confundido con quiebre**: en un mínimo suave (tipo parábola), decir que hay una esquina o pérdida de diferenciabilidad. Los vértices suaves son diferenciables con $f' = 0$; solo los picos angulares no lo son.
- **Salto clasificado como quiebre suave**: en una discontinuidad de salto, elegir "quiebre" (esquina). Un salto es una **discontinuidad**, así que la derivada tampoco existe, pero por continuidad y no por quiebre.
- **$f'(a) = 0$ leído como "no derivable"**: en un vértice suave con tangente horizontal, decir que la derivada no existe. Existe y vale $0$.

### Reglas específicas
- **Gráficos claros**, un solo comportamiento por ejercicio (una zona de subida, un vértice, un quiebre).
- **Vértices suaves como distractor** en sub-C (no son puntos de no-diferenciabilidad).
- Cuando la respuesta es un signo, opciones con textos exactos: `"Positiva"`, `"Negativa"`, `"Cero"`, `"No existe"`.
- **Sin pedir el valor numérico** de $f'(a)$; ese cálculo va en el tópico siguiente.
- `graph_view` cuadrado, escala 1:1 para no engañar visualmente sobre la pendiente.

---

## Hallazgos de auditoría (ronda 2, jul-2026)

Auditoría en vivo (`/test`) sobre ejercicios ya existentes, más un patrón dominante detectado al escanear los 4 archivos completos:

- **`LEXI_08`** (`ex_007`): el enunciado condensa contexto + pregunta en una sola oración larga ("Al tomar el límite cuando $h \to 0$ del cociente incremental... la tasa de cambio promedio se transforma en..."). Reescribir en **2 párrafos**: uno que sitúa el proceso, otro que hace la pregunta puntual con las mismas opciones.
- **`ESTR_11`** (`ex_055`) y **`LEXI_05`** (`ex_004`): ambos asumen que el alumno ya tiene presente la fórmula del cociente incremental de otro ejercicio de la sesión y arrancan directo en un tecnicismo derivado de ella (factorizar $h$ en $2xh+h^2$; qué representa el denominador $h$). **Violación de la regla crítica 31** (nueva esta ronda): reintroducir la definición $f'(a) = \lim_{h \to 0} \tfrac{f(a+h)-f(a)}{h}$ con su LaTeX centrado antes de la pregunta puntual, en los dos casos.
- **Patrón dominante confirmado en los 4 archivos completos** (no solo los 2 ejercicios de arriba): `ESTR` abre 12/15 ejercicios con la plantilla idéntica `"Calculé, por definición, la derivada de\n$$...$$"`. Es una cláusula completa (verbo + objeto), el problema es que **le falta el `:`** y se repite idéntica en los 12 ejercicios; agregar el `:` y variar la redacción alcanza, no hace falta reescribir el enunciado entero. `LEXI_01` abre con `"En la misma fórmula\n$$...$$"`: acá sí es un fragmento sin objeto propio, necesita reescribirse como cláusula completa. **Violación de la regla crítica 32** (nueva esta ronda) en ambos casos. Al completar hasta 30 ejercicios por skill, variar la redacción de apertura ejercicio a ejercicio y cerrar siempre con `:` los openers que ya son cláusulas completas.

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 2 skills activos):**
- [ ] `feedback_incorrect` completo en los 30 ejercicios: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna mención de reglas prácticas de derivación (potencia, producto, cociente, cadena)
- [ ] Ninguna ecuación de recta tangente ni cálculo numérico de pendiente de secante (reservado para el tópico siguiente)
- [ ] Explicaciones en 3 párrafos de prosa; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios; variables inline en la prosa
- [ ] **Ningún ejercicio que dependa de la fórmula del cociente incremental la asume vista en otro ejercicio**: la reintroduce con LaTeX centrado antes de la pregunta puntual (regla crítica 31)
- [ ] **"Calculá, por definición, la derivada de" tiene el `:` antes del bloque `$$...$$`** (es cláusula completa, solo faltaba la puntuación); **"En la misma fórmula" está reescrito como cláusula completa** (fragmento sin objeto propio). Redacción variada ejercicio a ejercicio en ambos casos (regla crítica 32)
- [ ] **Ningún `\begin{aligned}` alinea con `=` datos evaluados de forma independiente**; esa alineación es solo para pasos reales de una misma derivación (regla crítica 30)

**LEXI:**
- [ ] 30 ejercicios; **exactamente 3 opciones** por ejercicio
- [ ] Distribución A/B/C respetada (12/9/9)
- [ ] Negrita en primera mención de `derivada`, `tasa de cambio instantánea`, `cociente incremental`, `notación de Leibniz`, `notación de Lagrange`

**GRAF:**
- [ ] 30 ejercicios con `graph_fn` o gráfico embebido; `graph_view` cuadrado
- [ ] Distribución A/B/C respetada (12/9/9)
- [ ] Vértices suaves incluidos como distractor en sub-C
- [ ] Cardinalidad ajustada: 3 si categórica, 4 si numérica
- [ ] Ningún ejercicio pide el valor numérico de $f'(a)$
