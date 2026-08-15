# Topic: definition (Definición de límite)

Belt: `blue`, Unit: `limits`, Topic: `definition`

Skills en este topic: `LEXI`, `RESL`. **30 ejercicios cada uno (60 en total)** al cerrar el refactor.

Este topic tiene 2 ítems (uno por skill): `LEXI`, `RESL`. **30 ejercicios cada uno (60 en total)** al cerrar el refactor.

**Estado.** Este tópico reemplaza a `algebraic_limits`. La carpeta fue renombrada (`blue/limits/definition/`) y los `external_id` se van a regenerar en la próxima seed (`blue_definition_lexi_01…`), lo que rompe el progreso guardado en DB — asumido y aceptado. Los ejercicios viejos (`LEXI`, `ESTR`, `RESL`) se dejan tal cual en el folder por ahora; el refactor a la nueva distribución se hace en otro turno.

Este doc especifica el alcance nuevo, las reglas duras de restricción y la distribución objetivo por skill.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** funciones, dominio, imagen, evaluación de una función en un punto.
- **Lo que está aprendiendo acá:** el concepto intuitivo de **límite** ($x \to a$), la **sustitución directa** cuando la función es continua en el punto, el **diagnóstico** de una indeterminación $\tfrac{0}{0}$ (sin resolverla), y las **propiedades de linealidad** del operador límite (suma, resta, escalar, producto y cociente).
- **Lo que NO sabe todavía:** factorización, racionalización, límites laterales formales, límites al infinito, derivadas, L'Hôpital.

### Regla dura de restricción

**Está prohibido** usar o mencionar en enunciados, opciones, feedback y explicaciones:

- **Factorización** de polinomios para simplificar (ni siquiera como paso intermedio).
- **Racionalización** (multiplicar por el conjugado).
- **Regla de L'Hôpital**.
- **Límites laterales** con notación formal $x \to a^-$ / $x \to a^+$.
- **Límites al infinito** ($x \to \pm\infty$).
- **Derivadas** en cualquier forma.

Si una sustitución directa produce $\tfrac{0}{0}$, el ejercicio **termina** indicando que es una **indeterminación** o un "estado de pausa" que requiere una técnica que aún no se estudió. Nunca se pide resolverla en este tópico.

Los ejercicios que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 2 skills)

Reglas de authoring que se aplican al escribir los 60 ejercicios (misma línea que los otros topic-contexts):

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`. KaTeX agrega su propio margen.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`: (a) concepto abstracto, (b) aplicación paso a paso al caso (usar `\begin{aligned}` para desarrollos), (c) cierre útil o advertencia técnica en voz neutra. Sin viñetas `•`, sin sub-`-`, sin em-dash `—`, sin humor ni antropomorfismos.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Voz descriptiva del error del distractor, dirigida en segunda persona amable ("estás tomando…", "fijate que…"). Nunca "el alumno confunde…" (voz acusatoria prohibida).
4. **Negrita en primera mención** de conceptos clave: **límite**, **tendencia**, **aproximación**, **sustitución directa**, **indeterminación**, **continuidad**. Nunca negritas dentro de `options`.
5. **Ortotipografía**: decimales con **coma** (`4,3`, no `4.3`). Contextos genéricos ("un estudiante", "una empresa"); prohibidos los nombres propios.
6. **`correct_index` variado**, no concentrado en un solo índice.

---

## `feedback_incorrect` en los 60 ejercicios

Completar con `array<string|null>` paralelo a `options`, `null` en el índice correcto. Voz descriptiva del concepto, en segunda persona amable. Una oración por distractor, autosuficiente. Las confusiones fuente por skill están en cada sección.

---

## LEXI, 30 ejercicios

### Qué evalúa
Léxico, intuición y falsos paradigmas conceptuales alrededor de la idea de **límite**. Naturaleza de la aproximación, distinción entre $L$ y $f(a)$, diagnóstico de $\tfrac{0}{0}$ vs. tendencia infinita, condiciones para poder sustituir directo.

### Cardinalidad
**Exactamente 3 opciones** por ejercicio. Fuerza la lectura profunda y evita el descarte automático. Nada de rellenar con una cuarta opción implausible.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

**Ronda 2 (esta auditoría): se le da más peso relativo a A** (lectura de la notación), porque hoy mezclaba notación y concepto y quedaba subrepresentada frente al resto. B, C y D bajan levemente para compensar, sin perder su rol.

