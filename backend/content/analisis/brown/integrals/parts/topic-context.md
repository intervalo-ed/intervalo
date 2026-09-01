# Topic: parts (Integración por partes)

Belt: `brown`, Unit: `integrals`, Topic: `parts`

Skills en este topic: `ESTR`, `RESL`, `CLSF`. **30 ejercicios cada uno (90 en total)** al cerrar el refactor. `CLSF` se agregó en la ronda 2 (ago-2026, ver Hallazgos de auditoría) para la clasificación amplia tabla/sustitución/partes, ya con las tres técnicas conocidas.

Este topic tiene 3 ítems (uno por skill): `ESTR`, `RESL`, `CLSF`. **30 ejercicios cada uno (90 en total)** al cerrar el refactor.

**Estado.** Este tópico introduce el **segundo método** de integración: la integración por partes. Se apoya en la regla del producto para derivadas y transforma una integral difícil en dos términos: un producto explícito $uv$ más una integral remanente $\int v \, du$ que se busca más simple que la original.

Los `external_id` se generarán como `brown_parts_estr_01…`, `brown_parts_resl_01…`, `brown_parts_clsf_01…`.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** todo el cinturón violet (derivadas completas: elementales, producto, cociente, cadena) + `definition` de integrales (anatomía, primitiva, linealidad, acondicionamiento previo) + `reglas` de integración inmediata (tabla completa) + `sustitución` ($u$-sub).
- **Lo que está aprendiendo acá:** la **integración por partes** $\int u \, dv = uv - \int v \, du$. Cómo elegir $u$ y $dv$ (regla mnemotécnica **ILATE**: Inversa trigonométrica → Logaritmo → Algebraica → Trigonométrica → Exponencial, priorizando de izquierda a derecha para $u$), cómo calcular $du$ y $v$, cómo armar $uv - \int v \, du$ respetando el **signo negativo** de la fórmula, y cómo **distinguir** cuándo un integrando pide partes de cuándo pide sustitución, sobre pares de expresiones parecidas a primera vista (ver Regla dura, ronda 2).
- **Lo que NO sabe todavía:** **integral definida** y **regla de Barrow**, **áreas** entre curvas, **Teorema Fundamental del Cálculo**.

### Regla dura

En este tópico se aplica **exclusivamente** el método de partes + tabla de integrales inmediatas (de `reglas`) + linealidad + eventualmente sustitución (si aparece dentro del paso intermedio, aunque no como método principal). Nada de definidas.

**Prohibido**:

- **Integral definida** ($\int_a^b$), **regla de Barrow**, **áreas**, **TFC**: fuera de scope.
- **Sustitución trigonométrica** o **fracciones parciales**: técnicas avanzadas, fuera de scope.
- **Integrales cíclicas** ($\int e^x \sin x \, dx$, $\int e^x \cos x \, dx$) y **partes de dos o más iteraciones** ($\int x^2 e^x \, dx$, $\int x^2 \sin x \, dx$): **fuera de todo el topic, no solo de RESL** (revisado en ronda 2, ver Hallazgos de auditoría). Antes vivían diagnosticadas en ESTR sub-B; ese diagnóstico se sacó porque exceden el techo de carga mental del topic y porque nombrar el ciclo/la doble iteración es información que el enunciado le regala al alumno. `parts` completo trabaja **exclusivamente con integrales de una sola iteración**.
- **Polinómicas de grado superior a 1 en RESL sub-A**. RESL sub-A trabaja con **una única iteración**, así que la polinómica siempre es lineal ($x$, no $x^2$).
- **Constante de integración $C$ omitida**: toda respuesta correcta lleva $+C$. Se mantiene el hábito.
- **Signo negativo de la fórmula omitido**: dar $uv + \int v \, du$ es un distractor clásico; siempre debe ser $uv - \int v \, du$.
- **$\ln|·|$ sin valor absoluto** cuando aplique.
- **Techo de carga mental (regla 55 de `authoring-context.md`): respondible sin papel, <90s.** Ver Regla dura de RESL más abajo.

Los ejercicios que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 3 skills)

