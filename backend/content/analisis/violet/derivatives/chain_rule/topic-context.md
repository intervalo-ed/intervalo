# Topic: chain_rule (Regla de la Cadena)

Belt: `violet`, Unit: `derivatives`, Topic: `chain_rule`

Skills en este topic: `ESTR`, `RESL`. **50 ítems cada uno (100 en total)** al cerrar el refactor.

**Estado.** Este es el primer tópico donde el alumno **compone funciones al derivar**. La distribución completa (50 por skill) se hace en otro turno.

El contenido "APLI" que existía antes del merge DERI/INTG/APLI → RESL queda absorbido en **RESL** — coherente con la fusión de skills a nivel curso.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** todo lo previo del cinturón violet — **definición** de derivada por límite, **interpretación geométrica**, **reglas de derivación elementales** (potencia, constante, exponencial, logaritmo, trigonométricas), **linealidad**, **regla del producto**, **regla del cociente**.
- **Lo que está aprendiendo acá:** la **regla de la cadena**, $(g \circ h)'(x) = g'(h(x)) \cdot h'(x)$. La lectura de la jerarquía "exterior / interior" de una función compuesta, cuándo aplicar cadena vs cuándo el caso pide producto o cociente, y cómo la anulación de $h'(a)$ colapsa toda la expresión.
- **Lo que NO sabe todavía:** derivación implícita, derivadas de orden superior sistemáticas, integrales (todo el cinturón brown).

### Regla dura

En este tópico se **aplica la regla de la cadena** sobre funciones compuestas $g \circ h$ con **máximo 2 capas** (una exterior, una interior). El techo es estricto en todos los sub-familias (ver §Cardinalidad y §Distribución).

**Prohibido**:

- **Composición de 3 o más capas** ($\ln(\cos(2x))$, $\sqrt{\sin(e^x)}$). El alumno recién construye la lectura binaria interior/exterior; sumar una tercera capa infla la carga cognitiva sin agregar contenido pedagógico nuevo.
- **Justificar por límite** la regla de la cadena — se toma como fórmula conocida.
- **Composiciones donde la interior es a su vez un producto o cociente no trivial** ($\sin(u \cdot v)$, $e^{u/v}$). La interior $h(x)$ debe ser una función elemental (polinómica, trigonométrica, exponencial, logarítmica) evaluada en un argumento lineal simple ($ax + b$) o en $x$.
- **Contextos cotidianos en RESL** (ver §RESL).

Los ítems que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 2 skills)

