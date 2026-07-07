# Topic: quadratic (funciones cuadráticas)

Belt: `white`, Unit: `functions`, Topic: `quadratic`

Skills en este topic: `LEXI`, `CLSF`, `FORM`, `GRAF`. 50 ítems cada uno (200 en total).

**Estado.** Los ejercicios (enunciados, opciones y respuestas correctas) están validados y se conservan. Este documento especifica lo que falta para dejar el tema al día con las convenciones actuales:

1. **`feedback_incorrect`** que falta en 175/200 ítems (LEXI 50, CLSF 36, FORM 39, GRAF 50).
2. **Correcciones de formato** pendientes (31 explicaciones con viñetas).
3. **Distribución objetivo** de cada skill, para preservarla en cualquier refactor.

No se pide reescribir los problemas: se pide corregir el formato, sumar los feedback, rebalancear el `correct_index` y no romper la distribución.

---

## Correcciones de formato transversales (los 4 skills)

Defectos detectados en la auditoría (jul-2026). **Corrección sobre la auditoría anterior**: la afirmación de que cuadráticas ya estaba limpia en `\n\n$$` pegado a display y en em-dash `—` era incorrecta, verificado programáticamente sobre los 4 JSON. Los defectos reales que quedan:

1. **`\n\n` pegado a bloques `$$...$$`** (LEXI 10, CLSF 5, FORM 30 ítems; GRAF 0, ya limpio). Viola la regla crítica 2 del `authoring-context.md`: un solo `\n` antes y después de cada bloque display, nunca `\n\n`. Concentrado sobre todo en `explanation` de FORM, donde cada paso intermedio abre su fórmula con `\n\n$$...$$\n\n`.
   - ❌ `se calcula como:\n\n$$x_v = -\frac{b}{2a}$$\n\nCon $a = 4$...`
   - ✅ `se calcula como\n$$x_v = -\frac{b}{2a}$$\ncon $a = 4$...`
2. **Em-dash `—` y en-dash `–`** (LEXI 8, FORM 6 ítems; CLSF y GRAF limpios). Prohibidos (regla crítica 6). Reemplazar por `,`, `:`, `;` o `.`. Coinciden en buena parte con los ítems de viñetas de LEXI.
3. **Explicaciones con viñetas `•` y sub-viñetas `-`** (LEXI 15, CLSF 8, FORM 5, GRAF 3). Estilo viejo. Reescribir a la **estructura de 3 párrafos de prosa** (concepto general → aplicación al caso → cierre útil), separados por `\n\n`. Sin listas con `•`, sin sub-ítems con `-`.
   - ❌ `• $a$ es el coeficiente principal.\n• $b$ y $c$ son...`
   - ✅ Prosa: `El **coeficiente principal** $a$ define la apertura y el signo de la concavidad; $b$ y $c$ acompañan sin cambiar la familia.`
4. **Cierres con humor o antropomorfismo**. El cierre de la `explanation` debe ser **advertencia del error típico o consejo práctico**, en voz neutra (regla crítica 7 del `authoring-context.md`). Nada de remates de chiste.
5. **`correct_index` muy sesgado a un índice** (LEXI: 38/50 en índice 1; CLSF: 23/50 en índice 1; GRAF: 28/50 en índice 1 y **cero en índice 3**). El runtime baraja igual, pero como fuente dificulta auditar pistas delatoras. Al pasar por refactor, variar el índice correcto y garantizar presencia mínima en los cuatro índices para GRAF.
6. **`explanation` bajo el mínimo de 250 caracteres** (regla de *Extensión mínima* del `authoring-context.md`): GRAF 39/50, FORM 22/50, CLSF 2/50, LEXI 0/50. En GRAF son casi todas: solo cubren concepto + aplicación en 2-3 renglones cortos y no llegan al mínimo; hay que engordar el concepto general o sumar un cierre de advertencia/consejo (no ambos si el cierre no aporta, ver regla crítica 7) para cruzar el umbral sin inflar con relleno.