**Recortado (ronda ago-2026) de 50 → 30 ejercicios por skill, escalando cada sub-familia proporcionalmente (factor ~0.6, método de mayor resto).**

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Lectura de la notación, partes de la fórmula | Dado $\lim_{x\to a} f(x) = L$ (o una variante con números concretos), identificar qué representa cada símbolo por separado: la variable que se mueve ($x$), el punto de tendencia ($a$), la expresión evaluada en el entorno ($f(x)$), el resultado ($L$), y el sentido de la flecha (acercarse, nunca llegar). Incluye trampas de notación: confundir $a$ con $L$, escribir $x=a$ como si fuera el resultado, leer $f(a)$ donde corresponde $L$. | `lectura-notacion` | 12 |
| B. Independencia entre $L$ y $f(a)$ | El límite no es el valor de la función. Casos con un hueco removible o un punto desplazado: la tendencia existe aunque $f(a)$ no exista o valga otra cosa. | `independencia-limite-valor` | 7 |
| C. Diagnóstico de la indeterminación | $\tfrac{0}{0}$ es **indeterminación** (obliga a cambiar de técnica, no significa "no existe"). $\tfrac{k}{0}$ con $k \neq 0$ es tendencia a $\pm\infty$ (no es indeterminación). | `diagnostico-indeterminacion` | 6 |
| D. Condiciones para sustituir directo | Cuándo es legal evaluar directo: continuidad en el punto, ausencia de división por cero, argumento dentro del dominio (log, raíz). | `condiciones-sustitucion-directa` | 5 |

### El "porqué", no solo el "qué" (regla crítica 25 de `authoring-context.md`)

**Esta es la corrección de más peso de esta ronda.** Las explicaciones de B, C y D tienden a *declarar* el resultado ("es una indeterminación", "el límite no depende de $f(a)$", "hace falta continuidad") sin razonar el mecanismo detrás. Cada skill de este topic tiene que construir la intuición, no solo nombrarla:

- **C, diagnóstico de la indeterminación**: no alcanza con "$\tfrac{0}{0}$ es indeterminación, $\tfrac{k}{0}$ no". Hay que explicar **por qué** cada caso se comporta así: en $\tfrac{k}{0}$ el numerador queda fijo mientras el denominador se achica, y dividir algo fijo por algo cada vez más chico crece sin cota, sin importar qué función sea, el resultado ya está determinado. En $\tfrac{0}{0}$, numerador y denominador se achican **juntos**, y el cociente depende de qué tan rápido se achica cada uno respecto del otro, esa "carrera" es distinta en cada función, por eso $\tfrac{0}{0}$ no alcanza para saber el resultado y hace falta otra técnica que sí la revele.
- **B, independencia $L$ vs. $f(a)$**: no alcanza con "el límite no es el valor de la función". Hay que explicar **por qué** pueden ser independientes: el límite solo mira el comportamiento de $f$ en un entorno de $a$, nunca lo que pasa exactamente en $a$, son dos preguntas distintas que la definición separa a propósito. Por eso un hueco, un valor redefinido o un punto aislado no afectan a $L$, la definición de límite ni siquiera necesita que $f(a)$ exista.
- **D, condiciones para sustituir directo**: no alcanza con "hace falta que esté definida ahí". Hay que explicar **por qué** funciona cuando funciona: si $f$ es continua en $a$, eso significa por definición que el comportamiento de $f$ cerca de $a$ coincide con $f(a)$, la sustitución directa no es un atajo de cálculo, es la consecuencia directa de esa garantía. Por eso, cuando algo rompe la garantía (división por cero, argumento negativo en raíz o log), ya no hay "comportamiento cercano" que evaluar así.
- **A, lectura de la notación**: en vez de "la flecha significa que $x$ se acerca a $a$" sin más, explicar por qué la notación está construida así: la flecha separa dos cosas distintas, el proceso de acercarse (que ocurre en un entorno) del resultado de ese proceso (un número, $L$), si se usara "=" desde el enunciado se perdería esa distinción y se confundiría con evaluar la función.

### `feedback_incorrect`, confusiones fuente
- **Confundir tendencia con evaluación**: "el límite en $x = 2$ es $f(2)$" cuando $f$ no está definida en $2$. Describir: "estás evaluando la función; el límite mira los valores cercanos a $2$, no en $2$".
- **$\tfrac{0}{0}$ leído como "no existe"**: "el límite no existe" cuando la sustitución da $\tfrac{0}{0}$. Describir: "$\tfrac{0}{0}$ es una indeterminación, un estado de pausa: significa que la sustitución directa no alcanza, no que el límite sea inexistente".
- **$\tfrac{k}{0}$ leído como indeterminación**: confundir $\tfrac{1}{0}$ con $\tfrac{0}{0}$. Describir: "cuando solo el denominador tiende a $0$ y el numerador no, la expresión no está indeterminada: crece sin cota".
- **Notación**: "el valor de $\lim_{x \to a} f(x)$ es $x = a$" (dar la variable en lugar del límite). Recordar que el resultado del límite es un número $L$, no un valor de $x$.
- **Sustitución ilegal**: sustituir directo en una función que tiene un hueco justo en el punto y responder $f(a)$ (que no existe). Describir la condición que falta: continuidad.

