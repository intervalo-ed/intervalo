# Convenciones de autoría de ejercicios

Guía viva de las características y correcciones que definimos para los ejercicios
del curso `analisis-1` (carpeta `content/analisis-1/exercises/*.json`). Cada
ejercicio es un objeto JSON; los campos y reglas de estilo están abajo.

> **Mantenimiento de esta guía:** cada vez que el usuario haga un cambio o
> sugerencia sobre el formato de los ejercicios, anotarlo acá en la sección
> correspondiente (o crear una nueva). Este documento es la fuente de verdad de
> las convenciones; mantenerlo al día sin que haga falta que lo pidan.

> Tras editar cualquier `exercises/*.json`: reseedear con
> `python seed_content.py --course analisis-1` desde `backend/`. Si cambian las
> skills de un tema, regenerar el catálogo del front con
> `bun run scripts/sync-catalog.ts` desde `web/`.

---

## Campos del ejercicio

| Campo | Regla |
|-------|-------|
| `external_id` | `white_<topic>_<skill>_<NN>`, único en TODO el curso. |
| `belt`, `topic`, `exercise_type` | identifican la unidad (skill = `exercise_type`). |
| `question` | enunciado. Ver formato de párrafos abajo. |
| `options` | exactamente **4** opciones. |
| `correct_index` | índice (0–3) de la correcta. |
| `feedback_correct` | **corto**, 1 oración. |
| `feedback_incorrect` | **siempre `""`** (no se usa). |
| `explanation` | texto del botón "¿Por qué?". Párrafos cortos, ≤4 renglones en celular. Arranca por la definición abstracta y después la aplica al problema. |
| `has_math` | `true` si hay LaTeX. |
| `graph_fn`, `graph_view` | ver sección Gráficos. `null` si no hay gráfico. |
| `reviewed` | `false` hasta revisión manual. |

---

## Formato de párrafos (legibilidad en celular)

`MathText` usa `whitespace-pre-line`, así que `\n` = salto de línea y `\n\n` =
línea en blanco.

- **Entre dos párrafos de prosa** (dos ideas completas) → `\n\n` (línea en
  blanco). Aplica tanto a `question` como a `explanation`.
- **Pegado a una fórmula centrada `$$...$$`** (antes o después) → un solo `\n`.
  La fórmula pertenece a la oración que la rodea y KaTeX displayMode ya agrega
  margen vertical; una línea en blanco ahí se ve demasiado separada.

### Planteos de GRAF: contexto en dos párrafos

En los enunciados con gráfico, separar el **contexto** en dos párrafos cuando hay
dos oraciones distintas (situación + qué muestra el gráfico, o qué muestra +
detalle extra), y la **pregunta** va en un tercer párrafo:

```
Un remis cobra una tarifa fija al subir al auto, más un monto por kilómetro recorrido.

La gráfica muestra el costo total, en cientos de pesos, según los kilómetros.

¿Qué representa el valor donde la recta toca el eje vertical?
```

Si el contexto es una sola oración, queda en un párrafo + la pregunta.

---

## Redacción del enunciado

- **Sin paréntesis** para aclaraciones: usar coma + "es decir" / "o sea" / guion.
  Los `:` de notación matemática sí van, pero dentro de LaTeX.
- **Sin dos puntos `:` en la prosa**: preferir `.` o `,`.
- **"transforma"**: referirse a la función como "la regla que transforma
  [entradas] en [salidas]". NUNCA usar la flecha `A → B` en prosa (solo en la
  fórmula centrada).
- Situación cotidiana concreta + pregunta puntual (no "¿qué significa X?").
- **Contexto y pregunta en párrafos separados**: cuando el enunciado tiene una
  oración de contexto seguida de la pregunta, separarlas con `\n\n` (línea en
  blanco). Nunca pegarlas en un mismo renglón.
  - ❌ `El costo incluye costo fijo más costo por unidad. ¿Qué familia?`
  - ✅ `Una fábrica tiene un costo fijo de \$5000 más \$10 por cada unidad
    producida.\n\n¿Qué familia de función modela el costo total de producción?`
