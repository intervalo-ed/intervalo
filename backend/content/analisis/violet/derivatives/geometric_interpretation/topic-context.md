# Topic: geometric_interpretation (Interpretación geométrica)

Belt: `violet`, Unit: `derivatives`, Topic: `geometric_interpretation`

Skills en este topic: `LEXI`, `GRAF`, `ESTR`, `RESL`. **50 ítems cada uno (200 en total)** al cerrar el refactor.

**Estado.** Los ejercicios viejos se dejan tal cual en el folder por ahora; el refactor a la nueva distribución se hace en otro turno. Este doc especifica el alcance nuevo, las reglas duras de restricción y la distribución objetivo por skill.

Este es el **segundo tópico** de la unidad de derivadas: cubre la interpretación geométrica de $f'(a)$ como **pendiente de la recta tangente** y como **mejor aproximación lineal**.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** la **definición formal** de derivada por límite ($h \to 0$), que $f'(a)$ es una **tasa instantánea**, y sabe calcular la derivada de funciones lineales y cuadráticas usando el cociente incremental (tópico `limit_definition`).
- **Lo que está aprendiendo acá:** el contraste geométrico entre **recta secante** (dos puntos, tasa media) y **recta tangente** (un punto, tasa instantánea); el armado de la ecuación **punto-pendiente** $y = f'(a)(x - a) + f(a)$ y su reducción a $y = mx + b$; el criterio de **paralelismo** vía $f'(x) = m$; la intuición visual del **Teorema del Valor Medio**.
- **Lo que NO sabe todavía:** reglas prácticas de derivación (regla de la potencia $nx^{n-1}$, producto, cociente, cadena), derivadas de funciones elementales (sin, cos, exp, log).

### Regla dura 1 (ESTR y RESL)

Como el alumno **aún no conoce las reglas prácticas**, todos los cálculos numéricos de pendiente o tangente deben ajustarse a una de estas dos formas:

- **Función lineal o cuadrática**, cuya derivada el alumno puede armar mentalmente vía cociente incremental.
- **Valores explícitos** de $f(a)$ y $f'(a)$ dados en el enunciado ("sabiendo que $f(2) = 5$ y $f'(2) = 3$, hallá…").

**Prohibido**: pedir $f'(a)$ de $\sin x$, $e^x$, $\ln x$, $\sqrt{x}$, cocientes o compuestas — nada de eso está a mano acá.

### Regla dura 2

**No hay `CLSF` en este tópico** — el foco es **puramente espacial y geométrico**, así que el rol conceptual de clasificación se retira. El vocabulario y la teoría los cubre `LEXI`; la lectura visual, `GRAF`; el armado y ejecución, `ESTR` y `RESL`.

Los ítems que quiebren cualquiera de las reglas duras se descartan y se reescriben.

---

## Correcciones de formato transversales (los 4 skills)