### Reglas específicas
- **Negrita en primera mención** de `límite`, `tendencia`, `aproximación`, `sustitución directa`, `indeterminación`, `continuidad` en `question` y `explanation`.
- Notación: usar $\lim_{x \to a} f(x) = L$ en display cuando aparezca la definición; inline $x \to a$ en la prosa.
- **Nunca** insinuar que $\tfrac{0}{0}$ se puede resolver (esa técnica no se estudió acá).
- **El concepto abstracto siempre justifica el mecanismo, no solo nombra la regla** (ver sección "El porqué, no solo el qué" arriba y regla crítica 25 de `authoring-context.md`).

---

## RESL, 30 ejercicios

### Qué evalúa
Ejecutar el algoritmo de **evaluación por sustitución directa** cuando la función es continua en el punto: polinomios, constantes, racionales y radicales sin indeterminación.

**Descartadas (ronda ago-2026) las sub-familias de propiedades de linealidad** (suma/escalar y producto/cociente entre $f$ y $g$ abstractas): el skill quedaba desviado hacia álgebra de límites abstracta en vez de cálculo concreto. Su cupo se redistribuyó entre A y B, que ahora cubren el 100% del skill.

### Cardinalidad
**Exactamente 4 opciones** por ejercicio. Opciones numéricas o expresiones cortas (**$\leq 35$ caracteres**) para disparar la grilla 2×2 en el frontend.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

**Recortado (ronda ago-2026) de 50 → 30 ejercicios por skill.** Descartadas las sub-familias C (propiedades de suma/escalar) y D (propiedades de producto/cociente); su cupo combinado (30 de 60 originales) se redistribuyó por partes iguales entre A y B.

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Sustitución en polinomios y constantes | Evaluación pura. Trampas con tendencias negativas ($x \to -2$) y potencias con signo. Límites de funciones constantes ($\lim_{x \to 5} 8 = 8$). | `sustitucion-polinomios-constantes` | 15 |
| B. Racionales y radicales SIN indeterminación | Fracciones y raíces donde el denominador no se anula y el argumento de la raíz es válido. Filtro anti-autómatas: alumnos que intentan "factorizar todo lo que ven" pierden. | `racionales-radicales-sin-indeterminacion` | 15 |

### `feedback_incorrect`, confusiones fuente
- **Signo en potencias con base negativa**: en $\lim_{x \to -2} x^2 = 4$, elegir $-4$ (arrastrar el signo). Describir: "al elevar al cuadrado, el signo desaparece; el resultado es positivo".
- **Signo en potencias impares**: en $\lim_{x \to -2} x^3$, elegir $8$ olvidando el signo. "La potencia impar conserva el signo de la base".
- **Constante evaluada como variable**: $\lim_{x \to 5} 8 = 5$ o $= 40$ (confundir la constante con la tendencia). Recordar que si $f(x) = c$ es constante, $\lim_{x \to a} c = c$ para cualquier $a$.
- **Intentar factorizar cuando no hace falta**: dar la forma factorizada como resultado en lugar del valor numérico de la evaluación. Describir: "el denominador no se anula en el punto, así que la sustitución directa alcanza".

### Reglas específicas
- **Resultado numérico o expresión simplificada final** en las opciones; nunca dejar la expresión sin evaluar cuando la evaluación es legal.
- **Explicaciones con `\begin{aligned}`** para el desarrollo paso a paso (una línea por paso, `&=` alineado).
- **Decimales con coma** (`4,3`).
- **Concepto abstracto justifica el mecanismo**, no solo nombra la técnica (regla crítica 25): explicar brevemente por qué la sustitución directa es válida bajo esa hipótesis (continuidad del polinomio/racional/radical en el punto), no solo aplicarla mecánicamente.

---

## Hallazgos de auditoría (ronda 1, jul-2026)

Corrección puntual del usuario sobre los ejercicios de prueba de este topic (`correciones_analisis_limites_definicion_1.md`), aplicar al regenerar:

- **Espaciado desparejo entre renglones de un `\begin{aligned}`**: renglones con distinta altura (ej. uno con $\lim_{x\to a}$, los siguientes con aritmética simple) quedaban con distinto espacio vertical entre sí. **Ya corregido a nivel global** en `web/src/components/math-text.tsx` (strut `\vphantom` fijo al inicio de cada renglón), no requiere ningún cambio de contenido.
- **RESL, fórmula del enunciado tejida junto al texto en vez de centrada y sola**: en ejercicios que dan dos datos (ej. "$\lim f(x)=6$ y $\lim g(x)=0$, ¿qué puede afirmarse de $\lim \tfrac{f(x)}{g(x)}$?") y en ejercicios con la fórmula a calcular pegada a la consigna ("calculá: $\lim [f(x)\cdot g(x)]$"), conviene separar la fórmula central en su propio bloque `$$...$$` y dejar el texto acompañándola en oraciones propias. Esto ya es la regla crítica 18 de `authoring-context.md`, extenderla explícitamente a este patrón de RESL (dato + fórmula a evaluar), no solo a funciones puntuales tipo `f(x) = ...`.
- **LEXI, opción correcta demasiado larga**: en 2 ejercicios la opción correcta quedó mucho más extensa que las demás, y en uno de ellos agregaba información extra después de una coma que no aportaba a la distinción (regla crítica 4, ya documentada, remarcar acá porque reapareció).
- **LEXI, ejercicio sin contexto de límites**: uno de los ejercicios de la sub-familia C (contraste $\tfrac00$ vs. $\tfrac0k$) no mencionaba en ningún lugar del enunciado que se estuviera hablando de límites, quedando ambiguo fuera de contexto. Al regenerar, cada ejercicio tiene que dejar explícito desde la primera oración que se está evaluando un límite (mención a $\lim$ o a "tendencia"), no asumirlo solo por estar en esta carpeta.

Todo lo anterior se aplica en el próximo round de generación de este topic (no se reescriben los 15 ejercicios de prueba actuales en esta pasada).

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 2 skills):**
- [ ] `feedback_incorrect` completo en los 30 ejercicios: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna mención de factorización, racionalización, L'Hôpital, límites laterales formales, límites al infinito, ni derivadas
- [ ] Explicaciones en 3 párrafos de prosa; sin viñetas, sub-`-`, em-dash, humor
- [ ] Cierres de `explanation` en advertencia/consejo, voz neutra
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios
- [ ] **El concepto abstracto de cada `explanation` justifica el porqué, no solo declara el qué** (regla crítica 25): ninguna indeterminación, condición de dominio o propiedad operatoria se nombra sin razonar el mecanismo que la produce (ver sección "El porqué, no solo el qué" de LEXI, aplica igual al desarrollo de RESL)
- [ ] Cada `explanation` suma 1-2 párrafos de intuición general de la noción de límite en juego, no solo la resolución del caso puntual (ver `course-context.md` §Refuerzo de intuición en `blue`)
- [ ] Bloques `\begin{aligned}` con espaciado uniforme entre renglones (fix de `math-text.tsx` ya aplicado a nivel de frontend, no requiere nada especial en el contenido)

**LEXI:**
- [ ] 30 ejercicios; **exactamente 3 opciones** por ejercicio
- [ ] Distribución A/B/C/D respetada (**12/7/6/5**, ronda 2: más peso a lectura de notación)
- [ ] Negrita en primera mención de `límite`, `tendencia`, `aproximación`, `sustitución directa`, `indeterminación`, `continuidad`
- [ ] Ningún ejercicio sugiere que $\tfrac{0}{0}$ se pueda resolver
- [ ] Sub-familia A (`lectura-notacion`) aísla la identificación de partes de la fórmula ($x$, $a$, $f(x)$, $L$, la flecha) de la intuición de tendencia, que vive en el resto de las sub-familias
- [ ] Cada ejercicio deja explícito desde el enunciado que se está hablando de un límite (mención a $\lim$ o "tendencia"), ninguno queda ambiguo fuera de contexto
- [ ] Ningún ejercicio se enmarca respecto de otro de la sesión (regla crítica 24); la apertura de cada ejercicio varía su redacción, no repite la misma frase en toda una sub-familia

**RESL:**
- [ ] 30 ejercicios; **exactamente 4 opciones** por ejercicio, cada opción $\leq 35$ caracteres
- [ ] Distribución A/B respetada (15/15); sin sub-familias de propiedades de linealidad (descartadas, ronda ago-2026)
- [ ] Ninguna sustitución ilegal en la respuesta correcta (denominador $\to 0$ o argumento fuera de dominio)
- [ ] Fórmula a evaluar/calcular separada del texto en su propio bloque `$$...$$` centrado (regla crítica 18)