Reglas de authoring que se aplican al escribir los 90 ejercicios:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`, con enfoque **algorítmico**: (a) elegir $u$ y $dv$ aplicando ILATE, calcular $du$ (derivando $u$) y $v$ (integrando $dv$) en un `\begin{aligned}`, (b) armar $uv - \int v \, du$, resolver la integral remanente (que debe ser de tabla o inmediata), (c) simplificar, agregar $+C$, y cerrar con advertencia técnica (signo negativo de la fórmula, elección ILATE, factor oculto). Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (prohibido estricto)**, sin humor.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Contrastar el error común con el procedimiento correcto ("elegiste ILATE al revés: ILATE prioriza logaritmo antes que trigonométrica", "olvidaste el signo negativo de la fórmula: es $uv - \int v \, du$", "no aplicaste el truco del factor oculto: $dv = 1 \, dx$"). Voz descriptiva, segunda persona amable.
4. **Negrita en primera mención** de conceptos clave: **integración por partes**, **regla ILATE**, **factor oculto**. Nunca negritas dentro de `options`.
5. **Variables inline** ($u$, $dv$, $v$, $du$, $x$, $C$) en la prosa.
6. **Ortotipografía**: decimales con **coma** (`4,3`). Sin nombres propios.
7. **`correct_index` variado**, no concentrado en un solo índice.
8. **$+C$ obligatorio** en toda respuesta correcta y toda opción de RESL.

---

## ESTR, 15 ejercicios

### Qué evalúa
**Toma de decisiones previa al cálculo**. El alumno demuestra que sabe **armar el problema** aplicando ILATE (sub-A), y que puede **distinguir partes de sustitución** sobre integrandos casi idénticos a primera vista sin resolver ninguno (sub-B, rediseñada en ronda 2: ver Hallazgos de auditoría). Sin ejecutar la integral final en ningún caso.

### Cardinalidad
**Exactamente 3 opciones** por ejercicio.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Elección de variables y regla ILATE | Identificar qué función asume el rol de $u$ y cuál el de $dv$ para que la integral resultante sea más simple. Combinaciones clásicas: polinómica con logaritmo ($\int x^2 \ln x \, dx$: $u = \ln x$, $dv = x^2 \, dx$), polinómica con exponencial ($\int x e^x \, dx$: $u = x$, $dv = e^x \, dx$), polinómica con trigonométrica ($\int x \sin x \, dx$: $u = x$, $dv = \sin x \, dx$). ILATE prioriza I → L → A → T → E para elegir $u$. | `eleccion-variables-regla-liate` | 8 |
| B. Selección de método: partes vs. sustitución | El enunciado no anuncia la técnica (ver regla 54 de `authoring-context.md`; esta es la única sub-familia del topic donde el enunciado no puede nombrar el método, para no regalar la decisión). Pares de integrandos que se parecen a primera vista pero piden métodos distintos: $\int x\sin x\,dx$ (partes: producto de polinómica y trigonométrica, ninguna es la derivada de la otra) vs. $\int x\sin(x^2)\,dx$ (sustitución: $x$ es, salvo constante, la derivada de $x^2$); $\int \ln x\,dx$ (partes, factor oculto $dv=1\,dx$) vs. $\int \tfrac{\ln x}{x}\,dx$ (sustitución, $u=\ln x$); $\int xe^{2x}\,dx$ (partes) vs. $\int xe^{x^2}\,dx$ (sustitución). El criterio que discrimina: ¿alguna parte del integrando es (salvo constante) la derivada de otra parte? Si sí, sustitución; si no, partes. | `seleccion-partes-vs-sustitucion` | 7 |

### `feedback_incorrect`, confusiones fuente

- **ILATE invertida (elegir $u$ = exponencial en vez de polinómica)**: en $\int x e^x \, dx$, elegir $u = e^x$, $dv = x \, dx$. Esto da $du = e^x \, dx$ y $v = \tfrac{x^2}{2}$, y la integral remanente $\int \tfrac{x^2}{2} e^x \, dx$ es **más difícil** que la original. La regla ILATE prioriza Algebraica (A) sobre Exponencial (E): $u = x$, $dv = e^x \, dx$.
- **ILATE invertida (trigonométrica antes que polinómica)**: en $\int x \sin x \, dx$, elegir $u = \sin x$, $dv = x \, dx$. La integral remanente $\int \tfrac{x^2}{2} \cos x \, dx$ es peor. ILATE: Algebraica (A) antes de Trigonométrica (T): $u = x$.
- **Elegir $u = $ polinómica cuando hay logaritmo**: en $\int x^2 \ln x \, dx$, elegir $u = x^2$, $dv = \ln x \, dx$. Problema: integrar $\ln x$ requiere partes con factor oculto. ILATE: Logaritmo (L) antes que Algebraica (A): $u = \ln x$, $dv = x^2 \, dx$.
- **Sugerir sustitución en vez de partes**: proponer $u = x^2$ como sustitución para $\int x^2 \ln x \, dx$. La sustitución no simplifica productos de funciones de familias distintas; el método correcto es partes.
- **No detectar la derivada escondida (sub-B)**: elegir partes para $\int x\sin(x^2)\,dx$. $x$ es, salvo la constante $\tfrac12$, la derivada de $x^2$: eso es la marca de sustitución, no de partes. Intentar partes acá arrastra una integral remanente ($\int \tfrac{x^2}{2}\cos(x^2)\cdot 2x\,dx$) más difícil que la original.
- **Ver un producto donde no lo hay (sub-B)**: elegir partes para $\int \tfrac{\ln x}{x}\,dx$ por ver "dos funciones", cuando en realidad es $\ln x$ multiplicado por $\tfrac1x = (\ln x)'$: la marca exacta de sustitución con $u=\ln x$.
- **Elegir sustitución cuando ninguna parte es la derivada de la otra (sub-B)**: proponer $u=x$ o $u=\sin x$ como sustitución para $\int x\sin x\,dx$. Ni $x$ es la derivada de $\sin x$ ni $\sin x$ lo es de $x$; sin esa relación, sustitución no reduce nada y el método correcto es partes.

### Reglas específicas
- **Sin cálculo integral final** en ESTR: solo elección de $u/dv$ (sub-A) o selección de método (sub-B).
- **Opciones con textos exactos** para sub-A: mostrar la elección como `"u = x, dv = e^x \\, dx"` vs `"u = e^x, dv = x \\, dx"`. El distractor mayoritario es la elección invertida (que empeora la integral remanente).
- **Sub-B** con opciones `"Por partes"`, `"Sustitución"`, y una tercera plausible pero incorrecta según el par (ej. `"Tabla directa"` cuando ninguna de las dos aplica, o el método contrario mal etiquetado). El criterio de discriminación es siempre el mismo: ¿alguna parte del integrando es, salvo constante, la derivada de otra parte?
- **Ninguna integral cíclica ni de dos o más iteraciones aparece en este topic** (ver Regla dura, ronda 2): ni diagnosticada, ni resuelta, ni como distractor con nombre propio ("es cíclica", "requiere dos iteraciones").
- **Negrita en primera mención** de `integración por partes`, `regla ILATE`.

---

## RESL, 15 ejercicios

### Qué evalúa
**Cálculo estructurado en una única iteración, repartido en decisiones sueltas**: aplicar la fórmula $\int u \, dv = uv - \int v \, du$ con signo correcto, resolver la integral remanente, agregar $+C$. El estudiante recorre todo el procedimiento a lo largo de la sesión, pero **ningún ítem le pide ejecutarlo entero**. Sin contextos cotidianos.

### Formatos (ronda 3, ago-2026)

**Ningún ítem de esta skill pide el resultado final partiendo de la integral cruda.** Ese formato quedó descartado: exigía sostener de memoria la elección de roles, dos derivadas o primitivas auxiliares, el armado con su signo y la integral remanente, todo en un solo ítem. Reporte textual del testeo: *"veo mucho cálculo mental en tener que guardar en la cabeza, elegir $u$ y $v$, pensar $du$ y $v$, plantear la integral por partes, resolverla, son demasiados pasos, este ejercicio tiene que ser simplificado y troceado en ejercicios que evalúen distintas partes"*. El mismo temario se cubre con tres formatos, mezclados dentro de cada sub-familia:

| Formato | Regla | Qué se muestra | Qué se pregunta | Cant. |
|---|:--:|---|---|:-----:|
| **Paso troceado** | 56 | La integral con los roles ya repartidos, o el armado $uv-\int v\,du$ ya escrito | Cuánto vale $v$, cómo queda armada la fórmula, o cuál es el resultado desde el armado | 14 |
| **Verificar derivando** | 52 | Una expresión $F(x)$ candidata | De cuál de las cuatro integrales proviene | 8 |
| **Detectar el paso mal** | 53 | Una resolución completa con un error inyectado | Qué pieza del procedimiento falló | 8 |

El troceado cubre tres momentos del procedimiento, y ninguno de ellos pisa a `ESTR`, que se ocupa del **reparto de roles** ($u$ y $dv$) y de la discriminación partes contra sustitución:

1. **Obtener $v$** a partir de $dv$, que es donde vive la compensación de constante de las exponenciales con coeficiente.
2. **Armar la fórmula**, que es donde vive el cruce de signos y donde se ve si la derivada de $u$ efectivamente simplificó el integrando remanente. Es el paso más caro del método y el que más ítems merece.
3. **Cerrar desde el armado**, resolviendo la integral remanente ya escrita.

Los errores inyectados en "detectar el paso mal" salen de la lista de confusiones fuente de más abajo: signo de la fórmula perdido, coeficiente que no llega al segundo término, integral remanente mal simplificada. Nunca un error tipográfico ni arbitrario.

### Cardinalidad
**Exactamente 4 opciones** por ejercicio (grilla 2×2). Expresiones cortas (**$\leq 35$ caracteres**).

### Restricciones estrictas
- **Sin contextos cotidianos**. Mecánica pura.
- **Solo integrales indefinidas**. Nada de $\int_a^b$, nada de áreas, nada de Barrow.
- **Solo una iteración**: la polinómica siempre lineal (grado 1) en sub-A; el factor oculto ($dv = 1 \, dx$) o la fracción resultante en sub-B. Ningún $\int x^2 \sin x$ ni $\int x^3 e^x$.
- **Integrales cíclicas prohibidas** ($\int e^x \sin x$, $\int e^x \cos x$): fuera de todo el topic (ver Regla dura), no solo de RESL.
- **$+C$ obligatorio cuando la opción es un resultado cerrado.** En los ítems troceados que preguntan por $v$ o por el armado, y en los de verificación cuyas opciones son integrales, no corresponde $+C$: todavía no hay ningún resultado final escrito. El $v$ que se usa para armar la fórmula tampoco lo lleva, porque alcanza con una sola de las infinitas primitivas posibles.
- **Signo negativo de la fórmula respetado**: distractores clásicos con $uv + \int v \, du$.
- **Resultado en forma NO factorizada, tal como sale de $uv - \int v\,du$** (ej. $\tfrac{xe^{2x}}2-\tfrac{e^{2x}}4+C$, no $\tfrac{e^{2x}(2x-1)}4+C$). Factorizar a forma compacta es un paso extra que ninguna regla de este topic pide y que empuja el ítem contra el techo de carga mental (regla 55, ver Hallazgos de auditoría ronda 2).
- **Techo de carga mental (regla 55 de `authoring-context.md`): respondible sin papel, <90s.** Sin denominador > ~12 incluso en la forma sin factorizar. Un caso de sub-B que lo exceda (grado del polinomio dentro del logaritmo demasiado alto) se recalibra a un grado menor o se convierte a formato "verificar derivando" (regla 52).

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Aplicación directa de una iteración | Integrales que cierran aplicando partes **una única vez**. Polinómica de **grado 1** ($x$) combinada con trigonométrica o exponencial. Ejemplos: $\int x \sin x \, dx = -x \cos x + \sin x + C$; $\int x e^{2x} \, dx = \tfrac{x e^{2x}}{2} - \tfrac{e^{2x}}{4} + C$; $\int x \cos x \, dx = x \sin x + \cos x + C$. Foco: signo negativo de la fórmula, arrastre correcto de $u$, $v$, $du$, $dv$ y de la constante compensatoria si $dv = e^{ax} \, dx$ o $\sin(ax) \, dx$. | `aplicacion-directa-una-iteracion` | 8 |
| B. El factor oculto y reducciones cortas | Casos donde $dv = 1 \, dx$ (**factor oculto**: cuando el integrando es una única función que "no parece" un producto). Ejemplo: $\int \ln x \, dx = x \ln x - x + C$ (con $u = \ln x$, $dv = 1 \, dx$; la integral remanente $\int x \cdot \tfrac{1}{x} \, dx = \int 1 \, dx = x$). También casos donde el paso final requiere una **fracción** que sale directa de tabla, sin factorizar: $\int x \ln x \, dx = \tfrac{x^2 \ln x}{2} - \tfrac{x^2}{4} + C$; $\int x^2 \ln x \, dx = \tfrac{x^3 \ln x}{3} - \tfrac{x^3}{9} + C$. **Techo: no pasar de $\int x^2 \ln x\,dx$** (denominador 9); $\int x^3\ln x\,dx$ ya da denominador 16 y excede el techo de carga mental incluso sin factorizar (ver Hallazgos de auditoría ronda 2). | `factor-oculto-reducciones-cortas` | 7 |

### `feedback_incorrect`, confusiones fuente

- **Signo negativo omitido**: en $\int x \sin x \, dx$, dar $x \cos x + \sin x + C$ (con $+ x \cos x$ en vez de $-x \cos x$). La fórmula es $uv - \int v \, du$ con signo negativo antes de la integral remanente; además $v = -\cos x$ arrastra otro signo negativo. Doble atención al signo.
- **Fórmula con suma en vez de resta**: dar $uv + \int v \, du$. La fórmula correcta es $uv - \int v \, du$; el signo negativo es constitutivo.
- **$x$ no derivada en la integral remanente**: en $\int x \sin x \, dx$ con $u = x$, dar $\int v \, du = \int (-\cos x) \, dx$ como si $du = 1$ ya estuviera aplicado, pero mantener la $x$ como si no se hubiera derivado. La derivada de $u = x$ es $du = 1 \, dx$; la integral remanente no lleva $x$.
- **Integral del seno/coseno confundida en el paso intermedio**: en $\int x \cos x \, dx$ con $dv = \cos x \, dx$, dar $v = -\sin x$ en vez de $v = \sin x$. La primitiva de $\cos$ es $\sin$ (sin signo); la primitiva de $\sin$ es $-\cos$.
- **Factor oculto no aplicado en $\int \ln x \, dx$**: intentar "sacar" $\ln x$ como si tuviera primitiva directa de tabla, dando $\tfrac{(\ln x)^2}{2} + C$ o algo similar. El logaritmo natural no está en la tabla de integrales inmediatas; se requiere partes con **$dv = 1 \, dx$** (factor oculto): $u = \ln x$, $dv = 1 \, dx$.
- **Término $uv$ omitido**: en $\int \ln x \, dx$, dar solo $-x + C$ (resultado de la integral remanente) sin el $uv = x \ln x$. La fórmula da $uv - \int v \, du$; **ambos** términos aparecen.
- **Fracción mal simplificada en resultado**: en $\int x \ln x \, dx$, dar $\tfrac{x^2 \ln x}{2} - x + C$ (olvidando el $\tfrac{x^2}{4}$ del paso $\int \tfrac{x^2}{2} \cdot \tfrac{1}{x} \, dx = \tfrac{1}{2} \int x \, dx = \tfrac{x^2}{4}$).
- **Compensación de constante lineal olvidada en $dv = e^{ax} \, dx$**: en $\int x e^{2x} \, dx$, dar $x e^{2x} - \int e^{2x} \, dx$ y luego $x e^{2x} - e^{2x} + C$ olvidando el factor $\tfrac{1}{2}$ que sale de integrar $e^{2x}$. El $v$ correcto es $v = \tfrac{e^{2x}}{2}$, y ese $\tfrac{1}{2}$ se arrastra en ambos términos: $\tfrac{x e^{2x}}{2} - \tfrac{1}{2} \int e^{2x} \, dx = \tfrac{x e^{2x}}{2} - \tfrac{e^{2x}}{4} + C$.

### Reglas específicas
- **Explicaciones en 3 párrafos**, con la estructura adaptada al formato del ítem: en el **troceado**, (1) de dónde sale la pieza que se pide, con el cálculo en su propio bloque display, (2) el resultado del paso completo, (3) por qué ese paso condiciona el resto; en **verificar derivando**, (1) la derivada de $F$ mostrada entera con su cancelación, (2) qué estructura del método explica esa cancelación, (3) qué pasaría con los candidatos vecinos; en **detectar el paso mal**, (1) derivar el resultado propuesto para exponer el desacuerdo, (2) el resultado corregido, (3) qué partes del desarrollo sí estaban bien resueltas.
- **Cada ítem de "detectar el paso mal" nombra el paso fallado, no el resultado correcto.** Las opciones son frases cortas del tipo "El signo entre los dos términos" o "El coeficiente del segundo término", nunca resultados alternativos: si las opciones fueran expresiones, el ítem volvería a ser una resolución completa encubierta.
- **Polinómica siempre lineal en sub-A**: $\int x \sin x$, $\int x \cos x$, $\int x e^x$, $\int x e^{2x}$, $\int (2x + 1) \sin x$, etc. Ningún $x^2$ ni superior.
- **Sub-B con $dv = 1 \, dx$** para $\int \ln x \, dx$ y variantes cercanas ($\int \arctan x \, dx$ queda fuera porque involucra inversas trig que no vimos); y con reducción de fracciones para $\int x \ln x \, dx$ y similares.
- **Coeficientes lineales simples**: $2, 3, 4, -1, -2$. Sin fracciones incómodas.
- **Resultado como expresión simplificada final** en la variable $x$, con $+C$.
- **Decimales con coma** (`4,3`).

---

## CLSF, 15 ejercicios

Agregada en ronda 2 (ago-2026). Ver Hallazgos de auditoría.

### Qué evalúa
**Selección de método sin resolver nada, entre las tres técnicas completas.** A esta altura del curso el alumno ya conoce tabla, sustitución y partes: `CLSF` da un integrando y pregunta qué camino corresponde, entre **tabla directa**, **sustitución** y **por partes** (y, en la sub-familia B, también **reescribir antes** cuando el integrando se resuelve con álgebra básica sin ningún método avanzado). El estudiante nunca resuelve la integral, solo decide la ruta.

### Cardinalidad
**Exactamente 3 opciones** por ejercicio, siempre un subconjunto de `{"Regla directa", "Sustitución", "Por partes", "Reescribir antes"}` según lo que el ítem discrimine.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Reconocimiento amplio: tabla, sustitución y partes | Casos limpios de cada una de las tres técnicas, sin ambigüedad. Ejemplos: $\int e^x\,dx$ (tabla); $\int \cos(3x-2)\,dx$ (sustitución, argumento lineal); $\int x\sin x\,dx$ (partes, ninguna es la derivada de la otra); $\int x^2\ln x\,dx$ (partes, ILATE); $\int \ln x\,dx$ (partes, factor oculto). Foco: reconocer de un vistazo la estructura que cada técnica exige, con opciones `"Tabla directa"`/`"Sustitución"`/`"Por partes"`. | `reconocimiento-amplio-tabla-sustitucion-partes` | 8 |
| B. Reescribir antes o método avanzado | Contraste entre integrandos que se resuelven con **álgebra pura** (repartir un cociente, reescribir una raíz) sin ningún método avanzado, y los que sí necesitan sustitución o partes genuinas. Ejemplos: $\int \tfrac{x^4+3x^2}{x^2}\,dx$ (reescribir antes: se reparte, no hay composición ni producto) vs. $\int xe^{x^2}\,dx$ (sustitución genuina) vs. $\int x\ln x\,dx$ (partes genuina, producto sin relación de derivada). El par más fino: $\int x\ln x\,dx$ (partes) vs. $\int \tfrac{\ln x}{x}\,dx$ (sustitución), mismo logaritmo, distinta posición. Foco: no toda fracción o composición aparente implica un método avanzado. | `algebra-previa-o-metodo-avanzado` | 7 |

### `feedback_incorrect`, confusiones fuente

- **Ver producto donde hay composición**: elegir "Por partes" para $\int xe^{x^2}\,dx$, sin notar que $x$ es, salvo constante, la derivada de $x^2$.
- **Ver composición donde hay álgebra pura**: elegir "Sustitución" o "Por partes" para $\int \tfrac{x^4+3x^2}{x^2}\,dx$, sin notar que se reparte término a término sin ningún método avanzado.
- **No reconocer el factor oculto**: elegir "Tabla directa" para $\int \ln x\,dx$, sin notar que el logaritmo natural solo no es una entrada de tabla y necesita partes con $dv=1\,dx$.
- **Confundir la posición del logaritmo**: elegir "Sustitución" para $\int x\ln x\,dx$ (multiplicando) o "Por partes" para $\int \tfrac{\ln x}{x}\,dx$ (dividiendo). La posición del logaritmo, multiplicando o dividiendo, cambia por completo el método.

### Reglas específicas
- **El enunciado nunca nombra el método** (regla 54 de `authoring-context.md`), igual que en `substitution/CLSF`.
- **Sin cálculo final**: ningún ítem pide el valor de la primitiva, solo la ruta.
- **Sub-A usa siempre `{"Regla directa", "Sustitución", "Por partes"}`.** Sub-B combina `"Reescribir antes"` con dos de las otras tres, eligiendo el par que resulte plausible para ese integrando: donde el error natural es creer que ya sale de tabla, el tercer distractor es `"Regla directa"`; donde el error natural es ver un producto, es `"Por partes"`. Esa elección también mantiene la paridad de longitud: `"Reescribir antes"` mide 16 y necesita al menos un acompañante largo para no delatarse (regla 4).
- **Negrita en primera mención** de `tabla de integrales inmediatas`, `producto de dos funciones`, `factor oculto`, `álgebra básica`.

---

## Hallazgos de auditoría (ronda 1, jul-2026)

Pre-revisión programática sobre los ejercicios de prueba existentes:

- **[CORREGIDO EN CONTENIDO] Bug `\n\n$$` generalizado**: los 2 archivos (`ESTR`, `RESL`, 30 ejercicios) tenían el bloque de desarrollo pegado con `\n\n$$` en vez de `\n$$`. Corregido con el mismo script de reemplazo mecánico.
- **`ESTR`: 8/15 ejercicios abren con `"Para resolver\n$$...$$\npor partes, ¿cuál es la elección correcta de $u$ y $dv$ según ILATE?"`.** Es **una sola oración cortada por la fórmula** (la pregunta sigue en minúscula, gramaticalmente continuación de "para resolver X por partes"), viola la **regla crítica 9**, no solo la 32. Reescribir como `"Para resolver esta integral por partes:\n$$...$$\n¿Cuál es la elección correcta de $u$ y $dv$ según ILATE?"`.
- **`ESTR`: 7/15 con `"Considerá la integral\n$$...$$"`.** Cláusula completa, solo le falta el `:` y variar la redacción.
- **`RESL`: 15/15 con `"Calculá\n$$...$$"`.** Mismo caso que en `reglas`/`substitution`/`definite`: cláusula completa, solo falta el `:` y variar la redacción (hoy 100% idéntica).

---

## Hallazgos de auditoría (ronda 2, ago-2026)

Testeo real en la app (sesión 447) más un pedido explícito de acotar la unidad a integrales de una sola iteración:

- **ESTR sub-B rediseñada**: `diagnostico-iteracion-y-ciclos` (ítems 7, 8, 9, 11, 12: $\int x^2e^x$, $\int e^x\sin x$, $\int x^2\sin x$, $\int e^x\cos x$) se reemplaza por `seleccion-partes-vs-sustitucion`. Motivo doble: (a) diagnosticar ciclos/dos iteraciones no aporta nada si esas integrales nunca se resuelven en ningún lado del topic; (b) mantenerlas ahí contradecía el pedido de acotar la unidad a una sola iteración. Ver tabla de sub-familia B arriba.
- **Defecto encontrado, no una regla nueva**: `RESL` traía sub-B **factorizada** a forma compacta ($\tfrac{e^{2x}(2x-1)}4+C$, $\tfrac{x^2(2\ln x-1)}4+C$, etc.) en vez de la forma sin factorizar que esta spec siempre pidió como ejemplo canónico (línea de sub-A arriba: $\tfrac{xe^{2x}}2-\tfrac{e^{2x}}4+C$). La factorización es un paso extra no pedido por ninguna regla del topic, y fue lo que empujó `RESL#1`, `#9`, `#14` (ítems $\int xe^{2x}$, $\int x\ln x$, $\int x^2\ln x$) contra el techo de carga mental. Revertir a la forma sin factorizar los deja en L2/L3, sin tocar qué evalúan.
- **`RESL#12`** ($\int x^3\ln x\,dx$): incluso sin factorizar, el denominador (16) excede el techo. Se recalibra a un grado menor (ver tabla sub-B) o se convierte a "verificar derivando" (regla 52).
- **`CLSF` agregada**: cubre la clasificación amplia (tabla/sustitución/partes) que `ESTR` sub-B, tras el rediseño, ya no cubre. Este es el punto del topic donde el efecto de intercalado rinde más (Rohrer, d=0.83): las tres técnicas ya están todas disponibles.