---

## `feedback_incorrect`, falta en los 200 ítems

Hoy 175/200 son `""` (string vacío, legacy). Los 25 restantes (CLSF 14, FORM 11) **no están resueltos tampoco**: el campo es un `string` (no un `array`) que repite o parafrasea el `feedback_correct` explicando por qué la opción correcta es correcta, no una pista por distractor. Tratarlos igual que los `""`: descartar el contenido existente y escribir desde cero el `array<string|null>` paralelo a `options`, mismo largo, `null` en el índice correcto. Voz **descriptiva del concepto**, nunca acusatoria (`"confunde X con Y"` prohibido; ver `authoring-context.md` §Pistas). Una oración por distractor, autosuficiente. Las confusiones fuente por skill están en cada sección.

---

## LEXI, 50 ítems

### Qué evalúa
Vocabulario y parámetros de la parábola: forma canónica $f(x) = ax^2 + bx + c$, formas **vértice** $a(x-h)^2 + k$ y **factorizada** $a(x-r_1)(x-r_2)$, identificar **vértice**, **eje de simetría**, **raíces** (ceros), **ordenada al origen** $c$, **concavidad** (signo de $a$), **coeficiente principal**, dominio e imagen, máximo vs mínimo, raíz simple vs doble, discriminante.

### Cardinalidad
- **Identificación numérica** (leer $a$, $b$, $c$, vértice, raíz, $f(0)$): **4 opciones**, valores cortos, disparan la grilla 2×2.
- **Conceptual puro** (nombrar un parámetro, elegir la descripción): **3 opciones** si solo hay tres confusiones reales; no rellenar con una cuarta implausible.

### `feedback_incorrect`, confusiones fuente
- **Vértice ↔ raíz**: dar la raíz cuando se pide el vértice (o viceversa). Describir: "el vértice es el punto óptimo de la parábola; la raíz es donde cruza el eje $X$".
- **Eje de simetría ↔ eje $Y$**: elegir "$x = 0$" pensando que el eje de simetría siempre es el eje $Y$. Recordar que pasa por $x = h$ (el $x$ del vértice).
- **Dominio ↔ imagen**: dar $\mathbb{R}$ para la imagen o $[k, +\infty)$ para el dominio. Nombrar cuál es cuál en la descripción.
- **Máximo vs mínimo**: leer "máximo" cuando $a > 0$ (mínimo) o al revés. Describir sin la fórmula: "la parábola abre hacia arriba, así que el vértice es el punto más bajo".
- **Raíz simple vs doble**: dar "dos raíces distintas" cuando $\Delta = 0$ (raíz doble) o "sin raíces" cuando $\Delta > 0$.
- **`c` ≠ raíz**: confundir el valor de $c$ con una raíz de la parábola; $c$ es $f(0)$, la ordenada al origen.

### Reglas específicas
- **Negrita en primera mención** de `parábola`, `vértice`, `eje de simetría`, `raíces`, `ordenada al origen`, `concavidad`, `coeficiente principal`, `dominio`, `imagen` en `question` y `explanation`.
- Reescribir a forma canónica o vértice como primer paso de la `explanation` cuando el enunciado viene en forma factorizada o desordenada.

---

## CLSF, 50 ítems

### Qué evalúa
Clasificar a qué familia pertenece una función: cuadrática vs. lineal, exponencial o logarítmica. Dos entradas: desde la **fórmula** ($f(x) = 3x^2 - x$ es cuadrática; $2x + 1$, $3^x$, $\log x$ no) y desde una **situación cotidiana** (producto de dos magnitudes lineales, tiro con gravedad, precio×cantidad con demanda decreciente → cuadrática; tasa constante → lineal; factor multiplicativo → exponencial). Incluye también concavidad, monotonía por intervalos e imagen acotada por el vértice desde gráfico.