- **Ejercicios de comparación entre dos objetos matemáticos**: siempre incluir las
  fórmulas concretas en el enunciado, no solo la referencia abstracta. El alumno
  necesita ver los valores de $a$, $b$, $c$ para poder comparar.
  - ❌ `Entre dos parábolas, ¿cuál se ve más abierta?` (no hay fórmulas → no hay nada que comparar)
  - ✅ `Considerá las dos parábolas\n$$p(x) = 0{,}2x^2 - 3 \qquad q(x) = 4x^2 - 3$$\n¿Cuál de las dos se ve más abierta?`
  - Aplica a cualquier comparación de funciones (pendientes, valores de $a$, imágenes, etc.).
- **Preguntas auto-contenidas, nunca telegráficas**: la pregunta debe nombrar la
  magnitud concreta que se evalúa, no abreviar a una muletilla. `¿Qué familia?` /
  `¿Qué tipo?` son inadmisibles — el usuario no debería tener que releer el
  contexto para saber qué se le pregunta.
  - ❌ `¿Qué familia?`
  - ✅ `¿Qué familia de función describe el sueldo total en función de las ventas?`
- Distractores = confusiones clásicas (inyectividad, codominio↔imagen,
  dominio↔imagen, cardinalidad, etc.).
- **Sin pistas en las opciones**: la opción correcta no debe llevar una glosa
  aclaratoria entre paréntesis que las distractoras no tengan — delata la
  respuesta. Ej.: `Lineal (constante)` → `Lineal`; `$\mathbb{R}$ (siempre
  creciente)` → `$\mathbb{R}$`.
- **"Cuadrática" y "Polinómica" no pueden convivir en la misma grilla**: si la
  respuesta correcta es `Cuadrática`, ninguna de las otras opciones puede ser
  `Polinómica de grado N` (porque toda cuadrática es un polinomio, así que la
  opción polinómica no sería incorrecta — solo imprecisa, lo que genera
  ambigüedad). Elegir como distractor una familia claramente distinta
  (Lineal, Exponencial, Logarítmica, Racional). La regla aplica en espejo:
  si la respuesta correcta es `Polinómica`, no ofrecer `Cuadrática` como
  distractor porque la cuadrática pertenece a esa familia.
- Toque de humor en las explicaciones, sin pasarse.
- **Sin nombres propios**: ni en el enunciado, ni en la explicación, ni en las
  opciones. Usar roles genéricos — "un vendedor", "una empresa", "un estudiante",
  "un puesto de limonada", "un remis", etc. Los nombres propios personalizan
  innecesariamente y pueden generar sesgos o distracciones.
- **Dos fórmulas en un mismo bloque `$$`**: nunca usar `\qquad` para poner dos
  funciones en la misma línea display — en mobile se corta. Usar dos bloques
  `$$` separados, cada uno en su propia línea:
  - ❌ `$$f(x) = 3x^2 + 1 \qquad g(x) = 0{,}5x^2 + 1$$`
  - ✅ `$$f(x) = 3x^2 + 1$$\n$$g(x) = 0{,}5x^2 + 1$$`
- **Fórmulas largas**: no mostrar pasos intermedios dentro de un bloque `$$` en
  el enunciado. Si la fórmula desarrollada no entra en una línea mobile, mostrar
  solo la forma final simplificada. El paso intermedio puede ir en la explicación.
  - ❌ `$$I(p) = p(80 + 4(10 - p)) = p(120 - 4p)$$` (overflow en mobile)
  - ✅ `$$I(p) = 120p - 4p^2$$`
- **Opciones "Otra/Otra2/Otra3"**: marcador de ejercicio incompleto. Nunca
  llegar a reseed con opciones placeholder — el ejercicio no puede presentarse
  al usuario sin distractores reales.

---

## LaTeX y signo `$`

