# Topic: linear (funciones lineales)

Belt: `white`, Unit: `functions`, Topic: `linear`

Skills en este topic: `LEXI`, `CLSF`, `FORM`, `GRAF`. 50 ítems cada uno (200 en total).

**Estado.** Los ejercicios (enunciados, opciones y respuestas correctas) están validados y se conservan. Este documento especifica lo que falta para dejar el tema al día con las convenciones actuales:

1. **Correcciones de formato** pendientes (defectos sistémicos del estilo viejo).
2. **`feedback_incorrect`** que falta en los 200 ítems (hoy todos con `""`).
3. **Distribución objetivo** de cada skill, para preservarla en cualquier refactor.

No se pide reescribir los problemas: se pide corregir el formato, sumar los feedback y no romper la distribución.

---

## Correcciones de formato transversales (los 4 skills)

Defectos detectados en la auditoría (jul-2026). Aplicar a todos los ítems afectados.

1. **`\n\n` pegado a bloques `$$...$$`** (LEXI 29, CLSF 27, FORM 32 ítems). Viola la regla crítica 2 del `authoring-context.md`: las fórmulas display van con **un solo `\n`** antes y después, nunca `\n\n`. KaTeX ya agrega su propio margen; el doble salto abre un hueco vertical.
   - ❌ `escribirse en la forma:\n\n$$f(x) = mx + b$$\n\ndonde $m$ y $b$...`
   - ✅ `escribirse en la forma\n$$f(x) = mx + b$$\ndonde $m$ y $b$...`
   - El `:` que colgaba antes del `$$` se saca (o se deja como cierre de la frase, pero sin `\n\n`).
2. **Explicaciones con viñetas `•` y sub-viñetas `-`** (LEXI 13, CLSF 23, FORM 10). Es el estilo viejo. Reescribir a la **estructura de 3 párrafos de prosa** (concepto general → aplicación al caso → cierre útil), separados por `\n\n`. Sin listas con `•`, sin sub-ítems con `-`.
   - ❌ `• $m$ es la pendiente — mide la inclinación.\n• $b$ es la ordenada...`
   - ✅ Prosa: `El parámetro $m$ es la **pendiente** y $b$ es la **ordenada al origen**...`
3. **Em-dash `—` y en-dash `–`** (FORM 7, LEXI 1). Prohibidos (regla crítica 6). Reemplazar por `,`, `:`, `;` o `.`. Aparecen sobre todo como separador de viñeta y en los cierres humorísticos.
4. **Cierres con humor o antropomorfismo** (FORM y GRAF). El cierre de la `explanation` debe ser **advertencia del error típico o consejo práctico**, en voz neutra (regla crítica 7). Reemplazar los remates tipo chiste:
   - ❌ `la moto funciona al revés`, `la bicicleta no lo merece`, `probablemente sin luz igual`, `el que va una vez paga igual que el que vive ahí`.
   - ✅ Advertencia: `El error frecuente es intercambiar la tarifa por km con la bajada de bandera: la que multiplica a la variable es la pendiente.`
5. **`GRAF` es la referencia de estilo.** Es el único skill sin `\n\n±$$`, sin viñetas y sin em-dash. Al reescribir LEXI/CLSF/FORM, calcar su formato de prosa. Lo único a revisar en GRAF son los cierres humorísticos (punto 4).

**Además de formato:**
- **`correct_index` muy sesgado a un índice** (CLSF: 35/50 en índice 1; LEXI: 28/50 en índice 1). El runtime baraja igual, pero como fuente dificulta auditar pistas delatoras. Al pasar por refactor, variar el índice correcto.
- **Cardinalidad** (ver por skill). Hoy los 200 tienen 4 opciones. Está bien donde la respuesta es numérica o hay 4 confusiones reales (clasificación de familia); revisar los conceptuales puros con solo 3 distractores plausibles.

---

## `feedback_incorrect`, falta en los 200 ítems

Hoy todos son `""`. Completar con un `array<string|null>` paralelo a `options`, mismo largo, `null` en el índice correcto. Voz **descriptiva del concepto**, nunca acusatoria (`"confunde X con Y"` prohibido; ver `authoring-context.md` §Pistas). Una oración por distractor, autosuficiente. Las confusiones fuente por skill están en cada sección.

---

## LEXI, 50 ítems

### Qué evalúa
Vocabulario y parámetros de la recta: forma canónica $f(x) = mx + b$, identificar **pendiente** $m$ y **ordenada al origen** $b$ desde la fórmula, signo de $m$ y monotonía, raíz, dominio e imagen, casos especiales ($m = 0$ constante). Mezcla de ítems de identificación numérica (leer $m$ o $b$) y conceptuales (nombrar el parámetro, describir monotonía).

