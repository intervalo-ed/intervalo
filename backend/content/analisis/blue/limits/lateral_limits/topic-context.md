# Topic: lateral_limits (Límites laterales)

Belt: `blue`, Unit: `limits`, Topic: `lateral_limits`

Skills en este topic: `LEXI`, `GRAF`, `RESL`. **50 ítems cada uno (150 en total)** al cerrar el refactor.

**Estado.** Los ejercicios viejos (`LEXI`, `GRAF`, `RESL`) se dejan tal cual en el folder por ahora; el refactor a la nueva distribución se hace en otro turno. Este doc especifica el alcance nuevo, las reglas duras de restricción y la distribución objetivo por skill.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** funciones, dominio, definición general de **límite**, **sustitución directa**, diagnóstico de **indeterminación** $\tfrac{0}{0}$ (del tópico `definition`).
- **Lo que está aprendiendo acá:** notación de límites laterales ($x \to a^-$ y $x \to a^+$), **lectura gráfica** de saltos, evaluación de **funciones a trozos** y con **valor absoluto**, y el **teorema de existencia** del límite bilateral.
- **Lo que NO sabe todavía:** factorización, racionalización, límites al infinito, asíntotas verticales, derivadas, L'Hôpital.

### Regla dura de restricción

**Está prohibido** usar o mencionar en enunciados, opciones, feedback y explicaciones:

- **Factorización** de polinomios para simplificar.
- **Racionalización** (multiplicar por el conjugado).
- **Regla de L'Hôpital**.
- **Límites al infinito** ($x \to \pm\infty$).
- **Asíntotas verticales** — no se evalúan expresiones del tipo $\tfrac{k}{0}$ acá.
- **Derivadas** en cualquier forma.

Todo límite de cálculo se resuelve por **sustitución directa en la rama correspondiente**. Si el ítem viene de un gráfico, solo aparecen **saltos finitos**, **huecos** o **puntos continuos** — nunca ramas que se disparan al infinito.

Los ítems que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 3 skills)

Reglas de authoring que se aplican al escribir los 150 ítems (misma línea que los otros topic-contexts):

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`. KaTeX agrega su propio margen.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`: (a) concepto abstracto, (b) aplicación paso a paso al caso (usar `\begin{aligned}` para desarrollos), (c) cierre útil o advertencia técnica en voz neutra. Sin viñetas `•`, sin sub-`-`, sin em-dash `—`, sin humor ni antropomorfismos. Analogía cotidiana permitida solo si es formal y aporta al concepto.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Voz descriptiva del error del distractor, dirigida en segunda persona amable ("estás tomando…", "fijate que…"). Nunca "el alumno confunde…" (voz acusatoria prohibida).
4. **Negrita en primera mención** de conceptos clave: **límites laterales**, **límite bilateral**, **teorema de existencia**, **función a trozos**, **valor absoluto**, **salto**, **hueco**. Nunca negritas dentro de `options`.
5. **Ortotipografía**: decimales con **coma** (`4,3`, no `4.3`). Montos con `\$` escapado (en JSON `\\$`). Contextos genéricos ("un estudiante", "una empresa"); prohibidos los nombres propios.
6. **`correct_index` variado**, no concentrado en un solo índice.
7. **Texto de la opción "No existe"** cuando el bilateral no coincide: usar **exactamente** `"No existe"`. Aparece solo cuando corresponde (bilateral con ramas distintas); no rellenar como distractor automático en ítems donde el bilateral sí existe.

---

## `feedback_incorrect` en los 150 ítems

Completar con `array<string|null>` paralelo a `options`, `null` en el índice correcto. Voz descriptiva del concepto, en segunda persona amable. Una oración por distractor, autosuficiente. Las confusiones fuente por skill están en cada sección.

---

## LEXI, 50 ítems

### Qué evalúa
Decodificar la notación de laterales, destruir falsos paradigmas sobre el signo del superíndice, y afianzar el **teorema de existencia** del bilateral.

