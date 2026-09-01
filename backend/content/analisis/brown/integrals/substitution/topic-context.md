# Topic: substitution (Integración por sustitución)

Belt: `brown`, Unit: `integrals`, Topic: `substitution`

Skills en este topic: `ESTR`, `RESL`, `CLSF`. **30 ejercicios cada uno (90 en total)** al cerrar el refactor. `CLSF` se agregó en la ronda 2 (ago-2026, ver Hallazgos de auditoría) para practicar intercalado: elegir el método sin que el enunciado lo anuncie.

Este topic tiene 3 ítems (uno por skill): `ESTR`, `RESL`, `CLSF`. **30 ejercicios cada uno (90 en total)** al cerrar el refactor.

**Estado.** Este tópico introduce el **primer método** de integración: el **cambio de variable** ($u$-sub), operación inversa de la regla de la cadena vista en violet. El alumno aprende a detectar la anatomía "función compuesta + derivada del interior" y a compensar constantes cuando el diferencial no cierra exacto.

Los `external_id` se generarán como `brown_substitution_estr_01…`, `brown_substitution_resl_01…`, `brown_substitution_clsf_01…`.

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

## Correcciones de formato transversales (los 3 skills)

Reglas de authoring que se aplican al escribir los 90 ejercicios:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`, con enfoque **algorítmico**: (a) identificar $u$ y $du$, señalar por qué esa elección hace colapsar el integrando; usar `\begin{aligned}` para mostrar $u = g(x)$, $du = g'(x) \, dx$, y el despeje de $dx$ si hace falta constante compensatoria, (b) reemplazar en la integral, aplicar la fórmula de tabla que corresponde a $\int f(u) \, du$, (c) **volver a la variable $x$**, agregar $+C$, y cerrar con advertencia técnica (compensación de constante, valor absoluto en $\ln$, volver a $x$). Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (prohibido estricto)**, sin humor.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Contrastar el error común con el procedimiento correcto ("olvidaste dividir por el coeficiente $4$: la sustitución $u = 4x + 1$ da $du = 4 \, dx$", "dejaste la respuesta en $u$; sustituí de vuelta por $g(x)$", "olvidaste el valor absoluto en $\ln|u|$"). Voz descriptiva, segunda persona amable.
4. **Negrita en primera mención** de conceptos clave: **integración por sustitución**, **cambio de variable**, **diferencial**, **función compuesta**. Nunca negritas dentro de `options`.
5. **Variables inline** ($x$, $u$, $du$, $C$) en la prosa.
6. **Ortotipografía**: decimales con **coma** (`4,3`). Sin nombres propios.
7. **`correct_index` variado**, no concentrado en un solo índice.
8. **$+C$ obligatorio** en toda respuesta correcta, y **respuesta final en $x$** (no en $u$).

---

## ESTR, 15 ejercicios

### Qué evalúa
**Visión anatómica** del integrando antes de aplicar el método. Desglosar mentalmente la expresión para encontrar el **cambio de variable óptimo** y **ajustar el diferencial** cuando la derivada del interior aparece salvo un factor constante. Sin cálculo integral final.

### Cardinalidad
**Exactamente 3 opciones** por ejercicio.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Identificación anatómica de $u$ | Determinar qué parte del integrando debe reemplazarse para que su derivada cancele el resto. Casos: logaritmos ($\int \tfrac{\ln x}{x} \, dx$ con $u = \ln x$), trigonométricas con argumento polinómico ($\int x \cos(x^2) \, dx$ con $u = x^2$), exponenciales compuestas ($\int e^{3x + 1} \, dx$ con $u = 3x + 1$), cocientes con derivada del denominador en el numerador ($\int \tfrac{2x}{x^2 + 5} \, dx$ con $u = x^2 + 5$). | `identificacion-anatomica-de-u` | 8 |
| B. Ajuste del diferencial | Evaluar el manejo algebraico de la constante que aparece al derivar $u$. Dada una sustitución como $u = 5x - 2$, identificar cómo queda $dx = \tfrac{1}{5} \, du$. Casos con coeficientes enteros ($u = 3x + 1 \Rightarrow dx = \tfrac{1}{3} du$), fraccionarios ($u = \tfrac{x}{2} \Rightarrow dx = 2 \, du$), y con signos ($u = -2x \Rightarrow dx = -\tfrac{1}{2} du$). **Cada ítem muestra primero la integral concreta de la que sale ese cambio** (ronda 4, regla 58 de `authoring-context.md`): el enunciado lleva la integral centrada, después el cambio elegido también centrado, y recién ahí la pregunta por el diferencial. La integral no interviene en la respuesta, pero sin ella el ítem arranca en el aire. | `ajuste-del-diferencial` | 7 |

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

## RESL, 15 ejercicios

### Qué evalúa
**Ejecución técnica del método, repartida en decisiones sueltas**: elegir $u$, calcular $du$, reescribir la integral, aplicar la fórmula de tabla, volver a $x$, compensar constantes, agregar $+C$. El estudiante recorre todo el procedimiento a lo largo de la sesión, pero **ningún ítem le pide ejecutarlo entero**. Sin contextos cotidianos.

### Formatos (ronda 3, ago-2026)

**Ningún ítem de esta skill pide el resultado final de una integral.** Ese formato quedó descartado: exigía de 4 a 6 pasos encadenados sostenidos de memoria, muy por encima del techo de carga mental (regla 55 de `authoring-context.md`). El mismo temario se cubre con tres formatos, mezclados dentro de cada sub-familia:

| Formato | Regla | Qué se muestra | Qué se pregunta | Cant. |
|---|:--:|---|---|:-----:|
| **Paso troceado** | 56 | La integral con el cambio de variable ya elegido, o una primitiva ya obtenida en $u$ | En qué se transforma la integral escrita en $u$, o cuál es el resultado al deshacer el cambio | 12 |
| **Verificar derivando** | 52 | Una expresión $F(x)$ candidata | De cuál de las cuatro integrales proviene | 8 |
| **Detectar el paso mal** | 53 | Una resolución completa con un error inyectado | Qué pieza del procedimiento falló | 10 |

El troceado cubre dos momentos distintos del procedimiento: la **reescritura en $u$**, que es el corazón del método, y la **vuelta a $x$**. No cubre el despeje de $dx$ solo, que es territorio de `ESTR` sub-B, ni la aplicación de la tabla en $u$, que ya es territorio de `reglas`.

Los errores inyectados en "detectar el paso mal" salen siempre de la lista de confusiones fuente de más abajo: coeficiente sin compensar, signo de la primitiva perdido, valor absoluto omitido, exponente sin dividir, interior mal elegido. Nunca un error tipográfico ni arbitrario.

### Cardinalidad
**Exactamente 4 opciones** por ejercicio (grilla 2×2). Expresiones cortas (**$\leq 35$ caracteres**).

### Restricciones estrictas
- **Sin contextos cotidianos**. Mecánica pura de la fórmula.
- **Solo integrales indefinidas**. Nada de $\int_a^b$, nada de áreas, nada de regla de Barrow.
- **Techo de $u$**: **polinomio hasta grado 2** ($u = ax + b$, $u = x^2 + k$, $u = x^2 - k$) o **trascendentes simples** ($u = \ln x$, $u = \sin x$, $u = \cos x$, $u = e^x$). Ningún $u$ de grado 3+.
- **$+C$ obligatorio cuando la opción es una primitiva.** En los ítems troceados cuyas opciones son integrales a medio reescribir, y en los de verificación cuyas opciones son integrales, no corresponde $+C$: todavía no hay ninguna primitiva escrita. La expresión $F(x)$ de un ítem de verificación tampoco lo lleva, porque es **una** primitiva concreta y no la familia entera.
- **Toda respuesta correcta que sea una primitiva vuelve a la variable $x$**. Una opción "quedada en $u$" aparece como **distractor deliberado** en al menos algunos ejercicios, con `feedback_incorrect` explícito. En los ítems troceados de reescritura la respuesta correcta sí queda en $u$ **por diseño**, y ahí el enunciado tiene que pedirlo explícitamente, del tipo "¿cómo queda escrita en $u$?", para que la consigna no contradiga ese hábito.
- **$\ln|·|$ con valor absoluto** en toda respuesta que involucre logaritmo.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Sustitución lineal inmediata | Integrales donde el argumento de la función es un polinomio de **grado 1** ($u = ax + b$). Ejemplos: $\int e^{4x + 1} \, dx = \tfrac{1}{4} e^{4x + 1} + C$; $\int \cos(3x) \, dx = \tfrac{1}{3} \sin(3x) + C$; $\int (2x - 1)^5 \, dx = \tfrac{(2x - 1)^6}{12} + C$. Foco: compensación de constante por el coeficiente lineal. | `sustitucion-lineal-inmediata` | 8 |
| B. Sustitución de grado superior y trascendentes | Integrales donde $u$ es un polinomio de **grado 2** o una función trascendente simple. Casos: $\int x \cos(x^2) \, dx$ con $u = x^2 \Rightarrow \tfrac{1}{2} \sin(x^2) + C$; $\int \tfrac{2x}{x^2 + 5} \, dx$ con $u = x^2 + 5 \Rightarrow \ln | x^2 + 5 | + C$; $\int \tfrac{\ln x}{x} \, dx$ con $u = \ln x \Rightarrow \tfrac{(\ln x)^2}{2} + C$; $\int \sin^n x \cos x \, dx$ con $u = \sin x \Rightarrow \tfrac{\sin^{n+1} x}{n + 1} + C$. Foco: reconocer la anatomía "función compuesta multiplicada por derivada del interior". | `sustitucion-grado-superior-trascendentes` | 7 |

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
- **Explicaciones en 3 párrafos**, con la estructura adaptada al formato del ítem: en el **troceado**, (1) de dónde sale el ajuste, con el despeje en su propio bloque display, (2) la reescritura completa, (3) por qué ese paso decide el resto; en **verificar derivando**, (1) la derivada de $F$ mostrada entera, (2) qué estructura del método revela esa cancelación, (3) qué pasaría con los candidatos vecinos; en **detectar el paso mal**, (1) derivar el resultado propuesto para exponer el desacuerdo, (2) el resultado corregido, (3) qué partes del desarrollo sí estaban bien.
- **Cada ítem de "detectar el paso mal" nombra el paso fallado, no el resultado correcto.** Las opciones son frases cortas del tipo "El ajuste del diferencial" o "El signo de la primitiva", nunca primitivas alternativas: si las opciones fueran expresiones, el ítem volvería a ser una resolución completa encubierta.
- **Coeficientes lineales simples** en sub-A: $u = 2x, 3x, 4x, 5x, -2x, 2x + 1, 3x - 1, 5x + 3$, etc.
- **Ningún $u$ de grado 3+** en RESL. Nada de $u = x^3$, $u = x^3 + 1$.
- **Fracciones tipo $\tfrac{g'(x)}{g(x)}$** cuando el numerador es exactamente la derivada del denominador (sub-B), patrón que dispara $\ln|g(x)|$.
- **Decimales con coma** (`4,3`).

---

## CLSF, 15 ejercicios

Agregada en ronda 2 (ago-2026). Ver Hallazgos de auditoría.

### Qué evalúa
**Selección de método sin resolver nada.** El repaso mezcla ítems de todos los topics de la unidad; sin esta skill, el estudiante siempre sabe de antemano que necesita sustitución solo porque el ejercicio salió del topic `substitution`. `CLSF` rompe esa señal: da un integrando y pregunta qué camino corresponde, entre **tabla directa**, **sustitución** y **acondicionamiento algebraico y después tabla** (partes todavía no se conoce en este punto del curso, ver Estado matemático del alumno). El estudiante nunca resuelve la integral, solo decide la ruta.

### Cardinalidad
**Exactamente 3 opciones** por ejercicio: `"Regla directa"`, `"Sustitución"`, `"Reescribir antes"`, en cualquier orden. Las tres etiquetas son fijas y están elegidas por paridad de longitud (regla 15); no se reformulan ítem a ítem.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Tabla directa vs. sustitución | El integrando es o bien una entrada elemental de tabla (sin ninguna composición), o bien una función compuesta con un factor que es, salvo constante, la derivada del interior. Ejemplos: $\int \cos x\,dx$ (tabla) vs. $\int x\cos(x^2)\,dx$ (sustitución); $\int e^{5x}\,dx$ (sustitución, no tabla: el exponente no es $x$ solo); $\int \tfrac1x\,dx$ (tabla, caso especial del logaritmo). Foco: distinguir cuándo el argumento es "$x$ solo" de cuándo es una composición con su derivada acompañando. | `tabla-directa-vs-sustitucion` | 8 |
| B. Acondicionamiento vs. sustitución genuina | Contraste entre integrandos que se resuelven con **álgebra pura** (repartir un cociente, reescribir una raíz o potencia) sin ninguna estructura de composición, y los que sí tienen esa estructura y piden sustitución genuina. Ejemplos: $\int \tfrac{x^3+5x}{x}\,dx$ (acondicionamiento: se reparte el denominador, no hay ninguna función compuesta) vs. $\int 2xe^{x^2}\,dx$ (sustitución genuina: el factor $2x$ es exactamente la derivada de $x^2$). Foco: reconocer que una fracción o una raíz no siempre implica sustitución; a veces es puro acomodo algebraico. | `acondicionamiento-vs-sustitucion-genuina` | 7 |

### `feedback_incorrect`, confusiones fuente

- **Tratar una sustitución lineal como regla directa**: en $\int e^{5x}\,dx$, dar por buena la opción "Regla directa" porque la forma se parece a $\int e^x\,dx$. El $5$ dentro del exponente exige compensar con $u=5x$.
- **Ver composición donde solo hay álgebra**: elegir "Sustitución" para $\int \tfrac{x^3+5x}{x}\,dx$ por ver una fracción, sin notar que se reparte término a término sin ningún cambio de variable.
- **Ver acondicionamiento donde hay sustitución genuina**: elegir "Reescribir antes" para $\int 2xe^{x^2}\,dx$, sin notar que $2x$ es exactamente la derivada de $x^2$: no hay ninguna reescritura posible que evite el cambio de variable acá.
- **No reconocer una entrada de tabla simple**: elegir "Sustitución" o "Acondicionamiento" para $\int \sec^2x\,dx$ o $\int 3\,dx$, buscando estructura donde no la hay.

### Reglas específicas
- **El enunciado nunca nombra el método** (regla 54 de `authoring-context.md`): ninguna apertura dice "esta integral se resuelve por sustitución" ni equivalente. Es la única skill de este topic donde esa restricción aplica; en ESTR y RESL el enunciado sí puede nombrar la técnica porque ahí no es lo que se evalúa.
- **Nunca aparece "partes" como opción**: en este punto del curso el alumno todavía no la conoce (ver Estado matemático del alumno). El tercer distractor siempre es "Reescribir antes".
- **Sin cálculo final**: ningún ítem pide el valor de la primitiva, solo la ruta.
- **Negrita en primera mención** de `tabla de integrales inmediatas`, `sustitución`, `acondicionamiento algebraico`.

---

## Hallazgos de auditoría (ronda 1, jul-2026)

Pre-revisión programática sobre los ejercicios de prueba existentes:

- **[CORREGIDO EN CONTENIDO] Bug `\n\n$$` generalizado**: los 2 archivos (`ESTR`, `RESL`, 30 ejercicios) tenían el bloque de desarrollo pegado con `\n\n$$` en vez de `\n$$`. Corregido con el mismo script de reemplazo mecánico.
- **`ESTR`: 8/15 ejercicios abren con `"Para resolver\n$$...$$\n..."` cortando la oración con la fórmula en el medio**, mismo patrón que en `parts` (regla crítica 9). Reescribir con cierre propio antes del bloque y la pregunta en su propia oración.
- **`RESL`: 15/15 con `"Calculá\n$$...$$"`.** Cláusula completa, solo le falta el `:` y variar la redacción (hoy 100% idéntica).

---

## Hallazgos de auditoría (ronda 2, ago-2026)

Testeo real en la app (sesión 447): 11/15 ítems de `ESTR` nombraban la técnica en la apertura (`"En una integral que se resuelve por sustitución..."`), anulando el efecto de intercalado porque el repaso mezcla topics y el estudiante ya sabía la respuesta antes de leer el resto. Se agrega `CLSF` (ver sección arriba) como la skill donde el método realmente se decide sin esa pista; `ESTR` conserva la mención del método porque ahí la tarea es otra (elegir $u$ o el diferencial, no el método en sí). **Por esto, `ESTR.json` no se reescribió en esta ronda**: las 15 aperturas actuales (`"sustitución"`/`"cambio de variable"`) quedan como están, ya con variación suficiente entre ítems (regla 32) y sin plantilla repetida.

---

## Hallazgos de auditoría (ronda 3, ago-2026)

Testeo real en la app (sesión 449). Dos hallazgos, uno de diseño y uno de redacción.

**1. `RESL` era un solo formato, y era el más caro.** Los 15 ítems pedían el resultado final de la integral, con 4 a 6 pasos encadenados cada uno. El usuario lo reportó sobre un ítem de `parts`, pero el diagnóstico aplica igual acá: *"son demasiados pasos, este ejercicio tiene que ser simplificado y troceado en ejercicios que evalúen distintas partes"*. La skill se reescribió entera con los tres formatos de la tabla de Formatos. **Se conservó todo el temario**: los mismos integrandos de antes siguen presentes, cambia la dirección de la pregunta, no el contenido evaluado. Las dos sub-familias y sus slugs quedaron igual, porque clasifican el objeto matemático y no el formato.

**2. Jerga estructural en las aperturas (regla 57, nueva).** El usuario: *"mucho jargon innecesario al principio, esto está pasando en todos los ejercicios; el propósito de la oración inicial es introducir con lenguaje tranquilo el problema, y luego cuando el usuario se choca con la fórmula ahí tiene que activar sistema 2"*. En este topic las aperturas decían "binomio lineal", "polinomio lineal", "recíproco de la variable", "argumento cuadrático", "potencia lineal". Ninguna de esas etiquetas ayuda a decidir nada y todas suponen vocabulario que el estudiante no tiene. Las aperturas nuevas describen la situación del ítem en lenguaje llano. Contraste útil, elogiado en el mismo testeo: *"En este integrando, el factor $2x$ que multiplica a la exponencial coincide exactamente con la derivada del exponente"*, que sí señala lo que hay que notar.

**Nota sobre `CLSF`**: la etiqueta de opción que antes decía *tabla directa* pasó a `"Regla directa"` en toda la unidad. Reporte textual: *"de la tabla? de que tabla? no se entiende que es tabla directa"*. La palabra *tabla* no aparece en ningún enunciado del topic, así que la opción pedía un vocabulario que el ejercicio nunca introduce.

---

## Hallazgos de auditoría (ronda 4, ago-2026)

Testeo real en la app (sesiones 450, 452 y 453). El hallazgo de fondo vale para toda la unidad: *"hay que revisar sistemáticamente los ejercicios que van muy directo a la integral y dar más contexto sobre las integrales, como parte del problema aunque no importen para la resolución; es bastante seco saltar a una resolución porque sí, sin ninguna motivación"*.

**1. `ESTR` sub-B arrancaba sin ninguna integral a la vista.** Los 7 ítems mostraban solo el cambio de variable, del tipo `"Antes de reemplazar en una integral, se planteó el cambio de variable: $u=4x-7$"`. Reporte textual: *"quizá agregaría la integral original para más contexto, sería agregar una oración y la integral centrada antes de todo lo que hay en el problema, y cambiar un poquito la primera oración actual, aplica para otros ejercicios"*. Cada ítem recibió una integral concreta coherente con su cambio, sin tocar opciones ni respuesta. El piso de contexto quedó fijado por el propio usuario sobre `ESTR#0`: *"así es lo mínimo de contexto que se debe dar en un ejercicio, de acá para arriba"*.

