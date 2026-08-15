# Topic: rationalization (Racionalización)

Belt: `blue`, Unit: `limits`, Topic: `rationalization`

Skills en este topic: `LEXI`, `RESL`. **30 ejercicios cada uno (60 en total)** al cerrar el refactor.

Este topic tiene 2 ítems (uno por skill): `LEXI`, `RESL`. **30 ejercicios cada uno (60 en total)** al cerrar el refactor.

**Estado.** Este tópico reemplaza a `racionalizacion` (rename ES→EN). La carpeta fue renombrada (`blue/limits/rationalization/`) y los `external_id` se van a regenerar en la próxima seed (`blue_rationalization_lexi_01…`), lo que rompe el progreso guardado en DB — asumido y aceptado. `LEXI.json` y `RESL.json` ya existen con 15 ejercicios de prueba cada uno; el refactor a los 30 ejercicios de la distribución nueva se hace en otro turno.

Este doc especifica el alcance nuevo, las reglas duras de restricción y la distribución objetivo por skill.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** **sustitución directa**, diagnóstico de la **indeterminación** $\tfrac{0}{0}$, concepto general de **límite**, y el método de **factorización** (diferencia de cuadrados, factor común) del tópico anterior.
- **Lo que está aprendiendo acá:** el concepto de **conjugado** de una expresión con raíz cuadrada, la aplicación de la **identidad fundamental** $(\sqrt{u} - c)(\sqrt{u} + c) = u - c^2$ para quebrar la raíz, y la simplificación algebraica tras la racionalización.
- **Lo que NO sabe todavía:** regla de L'Hôpital, derivadas, racionalización con **raíces cúbicas** (fuera del alcance de este cinturón), conjugados complejos, raíces anidadas.

### Regla dura de restricción

**Está prohibido** usar o mencionar en enunciados, opciones, feedback y explicaciones:

- **Regla de L'Hôpital**.
- **Derivadas** en cualquier forma.
- **Raíces cúbicas** ($\sqrt[3]{\cdot}$) o índices mayores que $2$.
- **Raíces anidadas** ($\sqrt{\sqrt{\cdot}}$) o expresiones con dos raíces cuadradas distintas en el mismo lado del cociente.
- **Conjugados complejos** (con $i$).

La única técnica permitida para salvar la indeterminación $\tfrac{0}{0}$ acá es **multiplicar numerador y denominador por el conjugado** de la expresión con raíz cuadrada, aplicar la **diferencia de cuadrados**, cancelar el factor común $(x - a)$ y sustituir.

Los ejercicios que quiebren esta regla se descartan y se reescriben.

---

**Nota para cuando se audite este topic**: ver `course-context.md` sección "Refuerzo de intuición en `blue`" (agregada en la auditoría de `lateral_limits`/`infinite_limits`): las `explanation` de toda la unidad `limits` suman 1-2 párrafos de intuición general de la noción de límite en juego, no solo la resolución del caso puntual. Sumarlo al checklist de este topic al cerrarlo.

---

## Correcciones de formato transversales (los 2 skills)

