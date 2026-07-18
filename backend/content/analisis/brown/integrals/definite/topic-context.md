# Topic: definite (Integrales definidas)

Belt: `brown`, Unit: `integrals`, Topic: `definite`

Skills en este topic: `GRAF`, `RESL`. **50 ítems cada uno (100 en total)** al cerrar el refactor.

**Estado.** Este tópico **cierra el cinturón brown**. Es donde convergen todas las técnicas de integración vistas (tabla + sustitución + partes) evaluadas ahora en un intervalo, y donde el alumno interpreta geométricamente qué acumula la integral definida.

Los `external_id` se generarán como `brown_definite_graf_01…`, `brown_definite_resl_01…`.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** todo el cinturón violet (derivadas completas) + `definition` de integrales (anatomía, primitiva, linealidad, acondicionamiento previo) + `reglas` de integración inmediata (tabla completa con $\ln|x|$, casos especiales, etc.) + `substitution` ($u$-sub, con o sin compensación de constante) + `parts` (integración por partes con LIATE, factor oculto).
- **Lo que está aprendiendo acá:** la **integral definida** $\int_a^b f(x) \, dx = F(b) - F(a)$; la **Regla de Barrow** como puente entre la primitiva y el valor numérico exacto; el **Teorema Fundamental del Cálculo** como fundamento teórico; la interpretación geométrica del resultado como **área neta** con signos (áreas sobre el eje $x$ suman, áreas debajo restan); las **propiedades de los límites** de integración (inversión de límites cambia signo, límites iguales dan cero, aditividad sobre intervalos contiguos).
- **Lo que NO sabe todavía:** nada más allá de este tópico. **Áreas entre dos curvas**, **análisis de funciones** con integrales, **optimización** con integrales y el **TFC** en su versión aplicada avanzada quedan **fuera del alcance del curso** (eran temas del viejo cinturón `black`, hoy eliminado). El scope de este tópico es rigurosamente **una sola función vs eje $x$**.

### Regla dura

En este tópico se aplica **exclusivamente** el método de Barrow sobre una función y un intervalo. Se apoya en todas las técnicas del cinturón (tabla + sustitución + partes) pero el drill nuevo es la **evaluación en intervalo** y la **interpretación geométrica**.

**Prohibido**:

- **Áreas entre dos curvas** ($\int_a^b [f(x) - g(x)] \, dx$): fuera del alcance del curso.
- **Análisis de funciones con integrales** (crecimiento, concavidad, extremos vía integrales): fuera del alcance del curso.
- **Optimización con integrales**: fuera del alcance del curso.
- **Constante de integración $C$ en respuestas correctas**: en definidas la $C$ se **cancela** al restar $F(b) - F(a)$. Toda respuesta correcta muestra un **valor numérico** (no una expresión en $x$). $+C$ aparece **solo como distractor deliberado** en algunos ítems, con `feedback_incorrect` explícito ("en definidas la $C$ se cancela al restar").
- **Sustitución sin actualizar los límites**: en RESL sub-B con $u$-sub, cambiar los límites de integración a los nuevos valores en $u$ (o volver a $x$ antes de evaluar). Dejar la primitiva en $u$ evaluando con los límites originales en $x$ es un **distractor deliberado**.
- **Ninguna referencia a "suma de Riemann"** o construcciones formales de límite; se toma Barrow como definición operativa.

Los ítems que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 2 skills)

