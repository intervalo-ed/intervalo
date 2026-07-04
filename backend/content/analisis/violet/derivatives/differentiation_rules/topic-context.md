# Topic: differentiation_rules (Reglas de derivación)

Belt: `violet`, Unit: `derivatives`, Topic: `differentiation_rules`

Skills en este topic: `FORM`, `ESTR`, `RESL`. **50 ítems cada uno (150 en total)** al cerrar el refactor.

**Estado.** Este tópico reemplaza a `basic_rules`. Renombrado (`differentiation_rules/`) y los `external_id` se van a regenerar en la próxima seed (`violet_differentiation_rules_form_01…`), lo que rompe el progreso guardado en DB — asumido y aceptado. Los ejercicios viejos se **trasladaron** a las skills nuevas:

- `LEXI.json` → **`FORM.json`** (los 10 ítems son reconocimiento de fórmulas de derivación, que ahora vive en FORM).
- `ESTR.json` → **`ESTR.json`** (10 ítems se mantienen; encajan con el nuevo alcance).
- `RESL.json` → **`RESL.json`** (10 ítems, ya venía del merge con la vieja DERI).

El contenido "APLI" que el prompt original incluía (tangentes rápidas + problemas de razón) queda absorbido en **RESL** dentro de este topic-context — coherente con la fusión APLI → RESL. El refactor a la nueva distribución completa (50 por skill) se hace en otro turno.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** **definición formal** de derivada por límite ($h \to 0$), **interpretación geométrica** de $f'(a)$ como pendiente de la recta tangente, y cálculo de derivadas simples por cociente incremental (tópicos `limit_definition` y `geometric_interpretation`).
- **Lo que está aprendiendo acá:** **derivación algorítmica** mediante fórmulas directas, manejo de **linealidad** (suma, resta, escalar), y derivadas de **funciones elementales**: potencias ($x^n$), constantes, exponenciales ($e^x$, $a^x$), logaritmos ($\ln x$), trigonométricas ($\sin x$, $\cos x$, $\tan x$).
- **Lo que NO sabe todavía:** **regla de la cadena** (tópico siguiente), regla del **producto**, regla del **cociente**, derivadas de compuestas, derivación implícita.

### Regla dura

En este tópico, el alumno **aplica fórmulas directas**. El uso del límite ya **no es el método esperado**: no pedir desarrollos por cociente incremental; todo se resuelve por combinación lineal de derivadas básicas.

**Prohibido**:

- Regla del **producto**: no hay $(u \cdot v)'$ salvo si uno de los factores es una constante escalar (en cuyo caso es solo linealidad).
- Regla del **cociente**: sin $\left(\tfrac{u}{v}\right)'$; expresiones como $\tfrac{1}{x^n}$ se derivan reescribiendo como $x^{-n}$ y aplicando la potencia.
- Regla de la **cadena**: nada de $(g \circ h)'$, ni argumentos internos no triviales (no $\sin(2x + 1)$; sí $\sin x$).
- **Justificar por límite** cualquier derivada elemental — se toma como fórmula conocida.

Los ítems que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 3 skills)