Reglas de authoring que se aplican al escribir los 200 ítems:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`: (a) concepto geométrico abstracto, (b) desarrollo formal en `\begin{aligned}` si hay cálculo, (c) cierre con advertencia o regla útil. Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (prohibido estricto)**, sin humor ni antropomorfismos.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Voz descriptiva del error del distractor **sin resolverle el problema** ("calculaste la pendiente de la secante, no de la tangente"). Segunda persona amable. Nunca "el alumno confunde…".
4. **Negrita en primera mención** de conceptos clave: **recta tangente**, **recta secante**, **pendiente**, **punto de tangencia**, **aproximación lineal**, **paralelismo**, **Teorema del Valor Medio**. Nunca negritas dentro de `options`.
5. **Variables inline** ($x$, $a$, $m$) en la prosa; display solo para expresiones completas.
6. **Ortotipografía**: decimales con **coma** (`4,3`). Sin nombres propios.
7. **`correct_index` variado**, no concentrado en un solo índice.

---

## `feedback_incorrect` en los 200 ítems

Completar con `array<string|null>` paralelo a `options`, `null` en el índice correcto. Voz descriptiva del error, en segunda persona amable. Una oración por distractor.

---

## LEXI, 50 ítems

### Qué evalúa
Afianzar el **vocabulario geométrico** de las rectas asociadas a una curva y la **anatomía** de la fórmula punto-pendiente.

### Cardinalidad
**Exactamente 3 opciones** por ítem.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Vocabulario geométrico | Diferenciar conceptualmente **recta secante** (dos puntos, **tasa media**) vs. **recta tangente** (un punto, **tasa instantánea**). Punto de tangencia, corte transversal, dirección instantánea. | `vocabulario-geometrico-secante-tangente` | 20 |
| B. Anatomía de la fórmula punto-pendiente | Diseccionar $y = f'(a)(x - a) + f(a)$. Identificar qué representa $f'(a)$ (la **inclinación**) y qué representa $(a, f(a))$ (el **punto de anclaje**). Reconocer variantes equivalentes. | `anatomia-formula-punto-pendiente` | 15 |
| C. Aproximación lineal | Teórico: cómo y por qué la recta tangente actúa como "la mejor aproximación" únicamente **cerca del punto de tangencia**; qué pasa cuando uno se aleja. | `aproximacion-lineal-local` | 15 |

### `feedback_incorrect`, confusiones fuente
- **Secante llamada tangente**: elegir "tangente" para una recta que corta la curva en dos puntos. Recordar: la tangente toca en un solo punto (en un entorno pequeño).
- **Pendiente de la tangente confundida con $f(a)$**: dar $f(a)$ como pendiente cuando la pendiente es $f'(a)$. $f(a)$ es la altura del punto de anclaje.
- **$(a, f(a))$ confundido con $(0, b)$**: pensar que el punto de anclaje es la ordenada al origen. El anclaje es el punto de tangencia, no el corte con el eje $y$.
- **Aproximación lineal global**: sostener que la tangente aproxima bien en todo el dominio. Solo cerca del punto; lejos, el error crece con la curvatura.
- **Instantánea sin límite**: llamar "instantánea" a la tasa media entre dos puntos cercanos. Sin límite es media, aunque los puntos estén juntos.

### Reglas específicas
- **Negrita en primera mención** de `recta tangente`, `recta secante`, `pendiente`, `punto de tangencia`, `aproximación lineal`.
- Sub-A y sub-C con lenguaje geométrico; sub-B trabaja con la fórmula simbólica.
- **Textos exactos** en opciones de clasificación (sub-A): `"Secante"`, `"Tangente"`, `"Recta transversal"`, `"Ninguna de las anteriores"`.

---

## GRAF, 50 ítems

### Qué evalúa
Interpretar **gráficamente** tangentes, secantes y estimar **pendientes** leyendo la cuadrícula.

### Cardinalidad
- **3 opciones** para preguntas categóricas (cuál es tangente, hay/no hay tangente horizontal).
- **4 opciones** para respuestas numéricas cortas (valor de pendiente estimado).

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Identificación de la tangente | Dada una curva con **varias rectas** dibujadas en el mismo gráfico, discriminar visualmente cuál es **secante** (dos puntos), cuál corta **transversalmente** y cuál es la **verdadera tangente** en un punto dado. | `identificacion-visual-tangente` | 20 |
| B. Lectura de pendiente | Dada una curva con su tangente trazada sobre una **grilla clara**, estimar numéricamente $f'(a)$ midiendo $\tfrac{\Delta y}{\Delta x}$ de la recta. | `lectura-de-pendiente` | 15 |
| C. Extremos y tangentes horizontales | Marcar visualmente los puntos donde la tangente asume una **pendiente nula** (paralela al eje horizontal): vértices, crestas, valles. | `extremos-tangentes-horizontales` | 15 |

### `feedback_incorrect`, confusiones fuente
- **Secante identificada como tangente**: elegir la recta que corta la curva en dos puntos visibles. La tangente **toca** en un punto y tiene la misma dirección que la curva ahí.
- **Signo de la pendiente invertido**: dar $-2$ para una tangente que sube. Sube ⇒ pendiente positiva; baja ⇒ negativa.
- **$\Delta x$ y $\Delta y$ intercambiados**: calcular $\tfrac{\Delta x}{\Delta y}$ en vez de $\tfrac{\Delta y}{\Delta x}$. La pendiente es "cuánto sube por cada paso a la derecha".
- **Tangente horizontal donde $f(a) = 0$**: marcar la raíz de $f$ como punto de tangente horizontal. La tangente es horizontal donde **$f'(a) = 0$**, no donde $f(a) = 0$.
- **Grilla mal contada**: leer una escala distinta a la que muestra el gráfico (ej. leer cada cuadrícula como $1$ cuando vale $2$).

### Reglas específicas
- **`graph_view` cuadrado** con **escala 1:1** para no engañar visualmente sobre la pendiente; grilla enteros bien marcada.
- **Múltiples rectas dibujadas** en sub-A, cada una etiquetada mínimamente (colores o letras).
- **Sub-B con pendientes enteras o medios** ($m \in \{-2, -1, -0{,}5, 0, 0{,}5, 1, 2, 3\}$) para lecturas limpias.
- **Sub-C con vértices claros** y sin ambigüedad (no incluir puntos de inflexión aún).
- Ningún ítem pide la **ecuación** de la tangente desde el gráfico (eso va a ESTR).

---

## ESTR, 50 ítems

### Qué evalúa
**Armar** y **calcular** la ecuación analítica de la recta tangente y de la secante a partir de datos numéricos.

### Cardinalidad
**Exactamente 4 opciones** por ítem (grilla 2×2). Expresiones cortas (**$\leq 35$ caracteres**).

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Armado de la ecuación de la tangente | Dados numéricamente el punto y la pendiente (ej. $f(2) = 5$, $f'(2) = 3$), construir la ecuación en forma punto-pendiente y llevarla a $y = mx + b$. | `armado-ecuacion-tangente` | 25 |
| B. Cálculo de secantes | Dadas las coordenadas de dos puntos sobre una curva, calcular la pendiente de la recta secante como $\tfrac{f(b) - f(a)}{b - a}$. | `calculo-de-secantes` | 15 |
| C. Tangentes horizontales | Dada una expresión simple para $f'(x)$ (ej. $f'(x) = 2x - 4$), igualarla a cero y encontrar el $x$ del vértice donde la tangente es horizontal. | `tangentes-horizontales-calculo` | 10 |

### `feedback_incorrect`, confusiones fuente
- **Signo de $a$ en la fórmula punto-pendiente**: en $y = f'(a)(x - a) + f(a)$ con $a = 2$, escribir $(x + 2)$ en lugar de $(x - 2)$. El signo dentro va **opuesto** al valor de $a$.
- **Ordenada al origen mal calculada**: al pasar de $y - 5 = 3(x - 2)$ a $y = mx + b$, dar $b = 5$ (olvidar $-3 \cdot 2$). Es $y = 3x - 6 + 5 = 3x - 1$, así que $b = -1$.
- **Secante confundida con tangente**: entregar $f'(a)$ como pendiente de la secante entre dos puntos. Secante usa $\tfrac{\Delta y}{\Delta x}$ de los dos puntos dados, no la derivada.
- **Denominador invertido en la secante**: calcular $\tfrac{b - a}{f(b) - f(a)}$ en lugar de $\tfrac{f(b) - f(a)}{b - a}$.
- **Tangente horizontal donde $f(x) = 0$**: resolver $f(x) = 0$ en lugar de $f'(x) = 0$. La tangente horizontal exige que la **derivada** se anule.
- **Signo perdido en la ordenada al origen del vértice** (sub-C): al despejar $x = 2$ de $2x - 4 = 0$, dar $x = -2$ (arrastrar mal el signo).

### Reglas específicas
- **Sub-A** con $f(a)$ y $f'(a)$ **dados numéricamente** en el enunciado, o con función lineal/cuadrática simple.
- **Sub-B** con coordenadas enteras $(x, y)$ para que la aritmética sea limpia.
- **Sub-C** con $f'(x)$ **explícito** en el enunciado (nunca pedir derivar antes).
- **Ninguna función elemental** (sin, cos, exp, log, √) en los cálculos.
- **Explicaciones con `\begin{aligned}`** para el paso a paso: sustituir en la punto-pendiente → distribuir → despejar a $y = mx + b$.
- **Resultado como ecuación completa** en sub-A (`y = 3x - 1`), como número en sub-B y sub-C (`m = 2`, `x = 2`).
- **Decimales con coma** (`4,3`).

---

## RESL, 50 ítems

### Qué evalúa
**Usar la recta tangente** ya construida (o los datos suficientes para construirla) para responder preguntas geométricas: intersecciones con los ejes, condición de paralelismo con otra recta, y aplicación del **Teorema del Valor Medio** de forma cualitativa.

### Cardinalidad
- **4 opciones** cuando la respuesta es un valor numérico o una ecuación corta.
- **3 opciones** cuando la respuesta es categórica o cualitativa.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Intersecciones de la tangente | Tras deducir o recibir $y = mx + b$, calcular la **ordenada al origen** (evaluar en $x = 0$) o la **raíz** (resolver $mx + b = 0$). | `intersecciones-de-la-tangente` | 20 |
| B. Paralelismo | Plantear: si se busca una tangente paralela a $y = mx + b$, imponer la condición $f'(x) = m$ y despejar el $x$ del punto de tangencia. Datos numéricos simples. | `paralelismo-de-tangentes` | 15 |
| C. Teorema del Valor Medio (cualitativo) | Situaciones que exigen comprender que si la secante en $[a, b]$ tiene pendiente $m$, existe un punto interior $c \in (a, b)$ donde la tangente tiene esa misma pendiente $m$. Sin cálculo del $c$: solo el diagnóstico geométrico. | `teorema-valor-medio-cualitativo` | 15 |

### `feedback_incorrect`, confusiones fuente
- **Raíz confundida con ordenada al origen**: dar el corte con el eje $y$ cuando se pide la raíz, o al revés. Recordar: raíz = corte con eje $x$ (donde $y = 0$); ordenada al origen = corte con eje $y$ (donde $x = 0$).
- **Ordenada al origen mal despejada**: en $y = 3x - 1$ dar $b = 1$ (perder el signo). $b = -1$.
- **Paralelismo con $f(x) = m$ en vez de $f'(x) = m$**: igualar la función original a la pendiente en lugar de la derivada. La condición de paralelismo pide igual **pendiente**, y la pendiente de la tangente es $f'(x)$.
- **Perpendicular vs paralelo**: usar $f'(x) = -\tfrac{1}{m}$ (perpendicularidad) cuando se pide paralelismo. Paralelo pide misma pendiente.
- **TVM enunciado como "todos los puntos"**: sostener que **todos** los puntos interiores tienen tangente con pendiente igual a la de la secante. El TVM garantiza **al menos uno**, no todos.
- **TVM sin continuidad/derivabilidad**: aplicar el TVM a una función con salto o esquina. Las hipótesis exigen continua en $[a, b]$ y derivable en $(a, b)$.

### Reglas específicas
- **Datos numéricos simples** en A y B; los `m` y `b` de las tangentes se dan o se derivan de cuadráticas simples.
- **Sub-C sin pedir el valor de $c$**: solo interpretación cualitativa ("¿qué garantiza el TVM aquí?", "¿se cumplen las hipótesis?").
- **Opciones cualitativas** en sub-C con textos exactos: `"Existe al menos un c"`, `"Existe exactamente un c"`, `"No se cumplen las hipótesis"`, `"El TVM no aplica"`.
- **Explicaciones con `\begin{aligned}`** para el desarrollo aritmético en A y B; prosa geométrica en C.
- **Decimales con coma** (`4,3`).

---

## Hallazgos de auditoría (ronda 2, jul-2026)

No hubo ítems puntuales de este topic en el archivo de correcciones de esta ronda, pero el escaneo de los 4 archivos existentes confirma el mismo **patrón dominante de apertura corta** encontrado en el resto de la unidad (regla crítica 32, nueva): `RESL` abre 6/11 ítems con `"La recta tangente a una función en cierto punto es\n$$...$$"` y varios más con `"Sabiendo que"`; `LEXI` abre con `"En la ecuación punto-pendiente de la recta tangente\n$$...$$"` y `"En la misma ecuación\n$$...$$"`; `ESTR` con `"Sabiendo que"`. Ninguno cierra la oración antes del bloque `$$...$$`. Aplicar la corrección al completar hasta 50 ítems por skill: variar la redacción ítem a ítem y cerrar siempre la oración introductoria.

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 4 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna aplicación de reglas prácticas de derivación (potencia, producto, cociente, cadena); ninguna función elemental (sin, cos, exp, log, √)
- [ ] Solo lineales, cuadráticas o valores dados de $f(a)$ y $f'(a)$
- [ ] Explicaciones en 3 párrafos de prosa; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios; variables inline en la prosa
- [ ] **Ningún enunciado abre con un opener corto y genérico** ("La recta tangente a una función en cierto punto es", "Sabiendo que", "En la ecuación punto-pendiente") sin cerrar la oración antes del bloque `$$...$$` (regla crítica 32, confirmado como patrón dominante en los 4 archivos)
- [ ] **Ningún `\begin{aligned}` alinea con `=` datos evaluados de forma independiente**; solo pasos reales de una misma derivación (regla crítica 30)
- [ ] **Ningún ítem que dependa de la fórmula punto-pendiente la asume vista en otro ítem**: la reintroduce con LaTeX centrado antes de la pregunta puntual (regla crítica 31)

**LEXI:**
- [ ] 50 ítems; **exactamente 3 opciones** por ítem
- [ ] Distribución A/B/C respetada (20/15/15)
- [ ] Negrita en primera mención de `recta tangente`, `recta secante`, `pendiente`, `punto de tangencia`, `aproximación lineal`
- [ ] Textos exactos `"Secante"`, `"Tangente"`, `"Recta transversal"` cuando aplique

**GRAF:**
- [ ] 50 ítems con `graph_fn` o gráfico embebido; `graph_view` cuadrado, escala 1:1
- [ ] Distribución A/B/C respetada (20/15/15)
- [ ] Sub-B con pendientes enteras o medios; grilla claramente escalada
- [ ] Ningún ítem pide la ecuación de la tangente desde el gráfico

**ESTR:**
- [ ] 50 ítems; **exactamente 4 opciones** por ítem, cada opción $\leq 35$ caracteres
- [ ] Distribución A/B/C respetada (25/15/10)
- [ ] Sub-A con $f(a)$ y $f'(a)$ dados numéricamente o con función lineal/cuadrática
- [ ] Sub-C con $f'(x)$ explícito; ningún ítem pide derivar previamente
- [ ] Explicaciones con `\begin{aligned}` mostrando distribuir → despejar

**RESL:**
- [ ] 50 ítems; cardinalidad ajustada (4 numérica / 3 categórica)
- [ ] Distribución A/B/C respetada (20/15/15)
- [ ] Sub-B con paralelismo vía $f'(x) = m$ (no perpendicularidad, no $f(x) = m$)
- [ ] Sub-C sin pedir el valor de $c$; textos exactos en opciones cualitativas
- [ ] Ninguna aplicación de reglas prácticas ni funciones elementales