## Hallazgos de auditoría (ronda 3, ago-2026)

Testeo real en la app (sesión 449). El reporte apuntó a este topic con dos ítems concretos y dejó un diagnóstico que vale para toda la unidad.

**1. `RESL` era un solo formato, y era el más caro de todos.** Sobre `RESL#5` ($\int 3x\sin x\,dx$): *"este ejercicio es interesante pero veo mucho cálculo mental en tener que guardar en la cabeza… son demasiados pasos, este ejercicio tiene que ser simplificado y troceado en ejercicios que evalúen distintas partes"*. Sobre `RESL#8` ($\int \ln x\,dx$): *"un poco quilombo los pasos mentales para este"*. La skill se reescribió entera con los tres formatos de la tabla de Formatos. **Se conservó todo el temario**: los mismos integrandos siguen presentes, incluidos los dos reportados, que ahora se preguntan en la dirección inversa. Las dos sub-familias y sus slugs quedaron igual, porque clasifican el objeto matemático y no el formato.

**2. Jerga estructural en las aperturas (regla 57, nueva).** El usuario, sobre un ítem de `reglas` pero señalando el patrón: *"mucho jargon innecesario al principio, esto está pasando en todos los ejercicios; el propósito de la oración inicial es introducir con lenguaje tranquilo el problema, y luego cuando el usuario se choca con la fórmula ahí tiene que activar sistema 2"*. En este topic las aperturas decían "coeficiente que se arrastra", "binomio", "integrando". La apertura de `RESL#5` además adelantaba la trampa del ítem. Las nuevas describen la situación en lenguaje llano y sin filtrar nada.

