# Topic: continuity (Continuidad)

Belt: `blue`, Unit: `limits`, Topic: `continuity`

Skills en este topic: `CLSF`, `GRAF`, `RESL`. **50 ítems cada uno (150 en total)** al cerrar el refactor.

**Estado.** Los ejercicios viejos (`CLSF`, `GRAF`, `RESL`) se dejan tal cual en el folder por ahora; el refactor a la nueva distribución se hace en otro turno. Este doc especifica el alcance nuevo, las reglas duras de restricción y la distribución objetivo por skill.

**Nota estructural:** este tópico **prescinde de `LEXI`** y apoya todo el marco teórico en `CLSF`. Las 3 condiciones formales de continuidad y la clasificación de discontinuidades se evalúan como diagnóstico, no como léxico.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** **límite** algebraico, propiedades de límites, **límites laterales**, **límites al infinito**, **asíntotas** verticales y horizontales, funciones elementales y **funciones a trozos** (tópicos anteriores del cinturón).
- **Lo que está aprendiendo acá:** las **3 condiciones formales** de continuidad, la **clasificación** de discontinuidades (**removible**, **de salto**, **esencial**), la determinación analítica y visual de la continuidad en un punto, y el **despeje de parámetros** para forzar continuidad en funciones a trozos.
- **Lo que NO sabe todavía:** **derivadas** (por ende, no se puede argumentar "derivable implica continua"), regla de L'Hôpital, integración.

### Las 3 condiciones formales de continuidad en un punto

Para que $f$ sea continua en $x = a$ deben cumplirse **las tres** condiciones:

1. $f(a)$ está definida.
2. $\lim_{x \to a} f(x)$ existe (es decir, $\lim^- = \lim^+$ y ambos son finitos).
3. $\lim_{x \to a} f(x) = f(a)$.

La discontinuidad se clasifica según cuál condición falla:

- **Removible (evitable)**: el límite bilateral existe y es finito, pero $f(a)$ no está definida o $f(a) \neq L$. Se "arregla" redefiniendo el punto.
- **De salto**: los laterales existen y son finitos pero $\lim^- \neq \lim^+$. No se arregla redefiniendo un solo punto.
- **Esencial (infinita)**: al menos uno de los laterales diverge (asíntota vertical), o no existe por oscilación.

### Regla dura de restricción

**Está prohibido** usar o mencionar en enunciados, opciones, feedback y explicaciones:

- **Derivadas** en cualquier forma (incluida la implicancia derivabilidad ⇒ continuidad).
- **Regla de L'Hôpital**.
- **Integrales**.
- Cualquier argumento de "función suave" o "sin picos" (esos son de derivadas, no de continuidad).

Toda verificación analítica se sostiene exclusivamente en:

1. El cálculo de **límites laterales**.
2. La **evaluación puntual** $f(a)$.
3. La **comparación** entre ambos según las 3 condiciones.

Los ítems que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 3 skills)