**2. `RESL#6` mostraba un resultado a medio camino sin decir de dónde salía.** Reporte: *"acá no diste contexto de que la sustitución es en una integral, hay que recordar que los ejercicios son independientes y los usuarios solo ven el enunciado y las opciones, ese es todo el contexto que tienen"*. Ahora abre con la integral original y después muestra el estado intermedio.

**3. Aperturas deícticas.** `"Acá..."` quedó prohibida por la regla 58: señala algo que todavía no se mostró. Sugerencia del usuario, adoptada como forma canónica: *"quizá en vez de 'acá', introduciría con 'En la siguiente integral...'"*.

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 3 skills):**
- [ ] `feedback_incorrect` completo en los 30 ejercicios: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
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
- [ ] 30 ejercicios; **exactamente 3 opciones** por ejercicio
- [ ] Distribución A/B respetada (15/15)
- [ ] Ningún cálculo integral final; solo elección de $u$ o ajuste del diferencial
- [ ] Sub-A con distractor mayoritario = "u = función exterior completa" o "u = derivada de la interior"
- [ ] Sub-B con distractor mayoritario = multiplicar en vez de dividir por el coeficiente
- [ ] **Sub-B: todo ítem muestra la integral concreta antes del cambio de variable** (ronda 4, regla 58)
- [ ] Textos exactos en opciones de elección de $u$ y de $dx$ (ver §Reglas específicas)