**3. `CLSF`, tres reportes puntuales.** `CLSF#7` ($\int x^4\,dx$) abría con *"Esta integral es una potencia elemental de la tabla"* y la opción correcta era `"Tabla directa"`: el enunciado contenía la respuesta literal, violación directa de la regla 51. `CLSF#2` usaba *"binomio lineal"* y además adelantaba el criterio discriminador. `CLSF#11` abría repitiendo lo que la fórmula ya muestra: *"acá la primera oración tiene que ayudar un poquito a la intuición del estudiante, no repetir lo mismo que va a ver en la fórmula"*. La etiqueta `"Tabla directa"` se reemplazó por `"Regla directa"` en toda la unidad: *"de la tabla? de que tabla? no se entiende que es tabla directa"*.

---

## Hallazgos de auditoría (ronda 4, ago-2026)

Testeo real en la app (sesión 452), sobre el mismo defecto de fondo que atravesó a toda la unidad: los ítems que arrancan en un paso intermedio sin mostrar de dónde salió ese paso.

**1. Los troceados que empiezan desde el armado no mostraban la integral original.** `RESL#4` y `RESL#14` abrían directamente con la expresión ya armada. Reporte del usuario sobre el segundo: *"quizá daría un poco más de introducción"*. Ahora los dos muestran primero la integral y el reparto de roles elegido, y recién después el armado pendiente. Regla 58 de `authoring-context.md`.