Reglas de authoring que se aplican al escribir los 100 ítems:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`, con enfoque **algorítmico**:
   - Para RESL: (a) identificar la técnica que arma la primitiva (regla directa, sustitución, partes) y calcular $F(x)$ en un `\begin{aligned}`; si hay sustitución, cambiar los límites o volver a $x$ antes de evaluar, (b) aplicar Barrow: escribir $F(b) - F(a)$ con los valores evaluados, (c) simplificar al valor numérico final y cerrar con advertencia técnica (no sumar $C$, cambiar los límites al sustituir, evaluar $F(a)$ correctamente aunque parezca cero).
   - Para GRAF: (a) leer el gráfico e identificar las regiones sobre y bajo el eje $x$, (b) calcular las áreas geométricas de cada región (fórmulas simples), asignar signo positivo a las de arriba y negativo a las de abajo, (c) sumar las áreas con sus signos para obtener el **área neta** que devuelve la integral definida.
   Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (prohibido estricto)**, sin humor.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Contrastar el error común con el procedimiento correcto ("sumaste $C$: en definidas la constante se cancela al restar $F(b) - F(a)$", "cambiaste el signo al invertir los límites: $\int_b^a = -\int_a^b$", "olvidaste actualizar los límites al sustituir", "sumaste las áreas sin signo: la integral definida da **área neta**"). Voz descriptiva, segunda persona amable.
4. **Negrita en primera mención** de conceptos clave: **integral definida**, **Regla de Barrow**, **Teorema Fundamental del Cálculo**, **área neta**, **límites de integración**. Nunca negritas dentro de `options`.
5. **Variables inline** ($x$, $F$, $a$, $b$) en la prosa.
6. **Ortotipografía**: decimales con **coma** (`4,3`). Sin nombres propios.
7. **`correct_index` variado**, no concentrado en un solo índice.
8. **$+C$ prohibido en respuestas correctas** (contraste con `reglas`, `substitution`, `parts` donde era obligatorio). Aparece como distractor deliberado.

---

## GRAF, 50 ítems

### Qué evalúa
**Interpretación visual** de la integral definida como **área neta**. Auditar si el alumno reconoce que áreas por debajo del eje $x$ computan negativas, y si maneja las **propiedades de los límites** al leerlas geométricamente.

### Cardinalidad
**3 opciones** si el ítem evalúa una propiedad conceptual (signo del resultado, interpretación de $\int_b^a$, aditividad). **4 opciones** cortas si se pide el valor numérico del área para forzar grilla 2×2.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Lectura de área con signos | Gráficos con figuras geométricas simples (formadas por funciones analíticas piecewise: rectas $f(x) = x$, $f(x) = 2 - x$; parábolas simples; semicírculo $\sqrt{r^2 - x^2}$) donde parte del área queda **arriba** del eje y parte **abajo**. Pedir la integral definida en todo el intervalo, esperando que el alumno **reste** las áreas negativas. Ejemplo: una función lineal a trozos que forma un triángulo arriba y otro abajo → $\int$ = área del de arriba menos área del de abajo. | `lectura-area-con-signos` | 25 |
| B. Propiedades de los límites en el gráfico | Interpretar geométricamente las propiedades. Casos: $\int_b^a f(x) \, dx = -\int_a^b f(x) \, dx$ (invertir límites cambia signo); $\int_a^a f(x) \, dx = 0$ (límites iguales); aditividad $\int_a^c f + \int_c^b f = \int_a^b f$ (fraccionar en intervalos contiguos). Todo desde un gráfico dado. | `propiedades-limites-integracion` | 25 |

### `feedback_incorrect`, confusiones fuente

- **Sumar áreas sin signo**: dar la suma de áreas absolutas cuando la integral pide **neta**. La integral definida devuelve $\text{(área arriba)} - \text{(área abajo)}$, no $\text{área arriba} + \text{área abajo}$.
- **Calcular solo el área sobre el eje**: ignorar la parte que va debajo. El intervalo entero cuenta; las áreas debajo del eje **restan**.
- **Restar al revés** (área arriba menos área abajo con signos invertidos): dar $-(\text{arriba}) + (\text{abajo})$. Confusión sobre qué área lleva signo negativo.
- **Ignorar el cambio de signo al invertir límites**: dar $\int_b^a f = \int_a^b f$. Invertir los límites de integración **multiplica el resultado por $-1$**: $\int_b^a f(x) \, dx = -\int_a^b f(x) \, dx$.
- **$\int_a^a$ no reconocida como cero**: intentar aplicar Barrow o calcular un área. Con límites iguales, el "intervalo" tiene ancho cero: la integral es $0$ sin cálculo.
- **Aditividad rota**: dar $\int_a^c + \int_c^b = 2 \int_a^b$ o similar. La aditividad respeta la partición: $\int_a^c f + \int_c^b f = \int_a^b f$ (mismo resultado, un solo intervalo dividido).
- **Confundir área con integral definida**: dar el valor absoluto (área geométrica pura) cuando se pide el valor de la integral (área neta con signos). Son conceptos **relacionados pero distintos**: la integral puede ser negativa; el "área" en sentido geométrico nunca lo es.

### Reglas específicas
- **Gráficos con funciones analíticas piecewise únicamente**: rectas ($f(x) = x$ en $[0, 2]$, $f(x) = 2 - x$ en $[2, 4]$, etc.), parábolas simples ($f(x) = x^2 - 1$, $f(x) = 4 - x^2$), semicírculos ($\sqrt{r^2 - x^2}$ para el superior, $-\sqrt{r^2 - x^2}$ para el inferior). Nada de figuras que no puedan describirse por `graph_fn`.
- **Áreas calculables por fórmulas geométricas** en sub-A: triángulos ($\tfrac{1}{2} b h$), rectángulos ($b \cdot h$), semicírculos ($\tfrac{\pi r^2}{2}$). El alumno **no** hace la integral analítica; lee el gráfico y aplica fórmula geométrica con signo.
- **Valores enteros pequeños** para dimensiones de las figuras ($b, h, r \in \{1, 2, 3, 4\}$) para que la suma de áreas dé un valor limpio.
- **Sub-B con opciones conceptuales** ($-\int_a^b f$, $\int_a^b f$, $0$, "no se puede determinar sin el valor exacto") para las propiedades.
- **Ninguna respuesta con $+C$**: en definidas la respuesta es un número (o expresión numérica limpia), nunca una primitiva.
- **Negrita en primera mención** de `integral definida`, `área neta`, `límites de integración`, `Regla de Barrow`.

---

## RESL, 50 ítems

### Qué evalúa
**Cálculo numérico final** aplicando Barrow. Convergen todas las técnicas: reglas directas, sustitución, partes. El nuevo drill es **evaluar la primitiva** en los límites y **restar correctamente**, cuidando los detalles operativos que distinguen definidas de indefinidas.

### Cardinalidad
**Exactamente 4 opciones** por ítem (grilla 2×2). Expresiones cortas (**$\leq 35$ caracteres**).

### Restricciones estrictas
- **Sin contextos cotidianos**. Mecánica pura.
- **Ítems diseñados para que $F(a)$ y $F(b)$ den valores simples** (enteros pequeños o fracciones limpias), de modo que la resta $F(b) - F(a)$ sea aritmética elemental. Los límites en sí pueden ser $0, 1, 2$ para polinómicas/exponenciales; $0, \pi/2, \pi$ para trigonométricas (siempre que la evaluación cierre en un entero pequeño o valor exacto).
- **$+C$ prohibido** en toda respuesta correcta. Aparece como **distractor deliberado** (respuesta que muestra la primitiva evaluada + $C$) en al menos algunos ítems.
- **En sustitución (sub-B)**: los límites se **actualizan** al cambiar a $u$ o la primitiva se **vuelve a $x$** antes de evaluar. Dejar la primitiva en $u$ evaluando con los límites originales es distractor deliberado.
- **Áreas entre curvas prohibidas**: solo una función vs eje $x$.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Barrow con reglas directas | Integrales definidas de polinomios, exponenciales y trigonométricas de tabla evaluadas en intervalos cortos. Ejemplos: $\int_0^2 (x^2 + 1) \, dx = \tfrac{8}{3} + 2 = \tfrac{14}{3}$; $\int_0^1 e^x \, dx = e - 1$; $\int_0^{\pi} \sin x \, dx = 2$. Foco: aplicar la tabla + Barrow correctamente, restar $F(a)$ aunque parezca cero (típico en exponenciales: $F(0) = 1$, no $0$). | `barrow-con-reglas-directas` | 25 |
| B. Barrow con Sustitución y Partes | Ítems que requieren un método avanzado para hallar la primitiva y **después** aplicar Barrow. Ejemplos: $\int_0^1 x e^x \, dx$ (por partes) $= 1$; $\int_0^2 x(x^2 + 1)^3 \, dx$ (por sustitución con $u = x^2 + 1$, límites $u = 1$ a $u = 5$) $= \tfrac{5^4 - 1^4}{8} = \tfrac{624}{8} = 78$; $\int_0^{\pi/2} x \cos x \, dx$ (por partes) $= \tfrac{\pi}{2} - 1$. Foco: coordinar la técnica del cinturón con la evaluación en los límites. | `barrow-con-sustitucion-y-partes` | 25 |

### `feedback_incorrect`, confusiones fuente

- **$+C$ sumada al resultado**: dar el resultado numérico $+ C$. En definidas la $C$ se **cancela** al restar $F(b) - F(a)$; la respuesta es un número puro.
- **$F(a)$ olvidada (asumida cero)**: en $\int_0^1 e^x \, dx$, dar $e$ en vez de $e - 1$. La primitiva es $e^x$, y $F(0) = e^0 = 1$, no $0$. Muy común en exponenciales y cosenos donde el "cero" del límite inferior parece que no aporta.
- **Resta al revés** ($F(a) - F(b)$ en vez de $F(b) - F(a)$): dar el negativo del resultado correcto. Barrow es **primero el límite superior menos el inferior**.
- **Límites no actualizados en sustitución**: en $\int_0^2 x(x^2 + 1)^3 \, dx$ con $u = x^2 + 1$, dejar la primitiva $\tfrac{u^4}{8}$ y evaluar $u = 0$ a $u = 2$ (los límites originales en $x$). Los límites correctos en $u$ son $u(0) = 1$ y $u(2) = 5$; alternativamente, volver a $x$ antes de evaluar.
- **Primitiva quedada en $u$ con límites originales**: variante del anterior. Da resultados absurdos porque estás evaluando la fórmula equivocada en los puntos equivocados.
- **Signo negativo de partes mal arrastrado**: en $\int_0^1 x e^x \, dx$ con partes ($u = x$, $dv = e^x \, dx$), armar $[x e^x]_0^1 - \int_0^1 e^x \, dx = e - (e - 1) = 1$. Errar el signo negativo o el término $uv$ evaluado da resultados distintos.
- **Aritmética al final descuidada**: llegar a $F(2) - F(0) = \tfrac{8}{3} + 2 - 0$ y dar $\tfrac{10}{3}$ en vez de $\tfrac{14}{3}$. La resta requiere denominador común ($\tfrac{8}{3} + \tfrac{6}{3} = \tfrac{14}{3}$).
- **Valor absoluto olvidado en $\ln$**: en $\int_1^2 \tfrac{1}{x} \, dx$, dar $\ln 2 - \ln 1 = \ln 2$. Está bien acá (ambos positivos), pero si el intervalo cruzara $x = 0$ el $\ln|·|$ importa. Como este tópico usa límites simples positivos, este error queda como distractor específico solo en ítems donde el signo importe.

### Reglas específicas
- **Explicaciones con estructura algorítmica**: (1) armar la primitiva usando la técnica correspondiente (tabla, sustitución, partes) en un `\begin{aligned}`; en sustitución señalar el cambio de límites o el retorno a $x$, (2) aplicar Barrow: escribir $F(b) - F(a)$ con los valores evaluados, (3) simplificar al valor numérico final y cerrar con advertencia técnica.
- **Ítems calibrados para evaluación limpia**: elegir integrando + límites tales que $F(a)$ y $F(b)$ sean enteros pequeños, fracciones simples ($\tfrac{1}{2}$, $\tfrac{1}{3}$, $\tfrac{2}{3}$), o expresiones exactas ($e$, $e - 1$, $\pi/2$, $\pi/2 - 1$). La resta debe ser aritmética elemental.
- **Sub-A**: cobertura balanceada de polinomios ($\int x^n \, dx$), exponenciales ($\int e^x$, $\int e^{2x}$, $\int a^x$), trigonométricas ($\int \sin$, $\int \cos$).
- **Sub-B**: cobertura balanceada de sustitución y partes, priorizando ítems donde el error "no cambié los límites" (sub) o "olvidé $uv$" (partes) sea el distractor más plausible.
- **Ninguna respuesta con $+C$** en las opciones correctas; **al menos algunos** ítems tienen "$+C$ sumada" como distractor deliberado.
- **Resultado como expresión simplificada final**: un número o expresión numérica exacta. No dejar $F(2) - F(0)$ sin resolver.
- **Decimales con coma** (`4,3`).

---

## Hallazgos de auditoría (ronda 1, jul-2026)

Pre-revisión programática sobre los ítems de prueba existentes:

- **[CORREGIDO EN CONTENIDO] Bug `\n\n$$` generalizado**: los 2 archivos (`GRAF`, `RESL`, 30 ítems) tenían el bloque de desarrollo pegado con `\n\n$$` en vez de `\n$$`. Corregido con el mismo script de reemplazo mecánico.
- **`GRAF#14`: `$$\text{integral definida (con signo)} \neq \text{área geométrica (siempre positiva)}$$`.** Viola la regla crítica 26: dentro de `\text{}` hay cláusulas con aclaración entre paréntesis, no un rótulo corto. Reescribir sacando las aclaraciones a la prosa que rodea la fórmula, dejando solo símbolos en el bloque (ej. `$$\text{integral definida} \neq \text{área geométrica}$$`, con "(con signo)"/"(siempre positiva)" movidos a la oración de antes o después).
- **`GRAF#6`/`#7`: `\text{área arriba}`, `\text{área abajo}` dentro de `$$...$$`.** Más borderline (2 palabras, sin paréntesis), probablemente tolerable como rótulo corto, pero conviene sacarlo a la prosa igual para no dar pie a que el patrón crezca al completar los 50 ítems.
- **`GRAF#9`/`#12`: opciones `["$0$", "$f(a)$", "No se puede determinar sin más datos"]`.** La correcta (`$0$`, 3 caracteres) es la más corta por lejos frente a un distractor de 36 caracteres. Reincidencia de la regla crítica 4/15 (paridad también en el sentido "la correcta es la única mucho más corta"). Igualar longitudes al completar los 50 ítems, no dejar la correcta como la única breve.
- **`RESL`: 15/15 ítems abren con `"Calculá\n$$...$$"`.** Mismo patrón que en el resto de la unidad: cláusula completa, solo falta el `:` y variar la redacción.

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 2 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna aplicación de áreas entre curvas, análisis de funciones, optimización, ni ningún tema fuera del alcance del curso
- [ ] Ningún resultado con $+C$ en respuestas correctas
- [ ] Al menos algunos ítems con "$+C$ sumada" como distractor deliberado con `feedback_incorrect` explícito
- [ ] Explicaciones en 3 párrafos de prosa; estructura algorítmica; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios; variables inline en la prosa
- [ ] `$$...$$` pegado con un solo `\n` (bug corregido en la ronda anterior, no reintroducirlo)
- [ ] **Ningún `\text{}` dentro de `$$...$$` lleva una aclaración entre paréntesis** (reincidencia confirmada en `GRAF#14`, regla crítica 26); rótulos cortos tipo "área arriba"/"área abajo" preferentemente movidos a la prosa
- [ ] **Ninguna opción numérica corta (`$0$`) queda como la única mucho más breve que un distractor largo** (reincidencia confirmada en `GRAF#9`/`#12`, regla crítica 4/15)
- [ ] **`"Calculá"` (RESL) tiene el `:` agregado** y varía de redacción ítem a ítem (regla crítica 32)