### Cardinalidad
**Exactamente 3 opciones** por ítem.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Notación y dirección | Diferenciar el superíndice de dirección del signo del número. Ejemplo: $x \to 2^-$ son valores como $1{,}99$, no el número $-2$. Notación correcta y errores tipográficos frecuentes. | `notacion-y-direccion-lateral` | 15 |
| B. Teorema de existencia | Consolidar la regla $\lim^- = \lim^+ \iff \lim$ bilateral existe. Desvincular esto del valor $f(a)$. | `teorema-existencia-bilateral` | 15 |
| C. Discontinuidad por salto | Asociar analíticamente $\lim^- \neq \lim^+$ con una fractura visible en la gráfica. | `discontinuidad-por-salto` | 10 |
| D. Operación con sentido: tamaño del salto | **Reenfocada en la ronda 1** (ver hallazgos): en vez de sumar los laterales sin motivo, la operación con lectura real es la **resta**, que da el tamaño del salto ($\lim^+ - \lim^-$, cuánto sube o baja la curva al cruzar el punto). Sumar/comparar laterales solo aparece cuando el enunciado da una razón concreta para hacerlo, no como ejercicio aislado de "esto se puede sumar porque son números". **La `explanation` de estos ítems agrega 1-2 párrafos de intuición** (ver `course-context.md` §Refuerzo de intuición en `blue`): por qué la resta $\lim^+ - \lim^-$ representa la distancia entre las dos alturas a las que "apunta" cada rama, antes de aplicarlo al caso puntual. | `tamano-del-salto` | 10 |

### `feedback_incorrect`, confusiones fuente
- **Superíndice leído como signo del número**: interpretar $x \to 2^-$ como $x \to -2$. Describir: "el signo menos indica la dirección desde la que te acercás a $2$ (por valores menores), no un número negativo".
- **Bilateral atado a $f(a)$**: creer que si $f(a)$ no está definida, el bilateral tampoco puede existir. Recordar que el bilateral depende de la coincidencia de los laterales, no del valor puntual.
- **Bilateral existente pese a laterales distintos**: elegir "existe" cuando $\lim^- = 3$ y $\lim^+ = 5$. Describir el criterio: ambos tienen que coincidir en un mismo número.
- **Confundir salto con hueco**: pensar que un hueco (punto abierto sin salto) implica que el bilateral no existe. El hueco no impide la existencia del bilateral, solo desvincula $L$ de $f(a)$.
- **Signo invertido en la resta del tamaño del salto**: calcular $\lim^- - \lim^+$ en vez de $\lim^+ - \lim^-$, o no distinguir si el salto es "hacia arriba" o "hacia abajo" según el signo del resultado.

### Reglas específicas
- **Negrita en primera mención** de `límites laterales`, `límite bilateral`, `teorema de existencia`, `salto`, `hueco` en `question` y `explanation`.
- Notación estándar: $\lim_{x \to a^-} f(x)$ y $\lim_{x \to a^+} f(x)$ en display, o inline en la prosa.
- **Nunca** usar $x \to a^-$ con $a$ negativo en un ítem introductorio (confunde el superíndice con el signo). Reservar esos casos para ítems avanzados de sub-familia A donde justamente se pregunta por la distinción.
- **Regla crítica 24 (nueva)**: ningún ítem de LEXI se enmarca respecto de otro ítem de la sesión ("un caso más exigente"), y todo ítem abstracto sitúa el concepto (`límite`, `límite lateral`) desde la primera oración, variando la redacción de apertura ítem a ítem.

---

## GRAF, 50 ítems

### Qué evalúa
Interpretar el comportamiento direccional de una función a partir de un estímulo visual: leer un lateral, diagnosticar la existencia del bilateral, u operar dos laterales leídos del gráfico.