Reglas de authoring que se aplican al escribir los 100 ítems:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`, con enfoque **algorítmico**: (a) identificamos la **capa exterior** $g$ y la **capa interior** $h$ con sus derivadas usando `\begin{aligned}`, (b) aplicamos $g'(h(a)) \cdot h'(a)$ señalando el orden de evaluación (la derivada exterior se evalúa en $h(a)$, no en $a$), (c) simplificamos y cerramos con advertencia técnica sobre el error común (evaluar exterior en $a$ en vez de en $h(a)$, sumar en vez de multiplicar, omitir la derivada interior). Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (prohibido estricto)**, sin humor.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Contrastar el error común con el procedimiento correcto ("evaluaste $g'$ en $a$ en vez de en $h(a)$", "olvidaste multiplicar por $h'(a)$", "sumaste $g'(h(a)) + h'(a)$"). Voz descriptiva, segunda persona amable.
4. **Negrita en primera mención** de conceptos clave: **regla de la cadena**, **función compuesta**, **capa exterior**, **capa interior**. Nunca negritas dentro de `options`.
5. **Variables inline** ($x$, $g$, $h$, $a$) en la prosa.
6. **Ortotipografía**: decimales con **coma** (`4,3`). Sin nombres propios.
7. **`correct_index` variado**, no concentrado en un solo índice.

---

## ESTR, 50 ítems

### Qué evalúa
**Auditoría de la lectura anatómica** de la función compuesta antes de derivar. No se ejecuta la cadena completa: se identifica la jerarquía "exterior / interior" o se decide **qué regla aplicar** (cadena vs producto vs cociente) para estructuras visualmente similares. Sin cálculo numérico final.

### Cardinalidad
**Exactamente 3 opciones** por ítem.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Identificación de capas y jerarquía | Desglosar la función compuesta para identificar quién es la **exterior** ($g$) y quién la **interior** ($h$). Casos jerarquía confusa: $f(x) = \sin^2(x)$ (exterior = potencia cuadrática, interior = $\sin x$) frente a $f(x) = \sin(x^2)$ (exterior = $\sin$, interior = $x^2$). También $e^{\ln x}$ y variantes. | `identificacion-capas-jerarquia` | 25 |
| B. Falsos positivos: Producto vs Composición | Detectar cuándo aplica cadena y cuándo corresponde producto o cociente. Contrastar estructuras similares como $f(x) = e^{3x}$ (cadena) vs $f(x) = 3x \cdot e^x$ (producto), $f(x) = \ln(x^2)$ vs $f(x) = (\ln x)^2$ (ambas cadena pero con jerarquías distintas), o $f(x) = \tfrac{\sin x}{x}$ (cociente, no cadena). | `falsos-positivos-producto-composicion` | 25 |

### `feedback_incorrect`, confusiones fuente

- **Jerarquía invertida en $\sin^2(x)$**: identificar $g = \sin$ y $h = x^2$ como si fuera $\sin(x^2)$. Acá la escritura $\sin^2(x)$ significa $(\sin x)^2$: exterior = potencia cuadrática, interior = $\sin x$.
- **Argumento tratado como multiplicación**: en $\sin(x^2)$, leer $x^2$ como $x \cdot x$ y armar $\sin(x) \cdot \sin(x)$. La composición **evalúa** $\sin$ en el resultado de $x^2$; no distribuye.
- **Cadena confundida con producto**: en $f(x) = e^{3x}$, aplicar $u'v + uv'$ como si fuera un producto de $e^{3x}$ con algo. Es composición: exterior $e^{(\cdot)}$, interior $3x$; derivada $= e^{3x} \cdot 3$.
- **Producto confundido con cadena**: en $f(x) = 3x \cdot e^x$, tratar como composición ($e^{(3x \cdot x)}$ o similar). Es producto: aplicar $u'v + uv'$.
- **Cociente tratado como cadena en $\tfrac{\sin x}{x}$**: proponer exterior $\sin$ interior $x/x$. Es un cociente $u/v$ con $u = \sin x$, $v = x$; regla del cociente.
- **$\ln(x^2)$ vs $(\ln x)^2$**: intercambiar las dos jerarquías. $\ln(x^2)$: exterior $\ln$, interior $x^2$ (o reescribir como $2 \ln|x|$ para $x \neq 0$). $(\ln x)^2$: exterior potencia cuadrática, interior $\ln x$.
- **Ignorar la interior en la identificación**: elegir "no es una composición" para $f(x) = e^{3x}$ porque "el $3x$ es lineal". La linealidad de la interior no cancela la composición: la regla de la cadena se aplica igual, aunque la derivada interior sea simplemente una constante.

### Reglas específicas
- **Ningún cálculo numérico final** en ESTR — solo lectura anatómica o elección de regla.
- **Opciones con textos exactos** para elección de estrategia: `"Regla de la cadena"`, `"Regla del producto"`, `"Regla del cociente"`, `"Múltiplo escalar"`, `"No es composición"`.
- **Sub-A**: opciones que muestran distintas particiones "exterior/interior" como texto exacto (por ejemplo, `"g(u) = u^2, h(x) = \\sin x"` vs `"g(u) = \\sin u, h(x) = x^2"`). El distractor mayoritario es la partición invertida.
- **Sub-B**: la respuesta correcta es la regla que realmente aplica; el distractor mayoritario es la otra regla que la estructura sugiere visualmente.
- **Máximo 2 capas** en todos los ítems ESTR. Nada de $\ln(\cos(2x))$ ni $(e^{\sin x})^2$.
- **Negrita en primera mención** de `regla de la cadena`, `función compuesta`, `capa exterior`, `capa interior`.

---

## RESL, 50 ítems

### Qué evalúa
**Ejecución técnica** de la regla de la cadena: identificar $g$ y $h$, calcular $g'$ y $h'$, armar $g'(h(a)) \cdot h'(a)$ y **evaluar en un punto** $x = a$ donde el producto colapse o al menos un factor sea trivial ($0$ o $1$).

### Cardinalidad
**Exactamente 4 opciones** por ítem (grilla 2×2). Expresiones cortas (**$\leq 35$ caracteres**).

### Restricciones estrictas
- **Sin contextos cotidianos**. Mecánica pura de la fórmula.
- **Máximo 2 capas** en todos los ítems RESL. Sin excepciones.
- **Ancla forzada**: en toda evaluación puntual en $x = a$, al menos uno de los factores del producto ($g'(h(a))$ o $h'(a)$) debe ser $0$, $1$ o $-1$ (o un valor exacto amigable). El objetivo es que el alumno se enfoque en la lectura de la cadena, no en aritmética de multiplicación no trivial.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Anulación por derivada interna nula | El punto $x = a$ anula $h'(a) = 0$. Independientemente de la exterior, el producto colapsa a $0$. Ejemplo: $f(x) = \cos(x^2)$ en $x = 0$: $h'(x) = 2x$, $h'(0) = 0$, entonces $f'(0) = 0$. La respuesta correcta es $0$; los distractores son valores plausibles si el alumno evalúa mal. | `anulacion-derivada-interna-nula` | 20 |
| B. Evaluación en ancla trivial | El punto $x = a$ hace que $h(a)$ devuelva un valor exacto que simplifica $g'(h(a))$ (típicamente $0$, $1$, $\pi$, o un múltiplo simple). Ejemplo: $f(x) = e^{\sin x}$ en $x = \pi$: $\sin \pi = 0$, $g'(0) = e^0 = 1$, $h'(\pi) = \cos \pi = -1$; resultado $= 1 \cdot (-1) = -1$. | `evaluacion-ancla-trivial` | 20 |
| C. Evaluación con datos abstractos | Se brindan valores puntuales de $g(a), g'(a), h(a), h'(a)$, forzando a construir $g'(h(a)) \cdot h'(a)$. Ejemplo: "Si $h(2) = 3$, $h'(2) = 4$ y $g'(3) = 5$, calculá $(g \circ h)'(2)$". El alumno debe buscar $g'$ evaluada en $h(2) = 3$, no en $2$. Distractores: evaluar $g'(2) \cdot h'(2)$ o sumar en lugar de multiplicar. | `evaluacion-datos-abstractos-cadena` | 10 |

**Nota**: La sub-familia "Aplicación iterada (Tres capas)" del prompt original se descarta por la restricción de máximo 2 capas. Sus 10 ítems se redistribuyen: 5 a sub-A (más drill de anulación) y 5 a sub-B (más drill de ancla trivial). El total de RESL queda 20/20/10.

### `feedback_incorrect`, confusiones fuente

- **Derivada exterior evaluada en $a$ en vez de en $h(a)$**: en sub-B ($e^{\sin x}$ en $x = \pi$), dar $g'(\pi) \cdot h'(\pi) = e^\pi \cdot (-1)$ en vez de $g'(\sin \pi) \cdot h'(\pi) = e^0 \cdot (-1) = -1$. La derivada exterior se evalúa **en el output de la interior**, no en $a$.
- **Derivada interior omitida**: en $f(x) = e^{3x}$, dar $f'(x) = e^{3x}$ olvidando multiplicar por $h'(x) = 3$. La cadena multiplica por la derivada interior siempre.
- **Suma en vez de producto**: dar $g'(h(a)) + h'(a)$ en vez de $g'(h(a)) \cdot h'(a)$. La regla de la cadena **multiplica** los dos factores.
- **Derivadas confundidas ($g$ vs $g'$)**: en sub-C usar $g(h(a)) \cdot h'(a)$ en vez de $g'(h(a)) \cdot h'(a)$. La cadena involucra la derivada de la exterior, no la exterior misma.
- **Anulación no reconocida (sub-A)**: en $\cos(x^2)$ en $x = 0$, calcular $g'(0) = -\sin 0 = 0$ y darlo como respuesta final por otra razón. En realidad todo el producto es $0$ por $h'(0) = 0$; la lectura correcta pasa por darse cuenta del colapso por $h'$.
- **Ancla trivial mal aplicada (sub-B)**: en $e^{\sin x}$ en $x = \pi$, olvidar que $\sin \pi = 0$ y calcular $e^{\sin \pi}$ como valor no trivial. El ancla trivial es exactamente lo que permite simplificar $e^0 = 1$.
- **Signo perdido en $(\cos x)'$**: en $h(x) = \cos x$, dar $h'(a) = \sin a$ en vez de $-\sin a$. Ojo con el signo negativo.
- **Datos abstractos mal encadenados (sub-C)**: usar $g'(2) \cdot h'(2)$ (todo evaluado en $a = 2$) en vez de $g'(h(2)) \cdot h'(2) = g'(3) \cdot 4$. La exterior se evalúa en la interior.

### Reglas específicas
- **Explicaciones con estructura algorítmica**: (1) identificar $g$, $h$, $g'$, $h'$ en un `\begin{aligned}`, (2) evaluar $h(a)$ para conocer dónde va $g'$; escribir $g'(h(a)) \cdot h'(a)$ con los números; (3) simplificar y cerrar con advertencia sobre el error típico (evaluar exterior en $a$, olvidar la interior, sumar en vez de multiplicar).
- **Máximo 2 capas** en todos los ítems.
- **Interior con argumento lineal o $x$ solo**: $h(x) = ax + b$, $x^n$, $\sin x$, $\cos x$, $e^x$, $\ln x$. Nada de $h(x) = \sin(2x + 1)$ dentro de otra composición (eso es 3 capas encubiertas).
- **Puntos de evaluación simples**: enteros pequeños ($0, 1, 2$), $\pi$, $\pi/2$, o valores que hagan colapsar el producto. Nada de fracciones incómodas.
- **Sub-A**: la respuesta correcta es siempre $0$. Los distractores son valores plausibles si el alumno evalúa $g'$ correctamente pero olvida el factor $h'(a) = 0$.
- **Sub-C**: valores presentados como igualdades numéricas en el enunciado. No pedir calcular derivadas dentro de sub-C.
- **Resultado como expresión simplificada final**: no dejar $e^0 \cdot (-1)$; escribir $-1$.
- **Decimales con coma** (`4,3`).

---

## Hallazgos de auditoría (ronda 2, jul-2026)

Auditoría en vivo (`/test`) sobre ítems ya existentes:

- **`RESL_12`** (`ex_251`): la `explanation` alineaba con `=` en columna 3 líneas de un `\begin{aligned}` que en realidad eran datos evaluados de forma independiente ($h(\pi)=0$, $g'(h(\pi))=1$, $h'(\pi)=1$), no una cadena de transformación de una misma expresión. **Esto originó la regla crítica 30**, nueva en `authoring-context.md` esta ronda (la regla ya se documentó primero acá y se generalizó al resto de la unidad). Alinear con `=` solo cuando cada línea es un paso real de la misma derivación; los datos evaluados van en prosa.
- **`RESL_14`** (`ex_253`): el enunciado ("Si $h(1)=0$, $h'(1)=6$ y $g'(0)=2$, calculá $(g\circ h)'(1)$.") da 3 datos sueltos y la pregunta todo tejido en una sola oración con LaTeX inline. Hubiese estado mejor con la fórmula/datos centrados en su propio bloque `$$...$$` y 2 oraciones (antes/después) en vez de todo inline.

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 2 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna composición de 3 o más capas
- [ ] Ninguna interior que sea a su vez producto o cociente no trivial
- [ ] Ningún desarrollo por límite
- [ ] Explicaciones en 3 párrafos de prosa; estructura algorítmica; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios; variables inline en la prosa
- [ ] **Ningún `\begin{aligned}` alinea con `=` datos evaluados de forma independiente** (reincidencia confirmada en `RESL_12`, regla crítica 30): esa alineación es solo para pasos reales de una misma derivación
- [ ] **Ningún enunciado con datos abstractos sueltos teje todo inline** (reincidencia confirmada en `RESL_14`); considerar fórmula/datos centrados + 2 oraciones
- [ ] **Openers: `"Considerá la función"` solo necesita el `:` antes del bloque `$$...$$` (es cláusula completa); `"Sabiendo que"` necesita reescribirse entero (fragmento sin objeto propio, el `:` no lo arregla). Redacción variada ítem a ítem en ambos casos** (regla crítica 32)

**ESTR:**
- [ ] 50 ítems; **exactamente 3 opciones** por ítem
- [ ] Distribución A/B respetada (25/25)
- [ ] Ningún cálculo numérico final; solo lectura anatómica o elección de regla
- [ ] Sub-A con opciones tipo `"g(u) = u^2, h(x) = \\sin x"` textuales; distractor mayoritario = partición invertida
- [ ] Sub-B con distractor mayoritario = la otra regla que la estructura sugiere visualmente
- [ ] Textos exactos en opciones de elección de estrategia (ver §Reglas específicas)

**RESL:**
- [ ] 50 ítems; **exactamente 4 opciones** por ítem, cada opción $\leq 35$ caracteres
- [ ] Sin contextos cotidianos
- [ ] Distribución A/B/C respetada (20/20/10) — sub "tres capas" eliminada
- [ ] Todos los ítems cumplen la **ancla forzada** ($g'(h(a)) \in \{0, 1, -1\}$ o valor exacto amigable, o $h'(a) = 0$)
- [ ] Sub-A: respuesta correcta siempre $0$; distractores plausibles si el alumno olvida el factor $h'(a) = 0$
- [ ] Sub-C con datos abstractos presentados como igualdades numéricas en el enunciado
- [ ] Ninguna composición de 3+ capas ni interior producto/cociente
