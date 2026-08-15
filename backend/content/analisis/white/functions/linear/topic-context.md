# Topic: linear (funciones lineales)

Belt: `white`, Unit: `functions`, Topic: `linear`

Skills en este topic: `LEXI` (30), `FORM` (30), `GRAF` (30). 90 ejercicios en total.

> **CLSF archivado (jul-2026):** se sacó de este topic al podar a un máximo de 3 ítems (skills) por topic. Contenido preservado en `backend/content/archive/analisis/white/functions/linear/CLSF.json`. No generar CLSF para este topic en rondas futuras; el resto de este documento puede seguir mencionando CLSF en registros de auditoría históricos, que quedan como referencia, no como guía de generación.

**Estado.** Los ejercicios (enunciados, opciones y respuestas correctas) están validados y se conservan. Este documento especifica lo que falta para dejar el tema al día con las convenciones actuales:

1. **Correcciones de formato** pendientes (defectos sistémicos del estilo viejo) en LEXI y FORM (60 ejercicios).
2. **`feedback_incorrect`** que falta en los 60 ejercicios de LEXI y FORM (hoy todos con `""`). GRAF ya tiene los 10 completos (regenerado ago-2026, ver sección GRAF).
3. **Distribución objetivo** de cada skill, para preservarla en cualquier refactor.

No se pide reescribir los problemas: se pide corregir el formato, sumar los feedback y no romper la distribución.

---

## Correcciones de formato transversales (los 3 skills activos; CLSF archivado, ver nota arriba)

Defectos detectados en la auditoría (jul-2026). Aplicar a todos los ejercicios afectados.

1. **`\n\n` pegado a bloques `$$...$$`** (LEXI 29, CLSF 27, FORM 32 ejercicios). Viola la regla crítica 2 del `authoring-context.md`: las fórmulas display van con **un solo `\n`** antes y después, nunca `\n\n`. KaTeX ya agrega su propio margen; el doble salto abre un hueco vertical.
   - ❌ `escribirse en la forma:\n\n$$f(x) = mx + b$$\n\ndonde $m$ y $b$...`
   - ✅ `escribirse en la forma\n$$f(x) = mx + b$$\ndonde $m$ y $b$...`
   - El `:` que colgaba antes del `$$` se saca (o se deja como cierre de la frase, pero sin `\n\n`).
2. **Explicaciones con viñetas `•` y sub-viñetas `-`** (LEXI 13, CLSF 23, FORM 10). Es el estilo viejo. Reescribir a la **estructura de 3 párrafos de prosa** (concepto general → aplicación al caso → cierre útil), separados por `\n\n`. Sin listas con `•`, sin sub-ejercicios con `-`.
   - ❌ `• $m$ es la pendiente — mide la inclinación.\n• $b$ es la ordenada...`
   - ✅ Prosa: `El parámetro $m$ es la **pendiente** y $b$ es la **ordenada al origen**...`
3. **Em-dash `—` y en-dash `–`** (FORM 7, LEXI 1). Prohibidos (regla crítica 6). Reemplazar por `,`, `:`, `;` o `.`. Aparecen sobre todo como separador de viñeta y en los cierres humorísticos.
4. **Cierres con humor o antropomorfismo** (FORM y GRAF). El cierre de la `explanation` debe ser **advertencia del error típico o consejo práctico**, en voz neutra (regla crítica 7). Reemplazar los remates tipo chiste:
   - ❌ `la moto funciona al revés`, `la bicicleta no lo merece`, `probablemente sin luz igual`, `el que va una vez paga igual que el que vive ahí`.
   - ✅ Advertencia: `El error frecuente es intercambiar la tarifa por km con la bajada de bandera: la que multiplica a la variable es la pendiente.`
5. **`GRAF` es la referencia de estilo.** Es el único skill sin `\n\n±$$`, sin viñetas y sin em-dash. Al reescribir LEXI/CLSF/FORM, calcar su formato de prosa. Lo único a revisar en GRAF son los cierres humorísticos (punto 4).

**Además de formato:**
- **`correct_index` muy sesgado a un índice** (CLSF: 35/50 en índice 1; LEXI: 28/50 en índice 1). El runtime baraja igual, pero como fuente dificulta auditar pistas delatoras. Al pasar por refactor, variar el índice correcto.
- **Cardinalidad** (ver por skill). LEXI y FORM tienen 4 opciones en los 60 ejercicios. Está bien donde la respuesta es numérica o hay 4 confusiones reales (clasificación de familia); revisar los conceptuales puros con solo 3 distractores plausibles. GRAF (10, regenerado) también usa 4 opciones.

---

## `feedback_incorrect`, falta en los 60 ejercicios de LEXI y FORM

En LEXI y FORM todos son `""` todavía. Completar con un `array<string|null>` paralelo a `options`, mismo largo, `null` en el índice correcto. Voz **descriptiva del concepto**, nunca acusatoria (`"confunde X con Y"` prohibido; ver `authoring-context.md` §Pistas). Una oración por distractor, autosuficiente. Las confusiones fuente por skill están en cada sección. GRAF ya tiene esto resuelto en los 10 ejercicios regenerados.

