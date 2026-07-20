# Topic: substitution (Integración por sustitución)

Belt: `brown`, Unit: `integrals`, Topic: `substitution`

Skills en este topic: `ESTR`, `RESL`. **50 ejercicios cada uno (100 en total)** al cerrar el refactor.

Este topic tiene 2 ítems (uno por skill): `ESTR`, `RESL`. **50 ejercicios cada uno (100 en total)** al cerrar el refactor.

**Estado.** Este tópico introduce el **primer método** de integración: el **cambio de variable** ($u$-sub), operación inversa de la regla de la cadena vista en violet. El alumno aprende a detectar la anatomía "función compuesta + derivada del interior" y a compensar constantes cuando el diferencial no cierra exacto.

Los `external_id` se generarán como `brown_substitution_estr_01…`, `brown_substitution_resl_01…`.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** todo el cinturón violet (derivadas completas: elementales, producto, cociente, **regla de la cadena**), `definition` de integrales (anatomía, primitiva, linealidad, acondicionamiento algebraico previo) y `reglas` de integración inmediata (tabla completa con $x^n$, $\tfrac{1}{x}$, $e^x$, $a^x$, $\sin$, $\cos$, $\sec^2$, constante; $\ln|x|$ con valor absoluto; regla del logaritmo como caso especial $n = -1$).
- **Lo que está aprendiendo acá:** la **integración por sustitución** $\int f(g(x)) g'(x) \, dx = \int f(u) \, du$. Cómo elegir $u$ (mirando la función compuesta interior), cómo calcular $du = g'(x) \, dx$ y cómo despejar $dx$ para reemplazar, cómo **compensar constantes** cuando la derivada del interior aparece salvo por un factor escalar, y por qué el método es la **operación inversa** de la regla de la cadena.
- **Lo que NO sabe todavía:** **integración por partes**, **integral definida** y **regla de Barrow**, **áreas** entre curvas, **Teorema Fundamental del Cálculo**.

### Regla dura

En este tópico se aplica **exclusivamente** el método de sustitución + tabla de integrales inmediatas (de `reglas`) + linealidad. Nada de partes, nada de definidas.

**Prohibido**:

- **Integración por partes**: ni como respuesta, ni como distractor razonable, ni como paso implícito. Tópico posterior.
- **Integral definida** ($\int_a^b$), **regla de Barrow**, **áreas**, **TFC**: fuera de scope. Ni siquiera aparecen como distractores.
- **Sustitución trigonométrica** ($u = \sin\theta$ para $\sqrt{a^2 - x^2}$, etc.) o **fracciones parciales**: fuera de scope; son técnicas avanzadas posteriores.
- **$u$ más allá del techo**: el alcance de $u$ es **polinomio hasta grado 2** ($u = ax + b$, $u = x^2 + k$, $u = x^2 - kx + m$) + **trascendentes simples** ($u = \ln x$, $u = \sin x$, $u = \cos x$, $u = e^x$). Ningún $u$ de grado 3+.
- **Constante de integración $C$ omitida**: toda respuesta correcta lleva $+C$. Se mantiene el hábito iniciado en `reglas`.
- **Respuesta dejada en la variable $u$**: toda respuesta correcta en RESL **vuelve a $x$**. Dejar la primitiva expresada en $u$ es un **distractor deliberado** (en al menos algunos ejercicios) con `feedback_incorrect` que dice "olvidaste volver a la variable original".
- **$\ln|x|$ sin valor absoluto**: en cualquier resultado que involucre $\ln$, el valor absoluto es obligatorio ($\ln|u| \to \ln|g(x)|$).

Los ejercicios que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 2 skills)