Reglas de authoring que se aplican al escribir los 150 ítems:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`: (a) concepto abstracto / regla, (b) aplicación paso a paso al ejemplo (usar `\begin{aligned}` si hay más de un paso), (c) cierre con advertencia técnica o consejo práctico. Sin viñetas `•`, sin sub-`-`, sin em-dash `—` **(estrictamente prohibido en cualquier campo)**, sin humor ni antropomorfismos.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Voz descriptiva en segunda persona amable ("estás tomando el valor del límite en vez de la función", "fijate que…"). Nunca "el alumno confunde…".
4. **Negrita en primera mención** de conceptos clave: **continua**, **discontinuidad**, **removible**, **de salto**, **esencial**, **función a trozos**, **punto de quiebre**. Nunca negritas dentro de `options`.
5. **Ortotipografía**: decimales con **coma** (`4,3`). Contextos genéricos; sin nombres propios.
6. **`correct_index` variado**, no concentrado en un solo índice.
7. **Textos exactos** para tipos de discontinuidad en opciones: `"Removible"`, `"De salto"`, `"Esencial"`, `"Continua"` (con inicial en mayúscula, sin sinónimos). `"No existe"` reservado para casos donde el bilateral no existe.

---

## `feedback_incorrect` en los 150 ítems

Completar con `array<string|null>` paralelo a `options`, `null` en el índice correcto. Voz descriptiva del concepto, en segunda persona amable. Una oración por distractor, autosuficiente.

---

## CLSF, 50 ítems

### Qué evalúa
Diagnosticar analíticamente el estado de continuidad y clasificar el tipo de discontinuidad **sin estímulo visual**. Es el skill que reemplaza el rol conceptual que en otros tópicos cumple `LEXI`.

### Cardinalidad
**Exactamente 3 opciones** por ítem.

### Distribución por sub-familia

| Sub-familia | Foco | Cant. |
|-------------|------|:-----:|
| A. Las 3 condiciones formales | Dado un set de datos o una descripción teórica, identificar cuál de las 3 condiciones falla. Ejemplo: "si $\lim f(x) = 4$ pero $f(a)$ no está definida, ¿qué condición se rompe y qué tipo de discontinuidad genera?". | 15 |
| B. Clasificación analítica | Se dan valores puntuales de $\lim^-$, $\lim^+$ y $f(a)$. El alumno clasifica: continua / removible / de salto / esencial. Ejemplo: $\lim^- = 3$, $\lim^+ = 5$ → salto. | 20 |
| C. Continuidad por familias | Conocimiento teórico: polinómicas, exponenciales, seno y coseno son continuas en todo $\mathbb{R}$. Las racionales son continuas en su dominio (excluidas las raíces del denominador). Logaritmo continuo en $x > 0$. Raíz par continua en su dominio. | 15 |

### `feedback_incorrect`, confusiones fuente
- **Confundir removible con salto**: cuando $\lim^- = \lim^+ = L$ pero $f(a) \neq L$ (o no existe), elegir "de salto". Recordar: si el bilateral existe y es finito, la discontinuidad es **removible**.
- **Salto clasificado como esencial**: cuando ambos laterales son finitos pero distintos, elegir "esencial". Esencial requiere que al menos un lateral diverja u oscile.
- **Continua declarada cuando falta $f(a)$**: elegir "continua" cuando $\lim$ existe pero $f(a)$ no está definida. Falta la condición 1: la función debe estar **definida** en el punto.
- **Racional continua en su raíz del denominador**: creer que $\tfrac{1}{x-2}$ es continua en $x = 2$ porque "es una función elemental". Las racionales son continuas en su dominio; $x = 2$ está fuera del dominio.
- **Polinómica con discontinuidad**: sugerir que un polinomio tiene una discontinuidad. Los polinomios son continuos en todo $\mathbb{R}$ sin excepción.
- **Confundir "existe el límite" con "es continua"**: elegir "continua" solo porque el bilateral existe. Falta comparar con $f(a)$.

### Reglas específicas
- **Negrita en primera mención** de `continua`, `discontinuidad`, `removible`, `de salto`, `esencial` en `question` y `explanation`.
- Las opciones de clasificación usan exactamente los textos: `"Continua"`, `"Removible"`, `"De salto"`, `"Esencial"`.
- Sub-A y sub-B son numéricas / de datos concretos; sub-C es teórica.

---

## GRAF, 50 ítems

### Qué evalúa
Leer e identificar **fracturas geométricas** y su tipo directamente del gráfico. Diagnóstico visual del punto de discontinuidad y clasificación del tipo.

### Cardinalidad
- **4 opciones** cuando la respuesta es un valor de $x$ o $y$.
- **3 opciones** cuando la respuesta es una clasificación de tipo.

### Distribución por sub-familia

| Sub-familia | Foco | Cant. |
|-------------|------|:-----:|
| A. Diagnóstico visual de la falla | Dada una gráfica con una ruptura, identificar en qué valor de $x$ la función NO es continua. **Distractores**: puntos cercanos, intersecciones con ejes, vértices suaves (que no son discontinuidades). | 25 |
| B. Clasificación visual | Señalar un punto $x = a$ específico en una gráfica y pedir el tipo de discontinuidad: **removible** (hueco), **de salto** (dos ramas a distinta altura) o **esencial** (asíntota vertical). | 25 |

### `feedback_incorrect`, confusiones fuente
- **Vértice suave confundido con discontinuidad**: elegir el $x$ donde hay un pico (tipo $|x|$ en $0$) como punto discontinuo. Un pico es continuo; el problema sería de derivabilidad, que no se estudia acá.
- **Corte con eje $x$ confundido con discontinuidad**: dar la raíz de $f$ como punto discontinuo. Que $f(a) = 0$ no la hace discontinua.
- **Hueco clasificado como salto**: en un gráfico con un solo hueco (círculo abierto) y sin desplazamiento del punto, elegir "de salto". Recordar: hueco = removible.
- **Salto clasificado como esencial**: dos ramas finitas a distinta altura son un **salto**, no una discontinuidad esencial.
- **Asíntota vertical clasificada como salto**: la asíntota vertical corresponde a discontinuidad **esencial**, no de salto.
- **Punto abierto ↔ cerrado invertidos**: leer un círculo lleno como abierto o al revés, y errar el diagnóstico.

### Reglas específicas
- **Gráficos que exhiben exactamente una discontinuidad** por ítem, salvo en distractores explícitos del enunciado.
- **Puntos abiertos vs. cerrados** claramente distinguidos; convención declarada en el enunciado si hace falta.
- **Vértices suaves incluidos como distractor** en sub-A (no son discontinuidades).
- Opciones de clasificación con textos exactos: `"Removible"`, `"De salto"`, `"Esencial"`, `"Continua"`.
- **Distractor prohibido en sub-A**: no incluir el $y$-valor cuando se pregunta por el $x$-valor (típica confusión de ejes, se acepta solo si el ítem la usa deliberadamente).

---

## RESL, 50 ítems

### Qué evalúa
Ejecutar la **verificación algebraica** de las 3 condiciones y **forzar la continuidad** despejando parámetros en funciones a trozos.

### Cardinalidad
**Exactamente 4 opciones** por ítem (grilla 2×2). Valores numéricos cortos (**$\leq 35$ caracteres**).

### Distribución por sub-familia

| Sub-familia | Foco | Cant. |
|-------------|------|:-----:|
| A. Verificación en punto crítico | Dada una función a trozos sin parámetros, verificar si es continua o no en el punto de quiebre calculando $\lim^-$, $\lim^+$ y $f(a)$. La respuesta es un diagnóstico (continua / removible / de salto). | 15 |
| B. Despeje de un parámetro | Funciones a trozos con una constante $k$ (o $c$). Ejemplo: $f(x) = kx + 1$ para $x < 2$, $f(x) = x^2 - 3$ para $x \geq 2$. Calcular el valor de $k$ que hace continua a $f$ en $x = 2$. | 25 |
| C. Dominio de racionales y raíces | Encontrar el valor de $x$ donde una función estándar presenta discontinuidad resolviendo el dominio. Ejemplo: raíces del denominador en una racional; argumento negativo en una raíz par; argumento $\leq 0$ en un logaritmo. | 10 |

### `feedback_incorrect`, confusiones fuente
- **$k$ resuelto por una sola rama**: en el despeje, igualar solo $\lim^-$ a un número y dar ese $k$ sin verificar el bilateral con $\lim^+$. La ecuación para continuidad es $\lim^- = \lim^+ = f(a)$.
- **Igualar la rama al valor $f(a)$ ignorando el otro lateral**: en $f(x) = \{kx+1 \text{ si } x<2;\ x^2-3 \text{ si } x \geq 2\}$, resolver $k \cdot 2 + 1 = k \cdot 2 + 1$ (tautología) o solo con una rama.
- **Signo invertido en el despeje**: al resolver $2k + 1 = 1$, dar $k = 1$ en vez de $k = 0$.
- **Confundir dominio con continuidad**: en sub-C, dar el $x$ donde la función SÍ está definida como respuesta. Se pide dónde NO está definida (raíz del denominador, argumento fuera del dominio).
- **Raíz del numerador tomada como discontinuidad**: en una racional, dar la raíz del numerador (donde $f = 0$) como punto discontinuo. La discontinuidad viene del denominador.
- **Logaritmo con argumento igual a $0$ marcado como continuo**: creer que $\ln(x)$ es continua en $x = 0$. El dominio es $x > 0$, el $0$ queda fuera.

### Reglas específicas
- **Funciones a trozos** con 2 ramas por defecto, punto de quiebre único.
- **En sub-B, un solo parámetro por ítem** (una sola incógnita $k$ o $c$). Si el ítem exige dos parámetros, se justifica explícitamente y se cuenta como sub-B avanzada.
- **Explicaciones con `\begin{aligned}`** para el despeje de parámetros y para el cálculo de laterales.
- **Diagnóstico en sub-A** con opciones `"Continua"` / `"Removible"` / `"De salto"` / `"Esencial"` (no `"No existe"`).
- **En sub-C**, cuando la función tiene múltiples puntos fuera del dominio (ej. denominador cuadrático con 2 raíces reales), el enunciado especifica qué se pide (todos, el menor, el positivo).
- **Ninguna aplicación de L'Hôpital**; sub-A y sub-B se resuelven con sustitución directa en cada rama.
- **Decimales con coma** (`4,3`).

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 3 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna mención de derivadas, L'Hôpital, integrales, o "función suave / sin picos"
- [ ] Explicaciones en 3 párrafos de prosa; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] Cierres de `explanation` en advertencia/consejo, voz neutra
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios
- [ ] Textos exactos `"Continua"`, `"Removible"`, `"De salto"`, `"Esencial"` en opciones de clasificación

**CLSF:**
- [ ] 50 ítems; **exactamente 3 opciones** por ítem
- [ ] Distribución A/B/C respetada (15/20/15)
- [ ] Negrita en primera mención de `continua`, `discontinuidad`, `removible`, `de salto`, `esencial`
- [ ] Sub-A y sub-B trabajan con datos numéricos concretos; sub-C es teórica sin datos numéricos

**GRAF:**
- [ ] 50 ítems con `graph_fn` o gráfico embebido
- [ ] Distribución A/B respetada (25/25)
- [ ] Vértices suaves incluidos como distractor en sub-A (no son discontinuidades)
- [ ] Puntos abiertos vs. cerrados claramente distinguidos
- [ ] Cardinalidad ajustada: 4 si valor $x$/$y$, 3 si clasificación

**RESL:**
- [ ] 50 ítems; **exactamente 4 opciones** por ítem, cada opción $\leq 35$ caracteres
- [ ] Distribución A/B/C respetada (15/25/10)
- [ ] Funciones a trozos con 2 ramas y punto de quiebre único (por defecto)
- [ ] Sub-B con un solo parámetro por ítem, verificando $\lim^- = \lim^+ = f(a)$ en el despeje
- [ ] Sub-C con dominio bien definido; el enunciado precisa qué punto se pide cuando hay varios candidatos
- [ ] Ninguna aplicación de L'Hôpital