---

## LEXI, 30 ejercicios

### Qué evalúa
Vocabulario y parámetros de la recta: forma canónica $f(x) = mx + b$, identificar **pendiente** $m$ y **ordenada al origen** $b$ desde la fórmula, signo de $m$ y monotonía, raíz, dominio e imagen, casos especiales ($m = 0$ constante). Mezcla de ejercicios de identificación numérica (leer $m$ o $b$) y conceptuales (nombrar el parámetro, describir monotonía).

### Distribución objetivo

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`. Conteo verificado leyendo los 30 ejercicios actuales de `LEXI.json` (recorte proporcional ~0.6x desde la distribución de 50, jul-2026):

| Concepto | Slug | Cantidad actual |
|----------|------|-----------------:|
| Identificación de fórmula (es/no es lineal, otras familias) | `identificacion-formula` | 6 |
| Dominio e imagen (natural o restringido) | `dominio-imagen` | 5 |
| Propiedades generales (visual, existencia de raíz, tasa de cambio, sin extremos, rectas por puntos) | `propiedades-generales` | 4 |
| Nombrar parámetros/vocabulario (pendiente, ordenada, constante, raíz) | `nombre-parametros` | 4 |
| Monotonía y signo de la pendiente | `monotonia-signo-pendiente` | 3 |
| Parámetros $m$/$b$ leídos en contexto cotidiano | `parametros-contexto` | 3 |
| Pendiente, cálculo directo | `pendiente-calculo` | 2 |
| Raíz, cálculo directo | `raiz-calculo` | 2 |
| Ordenada al origen, cálculo directo | `ordenada-calculo` | 1 |
| **Total** | | **30** |

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

## FORM, 30 ejercicios

### Qué evalúa
Construir o leer la fórmula $f(x) = mx + b$ desde una situación: extraer la **pendiente** $m$ (tarifa por unidad, ritmo) y la **ordenada al origen** $b$ (costo fijo, valor inicial), armar la ecuación. Incluye raíz (resolver $f(x) = 0$), imagen sobre dominio restringido $[a, b]$, y 4 ejercicios que leen la ecuación desde un gráfico.

### Distribución objetivo

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`. Conteo verificado leyendo los 30 ejercicios actuales de `FORM.json` (recorte proporcional ~0.6x desde la distribución de 50, jul-2026):

| Concepto | Slug | Cantidad actual |
|----------|------|-----------------:|
| Armar fórmula desde situación cotidiana (costo, tanque, deuda, etc.) | `armar-formula-cotidiano` | 12 |
| Gráfico → fórmula | `grafico-a-formula` | 3 |
| Pendiente, cálculo directo | `pendiente-calculo` | 2 |
| Raíz, cálculo directo | `raiz-calculo` | 2 |
| Armar fórmula dados $m$ y $b$ | `armar-formula-mb` | 2 |
| Armar fórmula dados uno o dos puntos | `armar-formula-puntos` | 2 |
| Evaluar $f(\text{valor})$, abstracto o en contexto | `evaluar-f` | 2 |
| Leer un parámetro ($m$ o $b$) ya en contexto | `leer-parametro-contexto` | 1 |
| Ordenada al origen, cálculo directo | `ordenada-calculo` | 1 |
| Pendiente interpretada como tasa descrita en palabras | `pendiente-concepto-tasa` | 1 |
| Resolver la ecuación ($f(x) = k$) | `resolver-ecuacion` | 1 |
| Propiedades generales (identificar la decreciente) | `propiedades-generales` | 1 |
| **Total** | | **30** |

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

## GRAF, 30 ejercicios

> **Bug de contenido resuelto (ago-2026):** `GRAF.json` era una copia casi idéntica de `LEXI.json` (mismas preguntas, mismos `tags` de LEXI, sin `graph_fn`/`graph_view`), generada por error en el commit `a84de25f` ("regenerar white/functions/linear"). Se descartaron esos 30 ejercicios y se regeneraron 10 ejercicios genuinos de lectura de gráfico desde cero, con `graph_fn` real, usando como taxonomía los slugs de gráfico que ya estaban documentados acá como diseño pendiente. La cantidad bajó de 30 a 10 (en vez de podar 50→30 como el resto de la unidad) porque no había contenido real previo del que recortar proporcionalmente. **Completado a 30 (ago-2026, ronda 2):** se sumaron 20 ejercicios más siguiendo la misma taxonomía y el mismo estilo de prosa, alcanzando la paridad de cantidad con LEXI y FORM.