Reglas de authoring que se aplican al escribir los 60 ejercicios:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`: (a) concepto algebraico aplicado (diagnóstico visual: veo raíz + $\tfrac{0}{0}$ → racionalizar), (b) desarrollo formal en `\begin{aligned}` (multiplicar por conjugado → diferencia de cuadrados → cancelación → sustitución), (c) cierre con la evaluación final o advertencia técnica. Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (estrictamente prohibido en todo el contenido)**, sin humor.
3. **Economía del feedback**: `feedback_correct` directo ("Al multiplicar por el conjugado obtenemos $X$, cancelamos $Y$, y el límite resulta $Z$"). **No** volcar el álgebra completa ahí; el desarrollo va en `explanation` con `\begin{aligned}`.
4. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Voz descriptiva en segunda persona amable ("revisá el signo al aplicar la diferencia de cuadrados", "fijate que…"). Nunca "el alumno confunde…".
5. **Negrita en primera mención** de conceptos clave: **racionalización**, **conjugado**, **diferencia de cuadrados**, **indeterminación**, **factor común**. Nunca negritas dentro de `options`.
6. **Carga cognitiva**: números que caen en cuadrados perfectos chicos ($4, 9, 16, 25$), tendencias en enteros, sin cálculos aritméticos pesados en la sustitución final. Evaluamos el álgebra del conjugado, no aritmética.
7. **Ortotipografía**: decimales con **coma** (`4,3`). Usar "valor" para coordenadas de $x$ y "función" en lugar de "curva" / "trazo" cuando se habla del objeto matemático.
8. **`correct_index` variado**, no concentrado en un solo índice.

---

## `feedback_incorrect` en los 60 ejercicios

Completar con `array<string|null>` paralelo a `options`, `null` en el índice correcto. Voz descriptiva del concepto, en segunda persona amable. Una oración por distractor, autosuficiente.

---

## LEXI, 30 ejercicios

### Qué evalúa
Reconocimiento visual del **conjugado**, afianzamiento de la **identidad de diferencia de cuadrados** aplicada a raíces, y justificación algebraica de la técnica (por qué "arriba y abajo", cuándo aplicarla).

### Cardinalidad
**Exactamente 3 opciones** por ejercicio.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

**Recortado (ronda ago-2026) de 50 → 30 ejercicios por skill, escalando cada sub-familia proporcionalmente (factor ~0.6, exacto sin remainder).**

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Identificación del conjugado | Dada una expresión con raíz (ej. $\sqrt{x + 4} - 2$), elegir su conjugado exacto. **Cuidar**: el signo interno de la raíz no se altera, solo se invierte el signo entre los dos términos externos. | `identificacion-del-conjugado` | 9 |
| B. Identidad fundamental | Evaluar el resultado abstracto de multiplicar una raíz por su conjugado. Confirmar que $(\sqrt{u} - c)(\sqrt{u} + c) = u - c^2$; identificar el resultado en casos concretos. | `identidad-fundamental-conjugado` | 9 |
| C. Diagnóstico de técnica | Distinguir cuándo corresponde **racionalizar** (hay raíz cuadrada + $\tfrac{0}{0}$) y cuándo **factorizar** (no hay raíz, solo polinomios). Un caso híbrido también puede requerir ambas. | `diagnostico-racionalizar-vs-factorizar` | 6 |
| D. Propósito lógico | Preguntas teóricas: por qué se multiplica arriba **y** abajo (para multiplicar por $1$, no alterar la función), cuál es el objetivo de quebrar la raíz (exponer el factor $(x - a)$ para cancelar), qué pasa si multiplico solo el numerador. | `proposito-logico-conjugado` | 6 |

### `feedback_incorrect`, confusiones fuente
- **Conjugado con signo interno alterado**: para $\sqrt{x + 4} - 2$ dar $\sqrt{x - 4} + 2$ (invertir el signo dentro de la raíz). Recordar: el conjugado invierte solo el signo entre los dos términos externos, no dentro del radicando.
- **Conjugado con la raíz eliminada**: dar $(x + 4) + 2$ como conjugado de $\sqrt{x + 4} - 2$. El conjugado mantiene la raíz; lo que se elimina aparece **después** de multiplicar y aplicar la diferencia de cuadrados.
- **Identidad $(a - b)^2$ confundida con $(a - b)(a + b)$**: pensar que el producto por el conjugado da un cuadrado del binomio y no una diferencia de cuadrados. La suma de los términos internos se cancela, no se duplica.
- **Racionalización sin $\tfrac{0}{0}$**: proponer racionalizar cuando la sustitución directa da un valor finito. La racionalización se aplica solo si la sustitución directa da indeterminación.
- **Multiplicar solo el numerador**: proponer transformar solo la parte de arriba sin la de abajo. Eso **cambia** la función; hay que multiplicar por $\tfrac{\text{conjugado}}{\text{conjugado}}$ para que sea multiplicar por $1$.
- **Factorización propuesta con raíz presente**: elegir "factorizar por diferencia de cuadrados $x^2 - a^2$" cuando la expresión tiene $\sqrt{x} - a$. La diferencia de cuadrados como técnica de factoreo no rompe raíces; hay que forzarla vía conjugado.

### Reglas específicas
- **Negrita en primera mención** de `racionalización`, `conjugado`, `diferencia de cuadrados`, `indeterminación`.
- Sub-A y sub-B trabajan con expresiones simbólicas simples ($\sqrt{u} \pm c$); sub-C y sub-D son teóricas puras.
- **Textos exactos** en opciones de diagnóstico (sub-C): `"Factorizar"`, `"Racionalizar"`, `"Sustitución directa"`, `"Indeterminación no resoluble"`.
- **Nunca** insinuar que se puede resolver una raíz cúbica con la misma técnica del conjugado cuadrático (fuera de alcance).

---

## RESL, 30 ejercicios

### Qué evalúa
Ejecutar la **multiplicación por el conjugado**, simplificar la **diferencia de cuadrados**, cancelar el factor común $(x - a)$ y evaluar el límite por sustitución directa.

### Cardinalidad
**Exactamente 4 opciones** por ejercicio (grilla 2×2). Valores numéricos cortos (**$\leq 35$ caracteres**).

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

**Recortado (ronda ago-2026) de 50 → 30 ejercicios por skill, escalando cada sub-familia proporcionalmente (factor ~0.6, exacto sin remainder).**

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Raíz en el numerador | Límites donde la indeterminación viene de una raíz en la parte superior. Ejemplo: $\lim_{x \to 0} \tfrac{\sqrt{x + 9} - 3}{x}$. Multiplicar por conjugado del numerador. | `raiz-en-el-numerador` | 12 |
| B. Raíz en el denominador | Límites donde el conjugado se aplica para limpiar la parte inferior. Ejemplo: $\lim_{x \to 4} \tfrac{x - 4}{\sqrt{x} - 2}$. Multiplicar por conjugado del denominador. | `raiz-en-el-denominador` | 12 |
| C. Cancelación con signos ocultos | Límites donde, tras racionalizar, el factor resultante tiene signos invertidos y hay que extraer un $-1$ para poder cancelar. Ejemplo: $\lim_{x \to 4} \tfrac{4 - x}{\sqrt{x} - 2}$: $4 - x = -(x - 4)$. | `cancelacion-signos-ocultos` | 6 |

### `feedback_incorrect`, confusiones fuente
- **Multiplicar solo arriba o solo abajo**: al racionalizar el numerador, no multiplicar el denominador por el mismo conjugado. La fracción $\tfrac{\text{conjugado}}{\text{conjugado}} = 1$; si se rompe, se cambia la función.
- **Signo de la diferencia de cuadrados invertido**: en $(\sqrt{x + 9} - 3)(\sqrt{x + 9} + 3)$ dar $(x + 9) + 9$ o $9 - (x + 9)$. Es $(x + 9) - 9 = x$.
- **Cancelar antes de completar la diferencia de cuadrados**: cancelar $\sqrt{x}$ con $\sqrt{x}$ dentro de la raíz. No se puede: primero hay que aplicar la identidad completa.
- **Olvidar el factor cancelable en la sustitución**: sustituir $x = a$ en el cociente **sin** cancelar el factor $(x - a)$, obtener $\tfrac{0}{\text{algo}}$ o $\tfrac{\text{algo}}{0}$. Cancelar primero, sustituir después.
- **No manejar el signo oculto en sub-C**: en $\lim_{x \to 4} \tfrac{4 - x}{\sqrt{x} - 2}$ dar $+4$ olvidando que $4 - x = -(x - 4)$: el resultado va con signo menos.
- **Racionalizar por el conjugado del lado equivocado**: en un límite donde la raíz está en el numerador, multiplicar por el conjugado del denominador. El planteo estándar es racionalizar el lado donde está la raíz que genera la indeterminación.
- **Aritmética final invertida**: tras cancelar y sustituir, resolver mal el cociente (típico: $\tfrac{1}{2\sqrt{a}}$ con signo o denominador mal armado).

### Reglas específicas
- **Cociente con $\tfrac{0}{0}$ obligatorio** en el enunciado (verificar por sustitución directa). Si no hay indeterminación, el ejercicio no pertenece a este tópico.
- **Al menos una raíz cuadrada** en la expresión (si no hay raíz, va a `factorization`).
- **Números que caen en cuadrados perfectos chicos, tope $c \leq 5$**: radicandos que resultan en $\sqrt{4} = 2$, $\sqrt{9} = 3$, $\sqrt{16} = 4$, $\sqrt{25} = 5$ tras sustituir. **Nunca superar $c=5$** (ej. $\sqrt{36}=6$ o $\sqrt{49}=7$ ya son demasiado grandes para el foco de mecánica simple del skill; ver hallazgos, esto afectó a 4 de los 15 ejercicios de prueba, no solo a uno).
- **Nunca usar $+1$/$-1$ como desplazamiento dentro de la raíz** (ej. $\sqrt{x-1}-2$). Ese desplazamiento chico no aporta nada conceptualmente y agrega un paso de aritmética gratuito antes de la técnica real (calcular el radicando en el punto de tendencia), que además se confunde fácil con el propio $x$. Preferir directamente el patrón $\sqrt{x + c^2} - c$ con **tendencia $x \to 0$ como default**, donde el radicando en el punto de tendencia se lee directo sin ningún paso intermedio. Tendencias no nulas (y desplazamientos distintos de $c^2$) quedan reservadas para una **minoría de ejercicios avanzados**, y ahí el desplazamiento nunca es $\pm1$.
- **Explicaciones con `\begin{aligned}`** mostrando: diagnóstico → multiplicación por conjugado → diferencia de cuadrados → cancelación → sustitución. Una línea por paso. **El planteo de la multiplicación por el conjugado va en su propio renglón, separado de su resultado ya simplificado** (ver sección *Fórmulas anchas* → *Caso particular: multiplicar por un factor* de `authoring-context.md`); nunca los dos en la misma línea.
- **Resultado numérico final** en las opciones (nunca una expresión sin evaluar).
- **Ninguna aplicación de L'Hôpital**; ninguna factorización adicional más allá de la diferencia de cuadrados forzada.
- **Decimales con coma** (`4,3`).

---

## Hallazgos de auditoría (ronda 1, jul-2026)

Corrección puntual del usuario sobre ejercicios de prueba de este topic (`correciones_analisis_limites_racionalizacion_1.md`), aplicar al regenerar:

- **`RESL_05`**: usa $c=6$ (radicando $32$, $\sqrt{36}=6$), superando el tope de cuadrados perfectos chicos; además el primer renglón del `aligned` (multiplicación por el conjugado + resultado simplificado en la misma línea) desborda el ancho de pantalla en mobile. **Motivó el tope explícito $c \leq 5$** y la separación del planteo de la multiplicación en su propio renglón (ver *Reglas específicas* de `RESL` arriba y la nueva sección de `authoring-context.md` *Fórmulas anchas* → *Caso particular: multiplicar por un factor*).
- **`RESL_02`**: mismo desborde del primer renglón que `RESL_05` (el radicando $16$ en sí está dentro del tope permitido, el problema es puramente de formato).
- **`RESL_01`**: mismo desborde de formato; además señalado como con "demasiadas operaciones" para el foco de mecánica simple del skill, reforzando que el planteo de la multiplicación separado en su propio renglón (en vez de fusionado con el resultado) es necesario para que la derivación se lea con más aire, no solo para que entre en pantalla.
- **Revisión completa de los 15 ejercicios de `RESL` (más allá de los señalados en la corrección)**: además de `RESL_05` ($c=6$), otros 3 ejercicios de prueba también superan el tope: uno de sub-A con $c=7$ ($\sqrt{x+40}-7$) y dos de sub-B con $c=6$ y $c=7$ ($\tfrac{x-36}{\sqrt{x}-6}$, $\tfrac{x-49}{\sqrt{x}-7}$). Los 4 se corrigen a $c \leq 5$ al regenerar.
- **`RESL` con desplazamiento $\pm1$ dentro de la raíz** (ej. $\sqrt{x-1}-2$ con tendencia $x\to5$): agrega un paso de aritmética gratuito (calcular el radicando en un punto de tendencia no nulo) que no aporta nada conceptual y se confunde con el propio $x$. **Motivó la regla nueva**: nunca $\pm1$ como desplazamiento, y tendencia $x\to0$ como default (ver *Reglas específicas* de `RESL` arriba).
- **`LEXI_14`**: la palabra "liberar" (en la opción correcta, "Liberar el factor $(x-a)$ para poder cancelarlo") no convence; reemplazada por "exponer" en la tabla de distribución de arriba (sub-familia D). Además, la `explanation` teje $\tfrac{0}{0}$ apilado dentro de un párrafo de prosa ("sustituir directamente seguiría dando $\tfrac{0}{0}$"), **recurrencia de la regla crítica 28** (ya establecida en `factorization`): usar la forma horizontal `0/0` en texto corrido.

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 2 skills):**
- [ ] `feedback_incorrect` completo en los 30 ejercicios: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna mención de L'Hôpital, derivadas, raíces cúbicas, raíces anidadas ni conjugados complejos
- [ ] Explicaciones en 3 párrafos de prosa; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `feedback_correct` conciso; desarrollo completo en `explanation` con `\begin{aligned}`
- [ ] `correct_index` variado
- [ ] Radicandos que dan cuadrados perfectos chicos, **tope $c \leq 5$**; sin nombres propios
- [ ] Decimales con coma
- [ ] **Ninguna fracción $\tfrac{0}{0}$ apilada tejida en un párrafo de prosa** (regla crítica 28); en texto corrido usar `0/0`
- [ ] Cada `explanation` suma 1-2 párrafos de intuición general de la noción de límite en juego (ver `course-context.md` §Refuerzo de intuición en `blue`)

**LEXI:**
- [ ] 30 ejercicios; **exactamente 3 opciones** por ejercicio
- [ ] Distribución A/B/C/D respetada (9/9/6/6)
- [ ] Negrita en primera mención de `racionalización`, `conjugado`, `diferencia de cuadrados`, `indeterminación`
- [ ] Textos exactos en opciones de diagnóstico (`"Factorizar"`, `"Racionalizar"`, `"Sustitución directa"`, `"Indeterminación no resoluble"`)

**RESL:**
- [ ] 30 ejercicios; **exactamente 4 opciones** por ejercicio, cada opción $\leq 35$ caracteres
- [ ] Distribución A/B/C respetada (12/12/6)
- [ ] Todo enunciado presenta $\tfrac{0}{0}$ por sustitución directa **y** al menos una raíz cuadrada (verificado)
- [ ] Explicaciones con la secuencia diagnóstico → conjugado → diferencia de cuadrados → cancelación → sustitución
- [ ] Ningún resultado dejado como expresión sin evaluar
- [ ] Sub-C con el paso de extracción de $-1$ documentado en la explicación
- [ ] Ninguna aplicación de L'Hôpital ni factorización de polinomios sin raíces
- [ ] **El planteo de la multiplicación por el conjugado va en su propio renglón del `aligned`**, separado de su resultado ya simplificado (ver hallazgos `RESL_01`/`RESL_02`/`RESL_05`)
- [ ] **Ningún ejercicio con $c>5$** (verificar los 30 ejercicios, no solo los señalados en la auditoría; se encontraron 4 de 15 en la ronda 1)
- [ ] **Ningún desplazamiento $\pm1$ dentro de la raíz**; sub-A y sub-B usan por default tendencia $x\to0$ con radicando $x+c^2$, reservando tendencias no nulas a una minoría avanzada sin desplazamiento $\pm1$

---

## Hallazgos de auditoría (ronda 6, ago-2026)

Pasada de redacción para llevar los enunciados al estándar de las reglas 47-51 de `authoring-context.md`. En `RESL.json` se reemplazaron las 15 aperturas con imperativo de cálculo, y se verticalizaron 4 bloques `aligned` cuya primera fila juntaba el planteo y la multiplicación por el conjugado (regla 38). En `LEXI.json` se reescribieron 11 enunciados: 8 que arrancaban directo con `¿` y 3 que abrían con un imperativo de atención vacío.

Renombre de etiquetas de estrategia en la sub-familia `diagnostico-racionalizar-vs-factorizar` de `LEXI.json`, por sesgo de longitud (reglas 4 y 15): el juego viejo mezclaba "Factorizar" con "Sustitución directa" e "Indeterminación no resoluble", y la correcta se delataba por tamaño. El juego nuevo, aplicado de forma uniforme en todo el archivo, es **"Racionalizar y cancelar"**, **"Factorizar y cancelar"**, **"Sustituir directamente"** y **"Sin solución posible"** (render 23/21/22/20), todas nombrando el gesto concreto y dentro de una banda de 3 caracteres. Se alinearon los `feedback_correct` de esos ejercicios al vocabulario nuevo.

No hubo ningún cambio de contenido matemático: límites, conjugados, opciones correctas y `correct_index` quedaron intactos.

---

## Auditoría ronda 7 (feedback de testeo 465, ago-2026)

El feedback marcó que las aperturas de la unidad describían **dónde caen los símbolos en la hoja** (`"Arriba hay un trinomio y abajo una resta simple"`, `"La raíz ocupa el denominador"`) en vez de decir qué le pasa a la función o al límite. La ronda 6 había sacado el imperativo de cálculo (`"Calculá el límite:"`) y lo reemplazó por un inventario de la fórmula, y en esa sustitución se perdió el objeto. Sobre 225 ítems, 123 aperturas no nombraban límite, función ni tendencia, y 38 preguntas eran genéricas (`"¿Cuánto da?"`, `"¿Cuál es su resultado?"`).

De ahí sale la **regla 59** de `authoring-context.md`: la apertura nombra el objeto y la tensión que genera el ejercicio (el camino directo falla y sin embargo hay respuesta), y si ya lo nombró, la pregunta puede señalarlo hacia atrás (`"¿Cuál es ese valor?"`) en vez de repetir la misma fórmula quince veces.

En `RESL.json` se reescribieron los 15 enunciados con el mismo criterio que en `factorization`.

En `LEXI.json`, los ítems 9 a 11 abrían nombrando el criterio que discrimina la respuesta (`"conviene ver qué deja la sustitución directa"`), que es justo lo que el ejercicio pregunta (regla 57c). Las aperturas nuevas son neutras.

**Los ítems 12 y 14 preguntaban lo mismo** con distinta redacción (por qué no alcanza con multiplicar solo el numerador / qué pasa si se hace). El 14 conserva el contenido con el encuadre hipotético que pidió el feedback (`"una variante consiste en..."` validaba como legítimo un procedimiento que no lo es; ahora es un estudiante que lo hace). El 12 pasa a cubrir otro aspecto del mismo tag: al racionalizar, **la raíz no desaparece, cruza la barra** y por eso se puede cancelar.

La lista de trabajo salió del inventario de las 225 aperturas de la unidad, no del validador: estos enunciados ya pasaban 0/0 antes de la ronda. El defecto era semántico.