Reglas de authoring que se aplican al escribir los 100 ejercicios:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`, con enfoque **algorítmico**: (a) identificar $u$ y $du$, señalar por qué esa elección hace colapsar el integrando; usar `\begin{aligned}` para mostrar $u = g(x)$, $du = g'(x) \, dx$, y el despeje de $dx$ si hace falta constante compensatoria, (b) reemplazar en la integral, aplicar la fórmula de tabla que corresponde a $\int f(u) \, du$, (c) **volver a la variable $x$**, agregar $+C$, y cerrar con advertencia técnica (compensación de constante, valor absoluto en $\ln$, volver a $x$). Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (prohibido estricto)**, sin humor.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Contrastar el error común con el procedimiento correcto ("olvidaste dividir por el coeficiente $4$: la sustitución $u = 4x + 1$ da $du = 4 \, dx$", "dejaste la respuesta en $u$; sustituí de vuelta por $g(x)$", "olvidaste el valor absoluto en $\ln|u|$"). Voz descriptiva, segunda persona amable.
4. **Negrita en primera mención** de conceptos clave: **integración por sustitución**, **cambio de variable**, **diferencial**, **función compuesta**. Nunca negritas dentro de `options`.
5. **Variables inline** ($x$, $u$, $du$, $C$) en la prosa.
6. **Ortotipografía**: decimales con **coma** (`4,3`). Sin nombres propios.
7. **`correct_index` variado**, no concentrado en un solo índice.
8. **$+C$ obligatorio** en toda respuesta correcta, y **respuesta final en $x$** (no en $u$).

---

## ESTR, 50 ejercicios

### Qué evalúa
**Visión anatómica** del integrando antes de aplicar el método. Desglosar mentalmente la expresión para encontrar el **cambio de variable óptimo** y **ajustar el diferencial** cuando la derivada del interior aparece salvo un factor constante. Sin cálculo integral final.

### Cardinalidad
**Exactamente 3 opciones** por ejercicio.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Identificación anatómica de $u$ | Determinar qué parte del integrando debe reemplazarse para que su derivada cancele el resto. Casos: logaritmos ($\int \tfrac{\ln x}{x} \, dx$ con $u = \ln x$), trigonométricas con argumento polinómico ($\int x \cos(x^2) \, dx$ con $u = x^2$), exponenciales compuestas ($\int e^{3x + 1} \, dx$ con $u = 3x + 1$), cocientes con derivada del denominador en el numerador ($\int \tfrac{2x}{x^2 + 5} \, dx$ con $u = x^2 + 5$). | `identificacion-anatomica-de-u` | 25 |
| B. Ajuste del diferencial | Evaluar el manejo algebraico de la constante que aparece al derivar $u$. Dada una sustitución como $u = 5x - 2$, identificar cómo queda $dx = \tfrac{1}{5} \, du$. Casos con coeficientes enteros ($u = 3x + 1 \Rightarrow dx = \tfrac{1}{3} du$), fraccionarios ($u = \tfrac{x}{2} \Rightarrow dx = 2 \, du$), y con signos ($u = -2x \Rightarrow dx = -\tfrac{1}{2} du$). | `ajuste-del-diferencial` | 25 |

### `feedback_incorrect`, confusiones fuente

- **$u$ = función exterior completa**: en $\int \tfrac{\ln x}{x} \, dx$, elegir $u = \tfrac{\ln x}{x}$ como bloque entero. La sustitución busca que $du$ sea el **resto del integrando**; el candidato correcto es $u = \ln x$ (interior) porque $du = \tfrac{1}{x} \, dx$ es exactamente lo que queda.
- **$u$ = diferencial suelto**: elegir $u = dx$ como sustitución. El diferencial **marca la variable**; no es candidato a sustitución.
- **$u$ = derivada de la interior**: en $\int x \cos(x^2) \, dx$, elegir $u = 2x$ (la derivada de $x^2$). La sustitución reemplaza a la función interior misma, no a su derivada: $u = x^2 \Rightarrow du = 2x \, dx$.
- **$u$ = derivada del integrando entero**: proponer $u = $ derivada del integrando. La sustitución **no involucra derivar el integrando**; involucra reconocer una función compuesta dentro de él.
- **Coeficiente multiplicando en vez de dividiendo**: en $u = 5x - 2$, dar $dx = 5 \, du$ en vez de $dx = \tfrac{1}{5} \, du$. Derivar da $du = 5 \, dx$; despejar $dx$ requiere **dividir por 5**.
- **Constante ignorada al despejar $dx$**: en $u = 5x - 2$, dar $dx = du$ (olvidando el $5$). El coeficiente entra al despeje: $dx = \tfrac{du}{5}$.
- **Signo perdido**: en $u = -2x + 1$, dar $dx = \tfrac{1}{2} du$ en vez de $dx = -\tfrac{1}{2} du$. El signo negativo se conserva en el despeje.
- **Fraccionario mal invertido**: en $u = \tfrac{x}{2}$, dar $dx = \tfrac{1}{2} du$ en vez de $dx = 2 \, du$. Derivar da $du = \tfrac{1}{2} dx$; el despeje requiere **multiplicar por 2**.

### Reglas específicas
- **Sin cálculo integral final**: ESTR solo audita la elección de $u$ o el ajuste del diferencial.
- **Opciones con textos exactos** para elección de $u$ (por ejemplo, `"u = x^2"`, `"u = 2x"`, `"u = \\cos(x^2)"`, `"u = dx"`). El distractor mayoritario en sub-A es "u = función exterior completa" o "u = derivada de la interior".
- **Sub-B** con opciones que muestran distintas expresiones de $dx$ (`"dx = \\tfrac{1}{5} du"`, `"dx = 5 \\, du"`, `"dx = du"`). El distractor mayoritario es multiplicar en vez de dividir por el coeficiente.
- **Ninguna respuesta que ejecuta la integración final** en las opciones.
- **Negrita en primera mención** de `integración por sustitución`, `cambio de variable`, `diferencial`.

---

## RESL, 50 ejercicios

### Qué evalúa
**Ejecución técnica del método**: elegir $u$, calcular $du$, reemplazar, aplicar la fórmula de tabla que corresponde en la variable $u$, **volver a $x$**, compensar constantes, agregar $+C$. Sin contextos cotidianos.

### Cardinalidad
**Exactamente 4 opciones** por ejercicio (grilla 2×2). Expresiones cortas (**$\leq 35$ caracteres**).

### Restricciones estrictas
- **Sin contextos cotidianos**. Mecánica pura de la fórmula.
- **Solo integrales indefinidas**. Nada de $\int_a^b$, nada de áreas, nada de regla de Barrow.
- **Techo de $u$**: **polinomio hasta grado 2** ($u = ax + b$, $u = x^2 + k$, $u = x^2 - k$) o **trascendentes simples** ($u = \ln x$, $u = \sin x$, $u = \cos x$, $u = e^x$). Ningún $u$ de grado 3+.
- **$+C$ obligatorio en todas las opciones** (incluidos distractores).
- **Toda respuesta correcta vuelve a la variable $x$**. Una opción "quedada en $u$" aparece como **distractor deliberado** en al menos algunos ejercicios, con `feedback_incorrect` explícito.
- **$\ln|·|$ con valor absoluto** en toda respuesta que involucre logaritmo.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Sustitución lineal inmediata | Integrales donde el argumento de la función es un polinomio de **grado 1** ($u = ax + b$). Ejemplos: $\int e^{4x + 1} \, dx = \tfrac{1}{4} e^{4x + 1} + C$; $\int \cos(3x) \, dx = \tfrac{1}{3} \sin(3x) + C$; $\int (2x - 1)^5 \, dx = \tfrac{(2x - 1)^6}{12} + C$. Foco: compensación de constante por el coeficiente lineal. | `sustitucion-lineal-inmediata` | 25 |
| B. Sustitución de grado superior y trascendentes | Integrales donde $u$ es un polinomio de **grado 2** o una función trascendente simple. Casos: $\int x \cos(x^2) \, dx$ con $u = x^2 \Rightarrow \tfrac{1}{2} \sin(x^2) + C$; $\int \tfrac{2x}{x^2 + 5} \, dx$ con $u = x^2 + 5 \Rightarrow \ln|x^2 + 5| + C$; $\int \tfrac{\ln x}{x} \, dx$ con $u = \ln x \Rightarrow \tfrac{(\ln x)^2}{2} + C$; $\int \sin^n x \cos x \, dx$ con $u = \sin x \Rightarrow \tfrac{\sin^{n+1} x}{n + 1} + C$. Foco: reconocer la anatomía "función compuesta multiplicada por derivada del interior". | `sustitucion-grado-superior-trascendentes` | 25 |

### `feedback_incorrect`, confusiones fuente

- **Coeficiente lineal olvidado**: en $\int e^{4x + 1} \, dx$, dar $e^{4x + 1} + C$ (sin dividir por $4$) en vez de $\tfrac{1}{4} e^{4x + 1} + C$. La sustitución $u = 4x + 1$ da $du = 4 \, dx$, así que $dx = \tfrac{1}{4} du$ y ese $\tfrac{1}{4}$ sale de la integral.
- **Coeficiente lineal multiplicando en vez de dividiendo**: dar $4 e^{4x + 1} + C$. Confundir el ajuste del diferencial (dividir) con el coeficiente al derivar (multiplicar).
- **Signo perdido en trigonométrica**: en $\int \cos(3x) \, dx$, dar $-\tfrac{1}{3} \sin(3x) + C$ o $\tfrac{1}{3} \cos(3x) + C$ en vez de $\tfrac{1}{3} \sin(3x) + C$. Primitiva de $\cos$ es $\sin$ sin signo negativo.
- **Regla de la potencia sobre exponencial**: en $\int e^{4x + 1} \, dx$, dar $\tfrac{e^{4x + 2}}{4x + 2} + C$ (aplicando regla de la potencia al exponencial). La regla exponencial de tabla es $\int e^u \, du = e^u + C$; la potencia no aplica a $e^{(\cdot)}$.
- **Respuesta dejada en $u$**: dar $\tfrac{1}{4} e^u + C$ o $\ln|u| + C$ sin volver a $x$. La respuesta final debe estar en la variable original.
- **Constante de compensación aplicada al integrando en vez de al resultado**: en $\int x \cos(x^2) \, dx$, dar $\tfrac{1}{2} x \sin(x^2) + C$ (dejando la $x$ en el resultado). La sustitución $u = x^2 \Rightarrow du = 2x \, dx$ implica que $x \, dx = \tfrac{1}{2} du$; el $x$ se **absorbe** en el $du$, no queda en el resultado.
- **Valor absoluto omitido**: en $\int \tfrac{2x}{x^2 + 5} \, dx$, dar $\ln(x^2 + 5) + C$ en vez de $\ln|x^2 + 5| + C$. El valor absoluto siempre.
- **Regla de la potencia con exponente $-1$**: en $\int \tfrac{2x}{x^2 + 5} \, dx$ intentar $\int (x^2 + 5)^{-1} \, dx$ como potencia y dar $\tfrac{(x^2 + 5)^0}{0}$. El caso $n = -1$ dispara el **logaritmo**, no potencia.

### Reglas específicas
- **Explicaciones con estructura algorítmica**: (1) elegir $u$ y calcular $du$ en un `\begin{aligned}`, (2) reemplazar en la integral, aplicar la tabla, señalar la fórmula usada (potencia, exponencial, logaritmo, trigonométrica), (3) volver a la variable $x$, agregar $+C$, cerrar con advertencia sobre compensación de constante, valor absoluto o retorno a $x$.
- **Coeficientes lineales simples** en sub-A: $u = 2x, 3x, 4x, 5x, -2x, 2x + 1, 3x - 1, 5x + 3$, etc.
- **Ningún $u$ de grado 3+** en RESL. Nada de $u = x^3$, $u = x^3 + 1$.
- **Fracciones tipo $\tfrac{g'(x)}{g(x)}$** cuando el numerador es exactamente la derivada del denominador (sub-B) — patrón que dispara $\ln|g(x)|$.
- **Resultado como expresión simplificada final** en la variable $x$: no dejar $\tfrac{1}{4} e^u$ ni $\ln|u|$.
- **Decimales con coma** (`4,3`).

---

## Hallazgos de auditoría (ronda 1, jul-2026)

Pre-revisión programática sobre los ejercicios de prueba existentes:

- **[CORREGIDO EN CONTENIDO] Bug `\n\n$$` generalizado**: los 2 archivos (`ESTR`, `RESL`, 30 ejercicios) tenían el bloque de desarrollo pegado con `\n\n$$` en vez de `\n$$`. Corregido con el mismo script de reemplazo mecánico.
- **`ESTR`: 8/15 ejercicios abren con `"Para resolver\n$$...$$\n..."` cortando la oración con la fórmula en el medio**, mismo patrón que en `parts` (regla crítica 9). Reescribir con cierre propio antes del bloque y la pregunta en su propia oración.
- **`RESL`: 15/15 con `"Calculá\n$$...$$"`.** Cláusula completa, solo le falta el `:` y variar la redacción (hoy 100% idéntica).

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 2 skills):**
- [ ] `feedback_incorrect` completo en los 50 ejercicios: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna aplicación de partes, integral definida, TFC, áreas, ni sustitución trigonométrica
- [ ] Ningún $u$ de grado 3 o mayor
- [ ] $\ln|·|$ con valor absoluto obligatorio en toda respuesta que involucre logaritmo
- [ ] $+C$ presente en toda respuesta correcta y toda opción
- [ ] Respuesta final en $x$ en toda respuesta correcta de RESL
- [ ] Explicaciones en 3 párrafos de prosa; estructura algorítmica; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios; variables inline en la prosa
- [ ] `$$...$$` pegado con un solo `\n` (bug corregido en la ronda anterior, no reintroducirlo)
- [ ] **`"Para resolver"` (ESTR) reescrito como cláusula completa que no corta la oración con la fórmula en el medio** (regla crítica 9); **`"Calculá"` (RESL) tiene el `:` agregado** y varía de redacción ejercicio a ejercicio (regla crítica 32)
- [ ] Ningún `\begin{aligned}` alinea con `=` datos evaluados de forma independiente (regla crítica 30)

**ESTR:**
- [ ] 50 ejercicios; **exactamente 3 opciones** por ejercicio
- [ ] Distribución A/B respetada (25/25)
- [ ] Ningún cálculo integral final; solo elección de $u$ o ajuste del diferencial
- [ ] Sub-A con distractor mayoritario = "u = función exterior completa" o "u = derivada de la interior"
- [ ] Sub-B con distractor mayoritario = multiplicar en vez de dividir por el coeficiente
- [ ] Textos exactos en opciones de elección de $u$ y de $dx$ (ver §Reglas específicas)

**RESL:**
- [ ] 50 ejercicios; **exactamente 4 opciones** por ejercicio, cada opción $\leq 35$ caracteres
- [ ] Sin contextos cotidianos
- [ ] Solo integrales indefinidas; ningún $\int_a^b$, ningún área
- [ ] Distribución A/B respetada (25/25)
- [ ] Sub-A con $u = ax + b$ únicamente; compensación de constante en todos los ejercicios donde el coeficiente $\neq 1$
- [ ] Sub-B con $u$ hasta grado 2 o trascendente simple; casos $\tfrac{g'(x)}{g(x)}$ que disparan $\ln|·|$
- [ ] Al menos algunos ejercicios tienen "respuesta en $u$" como distractor deliberado
- [ ] Al menos algunos ejercicios tienen "$+C$ olvidada" como distractor deliberado