### Cardinalidad
- **Identificación numérica** (leer $m$, $b$, raíz, imagen): **4 opciones**, valores cortos, disparan la grilla 2×2.
- **Conceptual puro** (nombrar un parámetro, elegir la descripción): **3 opciones** si solo hay tres confusiones reales; no rellenar con una cuarta implausible.

### `feedback_incorrect`, confusiones fuente
- **Pendiente ↔ ordenada al origen**: dar el otro parámetro (en $f(x) = 7 - 3x$, responder $7$ cuando se pide la pendiente).
- **Valor vs. término con variable**: confundir el parámetro con el término completo ($-3x$ en lugar de $-3$, la ordenada con el término $b$).
- **Signo**: tomar $+3$ cuando la forma canónica deja $m = -3$ (no reordenar $7 - 3x$ a $-3x + 7$).
- **Monotonía**: leer creciente/decreciente al revés del signo de $m$; creer que una lineal tiene intervalos de crecimiento distintos (crece o decrece en todo $\mathbb{R}$).
- **Imagen**: dar $\{b\}$ o un intervalo cuando con $m \neq 0$ la imagen es $\mathbb{R}$; olvidar que $m = 0$ colapsa la imagen a un punto.

### Reglas específicas
- **Negrita en primera mención** de `pendiente`, `ordenada al origen`, `dominio`, `imagen` en `question` y `explanation`.
- Reescribir en forma canónica $f(x) = mx + b$ como primer paso de la `explanation` cuando el enunciado viene desordenado ($7 - 3x$).

---

## CLSF, 50 ítems

### Qué evalúa
Clasificar a qué familia pertenece una función: **lineal** vs. cuadrática, exponencial o logarítmica. Dos entradas: desde la **fórmula** ($f(x) = 2x - 5$ es lineal; $x^2$, $3^x$, $\log x$ no) y desde una **situación cotidiana** (tasa constante → lineal; porcentaje/factor multiplicativo → exponencial; área → cuadrática). Incluye también monotonía e imagen de lineales, y 2 ítems con gráfico (recta vs. parábola vs. curva).

### Cardinalidad
- **Clasificación de familia**: **4 opciones** (Lineal, Cuadrática, Exponencial, Logarítmica). Es el caso legítimo de 4: hay cuatro familias genuinamente distintas. Mantener las cuatro.
- **Monotonía / imagen**: según la respuesta, 3 conceptual o 4 si es un conjunto/intervalo.

### `feedback_incorrect`, confusiones fuente
- **Porcentaje/multiplicativo leído como lineal**: el eje del skill. "Perder 10% por año" o "multiplicarse por 1,01" es exponencial, no lineal; un porcentaje es un factor que multiplica, no una cantidad fija que se suma. Describir sin la fórmula: "un cambio del mismo porcentaje cada período multiplica, y eso curva el crecimiento".
- **Confundir con cuadrática**: creer que hay término $x^2$ donde no lo hay, o clasificar un área como lineal.
- **Confundir con logarítmica**: elegir logarítmica por descarte; nombrar qué la caracteriza (crecimiento que se frena, no una recta).
- **Distractor de familia en fórmula**: cuando la correcta es lineal, cada distractor nombra qué haría a la función de esa otra familia ($x$ al cuadrado, $x$ en el exponente, $x$ dentro de un log).

### Reglas específicas
- **Nunca poner "Cuadrática" y "Polinómica" juntas** en la misma grilla (ver `authoring-context.md`). Acá no aplica porque las familias son lineal/cuadrática/exp/log, pero mantenerlo en mente si se agregan opciones.
- **Contexto y pregunta en párrafos separados** (`\n\n`), con la pregunta nombrando la magnitud concreta ("¿qué familia describe el valor restante...?"), no `¿Qué familia?` telegráfico. Esto ya se corrigió en jun-2026; mantenerlo al tocar los ítems.
- **Sin traducir el porcentaje a multiplicador en el enunciado**: "pierde el 10% cada año" se deja así; convertirlo a "se multiplica por 0,9" regala la clasificación (ver `authoring-context.md` §Preguntas directas).

---

## FORM, 50 ítems

### Qué evalúa
Construir o leer la fórmula $f(x) = mx + b$ desde una situación: extraer la **pendiente** $m$ (tarifa por unidad, ritmo) y la **ordenada al origen** $b$ (costo fijo, valor inicial), armar la ecuación. Incluye raíz (resolver $f(x) = 0$), imagen sobre dominio restringido $[a, b]$, y 4 ítems que leen la ecuación desde un gráfico.