**Distractor más común: lineal vs cuadrática** (tasa constante vs. producto de dos magnitudes lineales, o "sube y después baja" mal leído como lineal). El resto de la tabla señal→familia vive en `authoring-context.md`.

### Cardinalidad
- **Clasificación de familia**: **4 opciones** (Lineal, Cuadrática, Exponencial, Logarítmica). Es el caso legítimo de 4: hay cuatro familias genuinamente distintas.
- **Concavidad / monotonía / imagen**: según la respuesta, 3 conceptual o 4 si es intervalo.

### `feedback_incorrect`, confusiones fuente
- **"Sube y después baja" leído como lineal**: el eje del skill. Una recta no puede tener un punto de máximo; si el fenómeno tiene un óptimo, es cuadrática. Describir: "una recta crece o decrece siempre al mismo ritmo, no puede tener un valor máximo".
- **Área confundida con lineal**: "lado × lado" o "largo × ancho con perímetro fijo" es cuadrática, no lineal. El producto de dos magnitudes que dependen de una misma variable eleva el grado.
- **Confundir con exponencial**: elegir exponencial por "crece rápido"; nombrar qué la caracteriza (multiplicación por un factor fijo cada período, no elevar la variable al cuadrado).
- **Confundir con logarítmica**: elegir logarítmica por descarte; describir el crecimiento que se frena vs. la parábola que crece cada vez más rápido.
- **Distractor de familia en fórmula**: cuando la correcta es cuadrática, cada distractor nombra qué haría a la función de esa otra familia ($x$ a la primera potencia, $x$ en el exponente, $x$ dentro de un log).

### Reglas específicas
- **Nunca poner "Cuadrática" y "Polinómica" juntas** en la misma grilla (ver `authoring-context.md`).
- **Contexto y pregunta en párrafos separados** (`\n\n`), con la pregunta nombrando la magnitud concreta ("¿qué familia describe la altura del proyectil en función del tiempo?"), no `¿Qué familia?` telegráfico.

---

## FORM, 50 ítems

### Qué evalúa
Construir o leer la fórmula $f(x) = ax^2 + bx + c$ y sus formas vértice / factorizada desde una situación:
- Leer $a$, $b$, $c$ desde forma estándar; calcular eje de simetría $-b/(2a)$; leer $f(0) = c$.
- Forma vértice ↔ coordenadas del vértice en ambos sentidos; evaluar $f(v)$; encontrar raíces desde forma canónica.
- Forma factorizada ↔ raíces: leer raíces, escribir factorizada dadas las raíces, raíz doble.
- Armar fórmula desde cotidiano: área del cuadrado, corral con perímetro fijo, tiro ($h_0 + v_0 t - \tfrac{1}{2} g t^2$), ganancia = precio × cantidad, caída libre, chorro, optimización.
- Gráfico → fórmula: vértice + signo de $a$ + apertura.
- Evaluar y resolver: $f(\text{valor})$, ¿cuándo $f(t) = 0$?, raíces desde forma estándar factorable, ecuación cuadrática desde contexto.

### Cardinalidad
- **Armar/leer la fórmula, coeficientes, vértice, raíces**: **4 opciones**, expresiones cortas, grilla 2×2.

### `feedback_incorrect`, confusiones fuente
- **Signo de $h$ en la forma vértice**: raíz $+3$ → factor $(x - 3)$, no $(x + 3)$. Vértice en $(2, k)$ → $a(x - 2)^2 + k$, no $a(x + 2)^2 + k$. Nombrar la regla: el signo dentro del paréntesis va **opuesto** al del vértice.
- **`c` ≠ raíz**: $c$ es $f(0)$, no donde la función se anula. Distractor que da $c$ cuando se piden las raíces (o al revés).
- **$b$ sin signo**: al calcular $-b/(2a)$, olvidar el signo de $b$: si $b = -6$, entonces $-b = 6$, no $-6$.
- **$a > 0$ / $a < 0$ invertido al leer apertura del gráfico**: parábola cóncava hacia arriba tiene $a > 0$; hacia abajo, $a < 0$.
- **Sumar en lugar de multiplicar** al armar la forma factorizada desde raíces: $r_1 = 2, r_2 = -3$ da $(x - 2)(x + 3)$, no $x - 2 + x + 3$.
- **Confundir vértice con raíz** al leer el gráfico para armar la forma vértice.