**GRAF:**
- [ ] 50 ítems; cardinalidad flexible (3 conceptual, 4 numérica corta)
- [ ] Distribución A/B respetada (25/25)
- [ ] Solo funciones analíticas piecewise para `graph_fn` (rectas, parábolas simples, semicírculos)
- [ ] Sub-A: figuras geométricas simples calculables por fórmula ($\tfrac{1}{2}bh$, $bh$, $\tfrac{\pi r^2}{2}$) con áreas arriba y abajo del eje; distractor mayoritario = "sumar sin signo"
- [ ] Sub-B: opciones conceptuales ($-\int_a^b f$, $0$, $\int_a^b f$, aditividad rota) para las propiedades de límites
- [ ] Dimensiones enteras pequeñas para que la suma neta sea limpia

**RESL:**
- [ ] 50 ítems; **exactamente 4 opciones** por ítem, cada opción $\leq 35$ caracteres
- [ ] Sin contextos cotidianos
- [ ] Distribución A/B respetada (25/25)
- [ ] Ítems calibrados: $F(a)$ y $F(b)$ dan valores simples (enteros pequeños, fracciones limpias, expresiones exactas)
- [ ] Sub-A con reglas directas de tabla (polinómicas, exponenciales, trigonométricas)
- [ ] Sub-B con sustitución (con actualización de límites o retorno a $x$) o partes (una iteración)
- [ ] Distractor mayoritario en sustitución = "olvidé cambiar los límites"
- [ ] Distractor mayoritario en partes = "signo negativo mal arrastrado" o "olvidé $uv$"
- [ ] Ningún resultado con $+C$; al menos algunos ítems con "$+C$ sumada" como distractor
- [ ] Ninguna integral cíclica; ninguna aplicación fuera del scope del cinturón brown
