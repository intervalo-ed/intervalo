# Topic: infinite_limits (Límites al infinito)

Belt: `blue`, Unit: `limits`, Topic: `infinite_limits`

Skills en este topic: `LEXI`, `GRAF`, `RESL`. **50 ítems cada uno (150 en total)** al cerrar el refactor.

**Estado.** Los ejercicios viejos (`LEXI`, `GRAF`, `RESL`) se dejan tal cual en el folder por ahora; el refactor a la nueva distribución se hace en otro turno. Este doc especifica el alcance nuevo, las reglas duras de restricción y la distribución objetivo por skill.

Este tópico cubre dos ideas distintas que comparten el símbolo $\infty$:

- **Límites al infinito**: $x \to \pm\infty$, con resultado $L$ (asíntota horizontal) o divergente.
- **Límites infinitos**: $x \to a$, con resultado $\pm\infty$ (asíntota vertical).

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** dominio, sustitución directa, concepto intuitivo de **límite**, **límites laterales**, diferencia entre límite y evaluación (tópicos `definition` y `lateral_limits`).
- **Lo que está aprendiendo acá:** el comportamiento a largo plazo ($x \to \pm\infty$), la **divergencia local** ($x \to a \implies \pm\infty$), reglas de **dominancia de grados** en funciones racionales, e identificación de **asíntotas horizontales** y **asíntotas verticales**.
- **Lo que NO sabe todavía:** regla de L'Hôpital, derivadas, integración.

### Regla dura de restricción

**Está prohibido** usar o mencionar en enunciados, opciones, feedback y explicaciones:

- **Regla de L'Hôpital**.
- **Derivadas** en cualquier forma.
- **Integrales**.
- **Factorización** o **racionalización** como método de resolución (esas técnicas viven en otros tópicos).

Toda resolución analítica se basa en:

1. **Análisis de signos** para $\tfrac{k}{0^+}$ vs $\tfrac{k}{0^-}$ (asíntota vertical).
2. **División por la mayor potencia** o **dominancia de grados** en racionales cuando $x \to \pm\infty$.
3. **Dominancia de familias** (exponencial $\succ$ polinómica $\succ$ logarítmica) como argumento teórico, sin cálculo.

Los ítems que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 3 skills)