**2. `ESTR` sub-A tenía una plantilla repetida y una oración rota.** Los 8 ítems abrían con `"Este integrando multiplica X por Y"`, que describe exactamente lo que la fórmula de abajo ya muestra (regla 57b), y la glosa de ILATE estaba escrita como un fragmento sin verbo del tipo `"Según la prioridad ILATE, el orden que indica qué familia conviene derivar antes."` en 7 de los 8. Reporte sobre `ESTR#3`: *"acá se introdujo lo mismo que se ve en la función, no es muy amigable la introducción"*. Las 8 aperturas se reescribieron señalando algo que el estudiante tendría que notar, y la glosa de ILATE pasó a ser una oración completa.

**3. `ESTR#8` y `ESTR#14`** repetían la fórmula en la apertura, mismo defecto. Reescritas.

**4. `CLSF`**: la etiqueta `"Álgebra previa"` pasó a `"Reescribir antes"`, y las aperturas deícticas `"Acá..."` quedaron prohibidas por la regla 58. En sub-B el tercer distractor dejó de ser siempre `"Por partes"`: ahora se elige el que resulte plausible para ese integrando, lo que además sostiene la paridad de longitud con la etiqueta nueva, que mide 16.

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 2 skills):**
- [ ] `feedback_incorrect` completo en los 30 ejercicios: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna aplicación de integral definida, TFC, áreas, sustitución trigonométrica ni fracciones parciales
- [ ] Ninguna integral cíclica en ningún ítem del topic, ni resuelta ni diagnosticada (ronda 2, ver Hallazgos de auditoría)
- [ ] Ninguna polinómica de grado $\geq 2$ en RESL
- [ ] $+C$ presente en toda respuesta correcta y toda opción
- [ ] Signo negativo de la fórmula respetado ($uv - \int v \, du$)
- [ ] $\ln|·|$ con valor absoluto cuando aplique
- [ ] Explicaciones en 3 párrafos de prosa; estructura algorítmica; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios; variables inline en la prosa
- [ ] `$$...$$` pegado con un solo `\n` (bug corregido en la ronda anterior, no reintroducirlo)
- [ ] **`"Para resolver"` (ESTR) reescrito como cláusula completa que no corta la oración con la fórmula en el medio** (regla crítica 9); **`"Considerá la integral"` (ESTR) y `"Calculá"` (RESL) tienen el `:` agregado** y varían de redacción ejercicio a ejercicio (regla crítica 32)
- [ ] Ningún `\begin{aligned}` alinea con `=` datos evaluados de forma independiente (regla crítica 30)