- Inline: `$...$`. Display centrado: `$$...$$`.
- **Dinero**: el signo de pesos en prosa va **escapado** como `\$` (en el JSON:
  `\\$`). Si se usa `$` sin escapar para un monto, KaTeX lo toma como delimitador
  de fórmula y empareja con el siguiente `$`, rompiendo el render.
  - ❌ `es decir $400. ... a $200 cada uno` → KaTeX renderiza
    "400. ... a 200" como fórmula, sin espacios.
  - ✅ `es decir \$400. ... a \$200 cada uno`.
  - `MathText` soporta `\$` como dólar literal (lookbehind en el parser +
    `unescapeDollar`); ver `web/src/components/math-text.tsx`.

---

## Gráficos (`graph_fn`, `graph_view`)

El componente `web/src/components/math-graph.tsx` renderiza con **relación de
aspecto 1:1** (misma escala px/unidad en ambos ejes) y grilla cuadrada dinámica.

- **Pendientes legibles a 1:1**: `|m| ≤ 3`. Con 1:1, la inclinación visual es
  `atan(m)`; `m=3 → 71°`, todavía contable cuadrito a cuadrito. Pendientes
  grandes (ej. `m=15`) salen casi verticales e ilegibles.
- **`graph_view` cuadrado**: `[xmin, xmax, ymin, ymax]` con `xRange ≈ yRange`,
  para que el 1:1 no deforme el encuadre. Los puntos clave (ordenada, raíz, valor
  leído) deben caer dentro de la vista.
- Si un contexto cotidiano exige magnitudes dispares (temperatura 0–200 vs
  minutos 0–12), **rediseñar el ejercicio** con números chicos en vez de romper
  el 1:1.

### Qué lee cada GRAF por tema

| Tema | Foco del gráfico |
|------|------------------|
| `linear` | pendiente (signo/magnitud), ordenada al origen, raíz |
| `quadratic` | vértice, eje de simetría, raíces, concavidad |
| `polynomial` | grado/paridad por forma, raíces, extremos |
| `exponential` | crecimiento/decrecimiento, corte en $(0,1)$, asíntota horizontal |
| `logarithmic` | dominio $(0,\infty)$, corte en $(1,0)$, asíntota vertical |

---

## Patrón de modernización: tema `linear`

Tras modernizar 150 ejercicios del tema `linear` (50 LEXI + 50 CLSF + 50 FORM),
se documentan los patrones y contextos para referencia futura:

### LEXI (léxico, 50 ejercicios)
- **Mayoría abstracto/vocabulario puro**: nombre de parámetros ($m$, $b$), forma $f(x) = mx + b$,
  signo de $m$ → monotonía, dominio/imagen, raíz, casos especiales ($m = 0$).
- **Algunos con contexto liviano**: sueldo, saldo, tanque. Contexto ilustra el término sin forzar.
- **Sin modelado pesado**: la idea es que el usuario conozca las palabras clave antes de
  entender "por qué" una situación es lineal.

### CLSF (clasificación, 50 ejercicios)
- **Núcleo: "Qué modelan"** — dada una situación en palabras, decidir si es lineal.
  - Lineal: tasa constante (sueldo fijo + comisión, tanque pierde 5 L/min, abono + costo por GB).
  - No-lineal: tasa multiplicativa (interés compuesto → exponencial), área (x²) → cuadrática.
- **Distractores**: elegir familia equivocada (confundir lineal con cuadrática/exp/log).
- **Variante gráfica**: clasificar desde la forma visual (recta vs parábola vs curva).
- **Monotonía**: intervalo donde crece/decrece (respuesta: ℝ entero si $m ≠ 0$).
- **[CORREGIDO jun-2026]** Los CLSF con contexto cotidiano (clsf_11..20, 31..40)
  tenían la pregunta pegada al contexto y abreviada a `¿Qué familia?`. Se separó
  contexto/pregunta con `\n\n` y se reescribió cada pregunta nombrando la
  magnitud concreta (ver reglas en *Redacción del enunciado*).