Reglas de authoring que se aplican al escribir los 150 ítems (misma línea que los otros topic-contexts):

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`: (a) concepto abstracto, (b) aplicación paso a paso al caso (usar `\begin{aligned}` para desarrollos), (c) cierre útil o advertencia técnica en voz neutra. Sin viñetas `•`, sin sub-`-`, sin em-dash `—`, sin humor ni antropomorfismos.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Voz descriptiva del error del distractor, en segunda persona amable ("estás tomando…", "fijate que…"). Nunca "el alumno confunde…".
4. **Negrita en primera mención** de conceptos clave: **límites al infinito**, **límites infinitos**, **asíntota horizontal**, **asíntota vertical**, **dominancia**, **divergencia**, **estabilización**. Nunca negritas dentro de `options`.
5. **Ortotipografía**: decimales con **coma** (`4,3`). Contextos genéricos; sin nombres propios.
6. **`correct_index` variado**, no concentrado en un solo índice.
7. **Notación de resultados**:
   - Si el límite es un número real, escribir el valor (`3`, `-1{,}5`).
   - Si diverge, escribir **exactamente** `+\infty`, `-\infty` o `\infty` (sin signo cuando corresponde).
   - Si no existe por asimetría de laterales, usar `"No existe"`.
   - Nunca mezclar $\infty$ con $\pm$ en la misma opción como resultado (usar uno u otro).

---

## `feedback_incorrect` en los 150 ítems

Completar con `array<string|null>` paralelo a `options`, `null` en el índice correcto. Voz descriptiva del concepto, en segunda persona amable. Una oración por distractor, autosuficiente. Las confusiones fuente por skill están en cada sección.

---

## LEXI, 50 ítems

### Qué evalúa
Destruir los falsos paradigmas del **álgebra del infinito** y formalizar las reglas teóricas de **dominancia** y **asintotismo**. Diferenciar $\tfrac{k}{\infty}$ de $\tfrac{k}{0}$, contrastar asíntota horizontal vs vertical, comparar velocidades de crecimiento entre familias.

### Cardinalidad
**Exactamente 3 opciones** por ítem.

### Distribución por sub-familia

| Sub-familia | Foco | Cant. |
|-------------|------|:-----:|
| A. Álgebra del infinito y el cero | $\tfrac{k}{\infty} \to 0$ vs $\tfrac{k}{0^+} \to \infty$. Contraste con la indeterminación $\tfrac{0}{0}$. Casos $\tfrac{\infty}{\infty}$ y $\infty - \infty$ como indeterminaciones (sin resolver). | 15 |
| B. Contraste de asíntotas | Diferenciar $x \to \infty \implies L$ (asíntota horizontal) de $x \to a \implies \infty$ (asíntota vertical). Cuál se identifica en cada dirección de lectura. | 15 |
| C. Dominancia de grados en racionales | Preguntas teóricas sin cálculo: "¿qué sucede cuando el grado del denominador es estrictamente mayor?" — la respuesta es $0$. Cuando gana el numerador — diverge. Cuando son iguales — cociente de coeficientes principales. | 10 |
| D. Crecimiento exponencial vs polinómico | Intuición teórica sobre dominancia entre familias: la exponencial supera a cualquier polinomio, y cualquier polinomio supera al logaritmo, cuando $x \to \infty$. | 10 |

### `feedback_incorrect`, confusiones fuente
- **$\tfrac{k}{\infty}$ leído como indeterminación**: pensar que "$k$ dividido infinito" es una indeterminación. Describir: "dividir un número fijo entre algo que crece sin cota lleva el cociente a cero; no es una indeterminación".
- **$\tfrac{k}{0}$ leído como indeterminación**: confundirlo con $\tfrac{0}{0}$. Describir: "solo el denominador se anula; el cociente diverge, no está indeterminado".
- **Asíntota horizontal ↔ vertical intercambiadas**: nombrar horizontal cuando la asíntota es vertical, o al revés. Recordar qué eje se estabiliza en cada caso.
- **Dominancia invertida**: creer que un polinomio de grado 100 le gana a una exponencial. La exponencial gana en el infinito, sin importar el grado del polinomio.
- **Cociente de grados iguales dado como infinito o cero**: cuando el grado del numerador iguala al del denominador, el límite es el cociente de coeficientes principales, no $0$ ni $\infty$.
- **$\infty - \infty$ resuelto directo**: dar $0$ como resultado de $\infty - \infty$. Es indeterminación; no se cancela por simetría notacional.

### Reglas específicas
- **Negrita en primera mención** de `límites al infinito`, `límites infinitos`, `asíntota horizontal`, `asíntota vertical`, `dominancia`, `divergencia`.
- Notación estándar: $x \to +\infty$, $x \to -\infty$, $\lim = +\infty$, $\lim = -\infty$. Reservar $\pm$ solo para enunciar el caso general.
- **Nunca** insinuar que $\tfrac{0}{0}$, $\tfrac{\infty}{\infty}$ o $\infty - \infty$ se pueden resolver acá con técnicas de este tópico.

---

## GRAF, 50 ítems

### Qué evalúa
Identificar el **comportamiento asintótico** a partir de una lectura visual: la altura a la que se estabiliza la curva en los extremos, la recta vertical donde diverge, y la asimetría entre extremos opuestos.

### Cardinalidad
- **4 opciones** cuando la respuesta es un valor numérico o una ecuación de recta corta.
- **3 opciones** cuando la respuesta es una propiedad conceptual (existe/no existe, tiene asíntota, es par, etc.).

### Distribución por sub-familia

| Sub-familia | Foco | Cant. |
|-------------|------|:-----:|
| A. Identificación de asíntota horizontal | Leer a qué altura $y = L$ se estabiliza la curva cuando $x \to \pm\infty$. Distractores: el corte con $y$, el máximo local, un valor puntual en el interior. | 20 |
| B. Identificación de asíntota vertical | Detectar en qué recta $x = a$ la curva se rompe y diverge. **Distractor principal**: confundir $x = a$ (la asíntota) con el corte en $x$ (donde $f = 0$). | 15 |
| C. Asimetría en el infinito | Gráficos donde $\lim_{x \to +\infty} \neq \lim_{x \to -\infty}$. Típico: exponenciales que tienen asíntota horizontal hacia un lado y explotan hacia el otro; racionales con distinto comportamiento extremo. | 15 |

### `feedback_incorrect`, confusiones fuente
- **Asíntota horizontal ↔ corte con $y$**: dar el valor $f(0)$ cuando se pregunta la asíntota horizontal. Describir: "la asíntota es a qué valor se acerca la curva en los extremos, no dónde cruza el eje $y$".
- **Asíntota vertical ↔ raíz**: dar la $x$ donde la curva cruza el eje ($f = 0$) cuando se pregunta la asíntota vertical (donde la curva diverge). Recordar: la asíntota vertical es la recta donde la función no está definida y explota.
- **Simetría asumida en el infinito**: elegir el mismo valor para ambos extremos cuando la gráfica es asimétrica. Verificar los dos extremos por separado.
- **Signo del infinito invertido**: en asíntotas verticales, decir $+\infty$ cuando la rama baja a $-\infty$. Leer hacia dónde va cada rama por separado.
- **Confundir asíntota con cota**: creer que la curva no puede pasar la asíntota. La curva puede cruzar una asíntota horizontal en la región central; la asíntota describe el comportamiento en los extremos.

### Reglas específicas
- **Gráficos con al menos una asíntota clara** (horizontal, vertical, o ambas según el ítem).
- **Puntos abiertos vs. cerrados** distinguidos si hay huecos removibles cerca de la asíntota.
- **`graph_view` con la asíntota bien centrada**: se debe ver la aproximación a la recta por al menos un lado.
- Cuando la respuesta es una asíntota, escribir la ecuación de la recta: `y = 2`, `x = -3` (no solo `2` o `-3`).
- Opciones de existencia con textos `"Sí"` / `"No"` / `"No se puede determinar"`, no `"existe"` / `"no existe"` (esto último queda reservado para RESL cuando aplique).

---

## RESL, 50 ítems

### Qué evalúa
Calcular la tendencia por límite directo o aplicando reglas de **dominancia de grados** en racionales cuando $x \to \pm\infty$, y evaluar **límites infinitos direccionales** analizando el signo del cero en el denominador cuando $x \to a$.

### Cardinalidad
**Exactamente 4 opciones** por ítem (grilla 2×2). Opciones numéricas o expresiones cortas (**$\leq 35$ caracteres**).

### Distribución por sub-familia

| Sub-familia | Foco | Cant. |
|-------------|------|:-----:|
| A. Racionales: mismo grado o gana denominador | $x \to \pm\infty$ con resultado constante (cociente de coeficientes principales) o $0$ (denominador de mayor grado). **Trampa**: signos negativos en los coeficientes principales. | 20 |
| B. Racionales: gana numerador | $x \to \pm\infty$ con resultado divergente ($+\infty$ o $-\infty$). **Desafío**: determinar el signo final correctamente cruzando signo de coeficientes principales con paridad del grado y dirección de $x$. | 10 |
| C. Cálculo de asíntota vertical | $\lim_{x \to a^{\pm}} \tfrac{k}{x - a}$ y variantes. **Desafío**: analizar si el "cero" del denominador tiende por $0^+$ o $0^-$, y cruzarlo con el signo del numerador para concluir $+\infty$ o $-\infty$. | 20 |

### `feedback_incorrect`, confusiones fuente
- **Signo del coeficiente principal ignorado**: en $\lim_{x \to +\infty} \tfrac{-3x^2 + \ldots}{x^2 + \ldots}$ dar $3$ en vez de $-3$. Describir: "el cociente de coeficientes principales incluye el signo; $\tfrac{-3}{1} = -3$".
- **Grados mal comparados**: cuando el numerador tiene grado mayor, dar $0$ (regla del denominador ganador aplicada al revés). Recordar: gana el que tiene grado más alto; si es el numerador, diverge.
- **Signo del infinito en B invertido**: al calcular $\lim_{x \to -\infty} 2x^3$, dar $+\infty$ en vez de $-\infty$. Cruzar signo del coeficiente ($+2$) con potencia impar y dirección negativa: resultado $-\infty$.
- **$0^+$ vs $0^-$ mal diagnosticado**: en $\lim_{x \to 2^-} \tfrac{1}{x-2}$, tratar el denominador como $0^+$ y dar $+\infty$. Cuando $x < 2$, $x - 2 < 0$, entonces el denominador tiende a $0^-$ y el cociente a $-\infty$.
- **Signo del numerador ignorado en asíntota vertical**: en $\lim_{x \to 2^+} \tfrac{-3}{x - 2}$, dar $+\infty$. El numerador negativo cambia el signo del resultado: $-\infty$.
- **Resultado como valor real cuando diverge**: dar un número finito cuando el límite es $\pm\infty$ (típico: dar el valor del numerador o del denominador aislado). El resultado del límite es $\pm\infty$, no una constante.
- **Grados iguales con distintos signos de $x$**: creer que $\lim_{x \to +\infty}$ y $\lim_{x \to -\infty}$ dan el mismo valor cuando el grado es par. En racionales con mismo grado, el resultado suele coincidir; con grados distintos o funciones no racionales, cada extremo se analiza por separado.

### Reglas específicas
- **Resultado numérico, `+\infty`, `-\infty`, o `No existe`** en las opciones; nunca dejar la expresión sin evaluar.
- **Explicaciones con `\begin{aligned}`** para el desarrollo paso a paso: identificar grados, dividir por la mayor potencia si corresponde, sustituir.
- **Racionales exclusivamente** en sub-A y sub-B (no incluir exponenciales, logs, ni raíces acá — reservado para tópicos posteriores).
- **Asíntota vertical (sub-C)** siempre con laterales especificados: $\lim_{x \to a^-}$ o $\lim_{x \to a^+}$. Si el enunciado pide el bilateral y los laterales difieren en signo, la respuesta es `"No existe"`.
- **Ninguna aplicación de L'Hôpital**; el desarrollo se basa en dominancia de grados o análisis de signos.
- **Decimales con coma** (`4,3`).

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 3 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna mención de L'Hôpital, derivadas, integrales, factorización ni racionalización
- [ ] Explicaciones en 3 párrafos de prosa; sin viñetas, sub-`-`, em-dash, humor
- [ ] Cierres de `explanation` en advertencia/consejo, voz neutra
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios
- [ ] Notación consistente para $\pm\infty$; `No existe` como texto exacto cuando aplique

**LEXI:**
- [ ] 50 ítems; **exactamente 3 opciones** por ítem
- [ ] Distribución A/B/C/D respetada (15/15/10/10)
- [ ] Negrita en primera mención de `límites al infinito`, `límites infinitos`, `asíntota horizontal`, `asíntota vertical`, `dominancia`, `divergencia`
- [ ] Ningún ítem sugiere que $\tfrac{0}{0}$, $\tfrac{\infty}{\infty}$ o $\infty - \infty$ se puedan resolver con las técnicas de este tópico

**GRAF:**
- [ ] 50 ítems con `graph_fn` o gráfico embebido; asíntotas claramente visibles
- [ ] Distribución A/B/C respetada (20/15/15)
- [ ] Asíntotas escritas como ecuación de recta (`y = L`, `x = a`), no como valor suelto
- [ ] Cardinalidad ajustada: 4 si numérica/recta, 3 si conceptual
- [ ] Opciones de existencia con `Sí` / `No` / `No se puede determinar`

**RESL:**
- [ ] 50 ítems; **exactamente 4 opciones** por ítem, cada opción $\leq 35$ caracteres
- [ ] Distribución A/B/C respetada (20/10/20)
- [ ] Racionales exclusivamente en A y B; sin exponenciales, logs ni raíces
- [ ] Sub-C con laterales explícitos; el signo del $0^{\pm}$ y el signo del numerador se justifican en la explicación
- [ ] Ninguna aplicación de L'Hôpital
- [ ] Resultado como valor real, `+\infty`, `-\infty` o `No existe` (nunca expresión sin evaluar)
