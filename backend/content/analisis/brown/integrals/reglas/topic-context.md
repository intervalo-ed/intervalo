# Topic: reglas (Reglas de integración)

Belt: `brown`, Unit: `integrals`, Topic: `reglas`

Skills en este topic: `FORM`, `ESTR`, `RESL`. **50 ítems cada uno (150 en total)** al cerrar el refactor.

**Estado.** Este tópico es el **primer sitio donde el alumno ejecuta cálculo integral final**. Se apoya en la anatomía y la linealidad que se fijaron en `definition` para aplicar la **tabla de integrales inmediatas** y resolver integrales que combinan sumas, restas y múltiplos escalares de funciones elementales.

**El cálculo con métodos** (sustitución, partes) queda **fuera de scope**: esos son los tópicos siguientes. Acá se aplica la tabla directamente, con al mucho una reescritura algebraica previa (heredada de `definition`).

Los `external_id` se generarán como `brown_reglas_form_01…`, `brown_reglas_estr_01…`, `brown_reglas_resl_01…`.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** todo el cinturón violet (derivadas completas: elementales, producto, cociente, cadena) + `definition` de integrales (anatomía, primitiva, linealidad, acondicionamiento algebraico previo). Del cinturón blue: **límites** y **continuidad**. Del cinturón white: **funciones** elementales y su comportamiento gráfico.
- **Lo que está aprendiendo acá:** las **fórmulas de integración inmediata** de las familias elementales:
  - **Potencia**: $\int x^n \, dx = \tfrac{x^{n+1}}{n+1} + C$ para $n \neq -1$.
  - **Caso especial $n = -1$**: $\int \tfrac{1}{x} \, dx = \ln|x| + C$.
  - **Exponencial base $e$**: $\int e^x \, dx = e^x + C$.
  - **Exponencial base $a$**: $\int a^x \, dx = \tfrac{a^x}{\ln a} + C$ (para $a > 0$, $a \neq 1$).
  - **Trigonométricas**: $\int \sin x \, dx = -\cos x + C$; $\int \cos x \, dx = \sin x + C$; $\int \sec^2 x \, dx = \tan x + C$.
  - **Constante**: $\int k \, dx = k x + C$.
  - Combinadas por **linealidad** (extraer escalares, separar sumas y restas).
- **Lo que NO sabe todavía:** **integración por sustitución** ($u$-sub), **integración por partes**, **integral definida** y su interpretación como área, **Teorema Fundamental del Cálculo**. Todo eso vive en tópicos posteriores.

### Regla dura

En este tópico se aplican **únicamente las fórmulas de la tabla + linealidad + reescritura algebraica previa**. Nada de métodos.

**Prohibido**:

- **Integración por sustitución** ($u$-sub): ni como respuesta, ni como distractor razonable, ni como paso implícito. Las integrales del tópico son **directas** (no requieren cambio de variable). Ninguna función compuesta en el integrando.
- **Integración por partes**: idem. Ningún $\int u \, dv$.
- **Integral definida** ($\int_a^b$), **área bajo la curva**, **TFC**: fuera de scope.
- **Exponentes irracionales** ($x^\pi$, $x^{\sqrt{2}}$): fuera. **Alcance de exponentes**: enteros positivos, enteros negativos (incluye caso especial $n = -1$ vía $\ln|x|$) y fraccionarios simples ($\tfrac{1}{2}$, $\tfrac{1}{3}$, $\tfrac{2}{3}$, $-\tfrac{1}{2}$, etc.).
- **Constante de integración $C$ omitida**: todo resultado que muestre una primitiva **sin** $+C$ es incorrecto. Esta regla vale en las respuestas correctas **y** aparece como distractor plausible ("olvidé la $C$") en al menos algunos ítems.
- **Valor absoluto omitido en $\ln$**: $\int \tfrac{1}{x} \, dx = \ln|x| + C$ **siempre** con valor absoluto. La versión sin valor absoluto ($\ln x + C$) queda como distractor plausible.
- **Familias trigonométricas raras**: $\csc^2 x$, $\sec x \tan x$, $\csc x \cot x$ están **fuera de scope** en este tópico (no forman parte del set básico universitario cubierto acá). El set es exactamente: $\sin x$, $\cos x$, $\sec^2 x$.

Los ítems que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 3 skills)

