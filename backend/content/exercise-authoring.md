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
- Distractores = confusiones clásicas (inyectividad, codominio↔imagen,
  dominio↔imagen, cardinalidad, etc.).
- **Sin pistas en las opciones**: la opción correcta no debe llevar una glosa
  aclaratoria entre paréntesis que las distractoras no tengan — delata la
  respuesta. Ej.: `Lineal (constante)` → `Lineal`; `$\mathbb{R}$ (siempre
  creciente)` → `$\mathbb{R}$`.
- Toque de humor en las explicaciones, sin pasarse.

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

## Pendientes / bugs conocidos

- **[CORREGIDO] Render de `$` de pesos**: montos con `$` sin escapar rompían
  KaTeX. Solución: `\$` en contenido + soporte de escape en `MathText`. Revisar
  que ningún ejercicio nuevo use `$` sin escapar para dinero.
- Las **sesiones cachean** el contenido del ejercicio al construirse
  (`session_store.py`), en memoria. Tras reseedear, las sesiones ya abiertas
  siguen con el snapshot viejo; arrancar una sesión nueva para ver cambios.