### FORM (formulación, 50 ejercicios)
- **Núcleo: "Armar la fórmula desde enunciado"** — extraer $m$ (tarifa/pendiente) y $b$ (costo fijo)
  de una situación cotidiana, escribir $f(x) = mx + b$.
  - Taxi: "500 fijo + 200/km" → $C(k) = 500 + 200k$ (ojo: $m = 200$, $b = 500$).
  - Tanque: "60 L, pierde 4 L/h" → $V(t) = 60 - 4t$ (ojo: $m = -4$).
  - Distractores: confundir $m$ ↔ $b$, signo invertido, sumar en lugar de multiplicar.
- **Variante gráfica**: leer ecuación desde gráfico (pendiente = "sube X por cada 1 en X", intercepto Y).
- **Raíz y imagen**: resolver $f(x) = 0$, imagen sobre dominio restringido $[a, b]$.

### Biblioteca de contextos (reutilizable, variar números)
Taxi/remis, plomero/gasista, sueldo fijo + comisión, abono celular + GB,
factura luz/gas, alquiler bici/auto por hora, suscripción + costo por uso,
tanque llena/vacía a ritmo, nafta, ahorro mensual, saldo SUBE/tarjeta,
distancia a velocidad, descuento por cantidad, peso por libro.

**Montos**: siempre con `\$` escapado (en JSON: `\\$`).
**Gráficos**: respetar 1:1 (pendientes `|m| ≤ 3`).

### Diferencia LEXI vs CLSF vs FORM
- **LEXI**: "¿Cómo se llama esto?" → respuesta: palabra clave.
- **CLSF**: "¿A qué familia pertenece?" (fórmula o situación) → respuesta: familia.
- **FORM**: "Construye/lee la fórmula" → respuesta: ecuación $f(x) = mx + b$.

La **progresión natural es LEXI → CLSF → FORM**: primero vocabulario,
luego clasificar modelos cotidianos, luego armar las fórmulas.

---

## Patrón GRAF: tema `quadratic`

50 GRAF cotidianos (`white_quadratic_graf_01..50`) que modelan fenómenos con un **punto óptimo**.
Cuatro focos del tema: **vértice, eje de simetría, raíces, concavidad**.

### Regla de gráfico (análogo de `|m|≤3` de lo lineal)
Las parábolas crecen rápido y con render 1:1 se van de la vista; si las raíces quedan fuera del
encuadre, la curva "flota" y no se interpreta (le pasó al ejercicio del corral, ya corregido).

- **Coeficiente líder chico**: `|a| ≤ 0.5` (típico `±0.25`, `±0.5`). Parábola suave.
- **Forma vértice al autorar**: `a*pow(x-h,2) + k`, para ubicar vértice y raíces a propósito.
- **`graph_view` cuadrado con el arco completo dentro**. Abajo (máximo): vértice arriba-centro y las
  dos raíces sobre el eje. Arriba (mínimo): el valle entero, vértice abajo-centro. Vista `[-1,11,-1,11]`
  o `[-1,13,-1,13]` si el span llega a 12.
- Vértice, raíces y el valor leído en coordenadas legibles (enteros o medios).

### Modelado
- **Máximo (cóncava abajo, `a<0`):**
  - *Tiro/proyectil* (en el tiempo): pelota, globo de agua, fuegos artificiales, clavadista, golf, salto.
  - *Arco/chorro* (en el espacio, $x$ = distancia): tiro libre, manguera, salto de moto, delfín.
  - *Optimización-máximo*: precio→ganancia, velocidad→rendimiento, mesas→ganancia, recaudación.
- **Mínimo (cóncava arriba, `a>0`):** cable/guirnalda colgando (punto más bajo), rampa en U de skate,
  temperatura de la madrugada (hora más fría), nivel de un río en sequía, costo medio, velocidad en una
  curva. El valle queda por encima del eje → estos **no** usan raíces/duración.