**RESL:**
- [ ] 30 ejercicios; **exactamente 4 opciones** por ejercicio, cada opción $\leq 35$ caracteres
- [ ] Sin contextos cotidianos
- [ ] Solo integrales indefinidas; ningún $\int_a^b$, ningún área
- [ ] Distribución A/B respetada (15/15)
- [ ] **Ningún ítem pide el resultado final de una integral** (ronda 3); los tres formatos de la tabla de Formatos están presentes en ambas sub-familias
- [ ] Los ítems troceados de reescritura piden explícitamente la forma "en $u$" en el enunciado
- [ ] Los ítems de "detectar el paso mal" tienen opciones que nombran el paso, nunca primitivas alternativas
- [ ] Cada error inyectado corresponde a una confusión de la lista de confusiones fuente
- [ ] Sub-A con $u = ax + b$ únicamente; compensación de constante en todos los ejercicios donde el coeficiente $\neq 1$
- [ ] Sub-B con $u$ hasta grado 2 o trascendente simple; casos $\tfrac{g'(x)}{g(x)}$ que disparan $\ln|·|$
- [ ] Al menos algunos ejercicios tienen "respuesta en $u$" como distractor deliberado
- [ ] $+C$ presente en toda opción que sea una primitiva, ausente en las que son integrales

**CLSF (ronda 2):**
- [ ] 30 ejercicios; **exactamente 3 opciones** por ejercicio (`"Regla directa"`, `"Sustitución"`, `"Reescribir antes"`)
- [ ] Distribución A/B respetada (15/15)
- [ ] **Ningún enunciado nombra el método** (única skill del topic con esta restricción)
- [ ] `"Partes"` nunca aparece como opción (el alumno todavía no la conoce en este punto del curso)
- [ ] Ningún ítem pide resolver la integral, solo elegir la ruta
