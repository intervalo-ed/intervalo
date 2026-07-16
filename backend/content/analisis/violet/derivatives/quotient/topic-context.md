# Topic: quotient (Regla del Cociente)

Belt: `violet`, Unit: `derivatives`, Topic: `quotient`

Skills en este topic: `ESTR`, `RESL`. **50 ítems cada uno (100 en total)** al cerrar el refactor.

**Estado.** Este tópico surgió del split de `product_quotient` en `product/` + `quotient/`. Los `external_id` se regeneran al reseedear (`violet_quotient_estr_01…`, `violet_quotient_resl_01…`), lo que rompe el progreso guardado en DB — asumido y aceptado. La distribución completa (50 por skill) se hace en otro turno.

El contenido "APLI" que existía antes del merge DERI/INTG/APLI → RESL queda absorbido en **RESL** — coherente con la fusión de skills a nivel curso.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** definición formal de derivada por límite, interpretación geométrica de $f'(a)$, **reglas de derivación** para funciones elementales, **linealidad**, **regla del producto** (tópico anterior). Todo lo de `limit_definition`, `geometric_interpretation`, `differentiation_rules` y `product`.
- **Lo que está aprendiendo acá:** la **regla del cociente**, $\left(\tfrac{u}{v}\right)' = \tfrac{u'v - uv'}{v^2}$. Cuándo aplicarla, cómo identificar $u$ y $v$, la anatomía del signo (la resta no es conmutativa) y el rol del denominador al cuadrado.
- **Lo que NO sabe todavía:** regla de la **cadena** (tópico siguiente), derivación implícita, derivadas de compuestas con argumento interno no trivial.

### Regla dura

En este tópico se **aplica la regla del cociente** sobre funciones que ya son cocientes explícitos de dos expresiones derivables por reglas elementales. Nada de compuestas.

**Prohibido**:

- Regla de la **cadena**: los factores $u$ y $v$ tienen argumento interno = $x$ solo. Nada de $u(x) = \sin(2x + 1)$ o $v(x) = e^{-x}$.
- **Justificar por límite** la regla del cociente — se toma como fórmula conocida derivada del cociente incremental.
- **Cocientes de tres o más niveles** — solo un cociente por ítem, sin fracciones anidadas.
- **Denominador que se anula en el punto de evaluación**: en RESL, $v(a) \neq 0$ siempre (ver §RESL restricciones).
- **Contextos cotidianos en RESL** (ver §RESL).

Los ítems que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 2 skills)