### Reglas específicas
- **Montos con `\$` escapado** siempre (en JSON `\\$`).
- **Mostrar solo la forma final** de la fórmula en el enunciado; el paso intermedio va en la `explanation`.
- **Cierres sin humor**: reescribir a advertencia del intercambio vértice↔raíz o del signo de $h$.

---

## GRAF, 50 ítems

### Qué evalúa
Leer una parábola desde su gráfico: **vértice** (valor y coordenada del óptimo), **concavidad** (signo de $a$), **raíces** (dónde toca el eje, solo si abre hacia abajo con el valle debajo del cero), **eje de simetría** (misma altura dos veces), **ordenada al origen** $c$ (valor de partida $f(0)$), lectura $f(v)$, y comparación crece-vs-decrece antes/después del vértice. Los 50 tienen `graph_fn`.

### Regla dura de gráfico (análogo del `|m|≤3` de lo lineal)
Las parábolas crecen rápido y con render 1:1 se van de la vista; si las raíces quedan fuera del encuadre, la curva "flota" y no se interpreta.

- **Coeficiente líder chico**: `|a| ≤ 0.5` (típico `±0.25`, `±0.5`). Parábola suave.
- **Forma vértice al autorar**: `a*pow(x-h,2) + k`, para ubicar vértice y raíces a propósito.
- **`graph_view` cuadrado con el arco completo dentro**. Abajo (máximo): vértice arriba-centro y las dos raíces sobre el eje. Arriba (mínimo): el valle entero, vértice abajo-centro. Vista `[-1,11,-1,11]` o `[-1,13,-1,13]` si el span llega a 12.
- Vértice, raíces y el valor leído en coordenadas legibles (enteros o medios).

**Lección del corral (autoría original de `graf_08`):** la función `-1*pow(x-2,2)+4` con $a = -1$ dejaba las raíces al borde de la vista y la curva parecía flotar sin contexto. Se reemplazó por limonada con $a = -0.5$ y vista `[-1,11,-1,11]`. **Regla de oro**: verificar numéricamente que las dos raíces (para abajo) caen dentro del `graph_view` antes de cerrar el ejercicio.

### Biblioteca de modelado
- **Máximo (cóncava abajo, $a < 0$):**
  - *Tiro/proyectil* (en el tiempo): pelota, globo de agua, fuegos artificiales, clavadista, golf, salto.
  - *Arco/chorro* (en el espacio, $x$ = distancia): tiro libre, manguera, salto de moto, delfín.
  - *Optimización-máximo*: precio→ganancia, velocidad→rendimiento, mesas→ganancia, recaudación.
- **Mínimo (cóncava arriba, $a > 0$):** cable/guirnalda colgando (punto más bajo), rampa en U de skate, temperatura de la madrugada (hora más fría), nivel de un río en sequía, costo medio, velocidad en una curva. El valle queda por encima del eje → estos **no** usan raíces/duración.

Variar números, no repetir personajes. Montos con `\\$` en JSON. Sin nombres propios.

### Arquetipos de pregunta
Vértice-y (valor máx/mín) · vértice-x (cuándo/dónde el óptimo) · concavidad (máx o mín → signo de $a$) · raíz (toca el suelo, solo abajo) · duración/dos raíces (solo abajo) · eje de simetría (misma altura dos veces) · lectura $f(v)$ · sube vs baja (crece antes del vértice, decrece después) · ordenada al origen $c$ (valor de partida, $f(0)$).