---

## Hallazgos de auditoría (ronda 6, ago-2026)

Pasada de redacción para llevar los enunciados al estándar de las reglas 47-51 de `authoring-context.md`. `RESL.json` estaba 15/15 con consignas del tipo "Calculá el límite:" y sin ninguna pregunta `¿...?`, así que se reescribieron los 15 enunciados completos con la anatomía canónica: apertura que sitúa el límite, fórmula en su propio bloque display y pregunta en su propio tramo.

En `LEXI.json` se reescribió la apertura del ejercicio que abría con "Considerá". Las aperturas se variaron ejercicio a ejercicio para no leerse como plantilla (regla 32).

No hubo ningún cambio de contenido matemático: límites, opciones y respuestas correctas quedaron intactos.

---

## Auditoría ronda 7 (feedback de testeo 465, ago-2026)

El feedback marcó que las aperturas de la unidad describían **dónde caen los símbolos en la hoja** (`"Arriba hay un trinomio y abajo una resta simple"`, `"La raíz ocupa el denominador"`) en vez de decir qué le pasa a la función o al límite. La ronda 6 había sacado el imperativo de cálculo (`"Calculá el límite:"`) y lo reemplazó por un inventario de la fórmula, y en esa sustitución se perdió el objeto. Sobre 225 ítems, 123 aperturas no nombraban límite, función ni tendencia, y 38 preguntas eran genéricas (`"¿Cuánto da?"`, `"¿Cuál es su resultado?"`).

De ahí sale la **regla 59** de `authoring-context.md`: la apertura nombra el objeto y la tensión que genera el ejercicio (el camino directo falla y sin embargo hay respuesta), y si ya lo nombró, la pregunta puede señalarlo hacia atrás (`"¿Cuál es ese valor?"`) en vez de repetir la misma fórmula quince veces.

En `RESL.json` se reescribieron 14 de los 15 enunciados. **El ítem 0 quedó intacto a propósito**: el feedback lo marcó como el único que introducía bien el concepto de límite, y es el patrón de referencia del archivo (`"su valor acompaña a $x$ sin sobresaltos"` describe comportamiento, no tipografía).

En `LEXI.json` se corrigieron 6 aperturas. Una de ellas era un leak de fondo: el ítem 9 abría diciendo `"el resultado es una **indeterminación** $0/0$"` y la respuesta correcta era `"Que hay una indeterminación"`. La apertura ahora dice solo que numerador y denominador dan cero.

La lista de trabajo salió del inventario de las 225 aperturas de la unidad, no del validador: estos enunciados ya pasaban 0/0 antes de la ronda. El defecto era semántico.

---

## Auditoría ronda 9 (feedback de testeo 467, ago-2026)

La ronda 7 arregló **de qué** hablaba la apertura (del comportamiento, no de la tipografía) pero no **que describiera**. El enunciado quedó haciendo el análisis y entregando el diagnóstico terminado: `"El punto de tendencia anula las dos partes de la fracción. La función no está definida ahí, pero sí se acerca a un número."` son tres conclusiones que el estudiante tendría que sacar, y le dejan solo la aritmética.

De ahí sale la **regla 61** de `authoring-context.md`: el sujeto de la primera oración es el objeto o una intención (`"Una función…"`, `"Un límite…"`, `"Se quiere…"`), va **una sola oración**, y no se reporta el resultado de ningún paso que el estudiante podría dar. La regla 59 sigue vigente contra la fórmula desnuda; la 61 la acota para que el enunciado no razone en su lugar.

En este topic se reescribieron las aperturas que tenían una propiedad de sujeto. Los cinco `RESL` de la unidad estaban al 100% en ese registro, porque son justamente los que la ronda 7 había reescrito.

**`definition/RESL[0]` sigue intacto**, por tercera ronda consecutiva: es el único ítem que el feedback marcó como bien introducido (465), y se conserva como referencia aunque su segunda oración concluya.

### Punto ciego del validador corregido en esta ronda

El testeo reportó una fila de `explanation` que se salía de pantalla y que el validador no marcaba. Medía **35** contra un umbral de **36**, o sea que pasaba por un carácter: `render_len` borraba `\sqrt` e `\infty` a longitud cero, cuando el radical es decoración que ocupa ancho y el infinito es un glifo ancho. Con los pesos nuevos esa fila mide **43** y se marca, y la fila sana de al lado sigue midiendo 29 sin falsos positivos.