**ESTR:**
- [ ] 30 ejercicios; **exactamente 3 opciones** por ejercicio
- [ ] Distribución A/B respetada (15/15)
- [ ] Ningún cálculo integral final; solo elección $u/dv$ (sub-A) o selección de método (sub-B)
- [ ] Sub-A con distractor mayoritario = ILATE invertida (que empeora la integral remanente)
- [ ] **Sub-B con opciones `"Por partes"`/`"Sustitución"`/tercera plausible**, sobre pares de integrandos parecidos (ronda 2, reemplaza el diagnóstico de iteración/ciclos); ningún enunciado de esta sub-familia nombra el método
- [ ] Textos exactos en opciones de elección de $u$ y $dv$
- [ ] **Ninguna integral cíclica ni de dos o más iteraciones en ningún ítem del topic** (ronda 2)

**RESL:**
- [ ] 30 ejercicios; **exactamente 4 opciones** por ejercicio, cada opción $\leq 35$ caracteres
- [ ] Sin contextos cotidianos
- [ ] Solo integrales indefinidas
- [ ] Distribución A/B respetada (15/15)
- [ ] Sub-A con polinómica siempre lineal (grado 1); una única iteración
- [ ] Sub-B con factor oculto ($dv = 1 \, dx$) o simplificación de fracción; una única iteración; **grado del polinomio dentro del $\ln$ tope $x^2$** (denominador 9), no $x^3$ (ronda 2)
- [ ] Al menos algunos ejercicios tienen "signo positivo en vez de negativo" ($uv + \int v \, du$) como distractor deliberado
- [ ] Ninguna integral cíclica en RESL
- [ ] **Ningún ítem parte de la integral cruda y pide el resultado final** (ronda 3); los tres formatos de la tabla de Formatos están presentes en ambas sub-familias
- [ ] Ningún ítem troceado pregunta por el reparto de roles, que es territorio de `ESTR`
- [ ] Los ítems de "detectar el paso mal" tienen opciones que nombran el paso, nunca resultados alternativos
- [ ] Cada error inyectado corresponde a una confusión de la lista de confusiones fuente
- [ ] **Resultado correcto en forma sin factorizar** (ronda 2, reincidencia confirmada en RESL#1/#9/#14); **ningún ítem excede el techo de carga mental** (regla 55)
- [ ] $+C$ presente en toda opción que sea un resultado cerrado, ausente en las que son integrales o valores de $v$

**CLSF (ronda 2):**
- [ ] 30 ejercicios; **exactamente 3 opciones** por ejercicio, subconjunto de `{"Regla directa", "Sustitución", "Por partes", "Reescribir antes"}`
- [ ] Distribución A/B respetada (15/15)
- [ ] **Ningún enunciado nombra el método** (única skill del topic con esta restricción, junto con `substitution/CLSF`)
- [ ] Sub-A usa siempre las 3 opciones sin "Reescribir antes"; sub-B siempre la incluye, acompañada del par plausible para ese integrando
- [ ] Ningún ítem pide resolver la integral, solo elegir la ruta