**Los mínimos (cóncava arriba) NO usan raíces ni duración**: el valle queda por encima del eje → la parábola nunca toca el cero. Los arquetipos válidos para arriba son: vértice-y, vértice-x, concavidad, lectura $f(v)$, eje de simetría, sube vs baja.

### Cardinalidad
- **4 opciones**, mezcla de descripciones cortas de contexto y valores numéricos leídos del gráfico.

### `feedback_incorrect`, confusiones fuente
- **Vértice-y ↔ vértice-x**: dar "a los 3 segundos" cuando se pide la altura máxima, o al revés. Describir qué parte del gráfico releer ("mirá el valor de altura en el punto más alto", "mirá el tiempo en el que se alcanza el punto más alto").
- **Concavidad invertida**: leer $a > 0$ en una parábola cóncava hacia abajo. Nombrar la regla: si el fenómeno tiene un máximo, la parábola abre hacia abajo y $a < 0$.
- **Raíz pedida en un mínimo**: pretender que un cable colgante o una temperatura mínima "toca el cero". Describir que el valle queda arriba del eje, así que la función nunca vale cero.
- **Ordenada al origen ↔ vértice**: dar el valor del vértice cuando se pregunta por el valor de partida $f(0)$, o al revés. Recordar que $c = f(0)$ es la altura de la curva sobre el eje $Y$; el vértice es el óptimo.
- **Eje de simetría mal leído**: dar el $x$ de una raíz cuando se pide el eje de simetría (que pasa por el punto medio entre las dos raíces).

### Reglas específicas
- **1:1 en los gráficos**: `|a| ≤ 0.5`, `graph_view` cuadrado.
- **Verificar raíces dentro del `graph_view`** para las de concavidad abajo (regla del corral).
- **Cierres sin humor**: pasar cualquier remate humorístico a advertencia/consejo.

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 4 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: `array` del largo de `options`, `null` en el correcto, una pista descriptiva por distractor (incluye reescribir los que hoy son `string` no vacío, son duplicados del `feedback_correct`)
- [ ] Ningún `\n\n` pegado a un bloque `$$...$$` (un solo `\n`)
- [ ] Ningún em-dash `—` ni en-dash `–` en ningún campo
- [ ] Ninguna explicación con viñetas `•` ni sub-ítems `-`: todas en 3 párrafos de prosa
- [ ] Cierres de `explanation` en advertencia/consejo, sin humor ni antropomorfismo
- [ ] `correct_index` variado, no concentrado en un solo índice
- [ ] `explanation` supera los 250 caracteres entre las 3 partes
- [ ] Montos con `\$` escapado

**LEXI:**
- [ ] 50 ítems; negrita en primera mención de `parábola`/`vértice`/`eje de simetría`/`raíces`/`ordenada al origen`/`concavidad`/`coeficiente principal`/`dominio`/`imagen`
- [ ] Conceptuales puros a 3 opciones cuando no hay una cuarta confusión real; numéricos a 4

**CLSF:**
- [ ] 50 ítems; clasificación de familia con las 4 opciones (Lineal/Cuadrática/Exponencial/Logarítmica)
- [ ] Nunca "Cuadrática" y "Polinómica" juntas en la misma grilla
- [ ] Contexto y pregunta separados por `\n\n`, pregunta con la magnitud nombrada

**FORM:**
- [ ] 50 ítems; forma final de la fórmula en el enunciado, paso intermedio en la explicación
- [ ] Distractores de signo de $h$, `c`↔raíz, $b$ sin signo, apertura invertida presentes

**GRAF:**
- [ ] 50 ítems con `graph_fn`, `graph_view` cuadrado y `|a| ≤ 0.5`
- [ ] Verificado numéricamente que las raíces (para las de $a < 0$) caen dentro del `graph_view`
- [ ] Los 9 arquetipos cubiertos al menos una vez
- [ ] Mínimos ($a > 0$) sin ítems de raíz ni de duración
- [ ] `correct_index` con presencia mínima en los cuatro índices (hoy no hay ninguno en 3)