### Cardinalidad
- **4 opciones** cuando la respuesta es numérica corta.
- **3 opciones** cuando la respuesta es conceptual o de existencia (sí / no / depende).

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Lectura lateral pura | Gráficos con saltos evidentes: se pide $\lim^-$ o $\lim^+$ en el punto de quiebre. Distractores clásicos: el valor del lado contrario, o el valor puntual cerrado (con círculo lleno). | `lectura-lateral-pura` | 20 |
| B. Diagnóstico bilateral | "¿Existe $\lim_{x \to a} f(x)$?" en puntos con salto, puntos continuos y puntos con hueco. | `diagnostico-bilateral-visual` | 15 |
| C. Tamaño del salto (visual) | **Reenfocada en la ronda 1** (mismo motivo que la D de LEXI, ver hallazgos): leer los dos laterales del gráfico y calcular la **resta** que da el tamaño del salto, no una suma arbitraria. Comparar el tamaño de dos saltos distintos en el mismo gráfico también entra acá. **La `explanation` agrega el mismo párrafo de intuición** que la D de LEXI (ver `course-context.md` §Refuerzo de intuición en `blue`). | `tamano-del-salto-visual` | 15 |

### `feedback_incorrect`, confusiones fuente
- **Lado contrario**: al pedir $\lim^-$, leer el valor del lado derecho del salto. Describir qué mirar: "estás leyendo hacia dónde sube la rama derecha; el lateral por izquierda es hacia dónde llega la rama izquierda".
- **Punto cerrado leído como lateral**: dar el valor $f(a)$ marcado con círculo lleno cuando se pregunta el lateral. El lateral depende de la rama, no del punto marcado.
- **Bilateral existente en un salto**: elegir "sí, existe" en un punto con salto porque hay ramas a ambos lados. Recordar que la existencia requiere coincidencia de valores.
- **Bilateral inexistente en un hueco**: elegir "no existe" cuando hay un hueco pero las ramas coinciden en el valor. El hueco solo afecta a $f(a)$, no a $L$.
- **Signo invertido en la resta del tamaño del salto**: calcular $\lim^- - \lim^+$ en vez de $\lim^+ - \lim^-$, invirtiendo si el salto se lee como "sube" o "baja".

### Reglas específicas
- **Gráficos con saltos finitos, huecos o puntos continuos**. Nunca ramas que se disparan al infinito (regla dura).
- **Puntos abiertos vs. cerrados** claramente distinguidos en la grilla; el enunciado nombra qué convención usar.
- **`graph_view` cuadrado** cuando la lectura es de $y$-valores; ajustar el rango vertical para que los saltos queden bien visibles.
- Cuando la respuesta es de existencia, usar exactamente **"Sí"** / **"No"** / **"No se puede determinar"** (nunca "existe" / "no existe" en este caso — reservado para RESL).

---

## RESL, 50 ítems

### Qué evalúa
Ejecutar el álgebra direccional eligiendo la **rama correcta** de una función a trozos o de una expresión con valor absoluto. Sin indeterminaciones $\tfrac{0}{0}$.

### Cardinalidad
**Exactamente 4 opciones** por ítem (grilla 2×2). Opciones numéricas o expresiones cortas (**$\leq 35$ caracteres**).

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Funciones a trozos: un lateral | Se da $f(x)$ partida en $x = a$ y se pide $\lim_{x \to a^-}$ o $\lim_{x \to a^+}$. Desafío: leer la inecuación de cada rama y elegir la que corresponde a la dirección de aproximación. | `trozos-un-lateral` | 20 |
| B. Funciones a trozos: bilateral | Se pide $\lim_{x \to a} f(x)$ en el punto de quiebre. Hay que evaluar ambas ramas: si coinciden, la respuesta es el valor; si difieren, la respuesta es **"No existe"**. | `trozos-bilateral` | 20 |
| C. Valor absoluto | Expresiones del tipo $\dfrac{\|x - c\|}{x - c}$ o $\dfrac{\|x\|}{x}$ donde se piden los laterales. Definir el valor absoluto por ramas para elegir la correcta. | `laterales-valor-absoluto` | 10 |