### Qué evalúa
Leer una recta desde su gráfico: valor puntual $f(a)$ dado $a$ (y a la inversa, qué $x$ da un $f(x)$ dado), **pendiente** (como tasa en contexto y como cociente entre dos puntos marcados), **ordenada al origen** (valor inicial), y raíz (agotamiento/vaciado en contexto). Los 30 llevan `graph_fn` y `graph_view` cuadrado, con $|m| \leq 2$ (ver `authoring-context.md` §Gráficos).

### Distribución objetivo

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`. Distribución aplicada a los 30 ejercicios:

| Concepto | Slug | Cantidad |
|----------|------|---------:|
| Lectura puntual: dado $x$, leer $f(x)$ en el gráfico | `lectura-y-dado-x` | 6 |
| Pendiente como tasa (abstracta o en contexto cotidiano) | `pendiente-tasa` | 6 |
| Ordenada al origen / valor inicial en contexto | `ordenada-origen-concepto` | 5 |
| Lectura inversa: dado $f(x)$, leer el $x$ correspondiente | `lectura-x-dado-y` | 5 |
| Raíz en contexto de agotamiento/vaciado | `raiz-agotamiento` | 4 |
| Pendiente calculada entre dos puntos marcados del gráfico | `pendiente-diferencia` | 4 |
| **Total** | | **30** |

### Cardinalidad
- **4 opciones**, mezcla de descripciones cortas de contexto y valores numéricos leídos del gráfico.

### `feedback_incorrect`, confusiones fuente
- **Pendiente ↔ ordenada al origen**: responder "el costo por km" cuando se pregunta por el punto donde la recta corta el eje vertical, o al revés. Describir qué parte del gráfico releer ("mirá el valor en $x = 0$", "mirá cuánto sube por cada paso a la derecha").
- **Confundir el dato con la incógnita**: en lectura inversa (dado $f(x)$, hallar $x$), responder el valor de $f(x)$ que ya daba el enunciado en vez del $x$ buscado.
- **Cociente de pendiente invertido**: calcular $\Delta x / \Delta y$ en vez de $\Delta y / \Delta x$ entre dos puntos marcados.
- **Confundir el valor inicial con el ritmo de cambio**, o con un valor leído en un instante posterior.

### Reglas específicas
- **Formato limpio**: sin `\n\n` pegado a `$$...$$`, sin viñetas, sin em-dash. Ya cumplido en los 30 ejercicios actuales; conservarlo en cualquier ejercicio nuevo.
- **Cierres**: advertencia/consejo, nunca humor ni antropomorfismo. Ya cumplido.
- **1:1 en los gráficos**: pendientes con $|m| \leq 2$, `graph_view` aproximadamente cuadrado (`xRange ≈ yRange`), ver `authoring-context.md` §Gráficos.
- **`feedback_incorrect` ya completo** en los 30 (a diferencia de LEXI/FORM, que todavía lo tienen vacío, ver sección de arriba).

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 3 skills activos):**
- [ ] `feedback_incorrect` completo: array del largo de `options`, `null` en el correcto, una pista descriptiva por distractor (LEXI y FORM pendientes, GRAF ya completo)
- [ ] Ningún `\n\n` pegado a un bloque `$$...$$` (un solo `\n`)
- [ ] Ninguna explicación con viñetas `•` ni sub-ejercicios `-`: todas en 3 párrafos de prosa
- [ ] Ningún em-dash `—` ni en-dash `–` en ningún campo
- [ ] Cierres de `explanation` en advertencia/consejo, sin humor ni antropomorfismo
- [ ] `correct_index` variado, no concentrado en un solo índice
- [ ] Montos con `\$` escapado

**LEXI:**
- [ ] 30 ejercicios; negrita en primera mención de `pendiente`/`ordenada al origen`/`dominio`/`imagen`
- [ ] Conceptuales puros a 3 opciones cuando no hay una cuarta confusión real; numéricos a 4

**FORM:**
- [ ] 30 ejercicios; forma final de la fórmula en el enunciado, paso intermedio en la explicación
- [ ] Distractores de $m \leftrightarrow b$ y signo presentes, del mismo orden de magnitud
- [ ] Los 7 cierres con em-dash reescritos a advertencia

**GRAF:**
- [x] 30 ejercicios (10 regenerados desde cero en ago-2026 + 20 sumados en la ronda siguiente), con `graph_fn`/`graph_view` reales, $|m| \leq 2$, `graph_view` aproximadamente cuadrado
- [x] `feedback_incorrect` completo en los 30
- [x] Formato de prosa limpio, cierres en advertencia/consejo

## Hallazgos de auditoría (ronda 6, ago-2026)

Pasada de redacción sobre los enunciados para llevarlos al estándar de las reglas 47-51: apertura que sitúa, fórmula centrada y pregunta `¿...?` en su propio tramo. Se reescribieron 45 enunciados entre `FORM.json`, `GRAF.json` y `LEXI.json`, con aperturas variadas ejercicio a ejercicio (regla 32) y sin imperativos de cálculo ni de atención. No hubo cambios de contenido matemático: solo se tocó el campo `question`.