### Cardinalidad
- **Armar/leer la fórmula, pendiente, raíz**: **4 opciones**, expresiones cortas ($C(k) = 500 + 200k$ y variantes), grilla 2×2.

### `feedback_incorrect`, confusiones fuente
- **$m \leftrightarrow b$ intercambiados**: el clásico. "Taxi cobra \$500 fijo más \$200 por km" da $C(k) = 500 + 200k$; el distractor $200 + 500k$ pone el fijo como tarifa. Describir: "el \$500 no depende de los km, así que es el término fijo, no el que multiplica a $k$".
- **Signo invertido**: en procesos que decrecen (tanque que pierde 4 L/h) el distractor usa $+4t$; nombrar que la cantidad baja, así que $m < 0$.
- **Sumar en lugar de multiplicar** (o viceversa): confundir una tasa por unidad con un monto único.
- **Raíz**: error de despeje de signo al resolver $mx + b = 0$; distractor con el signo cambiado o dividido al revés (mismo orden de magnitud, ver §Distractores del `authoring-context.md`).

### Reglas específicas
- **Montos con `\$` escapado** siempre (en JSON `\\$`).
- **Mostrar solo la forma final** de la fórmula en el enunciado; el paso intermedio va en la `explanation`.
- **Cierres sin humor**: acá están los 7 em-dash con remate de chiste ("la moto funciona al revés"). Reescribir a advertencia del intercambio $m \leftrightarrow b$ o del signo.

---

## GRAF, 50 ítems

### Qué evalúa
Leer una recta desde su gráfico: **ordenada al origen** (bajada de bandera, valor inicial), **pendiente** (costo por km, ritmo), raíz, comparación de dos valores, y el caso de pendiente cero (abono fijo). Los 50 tienen `graph_fn`.

### Cardinalidad
- **4 opciones**, mezcla de descripciones cortas de contexto y valores numéricos leídos del gráfico.

### `feedback_incorrect`, confusiones fuente
- **Pendiente ↔ ordenada al origen**: responder "el costo por km" cuando se pregunta por el punto donde la recta corta el eje vertical, o al revés. Describir qué parte del gráfico releer ("mirá el valor en $x = 0$", "mirá cuánto sube por cada paso a la derecha").
- **Leer la variable equivocada del contexto**: dar la distancia máxima o "el km donde se duplica" cuando se pide el valor inicial.
- **Pendiente cero**: creer que ir más veces cambia el total cuando la recta es horizontal.

### Reglas específicas
- **Formato limpio ya existente**: GRAF es la referencia de estilo (sin `\n\n±$$`, sin viñetas). Conservarlo.
- **Cierres**: revisar los remates humorísticos (p. ej. el del abono fijo) y pasarlos a advertencia/consejo.
- **1:1 en los gráficos**: pendientes con $|m| \leq 3$, `graph_view` cuadrado (ver `authoring-context.md` §Gráficos).

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 4 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: array del largo de `options`, `null` en el correcto, una pista descriptiva por distractor
- [ ] Ningún `\n\n` pegado a un bloque `$$...$$` (un solo `\n`)
- [ ] Ninguna explicación con viñetas `•` ni sub-ítems `-`: todas en 3 párrafos de prosa
- [ ] Ningún em-dash `—` ni en-dash `–` en ningún campo
- [ ] Cierres de `explanation` en advertencia/consejo, sin humor ni antropomorfismo
- [ ] `correct_index` variado, no concentrado en un solo índice
- [ ] Montos con `\$` escapado

**LEXI:**
- [ ] 50 ítems; negrita en primera mención de `pendiente`/`ordenada al origen`/`dominio`/`imagen`
- [ ] Conceptuales puros a 3 opciones cuando no hay una cuarta confusión real; numéricos a 4

**CLSF:**
- [ ] 50 ítems; clasificación de familia con las 4 opciones (Lineal/Cuadrática/Exponencial/Logarítmica)
- [ ] Contexto y pregunta separados por `\n\n`, pregunta con la magnitud nombrada
- [ ] Ningún enunciado traduce el porcentaje a multiplicador (no regalar la clasificación)

**FORM:**
- [ ] 50 ítems; forma final de la fórmula en el enunciado, paso intermedio en la explicación
- [ ] Distractores de $m \leftrightarrow b$ y signo presentes, del mismo orden de magnitud
- [ ] Los 7 cierres con em-dash reescritos a advertencia

**GRAF:**
- [ ] 50 ítems con `graph_fn`, `graph_view` cuadrado y $|m| \leq 3$
- [ ] Formato de prosa conservado (referencia de estilo)
- [ ] Cierres humorísticos pasados a advertencia/consejo