### `feedback_incorrect`, confusiones fuente
- **Rama invertida**: elegir la rama de $x > a$ cuando se pide $\lim^-$. Describir: "$\lim^-$ mira valores menores que $a$, así que corresponde a la rama definida para $x < a$".
- **Ambas ramas evaluadas y sumadas o promediadas**: dar la suma o el promedio de los dos laterales cuando el enunciado pide solo uno.
- **Bilateral con ramas distintas devuelto como número**: elegir uno de los dos valores como si fuera el bilateral. Cuando $\lim^- \neq \lim^+$, la respuesta es **"No existe"**.
- **Bilateral existente con "No existe" como distractor**: en ítems donde $\lim^- = \lim^+$, elegir "No existe" por reflejo. Verificar que las ramas coincidan antes de descartar.
- **Signo del valor absoluto**: en $\dfrac{\|x-c\|}{x-c}$ al aproximar por izquierda ($x < c$), el numerador vale $-(x-c)$, así que el cociente es $-1$; por derecha vale $+1$. Distractor típico: mismo signo en ambos lados.
- **Continuidad de la desigualdad en el punto de quiebre**: en $f(x) = \{x^2 \text{ si } x \leq 2;\ 3x \text{ si } x > 2\}$, el $\leq$ define quién "vale" en $x = 2$, pero el lateral no depende del punto: por izquierda usás $x^2$ y por derecha $3x$ igual.

### Reglas específicas
- **Resultado numérico o "No existe"** en las opciones; nunca dejar la expresión sin evaluar cuando la evaluación es legal.
- **Explicaciones con `\begin{aligned}`** para el desarrollo paso a paso, mostrando la elección de rama antes de sustituir. **Nunca encadenar 3+ igualdades en una sola línea horizontal** ($\lim^- = 8 = \lim^+ \Rightarrow \lim = 8$ es ilegible en mobile): siempre vertical, un paso por renglón (ver hallazgos de auditoría, `GRAF_08` como ejemplo modelo).
- **Texto exacto** de la opción de no existencia: `"No existe"`. No usar "DNE" ni "El límite no existe".
- **"No existe" como opción** solo cuando corresponde (bilateral con ramas distintas). En ítems de un lateral solo (sub-A) o de bilateral existente, no forzar "No existe" como distractor.
- **Funciones a trozos** con 2 ramas por defecto; 3 ramas solo si el ítem es explícitamente de sub-B avanzada. Punto de quiebre único.
- **Decimales con coma** (`4,3`).

---

## Hallazgos de auditoría (ronda 1, jul-2026)

Corrección puntual del usuario sobre ítems de prueba de este topic (`correciones_analisis_limites_laterales_1.md`), aplicar al regenerar:

- **`LEXI_10`**: el segundo párrafo de `explanation` acumulaba 2 fórmulas inline en la misma oración ("$\lim_{x\to a^-}f(x)=2$ y $\lim_{x\to a^+}f(x)=5$"). Recurrencia de la regla crítica 21 (2+ inline en un párrafo → dividir en oraciones con fórmulas centradas).
- **`LEXI_13`**: sumar los dos laterales "porque son números reales" no tiene ningún gancho interpretativo. **Reenfoque de la sub-familia D de LEXI y C de GRAF**: la operación con lectura real es la **resta**, que da el tamaño del salto. Ver tablas de distribución arriba, ya actualizadas a `tamano-del-salto`/`tamano-del-salto-visual`.
- **`LEXI_03`**: el enunciado abría con "Un caso más exigente aparece cuando el punto de tendencia ya es negativo, como en...", implicando comparación con un ítem anterior y sin situar que se hablaba de límites laterales antes del tecnicismo. Motivó la **regla crítica 24** (nueva en `authoring-context.md`): ningún ítem se enmarca respecto de otro de la sesión, y todo ítem abstracto sitúa el concepto desde la primera oración.
- **`LEXI_09`**: 
  - Un distractor tenía una cláusula "porque..." de más después de la coma, ya cubierto por la regla de `feedback_incorrect` (corto, sin mini-explicación).
  - La fórmula central de la explicación encadenaba 3 igualdades en una sola línea horizontal ($\lim^-=8=\lim^+ \Rightarrow \lim=8$), superando el ancho legible en mobile. Reescribir siempre en `\begin{aligned}` vertical.