### Arquetipos de pregunta
Vértice-y (valor máx/mín) · vértice-x (cuándo/dónde el óptimo) · concavidad (máx o mín → signo de `a`) ·
raíz (toca el suelo, solo abajo) · duración/dos raíces (solo abajo) · eje de simetría (misma altura dos
veces) · lectura $f(v)$ · sube vs baja (crece antes del vértice, decrece después) · ordenada al origen
`c` (valor de partida, $f(0)$).

**Los mínimos (cóncava arriba) NO usan raíces ni duración**: el valle queda por encima del eje → la
parábola nunca toca el cero. Los arquetipos válidos para arriba son: vértice-y, vértice-x, concavidad,
lectura f(v), eje de simetría, sube vs baja.

### Estado actual `white_quadratic_graf_*` (junio 2026)

50 GRAF completos (`graf_01..50`). Distribución:

| Familia | Concavidad | Cant. |
|---------|-----------|:-----:|
| Tiro / proyectil (en el tiempo) | abajo | 22 |
| Arco / chorro (en el espacio) | abajo | 9 |
| Optimización — máximo | abajo | 9 |
| Mínimos (cable, temperatura, rampa, río, costo…) | **arriba** | **10** |

Los 9 arquetipos están cubiertos al menos una vez. Los tres que faltaban al arrancar (duración/dos
raíces, sube-vs-baja, valor de partida `c`) se incorporaron en `graf_11..50`.

**Lección del corral (graf_08 original):** la función `-1*pow(x-2,2)+4` con `a=-1` dejaba las raíces al
borde de la vista y la curva parecía flotar sin contexto. Se reemplazó por limonada con `a=-0.5` y vista
`[-1,11,-1,11]`. Regla de oro: verificar numéricamente que las dos raíces (para abajo) caen dentro del
`graph_view` antes de cerrar el ejercicio.

---

## Patrón de modernización: tema `quadratic` (LEXI / CLSF / FORM)

Completado en junio 2026. Los cuatro skills quedan en **50 ejercicios cada uno** (`white_quadratic.json`, 200 total).

### Eje conceptual

Una cuadrática aparece cuando hay un **punto óptimo** (máximo o mínimo):

| Señal en el enunciado | Familia |
|-----------------------|---------|
| "área" / "producto de dos longitudes" / "lado²" | cuadrática |
| "sube y después baja" / "máximo / mínimo" | cuadrática |
| "tiro / caída libre / gravedad" | cuadrática |
| "precio × cantidad vendida" con demanda decreciente | cuadrática |
| "tasa fija / por unidad / proporcional" | lineal |
| "porcentaje / se multiplica / bacterias / interés compuesto" | exponencial |
| "escala logarítmica / pH / Richter / rendimiento decreciente" | logarítmica |

El distractor más común: **lineal vs cuadrática** (tasa constante vs. producto de dos magnitudes lineales).

### Biblioteca de contextos (variar números, no repetir personajes)

Tiro/proyectil (pelota, globo de agua, clavadista), arco/chorro (manguera, tiro libre), optimización (precio→ganancia de entradas/librería/limonada), área (terreno, cantero, corral con perímetro fijo, pizza), caída libre, cable colgante, temperatura mínima nocturna. Montos con `\\$` en JSON. Sin nombres propios.

### Cobertura por skill (lo que cubrió cada uno)

**LEXI (50):** léxico abstracto y light: parábola, vértice, eje de simetría, raíces/ceros, ordenada al origen, concavidad, coeficiente principal, forma estándar/vértice/factorizada, imagen/dominio, máximo vs mínimo, raíz simple vs doble. Distractores: vértice↔raíz, eje de simetría↔eje y, dominio↔imagen.

**CLSF (50):** clasificar desde situación (cuadrática/lineal/exp/log), desde gráfico (parábola vs recta), monotonía por intervalos, concavidad desde el fenómeno (¿tiene máximo o mínimo?), imagen acotada por el vértice. Pregunta siempre auto-contenida con `\n\n` entre contexto y pregunta.

