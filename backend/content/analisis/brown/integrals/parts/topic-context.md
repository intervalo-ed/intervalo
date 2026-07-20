# Topic: parts (Integración por partes)

Belt: `brown`, Unit: `integrals`, Topic: `parts`

Skills en este topic: `ESTR`, `RESL`. **50 ejercicios cada uno (100 en total)** al cerrar el refactor.

Este topic tiene 2 ítems (uno por skill): `ESTR`, `RESL`. **50 ejercicios cada uno (100 en total)** al cerrar el refactor.

**Estado.** Este tópico introduce el **segundo método** de integración: la integración por partes. Se apoya en la regla del producto para derivadas y transforma una integral difícil en dos términos: un producto explícito $uv$ más una integral remanente $\int v \, du$ que se busca más simple que la original.

Los `external_id` se generarán como `brown_parts_estr_01…`, `brown_parts_resl_01…`.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** todo el cinturón violet (derivadas completas: elementales, producto, cociente, cadena) + `definition` de integrales (anatomía, primitiva, linealidad, acondicionamiento previo) + `reglas` de integración inmediata (tabla completa) + `sustitución` ($u$-sub).
- **Lo que está aprendiendo acá:** la **integración por partes** $\int u \, dv = uv - \int v \, du$. Cómo elegir $u$ y $dv$ (regla mnemotécnica **LIATE**: Logaritmo → Inversa trigonométrica → Algebraica → Trigonométrica → Exponencial, priorizando de izquierda a derecha para $u$), cómo calcular $du$ y $v$, cómo armar $uv - \int v \, du$ respetando el **signo negativo** de la fórmula, y cómo **diagnosticar** cuándo la iteración va a resolver el problema, cuándo va a requerir varias aplicaciones y cuándo va a generar un **ciclo** (integrales cíclicas del tipo $\int e^x \sin x \, dx$).
- **Lo que NO sabe todavía:** **integral definida** y **regla de Barrow**, **áreas** entre curvas, **Teorema Fundamental del Cálculo**.

### Regla dura

En este tópico se aplica **exclusivamente** el método de partes + tabla de integrales inmediatas (de `reglas`) + linealidad + eventualmente sustitución (si aparece dentro del paso intermedio, aunque no como método principal). Nada de definidas.

**Prohibido**:

- **Integral definida** ($\int_a^b$), **regla de Barrow**, **áreas**, **TFC**: fuera de scope.
- **Sustitución trigonométrica** o **fracciones parciales**: técnicas avanzadas, fuera de scope.
- **Resolución completa de integrales cíclicas** en RESL. Las cíclicas ($\int e^x \sin x \, dx$, $\int e^x \cos x \, dx$) aparecen **solo** en ESTR sub-B como diagnóstico ("esta integral es cíclica, requiere despejar la original"), no se resuelven en RESL.
- **Polinómicas de grado superior a 1 en RESL sub-A**. RESL sub-A trabaja con **una única iteración**, así que la polinómica siempre es lineal ($x$, no $x^2$). El caso $\int x^2 \sin x \, dx$ (que requiere 2 iteraciones) vive en **ESTR sub-B como diagnóstico** ("esta integral requiere aplicar la fórmula dos veces"), no en RESL.
- **Constante de integración $C$ omitida**: toda respuesta correcta lleva $+C$. Se mantiene el hábito.
- **Signo negativo de la fórmula omitido**: dar $uv + \int v \, du$ es un distractor clásico; siempre debe ser $uv - \int v \, du$.
- **$\ln|·|$ sin valor absoluto** cuando aplique.

Los ejercicios que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 2 skills)