Reglas de authoring que se aplican al escribir los 150 ítems:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`, con enfoque **algorítmico**: (a) identificamos los términos, (b) aplicamos la regla a cada uno usando `\begin{aligned}`, (c) sumamos/restamos los resultados y cierre con advertencia técnica. Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (prohibido estricto)**, sin humor.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. En **RESL** especialmente: **contrastar el error común con el procedimiento correcto** ("aplicaste la potencia pero olvidaste bajar el exponente en $1$", "olvidaste el signo negativo de $(\cos x)'$"). Voz descriptiva, segunda persona amable. Nunca "el alumno confunde…".
4. **Negrita en primera mención** de conceptos clave: **reglas de derivación**, **linealidad**, **regla de la potencia**, **regla de la constante**, **derivada elemental**. Nunca negritas dentro de `options`.
5. **Variables inline** ($x$, $n$, $a$) en la prosa.
6. **Ortotipografía**: decimales con **coma** (`4,3`). Sin nombres propios.
7. **`correct_index` variado**, no concentrado en un solo índice.

---

## `feedback_incorrect` en los 150 ítems

Completar con `array<string|null>` paralelo a `options`, `null` en el índice correcto. Voz descriptiva del error específico del distractor, en segunda persona amable, contrastando con el procedimiento correcto.

---

## FORM, 50 ítems

### Qué evalúa
**Reconocimiento** de las fórmulas de derivación para funciones elementales y de la **notación**. No hay cálculo compuesto: se identifica la fórmula que corresponde.

### Cardinalidad
- **3 opciones** cuando la respuesta es una fórmula o descripción textual.
- **4 opciones** cuando la respuesta es numérica corta.

### Distribución por sub-familia

| Sub-familia | Foco | Cant. |
|-------------|------|:-----:|
| A. Derivadas elementales | Reconocer las derivadas directas: $(x^n)' = n x^{n-1}$; $(c)' = 0$; $(k f)' = k f'$; $(e^x)' = e^x$; $(a^x)' = a^x \ln a$; $(\ln x)' = 1/x$; $(\sin x)' = \cos x$; $(\cos x)' = -\sin x$; $(\tan x)' = \sec^2 x$. | 35 |
| B. Notación y operadores | Familiaridad con $f'(x)$, $y'$, $\tfrac{dy}{dx}$, $\tfrac{d}{dx}[\cdot]$, operador $D[f]$. Equivalencias y lecturas. | 15 |

### `feedback_incorrect`, confusiones fuente
- **Signo de $(\cos x)'$**: dar $\sin x$ en vez de $-\sin x$. La derivada del coseno es **negativa** del seno.
- **Constante ≠ 0**: dar $(c)' = c$ o $(c)' = 1$. La derivada de una constante es $0$; el valor $c$ no aparece.
- **Regla de la potencia mal aplicada**: dar $(x^n)' = x^{n-1}$ (olvidar el coeficiente $n$) o $(x^n)' = n x^n$ (olvidar bajar el exponente).
- **$(e^x)' \neq x e^{x-1}$**: aplicar la regla de la potencia al exponencial. La exponencial **no** es una potencia; su derivada es ella misma.
- **$(\ln x)' = \ln x$**: dar la misma expresión. La derivada es $\tfrac{1}{x}$.
- **$(a^x)'$ sin el factor $\ln a$**: dar $(a^x)' = a^x$ olvidando el $\ln a$. Solo $e^x$ coincide con su derivada; para base general aparece $\ln a$.
- **Notación confundida**: leer $\tfrac{dy}{dx}$ como una fracción algebraica donde $dy$ y $dx$ se cancelan.

### Reglas específicas
- **Negrita en primera mención** de `regla de la potencia`, `regla de la constante`, `derivada elemental`.
- **Ninguna función con argumento no trivial** ($\sin(2x)$, $e^{3x}$) — reservado para el tópico de cadena.
- Sub-B con opciones que muestren distintas notaciones ($\tfrac{df}{dx}$, $f'$, $Df$), no en prosa.

---

## ESTR, 50 ítems

### Qué evalúa
**Elección del método**, planificación del orden de aplicación de reglas y **descomposición** de expresiones antes de derivar.

### Cardinalidad
**Exactamente 3 opciones** por ítem.

### Distribución por sub-familia

| Sub-familia | Foco | Cant. |
|-------------|------|:-----:|
| A. Jerarquía de reglas | Decidir el **orden** de aplicación: identificar primero la suma/resta (linealidad) antes de aplicar la potencia o la trigonométrica a cada término. Cuándo reescribir una expresión ($\sqrt{x} \to x^{1/2}$, $\tfrac{1}{x^n} \to x^{-n}$) antes de derivar. | 25 |
| B. Descomposición de funciones | Dada $f(x) = 3x^2 + \sin x - \ln x$, identificar cada término y qué regla corresponde a cada uno **antes** de derivar. | 25 |

### `feedback_incorrect`, confusiones fuente
- **Aplicar la potencia sin reescribir**: intentar derivar $\sqrt{x}$ o $\tfrac{1}{x^3}$ sin llevarlos primero a $x^{1/2}$ o $x^{-3}$.
- **Linealidad ignorada**: proponer derivar $f + g$ como algo distinto a $f' + g'$. La suma se deriva término a término.
- **Constante multiplicativa mal manejada**: proponer que $(3x^2)' = 3 \cdot 2 x \cdot 3$ o algo similar. Es $3 \cdot (x^2)' = 3 \cdot 2x = 6x$.
- **Descomposición incompleta**: elegir "solo un término" en una suma cuando hay varios. Cada término se deriva por separado.
- **Regla equivocada por término**: aplicar la potencia a un exponencial (o al revés). La elección de regla depende del **tipo** de función elemental de cada término.

### Reglas específicas
- **Ningún cálculo numérico final** en ESTR — solo elección del método/orden/descomposición.
- **Opciones con textos exactos** para elección de regla: `"Regla de la potencia"`, `"Regla de la constante"`, `"Linealidad (suma/resta)"`, `"Múltiplo escalar"`, `"Derivada de exponencial"`, `"Derivada de logaritmo"`, `"Derivada trigonométrica"`.
- Sub-A puede requerir **reescritura previa** en la explicación; señalarlo como paso obligatorio.

---

## RESL, 50 ítems

### Qué evalúa
**Ejecución técnica** del cálculo de la derivada aplicando fórmulas y linealidad, más las **aplicaciones directas** (tangentes rápidas, razones de cambio) que antes vivían en APLI.

### Cardinalidad
**Exactamente 4 opciones** por ítem (grilla 2×2). Expresiones cortas (**$\leq 35$ caracteres**).

### Distribución por sub-familia

| Sub-familia | Foco | Cant. |
|-------------|------|:-----:|
| A. Derivadas elementales | Aplicación directa: potencia, constante, exponenciales, logaritmos y trigonométricas simples. Un solo término. | 15 |
| B. Combinaciones lineales | Sumas, restas y múltiplos escalares que combinan varias funciones elementales. Ejemplo: $f(x) = 4x^3 - 2\sin x + \ln x$. | 20 |
| C. Tangentes rápidas | Hallar $f'(a)$ para valores puntuales, o armar la ecuación de la recta tangente $y = f'(a)(x - a) + f(a)$, usando las reglas del tópico. | 10 |
| D. Razones de cambio | Aplicación breve: si $s(t)$ es posición, hallar $v(t) = s'(t)$ o $v(t_0)$. Pendientes paralelas ($f'(x) = m$ para $m$ dado). Sin problemas verbales elaborados. | 5 |

### `feedback_incorrect`, confusiones fuente
- **Coeficiente olvidado en la potencia**: dar $(3x^4)' = 3 x^3$ (olvidar el $4$). Es $3 \cdot 4 x^3 = 12 x^3$.
- **Exponente no bajado**: dar $(x^7)' = 7 x^7$ (olvidar restar $1$). Es $7 x^6$.
- **Signo de $(\cos x)'$ perdido**: en $(2\sin x + \cos x)'$ dar $2 \cos x + \sin x$. El coseno se deriva con signo negativo: $2 \cos x - \sin x$.
- **Reescritura omitida**: en $\tfrac{1}{x^2}$ intentar aplicar cociente. Reescribir como $x^{-2}$; entonces $(x^{-2})' = -2 x^{-3}$.
- **Constante derivada como no nula**: dar $(5)' = 5$. Es $0$.
- **Linealidad rota**: en $(f + g)'$ dar $f' \cdot g'$ o $(f + g)$. Es $f' + g'$.
- **Evaluación en $a$ olvidada**: en sub-C dar $f'(x)$ como respuesta cuando se pide $f'(a)$ para $a$ específico. Sustituir el valor.
- **Signo perdido al evaluar** funciones trigonométricas en ángulos con signo (ej. $\cos(-\pi/3)$).

### Reglas específicas
- **Explicaciones con estructura algorítmica**: (1) identificamos los términos, (2) aplicamos cada regla usando `\begin{aligned}`, (3) combinamos resultados.
- **Ninguna función compuesta** ($\sin(2x)$, $e^{-x}$, $\ln(x^2 + 1)$) — argumentos internos = $x$ solo.
- **Sub-C con $a$ en enteros o múltiplos simples de $\pi$** ($0, 1, \pi/2, \pi$), sin fracciones difíciles.
- **Sub-D con función posición simple** (polinómica o trig sin compuesta); no pedir aceleración compuesta.
- **Resultado como expresión simplificada final** (no dejar $(x^2)' \cdot 3$ sin resolver).
- **Decimales con coma** (`4,3`).

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 3 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna aplicación de regla del producto, cociente o cadena; ninguna función compuesta
- [ ] Ningún desarrollo por límite del cociente incremental (fórmulas directas)
- [ ] Explicaciones en 3 párrafos de prosa; estructura algorítmica; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios; variables inline en la prosa

**FORM:**
- [ ] 50 ítems; cardinalidad 3 (fórmulas/textuales) o 4 (numéricas)
- [ ] Distribución A/B respetada (35/15)
- [ ] Negrita en primera mención de `regla de la potencia`, `regla de la constante`, `derivada elemental`
- [ ] Sub-B con opciones que muestran notaciones, no prosa

**ESTR:**
- [ ] 50 ítems; **exactamente 3 opciones** por ítem
- [ ] Distribución A/B respetada (25/25)
- [ ] Ningún cálculo numérico final; solo elección de método/descomposición
- [ ] Textos exactos en opciones de elección de regla (ver §Reglas específicas)

**RESL:**
- [ ] 50 ítems; **exactamente 4 opciones** por ítem, cada opción $\leq 35$ caracteres
- [ ] Distribución A/B/C/D respetada (15/20/10/5)
- [ ] Explicaciones con estructura algorítmica (identificar → aplicar → combinar)
- [ ] Ningún argumento interno no trivial en funciones elementales
- [ ] Sub-C y sub-D con datos simples; sub-D sin problemas verbales elaborados