**FORM (50):**
- Leer a, b, c desde forma estándar (×6); eje de simetría -b/2a; f(0) = c.
- Forma vértice ↔ coordenadas en ambos sentidos; evaluar f(valor); encontrar raíces desde forma canónica.
- Forma factorizada ↔ raíces: leer raíces, escribir factorizada dadas las raíces, raíz doble.
- Armar fórmula desde cotidiano: área cuadrado, corral con perímetro fijo, tiro (h₀+v₀t−½gt²), ganancia = precio×cantidad, caída libre, chorro, optimización.
- Gráfico → fórmula (5 ejercicios con `graph_fn`/`graph_view`): vértice + signo de a + apertura.
- Evaluar y resolver: f(valor), ¿cuándo f(t)=0?, raíces desde forma estándar factorable, ecuación cuadrática desde contexto.

### Distractores frecuentes en FORM

- Signo de h en la forma vértice: raíz +3 → factor (x−3), no (x+3).
- c ≠ raíz: c es f(0), no donde la función se anula.
- b sin signo: −6 no es lo mismo que 6 en -b/2a.
- a>0 / a<0 invertido al leer apertura del gráfico.

---

## Patrón de modernización: tema `polynomial` (LEXI / CLSF / FORM / GRAF)

### Eje conceptual

Un polinomio de grado ≥ 3 aparece cuando hay **múltiples fases** — la función sube, baja y puede volver a subir:

| Señal en enunciado o gráfico | Tipo |
|------------------------------|------|
| "sube, baja, vuelve a subir" / múltiples picos | polinómica grado ≥ 3 |
| Forma **S** (un pico, un valle, extremos opuestos) | grado 3 |
| Forma **W / M** (dos valles / dos picos, extremos iguales) | grado 4 |
| "tasa fija, proporcional" | lineal |
| "un máximo / mínimo, curvatura única" | cuadrática |
| "porcentaje / multiplicativo" | exponencial |

**Señales gráficas:**
- Extremos en **misma dirección** → grado **par** (+ coef positivo: ambos arriba; negativo: ambos abajo).
- Extremos en **dirección opuesta** → grado **impar**.
- Raíz **simple** = cruza eje x; raíz **doble** = toca sin cruzar; raíz **triple** = cruza con inflexión.
- Máximo $n−1$ extremos locales para grado $n$.

### Biblioteca de contextos validados

Montaña rusa (perfil de altura), temperatura mensual o anual, caudal de río (estacionalidad), perfil de elevación de ruta serrana, ventas con múltiples temporadas. Sin nombres propios. Montos con `\\$`. Evitar: volumen de caja (cortes de esquinas), resistencia de materiales.

### Regla de convivencia Cuadrática / Polinómica

En CLSF: **nunca colocar "Cuadrática" y "Polinómica" en la misma grilla de 4 opciones.** Distractores para polinómica: Lineal, Exponencial, Logarítmica, Racional.

### Identidades notables en FORM

Incluidas en FORM polynomial (y algunos FORM quadratic):

| Identidad | Forma |
|-----------|-------|
| BCP | $(a\pm b)^2 = a^2 \pm 2ab + b^2$ |
| Diferencia de cuadrados | $(a+b)(a-b) = a^2-b^2$ |
| Cubo del binomio | $(a\pm b)^3 = a^3 \pm 3a^2b + 3ab^2 \pm b^3$ |
| Suma de cubos | $a^3+b^3 = (a+b)(a^2-ab+b^2)$ |
| Diferencia de cubos | $a^3-b^3 = (a-b)(a^2+ab+b^2)$ |

### Cobertura por skill (polynomial, 200 ejercicios)