Reglas de authoring que se aplican al escribir los 100 ejercicios:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`, con enfoque **algorítmico**: (a) elegir $u$ y $dv$ aplicando LIATE, calcular $du$ (derivando $u$) y $v$ (integrando $dv$) en un `\begin{aligned}`, (b) armar $uv - \int v \, du$, resolver la integral remanente (que debe ser de tabla o inmediata), (c) simplificar, agregar $+C$, y cerrar con advertencia técnica (signo negativo de la fórmula, elección LIATE, factor oculto). Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (prohibido estricto)**, sin humor.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Contrastar el error común con el procedimiento correcto ("elegiste LIATE al revés: LIATE prioriza logaritmo antes que trigonométrica", "olvidaste el signo negativo de la fórmula: es $uv - \int v \, du$", "no aplicaste el truco del factor oculto: $dv = 1 \, dx$"). Voz descriptiva, segunda persona amable.
4. **Negrita en primera mención** de conceptos clave: **integración por partes**, **regla LIATE**, **integrales cíclicas**, **factor oculto**. Nunca negritas dentro de `options`.
5. **Variables inline** ($u$, $dv$, $v$, $du$, $x$, $C$) en la prosa.
6. **Ortotipografía**: decimales con **coma** (`4,3`). Sin nombres propios.
7. **`correct_index` variado**, no concentrado en un solo índice.
8. **$+C$ obligatorio** en toda respuesta correcta y toda opción de RESL.

---

## ESTR, 50 ejercicios

### Qué evalúa
**Toma de decisiones previa al cálculo**. El alumno demuestra que sabe **armar el problema** aplicando LIATE, **predice el comportamiento del método** (una iteración vs varias vs cíclica) antes de gastar hojas en cálculos ciegos. Sin ejecutar la integral final.

### Cardinalidad
**Exactamente 3 opciones** por ejercicio.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Elección de variables y regla LIATE | Identificar qué función asume el rol de $u$ y cuál el de $dv$ para que la integral resultante sea más simple. Combinaciones clásicas: polinómica con logaritmo ($\int x^2 \ln x \, dx$: $u = \ln x$, $dv = x^2 \, dx$), polinómica con exponencial ($\int x e^x \, dx$: $u = x$, $dv = e^x \, dx$), polinómica con trigonométrica ($\int x \sin x \, dx$: $u = x$, $dv = \sin x \, dx$). LIATE prioriza L → I → A → T → E para elegir $u$. | `eleccion-variables-regla-liate` | 25 |
| B. Diagnóstico de iteración y ciclos | Predecir el comportamiento del método sin resolver. Casos: $\int x^2 e^x \, dx$ requiere **aplicar la fórmula dos veces** (grado 2 en polinómica); $\int e^x \sin x \, dx$ genera una **integral cíclica** (aplicar dos veces regresa a la original con signo cambiado, hay que **despejar**); $\int x^n \ln x \, dx$ cierra en **una** iteración cualquiera sea $n$. Distinguir estos comportamientos. | `diagnostico-iteracion-y-ciclos` | 25 |

### `feedback_incorrect`, confusiones fuente

- **LIATE invertida (elegir $u$ = exponencial en vez de polinómica)**: en $\int x e^x \, dx$, elegir $u = e^x$, $dv = x \, dx$. Esto da $du = e^x \, dx$ y $v = \tfrac{x^2}{2}$, y la integral remanente $\int \tfrac{x^2}{2} e^x \, dx$ es **más difícil** que la original. La regla LIATE prioriza Algebraica (A) sobre Exponencial (E): $u = x$, $dv = e^x \, dx$.
- **LIATE invertida (trigonométrica antes que polinómica)**: en $\int x \sin x \, dx$, elegir $u = \sin x$, $dv = x \, dx$. La integral remanente $\int \tfrac{x^2}{2} \cos x \, dx$ es peor. LIATE: Algebraica (A) antes de Trigonométrica (T): $u = x$.
- **Elegir $u = $ polinómica cuando hay logaritmo**: en $\int x^2 \ln x \, dx$, elegir $u = x^2$, $dv = \ln x \, dx$. Problema: integrar $\ln x$ requiere partes con factor oculto. LIATE: Logaritmo (L) antes que Algebraica (A): $u = \ln x$, $dv = x^2 \, dx$.
- **Sugerir sustitución en vez de partes**: proponer $u = x^2$ como sustitución para $\int x^2 \ln x \, dx$. La sustitución no simplifica productos de funciones de familias distintas; el método correcto es partes.
- **Creer que el método siempre resuelve en un paso**: dar como correcto "una iteración" para $\int x^2 e^x \, dx$. Grado 2 en polinómica requiere aplicar partes **dos veces** (cada aplicación reduce el grado en 1).
- **Confundir cíclica con sustitución**: proponer $u = e^x$ como sustitución para $\int e^x \sin x \, dx$. Las cíclicas requieren aplicar partes dos veces y **despejar** la integral original; no admiten sustitución.
- **No reconocer que $\int x^n \ln x$ es siempre una iteración**: predecir "$n$ iteraciones" para $\int x^5 \ln x \, dx$. Como $u = \ln x$ tiene derivada $\tfrac{1}{x}$, la integral remanente $\int \tfrac{x^{n+1}}{n+1} \cdot \tfrac{1}{x} \, dx = \tfrac{1}{n+1} \int x^n \, dx$ cierra directo.

### Reglas específicas
- **Sin cálculo integral final** en ESTR: solo elección de $u/dv$ o diagnóstico del comportamiento.
- **Opciones con textos exactos** para sub-A: mostrar la elección como `"u = x, dv = e^x \\, dx"` vs `"u = e^x, dv = x \\, dx"`. El distractor mayoritario es la elección invertida (que empeora la integral remanente).
- **Sub-B** con opciones tipo `"Requiere una iteración"`, `"Requiere dos iteraciones"`, `"Es cíclica (despejar la original)"`, `"No se puede resolver por partes"` (distractor). El distractor mayoritario en casos cíclicos es "una iteración"; en polinómica grado 2 es "una iteración".
- **Las integrales cíclicas** aparecen **solo en ESTR** como diagnóstico; nunca se resuelven acá.
- **Negrita en primera mención** de `integración por partes`, `regla LIATE`, `integrales cíclicas`.

---

## RESL, 50 ejercicios

### Qué evalúa
**Cálculo estructurado en una única iteración**: aplicar la fórmula $\int u \, dv = uv - \int v \, du$ con signo correcto, resolver la integral remanente (que debe cerrar en una fórmula de tabla), volver a $x$ si hubo sustitución auxiliar interna, agregar $+C$. Sin contextos cotidianos.

### Cardinalidad
**Exactamente 4 opciones** por ejercicio (grilla 2×2). Expresiones cortas (**$\leq 35$ caracteres**).

### Restricciones estrictas
- **Sin contextos cotidianos**. Mecánica pura.
- **Solo integrales indefinidas**. Nada de $\int_a^b$, nada de áreas, nada de Barrow.
- **Solo una iteración**: la polinómica siempre lineal (grado 1) en sub-A; el factor oculto ($dv = 1 \, dx$) o la fracción resultante en sub-B. Ningún $\int x^2 \sin x$ ni $\int x^3 e^x$.
- **Integrales cíclicas prohibidas** ($\int e^x \sin x$, $\int e^x \cos x$): fuera de RESL. Viven exclusivamente en ESTR sub-B como diagnóstico.
- **$+C$ obligatorio en todas las opciones**.
- **Signo negativo de la fórmula respetado**: distractores clásicos con $uv + \int v \, du$.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Aplicación directa de una iteración | Integrales que cierran aplicando partes **una única vez**. Polinómica de **grado 1** ($x$) combinada con trigonométrica o exponencial. Ejemplos: $\int x \sin x \, dx = -x \cos x + \sin x + C$; $\int x e^{2x} \, dx = \tfrac{x e^{2x}}{2} - \tfrac{e^{2x}}{4} + C$; $\int x \cos x \, dx = x \sin x + \cos x + C$. Foco: signo negativo de la fórmula, arrastre correcto de $u$, $v$, $du$, $dv$ y de la constante compensatoria si $dv = e^{ax} \, dx$ o $\sin(ax) \, dx$. | `aplicacion-directa-una-iteracion` | 25 |
| B. El factor oculto y reducciones cortas | Casos donde $dv = 1 \, dx$ (**factor oculto**: cuando el integrando es una única función que "no parece" un producto). Ejemplo: $\int \ln x \, dx = x \ln x - x + C$ (con $u = \ln x$, $dv = 1 \, dx$; la integral remanente $\int x \cdot \tfrac{1}{x} \, dx = \int 1 \, dx = x$). También casos donde el paso final requiere simplificar una **fracción** que sale directa de tabla: $\int x \ln x \, dx = \tfrac{x^2 \ln x}{2} - \tfrac{x^2}{4} + C$. | `factor-oculto-reducciones-cortas` | 25 |

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
- **Explicaciones con estructura algorítmica**: (1) elegir $u$ y $dv$ aplicando LIATE, calcular $du$ y $v$ en un `\begin{aligned}`, (2) armar $uv - \int v \, du$ y resolver la integral remanente (que debe ser de tabla o inmediata), (3) simplificar, agregar $+C$, cerrar con advertencia sobre el signo negativo, LIATE o factor oculto.
- **Polinómica siempre lineal en sub-A**: $\int x \sin x$, $\int x \cos x$, $\int x e^x$, $\int x e^{2x}$, $\int (2x + 1) \sin x$, etc. Ningún $x^2$ ni superior.
- **Sub-B con $dv = 1 \, dx$** para $\int \ln x \, dx$ y variantes cercanas ($\int \arctan x \, dx$ queda fuera porque involucra inversas trig que no vimos); y con reducción de fracciones para $\int x \ln x \, dx$ y similares.
- **Coeficientes lineales simples**: $2, 3, 4, -1, -2$. Sin fracciones incómodas.
- **Resultado como expresión simplificada final** en la variable $x$, con $+C$.
- **Decimales con coma** (`4,3`).

---

## Hallazgos de auditoría (ronda 1, jul-2026)

Pre-revisión programática sobre los ejercicios de prueba existentes:

- **[CORREGIDO EN CONTENIDO] Bug `\n\n$$` generalizado**: los 2 archivos (`ESTR`, `RESL`, 30 ejercicios) tenían el bloque de desarrollo pegado con `\n\n$$` en vez de `\n$$`. Corregido con el mismo script de reemplazo mecánico.
- **`ESTR`: 8/15 ejercicios abren con `"Para resolver\n$$...$$\npor partes, ¿cuál es la elección correcta de $u$ y $dv$ según LIATE?"`.** Es **una sola oración cortada por la fórmula** (la pregunta sigue en minúscula, gramaticalmente continuación de "para resolver X por partes"), viola la **regla crítica 9**, no solo la 32. Reescribir como `"Para resolver esta integral por partes:\n$$...$$\n¿Cuál es la elección correcta de $u$ y $dv$ según LIATE?"`.
- **`ESTR`: 7/15 con `"Considerá la integral\n$$...$$"`.** Cláusula completa, solo le falta el `:` y variar la redacción.
- **`RESL`: 15/15 con `"Calculá\n$$...$$"`.** Mismo caso que en `reglas`/`substitution`/`definite`: cláusula completa, solo falta el `:` y variar la redacción (hoy 100% idéntica).

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 2 skills):**
- [ ] `feedback_incorrect` completo en los 50 ejercicios: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna aplicación de integral definida, TFC, áreas, sustitución trigonométrica ni fracciones parciales
- [ ] Ninguna integral cíclica **resuelta** (solo diagnosticada en ESTR sub-B)
- [ ] Ninguna polinómica de grado $\geq 2$ en RESL (viven en ESTR sub-B como diagnóstico)
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
- [ ] 50 ejercicios; **exactamente 3 opciones** por ejercicio
- [ ] Distribución A/B respetada (25/25)
- [ ] Ningún cálculo integral final; solo elección $u/dv$ o diagnóstico
- [ ] Sub-A con distractor mayoritario = LIATE invertida (que empeora la integral remanente)
- [ ] Sub-B con opciones categorizadas ("una iteración", "dos iteraciones", "cíclica"); casos $x^2$ presentes como diagnóstico de "dos iteraciones"; casos $e^x \sin x$ presentes como diagnóstico de "cíclica"
- [ ] Textos exactos en opciones de elección de $u$ y $dv$

**RESL:**
- [ ] 50 ejercicios; **exactamente 4 opciones** por ejercicio, cada opción $\leq 35$ caracteres
- [ ] Sin contextos cotidianos
- [ ] Solo integrales indefinidas
- [ ] Distribución A/B respetada (25/25)
- [ ] Sub-A con polinómica siempre lineal (grado 1); una única iteración
- [ ] Sub-B con factor oculto ($dv = 1 \, dx$) o simplificación de fracción; una única iteración
- [ ] Al menos algunos ejercicios tienen "signo positivo en vez de negativo" ($uv + \int v \, du$) como distractor deliberado
- [ ] Al menos algunos ejercicios tienen "$+C$ olvidada" como distractor deliberado
- [ ] Ninguna integral cíclica en RESL