- **`GRAF_08`**: sin cambios, queda como **ejemplo modelo** de desarrollo vertical con `aligned` para lateral+bilateral, contrastar contra `LEXI_09` al revisar el resto de los ítems con desarrollo de 2+ pasos.
- **Ronda 2 (auditoría de `continuity`)**: se detectó que 4 ítems de este topic (`GRAF.json` ×2, `LEXI.json` ×1, `RESL.json` ×1) usaban `\lim^-`/`\lim^+` sin el punto de tendencia en el subíndice. **Ya corregido con un script** (regla crítica 27, nueva en `authoring-context.md`), no volver a introducirlo al generar el resto de los ítems.

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 3 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna mención de factorización, racionalización, L'Hôpital, límites al infinito, asíntotas verticales ni derivadas
- [ ] Explicaciones en 3 párrafos de prosa; sin viñetas, sub-`-`, em-dash, humor
- [ ] Cierres de `explanation` en advertencia/consejo, voz neutra
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios; montos con `\$` escapado
- [ ] **Ningún ítem se enmarca respecto de otro de la sesión** (regla crítica 24): sin "un caso más exigente", "a diferencia del anterior"
- [ ] **Todo límite lateral lleva el punto de tendencia en el subíndice** (`\lim_{x \to a^-}`/`\lim_{x \to a^+}`, regla crítica 27); ya corregido en esta ronda (10 ítems, ver hallazgos de `continuity`), no reintroducirlo al generar los ítems que faltan
- [ ] **Todo ítem abstracto (LEXI sin contexto cotidiano) sitúa el concepto desde la primera oración** (regla crítica 24), con redacción de apertura variada ítem a ítem
- [ ] **El concepto abstracto de cada `explanation` justifica el porqué, no solo declara el qué** (regla crítica 25): el teorema de existencia, salto vs. hueco, y la independencia con $f(a)$ se razonan, no solo se nombran
- [ ] Cada `explanation` suma 1-2 párrafos de intuición general de la noción de límite en juego, no solo la resolución del caso puntual (ver `course-context.md` §Refuerzo de intuición en `blue`); en la sub-familia "tamaño del salto" (D de LEXI, C de GRAF) esto ya está especificado en su fila de distribución
- [ ] Ningún desarrollo de 2+ pasos encadena las igualdades en una sola línea horizontal; siempre `\begin{aligned}` vertical

**LEXI:**
- [ ] 50 ítems; **exactamente 3 opciones** por ítem
- [ ] Distribución A/B/C/D respetada (15/15/10/10, D reenfocada a `tamano-del-salto`)
- [ ] Negrita en primera mención de `límites laterales`, `límite bilateral`, `teorema de existencia`, `salto`, `hueco`
- [ ] Sub-familia A no mezcla $x \to a^-$ con $a$ negativo (reservado solo para ítems que preguntan por la distinción)
- [ ] Sub-familia D pide el **tamaño del salto** (resta con lectura real), no una suma sin motivo

**GRAF:**
- [ ] 50 ítems con `graph_fn` o gráfico embebido; ningún gráfico con asíntotas verticales
- [ ] Distribución A/B/C respetada (20/15/15, C reenfocada a `tamano-del-salto-visual`)
- [ ] Puntos abiertos vs. cerrados claramente distinguidos
- [ ] Cardinalidad ajustada por tipo: 4 si numérica corta, 3 si conceptual
- [ ] Opciones de existencia con textos "Sí" / "No" / "No se puede determinar", no "existe" / "no existe"
- [ ] Sub-familia C pide el **tamaño del salto** leído del gráfico, no una suma sin motivo

**RESL:**
- [ ] 50 ítems; **exactamente 4 opciones** por ítem, cada opción $\leq 35$ caracteres
- [ ] Distribución A/B/C respetada (20/20/10)
- [ ] Ninguna sustitución que produzca $\tfrac{0}{0}$ o $\tfrac{k}{0}$ en la respuesta correcta
- [ ] `"No existe"` (texto exacto) presente como opción solo cuando corresponde
- [ ] Funciones a trozos con 2 ramas por defecto; punto de quiebre único
- [ ] Ningún desarrollo con 3+ igualdades encadenadas en una línea horizontal (ver hallazgo `LEXI_09`, aplica igual a `RESL`)