**LEXI (50):** grado, coef. principal y su signo, término independiente = f(0), forma estándar vs factorizada, raíces/ceros (cantidad ≤ grado), multiplicidad (simple/doble/triple), dominio = ℝ, imagen (ℝ si impar; acotada si par), comportamiento en ±∞, extremos locales (máx n−1), paridad (polinomio par/impar), monotonía de x³, punto de inflexión, raíces complejas conjugadas, Teorema Fundamental. Identidades notables: BCP, diferencia cuadrados, cubo del binomio, suma/diferencia de cubos.

**CLSF (50):** desde fórmula (vs racional/radical/exponencial/logarítmica), desde gráfico (S=cúbica, W/M=cuártica, cambios de dirección), cotidiano (montaña rusa, temperatura, caudal), comportamiento en infinito (paridad y signo), imagen (acotada/ℝ), extremos locales e imagen según paridad, monotonía, distinguir racional (asíntota) de polinómica (no tiene). Grillas con `graph_fn` para 3 ejercicios.

**FORM (50):** coeficientes desde forma estándar, f(0) = término independiente, evaluar f(valor), grado del producto/suma, forma factorizada ↔ raíces (incluye raíz doble/triple), coeficiente principal en factorizada, gráfico → fórmula (5 ejercicios con `graph_fn`). Identidades notables: BCP (×8), diferencia de cuadrados (×2), cubo del binomio (×6), suma/diferencia de cubos (×4).

**GRAF (50):** *Tipo A (25)*: leer propiedades desde gráfico — raíces, grado (por forma S/W/M y extremos locales), signo coef. principal (por dirección de extremos), f(0) = intersección eje y, multiplicidad de raíz (cruza vs toca), imagen (acotada o ℝ), mínimo/máximo global (solo en par), extremos locales, monotonía, dominio. *Tipo B (15)*: identificar la fórmula entre 4 opciones dado el gráfico. *Tipo C (10)*: contexto cotidiano + gráfico (montaña rusa, temperatura, caudal, ruta serrana, ventas).

### `graph_fn` para GRAF polynomial

Sintaxis mathjs; escalar para que raíces y extremos sean visibles en la ventana cuadrada:

```
Cúbicas:
  x*(x-2)*(x+2)/4           # raíces -2,0,2  coef+
  -x*(x-2)*(x+2)/4          # raíces -2,0,2  coef-
  pow(x,3)/8                 # raíz triple en 0, globalmente creciente
  -pow(x,3)/8                # raíz triple en 0, globalmente decreciente
  pow(x,2)*(x-3)/5           # raíz doble en 0, simple en 3

Cuárticas:
  (pow(x,2)-1)*(pow(x,2)-4)/4    # raíces ±1,±2  coef+  (W)
  -(pow(x,2)-1)*(pow(x,2)-4)/4   # raíces ±1,±2  coef-  (M)
  (pow(x,2)-1)*(pow(x,2)-9)/8    # raíces ±1,±3  coef+
  pow(x+2,2)*pow(x-2,2)/16       # raíces dobles en ±2
```

---

## Patrón de modernización: tema `exponential` (LEXI / CLSF / FORM / GRAF)

### Eje conceptual

Una exponencial aparece cuando el cambio es **proporcional al valor actual** — crecimiento o decaimiento en porcentaje fijo por período:

| Señal en el enunciado | Familia |
|-----------------------|---------|
| "se duplica cada período" / "crece un X% por año" | exponencial creciente |
| "se reduce a la mitad" / "pierde el X% anual" | exponencial decreciente |
| "tasa fija por unidad / suma constante" | lineal |
| "un máximo / mínimo, curvatura única" | cuadrática |
| "múltiples picos / fases" | polinómica |
| "escala logarítmica / pH / Richter" | logarítmica |

**Diferencia cotidiana clave:** "suma \\$500 por mes" → lineal; "crece un 10% mensual" → exponencial.

### Biblioteca de contextos validados

Bacterias que se duplican, interés compuesto, depreciación de un auto, desintegración radiactiva (vida media), enfriamiento de un objeto (Newton), propagación de usuarios/app. Montos con `\\$`. Sin nombres propios.

### Auditoría de los 36 originales (junio 2026)