Reglas de authoring que se aplican al escribir los 150 ítems:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`, con enfoque **algorítmico**: (a) identificar la fórmula de tabla aplicable (o el paso previo de linealidad/reescritura si corresponde), (b) aplicar la fórmula usando `\begin{aligned}` cuando hay más de un término, (c) simplificar, agregar $+C$ y cerrar con advertencia técnica sobre el error común (signo del $-\cos x$, valor absoluto en $\ln$, coeficiente arrastrado, $C$ olvidada). Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (prohibido estricto)**, sin humor.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Contrastar el error común con el procedimiento correcto ("olvidaste el signo negativo de $\int \sin x \, dx$", "aplicaste la regla de la potencia con $n = -1$: hay una división por cero", "olvidaste el valor absoluto en $\ln|x|$", "no sumaste $+C$"). Voz descriptiva, segunda persona amable.
4. **Negrita en primera mención** de conceptos clave: **regla de la potencia**, **regla exponencial**, **regla del logaritmo**, **linealidad**, **tabla de integrales inmediatas**. Nunca negritas dentro de `options`.
5. **Variables inline** ($x$, $n$, $a$, $C$) en la prosa.
6. **Ortotipografía**: decimales con **coma** (`4,3`). Sin nombres propios.
7. **`correct_index` variado**, no concentrado en un solo índice.
8. **$+C$ obligatorio en toda respuesta correcta**, incluso en las opciones cortas de la grilla 2×2 de RESL. Si el límite de 35 caracteres pega contra $+C$, se acorta la expresión (por ejemplo, se usa fracciones compactas) pero **no se omite** $C$.

---

## FORM, 50 ítems

### Qué evalúa
**Consolidación de la memoria de la tabla de integrales inmediatas**, auditando el **reconocimiento inverso** (Sistema 1: reconocer de una la primitiva sin cálculo intermedio) y el **pensamiento inverso** (dada una función, decir qué se derivó para llegar a ella).

### Cardinalidad
**3 opciones por defecto**. **4 opciones** cuando los resultados numéricos son cortos y entran en grilla 2×2 (≤ 35 caracteres cada uno) — típicamente en sub-A cuando la respuesta es una primitiva compacta como `"$\\sin x + C$"`.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Reconocimiento directo de antiderivadas | Preguntar directamente por la primitiva de una función elemental de la tabla. Ejemplos: $\int \cos x \, dx = \sin x + C$; $\int e^x \, dx = e^x + C$; $\int \sec^2 x \, dx = \tan x + C$; $\int \sin x \, dx = -\cos x + C$; $\int \tfrac{1}{x} \, dx = \ln|x| + C$. Set cubierto: $x^n$, $\tfrac{1}{x}$, $e^x$, $a^x$, $\sin x$, $\cos x$, $\sec^2 x$, **constante**. | `reconocimiento-directo-antiderivadas` | 25 |
| B. Identificación inversa de la derivada | Forzar el pensamiento inverso: "¿Qué función al derivarse da $\tfrac{1}{x}$?" (respuesta: $\ln|x| + C$). "¿Qué función al derivarse da $e^x$?" (respuesta: $e^x + C$). Refuerza que la integración es la **operación inversa** de la derivación. | `identificacion-inversa-derivada` | 25 |

### `feedback_incorrect`, confusiones fuente

- **Signo perdido en $\int \sin x \, dx$**: dar $\cos x + C$ en vez de $-\cos x + C$. La primitiva de $\sin$ lleva **signo negativo**, porque $(-\cos x)' = \sin x$.
- **Signo agregado a $\int \cos x \, dx$**: dar $-\sin x + C$ en vez de $\sin x + C$. La primitiva de $\cos$ es $\sin$ sin signo, porque $(\sin x)' = \cos x$.
- **Regla de la potencia aplicada a $\tfrac{1}{x}$**: intentar $\int x^{-1} \, dx = \tfrac{x^0}{0}$, dividiendo por cero. El caso $n = -1$ es la **excepción** de la regla de la potencia; su primitiva es $\ln|x| + C$.
- **Valor absoluto omitido en $\ln$**: dar $\ln x + C$ en vez de $\ln|x| + C$. El valor absoluto respeta el dominio de $\tfrac{1}{x}$ (que incluye $x < 0$).
- **Base $a$ vs base $e$ confundidas**: dar $\int a^x \, dx = a^x + C$ (versión de $e^x$) en vez de $\tfrac{a^x}{\ln a} + C$. La base $e$ es el único caso donde la primitiva coincide con el integrando.
- **Constante de integración olvidada**: dar $\sin x$ (sin $+C$) como respuesta a $\int \cos x \, dx$. La primitiva incluye siempre la familia $+C$.
- **Regla de la potencia mal aplicada**: subir el exponente en $1$ pero olvidar dividir por el nuevo exponente ($\int x^n \, dx = x^{n+1} + C$ en vez de $\tfrac{x^{n+1}}{n+1} + C$), o dividir por el exponente original ($\tfrac{x^{n+1}}{n} + C$).
- **Constante confundida con variable en $\int e^2 \, dx$**: dar $\tfrac{e^3}{3} + C$ (aplicando regla exponencial o de la potencia) en vez de $e^2 x + C$. $e^2$ es una **constante numérica**, no una función de $x$.

### Reglas específicas
- **Sin cálculo intermedio complejo**: FORM es reconocimiento directo, no combinación de reglas.
- **Sub-A** con opciones cortas (típicamente ≤ 35 caracteres) que permiten grilla 2×2 → 4 opciones cuando entran; 3 en otro caso.
- **Sub-B** con opciones tipo "$\\ln|x| + C$", "$\\ln x + C$" (para auditar el valor absoluto), "$-\\tfrac{1}{x^2} + C$" (aplicar regla de la potencia con $n = -1$, error).
- **Restricciones de dominio** mencionadas en las opciones cuando aplique (ej. $\ln|x|$ vs $\ln x$).
- **Negrita en primera mención** de `tabla de integrales inmediatas`, `regla de la potencia`, `regla exponencial`, `regla del logaritmo`.

---

## ESTR, 50 ítems

### Qué evalúa
**Detección de trampas visuales, constantes disfrazadas y discriminación de familias** antes de aplicar la fórmula. Bloquea el impulso automático de "integrar todo lo que parece $x$" o de "confundir potencia con exponencial por el símbolo $e$". Sin cálculo numérico final.

### Cardinalidad
**Exactamente 3 opciones** por ítem.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Constantes engañosas | Diferenciar **números fijos** de **variables**. Bloquear el impulso de aplicar reglas de funciones a constantes numéricas. Ejemplos: $\int \pi \, dx = \pi x + C$; $\int e^2 \, dx = e^2 x + C$; $\int \ln 5 \, dx = (\ln 5) x + C$. Todas se resuelven con la regla de la constante ($\int k \, dx = kx + C$), no con la regla exponencial ni con la de la potencia. | `constantes-enganosas` | 25 |
| B. Discriminación de familias | Auditar la diferencia entre estructuras algebraicas visualmente parecidas que requieren reglas distintas. Casos: $x^e$ vs $e^x$ (potencia vs exponencial); $x^n$ vs $n^x$ para $n$ numérico ($x^2$ es potencia, $2^x$ es exponencial base $a$); $\tfrac{1}{x}$ vs $\tfrac{1}{x^2}$ (logaritmo vs regla de la potencia con $n = -2$); $\sin x$ vs $\cos x$ (signo opuesto en sus primitivas). | `discriminacion-de-familias` | 25 |

### `feedback_incorrect`, confusiones fuente

- **Regla de la potencia sobre constante en $\int e^2 \, dx$**: dar $\tfrac{e^3}{3} + C$ como si $e^2$ fuera $x^2$ evaluado. $e^2 \approx 7{,}389$ es un **número fijo**: aplicá la regla de la constante.
- **Regla exponencial sobre constante $\int e^2 \, dx$**: dar $e^2 + C$ como si fuera $\int e^x \, dx$ evaluado. La regla exponencial aplica a $e^x$, no a $e^k$ para $k$ constante.
- **Constante $\ln 5$ tratada como logaritmo variable**: en $\int \ln 5 \, dx$ intentar aplicar $\int \ln x \, dx$ (que no es de tabla en este tópico). $\ln 5 \approx 1{,}609$ es un número; el integrando es una **constante numérica**.
- **$x^e$ tratado como exponencial**: en $\int x^e \, dx$ dar $\tfrac{x^e}{\ln e} + C$ (aplicando regla exponencial base $a$) en vez de $\tfrac{x^{e+1}}{e+1} + C$ (regla de la potencia). El exponente $e$ es un **número real fijo**; la base $x$ es variable, así que aplica la regla de la potencia.
- **$e^x$ tratado como potencia**: en $\int e^x \, dx$ dar $\tfrac{e^{x+1}}{x+1} + C$ (aplicando regla de la potencia) en vez de $e^x + C$. La base $e$ es constante; la variable está en el exponente, así que aplica la regla exponencial.
- **$\tfrac{1}{x^2}$ tratado como logaritmo**: dar $\ln|x^2| + C$ o $\ln|x| + C$ en vez de reconocer que $\tfrac{1}{x^2} = x^{-2}$ (potencia con $n = -2$, primitiva $\tfrac{x^{-1}}{-1} + C = -\tfrac{1}{x} + C$). El caso logaritmo es **solo** $n = -1$.
- **$2^x$ tratado como potencia**: en $\int 2^x \, dx$ dar $\tfrac{2^{x+1}}{x+1} + C$. La base $2$ es constante, la variable está en el exponente: aplicá la regla exponencial base $a$: $\tfrac{2^x}{\ln 2} + C$.

### Reglas específicas
- **Sin cálculo numérico final**: ESTR solo audita **qué regla aplicar** o cómo tratar la constante disfrazada.
- **Opciones con textos exactos** para elección de regla: `"Regla de la constante"`, `"Regla de la potencia"`, `"Regla exponencial (base $e$)"`, `"Regla exponencial (base $a$)"`, `"Regla del logaritmo"`, `"Regla trigonométrica"`.
- **Sub-A**: la respuesta correcta es siempre "regla de la constante"; el distractor mayoritario es la regla exponencial (por la presencia visual de $e$, $\pi$, $\ln$).
- **Sub-B**: opciones que muestran distintas reglas aplicables; el distractor mayoritario es la regla equivocada (potencia intercambiada con exponencial o con logaritmo).
- **Sin ejecutar** la primitiva final en el enunciado ni las opciones; la pregunta es sobre el **método**, no el resultado.

---

## RESL, 50 ítems

### Qué evalúa
**Ejecución técnica del cálculo integral**: aplicar la **linealidad** aprendida en `definition` combinada con las **fórmulas de tabla** aprendidas en FORM, en integrales que combinan varios términos. Sistema 2 completo: identificar cada término, aplicar la regla que corresponde, sumar/restar con signos correctos, incluir $+C$.

### Cardinalidad
**Exactamente 4 opciones** por ítem (grilla 2×2). Expresiones cortas (**$\leq 35$ caracteres**).

### Restricciones estrictas
- **Sin contextos cotidianos**. Mecánica pura de la fórmula.
- **Sin función compuesta** en el integrando (ni $\sin(2x)$, ni $e^{3x}$, ni $\ln(x^2)$). Todo el integrando es suma/resta de funciones elementales evaluadas en $x$ solo, cada una con su coeficiente escalar. La composición es tópico de `sustitución`.
- **$+C$ obligatorio en todas las opciones** (incluidos los distractores, para forzar la comparación por contenido, no por presencia/ausencia de la constante). Excepción única controlada: **en algún ítem específico**, una opción **sin** $+C$ puede aparecer como distractor deliberado "olvidé la constante" — con `feedback_incorrect` explícito.
- **Alcance de exponentes**: enteros positivos y negativos (incluida la excepción $n = -1$ que dispara $\ln|x|$), fraccionarios simples. Ningún irracional.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Suma y resta de términos elementales | Integrales que combinan **dos o tres términos** distintos de la tabla, con coeficientes escalares. Ejemplo: $\int (4x^3 - 2\sin x) \, dx = x^4 + 2\cos x + C$. Foco: linealidad + signos + arrastre de coeficientes. Familias mezcladas: polinómicas + trigonométricas + exponencial + constante. | `suma-resta-terminos-elementales` | 25 |
| B. Polinomios y fracciones simples combinadas | Integrales donde interactúa la **regla de la potencia** con el caso especial del **logaritmo** ($\tfrac{1}{x}$). Ejemplo: $\int (x^2 + \tfrac{5}{x}) \, dx = \tfrac{x^3}{3} + 5\ln\|x\| + C$. Foco: reconocer cuándo aplicar la excepción $n = -1$ y cuándo la regla de la potencia normal. También incluye reescritura algebraica previa (heredada de `definition`, aplicada en simultáneo con la integración). | `polinomios-fracciones-simples-combinadas` | 25 |

### `feedback_incorrect`, confusiones fuente

- **Signo mal arrastrado en trig**: en $\int (4x^3 - 2\sin x) \, dx$ dar $x^4 - 2\cos x + C$ en vez de $x^4 + 2\cos x + C$. La primitiva de $\sin x$ es $-\cos x$; el signo negativo del enunciado se combina con el signo de la primitiva y da **positivo**.
- **Coeficiente escalar perdido**: en $\int 4x^3 \, dx$ dar $x^4 + C$ (olvidando el $4$) o $x^4 \cdot 4 + C$ (multiplicando después mal). El correcto es $4 \cdot \tfrac{x^4}{4} + C = x^4 + C$; el arrastre requiere calcular bien la potencia y el escalar.
- **Regla de la potencia aplicada a $\tfrac{1}{x}$ (n = -1)**: en $\int (x^2 + \tfrac{5}{x}) \, dx$ dar $\tfrac{x^3}{3} + 5 \cdot \tfrac{x^0}{0} + C$ (división por cero) o intentar $\tfrac{x^3}{3} - \tfrac{5}{x^2} + C$. El caso $n = -1$ es la **excepción**: primitiva $\ln|x|$.
- **Valor absoluto omitido en resultado con $\ln$**: dar $\tfrac{x^3}{3} + 5\ln x + C$ en vez de $\tfrac{x^3}{3} + 5\ln|x| + C$. El valor absoluto es obligatorio.
- **Separación algebraica previa omitida**: en $\int (x^2 + \tfrac{5}{x}) \, dx$ intentar integrar como un solo bloque. La linealidad requiere separar en $\int x^2 \, dx + 5 \int \tfrac{1}{x} \, dx$.
- **Constante $C$ omitida**: dar $\tfrac{x^3}{3} + 5\ln|x|$ (sin $+C$). La primitiva es una **familia**; siempre incluí la constante.
- **Regla del producto/cociente aplicada a integral**: intentar armar $\int u \, dv$ o similar para separar productos. La integración por partes es tópico posterior; acá solo aplican linealidad + tabla.
- **Exponente subido pero no dividido**: en $\int x^3 \, dx$ dar $x^4 + C$ (sin dividir por el nuevo exponente) en vez de $\tfrac{x^4}{4} + C$.
- **Confusión entre $-\cos$ y $\cos$ al reagrupar signos**: al aplicar $\int -\sin x \, dx$ dar $-(-\cos x) + C = \cos x + C$ (correcto) pero al hacer $\int -2\sin x \, dx$ dar $-2(-\cos x) + C = 2\cos x + C$ y confundirse con la posición del signo.

### Reglas específicas
- **Explicaciones con estructura algorítmica**: (1) separar por linealidad los términos y las constantes en un `\begin{aligned}`, (2) aplicar la fórmula de tabla a cada término (indicando cuál se usa: regla de la potencia, regla exponencial, regla del logaritmo, etc.), (3) simplificar, agregar $+C$ y cerrar con advertencia técnica sobre el error típico.
- **Ningún término del integrando puede ser compuesto** ($\sin(2x)$, $e^{-x}$, $\ln(x + 1)$). Todo evaluado en $x$ solo.
- **Coeficientes escalares enteros pequeños** ($1, 2, 3, 4, 5, -1, -2, -3$) o fraccionarios simples ($\tfrac{1}{2}$, $\tfrac{1}{3}$).
- **Exponentes** dentro del alcance: enteros y fraccionarios simples; incluye caso especial $n = -1$.
- **$+C$ en todas las opciones** de todos los ítems, salvo distractor deliberado "olvidé $C$" en ítems marcados.
- **Sub-B con reescritura previa**: los ítems que requieren reescribir (por ejemplo, $\sqrt{x}$ como $x^{1/2}$) se incluyen acá; la respuesta correcta muestra el resultado ya integrado. La reescritura se explica en la explicación paso a paso.
- **Resultado como expresión simplificada final**: no dejar $\tfrac{5x^0}{0}$ ni $\tfrac{x^4}{4} \cdot 4$; escribir la primitiva compacta.
- **Decimales con coma** (`4,3`).

---

## Hallazgos de auditoría (ronda 1, jul-2026)

Pre-revisión programática sobre los ítems de prueba existentes:

- **[CORREGIDO EN CONTENIDO] Bug `\n\n$$` generalizado**: los 3 archivos (`FORM`, `ESTR`, `RESL`, 45 ítems) tenían el bloque de desarrollo pegado con `\n\n$$` en vez de `\n$$`. Corregido con el mismo script de reemplazo mecánico que se usó en `definition`.
- **`ESTR`: 15/15 ítems abren con `"Considerá la integral\n$$...$$"`.** Cláusula completa, solo le falta el `:` (regla 32) y variar la redacción.
- **`RESL`: 15/15 ítems abren con la palabra suelta `"Calculá\n$$...$$"`**, sin ningún objeto explícito (ni siquiera "la integral"). Es un imperativo con la fórmula como objeto directo: **cláusula completa, solo le falta el `:`** (`"Calculá:\n$$...$$"`) y variar la redacción (hoy 100% idéntica en los 15 ítems).
- **`FORM`: 8/15 con `"Calculá\n$$...$$"`** (mismo caso que RESL, solo falta `:`) **y 7/15 con `"¿Qué función, al derivarse, da\n$$...$$?"`**. Este último es una pregunta única con la fórmula como objeto embebido, cerrando junto con el `?`; es un patrón distinto y más aceptable que un preámbulo colgante (no corta una oración en dos), pero conviene variar la redacción igual para no repetirlo en el 100% de sub-B.

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 3 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna aplicación de sustitución, partes, integral definida, TFC, ni áreas
- [ ] Ninguna función compuesta en el integrando (argumentos internos = $x$ solo)
- [ ] Ningún exponente irracional ($x^\pi$, $x^{\sqrt 2}$)
- [ ] $\ln|x|$ con valor absoluto en toda respuesta correcta que involucre el caso $n = -1$
- [ ] $+C$ presente en toda respuesta correcta
- [ ] Explicaciones en 3 párrafos de prosa; estructura algorítmica; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios; variables inline en la prosa
- [ ] `$$...$$` pegado con un solo `\n` (bug corregido en la ronda anterior, no reintroducirlo)
- [ ] **`"Considerá la integral"` (ESTR) y `"Calculá"` (FORM/RESL) tienen el `:` antes del bloque `$$...$$`** y varían de redacción ítem a ítem (regla crítica 32)
- [ ] Ningún `\begin{aligned}` alinea con `=` datos evaluados de forma independiente (regla crítica 30)

**FORM:**
- [ ] 50 ítems; **3 opciones por defecto**, **4 opciones** cuando las respuestas cortas entren en grilla 2×2 (≤ 35 caracteres)
- [ ] Distribución A/B respetada (25/25)
- [ ] Set de familias cubierto: $x^n$, $\tfrac{1}{x}$, $e^x$, $a^x$, $\sin x$, $\cos x$, $\sec^2 x$, constante
- [ ] Nada de $\csc^2 x$, $\sec x \tan x$, $\csc x \cot x$
- [ ] Sub-A con reconocimiento directo de tabla; sub-B con pregunta inversa ("¿qué se derivó para llegar a X?")

**ESTR:**
- [ ] 50 ítems; **exactamente 3 opciones** por ítem
- [ ] Distribución A/B respetada (25/25)
- [ ] Ningún cálculo numérico final; solo elección de regla
- [ ] Sub-A con distractor mayoritario = regla exponencial o de la potencia sobre constante
- [ ] Sub-B con distractor mayoritario = regla equivocada (potencia intercambiada con exponencial o logaritmo)
- [ ] Textos exactos en opciones de elección de regla (ver §Reglas específicas)

**RESL:**
- [ ] 50 ítems; **exactamente 4 opciones** por ítem, cada opción $\leq 35$ caracteres
- [ ] Sin contextos cotidianos
- [ ] Distribución A/B respetada (25/25)
- [ ] $+C$ en todas las opciones; excepción única "olvidé $C$" como distractor deliberado marcado en el `feedback_incorrect`
- [ ] Sub-A con combinaciones lineales de dos o tres familias; sub-B con casos que mezclan regla de la potencia con excepción del logaritmo
- [ ] Explicaciones con estructura algorítmica (separar por linealidad → aplicar tabla a cada término → simplificar y agregar $C$)