Reglas de authoring que se aplican al escribir los 100 ítems:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`, con enfoque **algorítmico**: (a) identificamos $u$ y $v$ y calculamos $u'$ y $v'$ usando `\begin{aligned}`, (b) aplicamos la fórmula $\tfrac{u'v - uv'}{v^2}$ señalando el orden estricto de la resta, (c) simplificamos y cerramos con advertencia técnica (orden de la resta, cuadrado del denominador, signo). Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (prohibido estricto)**, sin humor.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Contrastar el error común con el procedimiento correcto ("invertiste el orden a $uv' - u'v$", "olvidaste el cuadrado del denominador", "sumaste en vez de restar"). Voz descriptiva, segunda persona amable.
4. **Negrita en primera mención** de conceptos clave: **regla del cociente**, **numerador**, **denominador**. Nunca negritas dentro de `options`.
5. **Variables inline** ($x$, $u$, $v$, $a$) en la prosa.
6. **Ortotipografía**: decimales con **coma** (`4,3`). Sin nombres propios.
7. **`correct_index` variado**, no concentrado en un solo índice.

---

## ESTR, 50 ítems

### Qué evalúa
**Auditoría de la toma de decisiones previa al cálculo** y **comprensión anatómica de la fórmula**. No se ejecuta la derivación completa: se decide **qué regla aplicar**, **cómo desglosar la expresión** y **qué orden respetar en la resta del numerador**. Sin cálculo numérico final.

### Cardinalidad
**Exactamente 3 opciones** por ítem.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Falsos positivos y alternativas algebraicas | Detectar cuándo la regla del cociente es válida pero **estratégicamente ineficiente**. Constante en el numerador ($f(x) = \tfrac{5}{x^3}$ conviene como $5x^{-3}$), constante en el denominador ($f(x) = \tfrac{x^2 + 1}{4}$ es $\tfrac{1}{4}(x^2 + 1)$), o polinomios simplificables antes de derivar ($f(x) = \tfrac{x^2 - 1}{x - 1} = x + 1$ para $x \neq 1$). | `falsos-positivos-alternativas-cociente` | 25 |
| B. Anatomía, signos y dominio | Auditar el **orden estricto** del numerador (la resta no es conmutativa), el **rol del cuadrado** del denominador y la **identificación** de $u$ y $v$. Reconocer que el signo de la derivada lo dicta el numerador ($v^2 > 0$ siempre que $v \neq 0$). | `anatomia-signos-y-dominio-cociente` | 25 |

### `feedback_incorrect`, confusiones fuente

- **Cociente como único camino**: proponer $\left(\tfrac{5}{x^3}\right)' = \tfrac{0 \cdot x^3 - 5 \cdot 3x^2}{x^6}$ en vez de reescribir como $5 x^{-3}$ y aplicar la regla de la potencia.
- **Constante en denominador mal manejada**: aplicar la regla del cociente a $\tfrac{x^2 + 1}{4}$ en vez de tratar el $\tfrac{1}{4}$ como múltiplo escalar y derivar $x^2 + 1$ directamente.
- **Simplificación omitida**: derivar $\tfrac{x^2 - 1}{x - 1}$ con la regla del cociente sin notar que la expresión colapsa a $x + 1$ (para $x \neq 1$), cuya derivada es $1$.
- **Orden invertido en la resta**: dar $\tfrac{uv' - u'v}{v^2}$ (numerador con el orden equivocado). Es $\tfrac{u'v - uv'}{v^2}$: primero el término con $u'$, después el resta con $v'$.
- **Suma en vez de resta**: dar $\tfrac{u'v + uv'}{v^2}$ confundiendo con la regla del producto. La regla del cociente **resta** los dos términos del numerador.
- **Denominador sin elevar al cuadrado**: dar $\tfrac{u'v - uv'}{v}$ olvidando el $v^2$. El denominador va al cuadrado siempre.
- **Signo de la derivada mal atribuido**: creer que el signo depende del cuadrado del denominador. Como $v^2 \geq 0$ (y $\neq 0$ por hipótesis), el signo de $f'$ lo dicta enteramente el numerador $u'v - uv'$.
- **Aislar $u$ y $v$ en fracción anidada**: en $f(x) = \tfrac{x^2 + 1}{x + \tfrac{1}{x}}$, tomar $v = x$ en vez de $v = x + \tfrac{1}{x}$ (el denominador entero es $v$).

### Reglas específicas
- **Ningún cálculo numérico final** en ESTR — solo elección de método/descomposición o identificación de anatomía.
- **Opciones con textos exactos** para elección de estrategia: `"Regla del cociente"`, `"Reescribir como potencia negativa"`, `"Múltiplo escalar (linealidad)"`, `"Simplificar el cociente primero"`, `"Regla del producto"`.
- **Sub-A**: la respuesta correcta es siempre la **alternativa algebraica**, no la regla del cociente. El distractor mayoritario es "regla del cociente".
- **Sub-B**: opciones que muestran distintas fórmulas exactas (`"(u'v - uv') / v^2"`, `"(uv' - u'v) / v^2"`, `"(u'v + uv') / v^2"`) como texto — evaluar reconocimiento de la fórmula correcta.
- **Negrita en primera mención** de `regla del cociente`, `numerador`, `denominador`.

---

## RESL, 50 ítems

### Qué evalúa
**Ejecución técnica** de la regla del cociente: identificar $u$ y $v$, calcular $u'$ y $v'$, armar $\tfrac{u'v - uv'}{v^2}$ y **evaluar en un punto** $x = a$ donde al menos un término de la resta se anula (con $v(a) \neq 0$ garantizado).

### Cardinalidad
**Exactamente 4 opciones** por ítem (grilla 2×2). Expresiones cortas (**$\leq 35$ caracteres**).

### Restricciones estrictas
- **Sin contextos cotidianos**. Mecánica pura de la fórmula.
- **Anulación forzada**: en toda evaluación puntual en $x = a$, **al menos uno de los términos de la resta** ($u'(a) v(a)$ o $u(a) v'(a)$) debe anularse resultando en $0$. Excepción: sub-C (tangentes horizontales), donde se resuelve una ecuación en vez de evaluar en un punto dado.
- **Denominador no nulo**: $v(a) \neq 0$ siempre. El punto de evaluación jamás puede hacer estallar la fracción.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Anulación por raíz en el numerador | El punto $x = a$ anula $u$ ($u(a) = 0$), haciendo desaparecer el término $u(a) v'(a)$. Queda $\tfrac{u'(a) v(a)}{v(a)^2} = \tfrac{u'(a)}{v(a)}$. Ejemplo: $f(x) = \tfrac{x^2 - 4}{e^x}$ evaluada en $x = 2$. | `anulacion-raiz-numerador-cociente` | 15 |
| B. Anulación por extremo local (derivada nula) | El punto $x = a$ anula $u'$ o $v'$. Ejemplo: $f(x) = \tfrac{\sin x}{x}$ evaluada en $x = \tfrac{\pi}{2}$ (acá $\cos(\pi/2) = 0$, anula $u'(a) v(a) = 0$, queda $-\tfrac{u(a) v'(a)}{v(a)^2} = -\tfrac{1 \cdot 1}{(\pi/2)^2} = -\tfrac{4}{\pi^2}$). | `anulacion-derivada-nula-cociente` | 15 |
| C. Tangentes horizontales (numerador completo nulo) | En vez de evaluar en un $a$ dado, se pide encontrar el $x$ donde $f'(x) = 0$. El alumno deriva, descarta $v^2$ (una fracción es cero cuando el numerador es cero) y resuelve la ecuación $u'v - uv' = 0$. Los ítems se eligen para que la ecuación resultante se factorice a mano en una o dos raíces enteras. | `tangentes-horizontales-cociente` | 10 |
| D. Evaluación con datos abstractos | Se brindan valores puntuales de $f(a), f'(a), g(a), g'(a)$, uno o más iguales a $0$ explícitamente. Ejemplo: "Si $f(2) = 0$, $f'(2) = 3$, $g(2) = 4$, $g'(2) = -1$, calculá $\left(\tfrac{f}{g}\right)'(2)$". Respuesta: $\tfrac{3 \cdot 4 - 0 \cdot (-1)}{4^2} = \tfrac{12}{16} = \tfrac{3}{4}$. Fuerza la estructura abstracta pura respetando el **orden de la resta**. | `evaluacion-datos-abstractos-cociente` | 10 |

### `feedback_incorrect`, confusiones fuente

- **Orden invertido**: dar $\tfrac{uv' - u'v}{v^2}$ en vez de $\tfrac{u'v - uv'}{v^2}$. En sub-A ($f = \tfrac{x^2-4}{e^x}$ en $x=2$), esto invierte el signo del resultado.
- **Fórmula del producto en vez del cociente**: dar $\tfrac{u'v + uv'}{v^2}$ (suma) confundiendo las dos reglas. La regla del cociente **resta**.
- **Denominador sin cuadrado**: dar $\tfrac{u'v - uv'}{v}$ olvidando el $v^2$. En sub-A el resultado escala mal por un factor $v(a)$.
- **Anulación mal identificada**: en sub-A ($u(a) = 0$), anular $u'(a)$ en vez de $u(a)$. La raíz vive en la función original, no en su derivada.
- **Signo de $(\cos x)'$ perdido**: en sub-B con $u(x) = \sin x$, dar $u'(a) = 1$ en vez de $\cos(\pi/2) = 0$. Ojo con evaluar la derivada, no la función.
- **Tangente horizontal con denominador**: en sub-C, resolver $u'v - uv' = v^2$ o incluir el denominador en la ecuación. Al igualar $f' = 0$ el $v^2$ se descarta (denominador de una fracción nula es irrelevante siempre que $v \neq 0$).
- **Datos abstractos con f(a)·g(a) en vez de derivada**: en sub-D usar $f(a) g(a)$ (valor puntual) en vez de $\tfrac{f'(a) g(a) - f(a) g'(a)}{g(a)^2}$ (valor de la derivada del cociente).
- **Suma en vez de resta en abstractos (sub-D)**: dar $\tfrac{f'(a) g(a) + f(a) g'(a)}{g(a)^2}$ armando estructura de producto sobre el numerador. La regla del cociente resta.

### Reglas específicas
- **Explicaciones con estructura algorítmica**: (1) identificar $u$, $v$, $u'$, $v'$ en un `\begin{aligned}`, (2) aplicar $\tfrac{u'(a) v(a) - u(a) v'(a)}{v(a)^2}$ señalando cuál término se anula y por qué, (3) simplificar al valor final y cerrar con advertencia sobre orden de la resta, cuadrado del denominador o confusión con producto.
- **Ninguna función compuesta** en $u$ o $v$: argumentos internos = $x$ solo. Nada de $u(x) = \sin(2x)$.
- **Cociente único**: sin fracciones anidadas.
- **Puntos de evaluación simples**: enteros pequeños ($0, 1, 2, 3, -1$) o múltiplos simples de $\pi$ ($0, \pi/2, \pi$). Nada de fracciones complejas.
- **Sub-C con ecuaciones factorizables**: la ecuación $u'v - uv' = 0$ debe reducir a factores lineales o cuadráticos triviales, raíces enteras o múltiplos simples de $\pi$. Nada de resolvente incómoda.
- **Sub-D**: valores presentados como igualdades numéricas en el enunciado. No pedir calcular derivadas dentro de sub-D.
- **Resultado como expresión simplificada final**: no dejar $\tfrac{3 \cdot 4 - 0}{16}$ sin resolver; escribir $\tfrac{3}{4}$.
- **Decimales con coma** (`4,3`).

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 2 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna aplicación de regla de la cadena; ninguna función compuesta en $u$ o $v$
- [ ] Ningún desarrollo por límite; un solo cociente por ítem
- [ ] Explicaciones en 3 párrafos de prosa; estructura algorítmica; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios; variables inline en la prosa

**ESTR:**
- [ ] 50 ítems; **exactamente 3 opciones** por ítem
- [ ] Distribución A/B respetada (25/25)
- [ ] Ningún cálculo numérico final; solo elección de método/descomposición/anatomía
- [ ] Sub-A con distractor mayoritario = "regla del cociente"; sub-B con opciones tipo fórmulas exactas (`"(u'v - uv') / v^2"`) para reconocimiento
- [ ] Textos exactos en opciones de elección de estrategia (ver §Reglas específicas)

**RESL:**
- [ ] 50 ítems; **exactamente 4 opciones** por ítem, cada opción $\leq 35$ caracteres
- [ ] Sin contextos cotidianos
- [ ] Distribución A/B/C/D respetada (15/15/10/10)
- [ ] En sub-A/B: todos los ítems cumplen la **anulación forzada** ($u'(a) v(a) = 0$ o $u(a) v'(a) = 0$)
- [ ] En todos los ítems con evaluación puntual: $v(a) \neq 0$ garantizado
- [ ] Sub-C con ecuaciones factorizables a mano; sin resolvente incómoda
- [ ] Sub-D con datos abstractos presentados como igualdades numéricas en el enunciado
- [ ] Explicaciones con estructura algorítmica (identificar $u,v,u',v'$ → aplicar fórmula señalando anulación → simplificar)