- `feedback_incorrect` estaba lleno en los 36 → vaciado a `""` en batch.
- `clsf_13` tenía pista en la opción correcta `(siempre creciente)` → eliminada.
- `clsf_01`, `clsf_05`, `clsf_08` sin párrafo de contexto → se agregó intro.
- `graph_view` no cuadrado en 7 ejercicios → se ajustaron bases y vistas.

### Cobertura por skill (exponential, 200 ejercicios)

**LEXI (50):** forma canónica $f(x) = a \cdot b^x$, dominio $\mathbb{R}$, imagen $(0,+\infty)$, asíntota horizontal, monotonía según base, $f(0)=a$, tasa de crecimiento ($r = b-1$), período de duplicación, vida media, número de Euler $e$, transformaciones (desplazamiento horizontal/vertical, reflexión), propiedades algebraicas, inyectividad, inversa (logaritmo), sin raíces reales, comparación de bases, comportamiento en $\pm\infty$.

**CLSF (50):** desde cotidiano (bacterias, interés, depreciación, enfriamiento), desde fórmula (formas transformadas), desde gráfico (asíntota desplazada, creciente vs decreciente, distinguir de logarítmica), imagen con desplazamiento, monotonía global, sin extremos locales. Distractor frecuente: **Exponencial ↔ Logarítmica**.

**FORM (50):** armar fórmula desde cotidiano ($B(t)=P_0 \cdot 2^t$, $M(t)=C(1+r)^t$, $V(t)=V_0(1-r)^t$), leer $a$ y $b$, evaluar $f(\text{valor})$, determinar $a$ y $b$ desde dos puntos, desplazamiento vertical, propiedades algebraicas, 5 ejercicios leer-desde-gráfico con `graph_fn`.

**GRAF (50):** *Tipo A (25)*: leer propiedades — creciente/decreciente, asíntota, $f(0)$, imagen, raíces, $f(1)$ para leer base, comportamiento en $\pm\infty$. *Tipo B (15)*: identificar la fórmula. *Tipo C (10)*: contexto cotidiano (bacterias, inversión, depreciación, enfriamiento, usuarios).

### `graph_fn` para GRAF exponential

Sintaxis mathjs. Usar bases ≈ 1,5 o escalar para fit cuadrado:

```
Crecientes:
  pow(1.5, x)              [-5,5,-0.5,8.5]    # base 1.5, f(0)=1
  pow(2, x)                [-4,4,-0.5,8.5]    # base 2
  exp(x)                   [-3,5,-0.5,8.5]    # base e
  2 * pow(1.5, x)          [-5,5,-0.5,10]     # a=2, f(0)=2
  3 * pow(2, x)            [-4,3,-0.5,10]     # a=3, f(0)=3

Decrecientes:
  pow(0.5, x)              [-4,4,-0.5,8.5]    # base 0.5
  pow(0.7, x)              [-6,4,-0.5,8.5]    # decae suave
  3 * pow(0.6, x)          [-4,6,-0.5,10]     # a=3

Con desplazamiento vertical:
  pow(2, x) + 2            [-4,4,-0.5,9.0]    # asíntota y=2, f(0)=3
  pow(0.5, x) + 1          [-4,6,-0.5,9.0]    # asíntota y=1, decreciente
  pow(2, x) - 1            [-4,5,-1.5,8.5]    # asíntota y=-1, tiene raíz en x=0
```

---

## Pendientes / bugs conocidos

- **[CORREGIDO] Render de `$` de pesos**: montos con `$` sin escapar rompían
  KaTeX. Solución: `\$` en contenido + soporte de escape en `MathText`. Revisar
  que ningún ejercicio nuevo use `$` sin escapar para dinero.
- Las **sesiones cachean** el contenido del ejercicio al construirse
  (`session_store.py`), en memoria. Tras reseedear, las sesiones ya abiertas
  siguen con el snapshot viejo; arrancar una sesión nueva para ver cambios.
