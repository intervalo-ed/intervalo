# Ejercicios con tabla: investigación, diseño y cómo trasladarlo a otros cursos

Este documento es el punto de partida para llevar el formato **tabla** a `analisis` y `algebra`.
Tiene tres partes:

1. **La investigación pedagógica**, que es lo que no hay que volver a hacer desde cero.
2. **Las decisiones de diseño y su evidencia**, o sea por qué el formato quedó como quedó.
3. **El traslado**: dónde entra en cada curso, dónde está contraindicado, y el protocolo para
   repetir la investigación con el rigor de la primera vez.

Las reglas operativas viven en `authoring-context.md` (R68-R75) y la forma del campo en su sección
*Tablas*. Acá está el **porqué**; allá el **qué**.

Convención de evidencia, la misma que se usó al investigar:
**[LIT]** = respaldado por literatura leída en fuente primaria · **[LIT-2ª]** = cita verificada en
una fuente secundaria, original no accesible · **[INF]** = inferencia razonada, sin respaldo directo.

---

## Parte 1 — Qué entrena este formato

### 1.1 Los tres modos de pensamiento funcional

**[LIT]** Stephens, Ellis, Blanton & Brizuela (2020, *JRME* 51(5)) modelan el pensamiento
funcional en tres modos, en orden creciente:

| Modo | Qué hace el alumno | Ejemplo |
|---|---|---|
| **Recursivo** | Mira una sola columna | "la salida sube de a 3" |
| **Covariacional** | Coordina los dos cambios | "cuando la entrada sube 1, la salida sube 3" |
| **Correspondencia** | Relaciona entrada con salida | "la salida es la entrada más 3" |

Solo el tercero produce una fórmula. El formato tabla apunta ahí, que es el **objetivo terminal**
de una progresión que en early algebra lleva años. No es un ejercicio fácil disfrazado de tabla.

### 1.2 El riesgo estructural: inducción ingenua

**[LIT]** Radford (2006, PME-NA 28) distingue **generalización algebraica** de **inducción
ingenua**: probar reglas y chequear contra algunos casos. Transcribe a un grupo que produjo una
fórmula correcta y, al preguntarles cómo la encontraron, respondió *"la encontramos de casualidad"*.

Su frase, que conviene tener presente al diseñar: *"así como no toda simbolización es algebraica,
no toda actividad de patrones lleva a pensamiento algebraico"*.

**Un ítem de opción múltiple con tabla es, por su mecánica, una invitación estructural a la
inducción ingenua**: le servís al alumno 3 o 4 hipótesis y 3 casos para testearlas. Casi todo el
diseño del formato es pelear contra eso.

### 1.3 La advertencia sobre tablas existe desde 1995

**[LIT]** Radford (2006), citando a MacGregor & Stacey (1992, 1995) y Castro Martínez (1995):

> "las tablas X-Y enfatizaban un aspecto formulaico de la generalidad basado en heurísticas de
> ensayo y error, confinando a las notaciones algebraicas al estatus de marcadores de posición con
> muy poco significado algebraico."

**[LIT]** Moss, Boyce & Lamberg (2020, *IEJME* 15(2)) agregan una segunda advertencia, distinta:
*"una representación de tabla de función puede connotar a las variables como valores conocidos"*,
en vez de como cantidades que varían. La tabla, sola, empuja a leer la letra como un número fijo.

**Ninguna de las dos invalida el formato. Las dos dicen qué hay que compensar por diseño.**

### 1.4 El dato que decide el diseño

**[LIT]** Stephens, Fonger, Blanton & Knuth (2016, AERA ED566523), 104 estudiantes. Misma tabla,
entradas consecutivas 1..7, dos consignas distintas:

| Consigna | Respuesta recursiva | Respuesta funcional en variables |
|---|---:|---:|
| Abierta: *"¿ves algún patrón?"* | **70%** | 1% |
| Dirigida: *"escribí la regla con variables"* | — | **37%** (3.º) / **64%** (4.º) |

**La consigna pesa tanto como la estructura de la tabla.** Y ahí tenemos suerte estructural:
nuestras opciones son expresiones simbólicas, así que la consigna es intrínsecamente de
correspondencia. Eso solo ya nos blinda contra el peor modo de falla.

Hallazgo secundario del mismo paper, contraintuitivo y a favor nuestro: los alumnos fueron
**sistemáticamente mejores expresando la regla en variables que en palabras**. Las opciones van en
notación, no en prosa.

### 1.5 Entradas no consecutivas: confirmado en fuente primaria

**[LIT]** Ellis, Ozgur, Kulow, Dogan, Williams & Amidon (2013, PME-NA 35, ED584480), experimento
de enseñanza de 12 días. Textual (p. 124):

> "el hueco de 11 semanas fue suficientemente grande como para desalentar a Uditi de apoyarse en
> una imagen mental de multiplicación repetida."

Usaron huecos grandes **deliberadamente** para bloquear la estrategia recursiva, y funcionó. La
tabla de su Figura 3 es casi exactamente nuestro formato: entradas no consecutivas con huecos
crecientes, celdas vacías y **una fila simbólica al final** (`x → ?`).

Matiz que el mismo paper deja: correspondencia no es "mejor" en abstracto. Lo covariacional es el
punto de entrada natural, y matarlo tiene costo. **El objetivo no es prohibir la lectura recursiva,
sino que no alcance para resolver el ítem.**

### 1.6 La fila simbólica es la decisión de mayor impacto

Y hay un refinamiento que vale más que la fila en sí: **las opciones son los candidatos para llenar
la celda simbólica**. Eso reencuadra el ítem entero. Deja de ser "¿qué fórmula genera estos
números?" (inducción) y pasa a ser "¿cuál es la salida cuando la entrada es $n$?", que es
literalmente la definición de generalización algebraica de Radford: producir la expresión de un
término cualquiera.

Es un cambio de redacción gratis que mueve el ítem un nivel entero en la progresión.

### 1.7 Los emojis tienen un riesgo con nombre

Se llama **fruit-salad algebra**. **[LIT]** Moss et al. (2020) catalogan "letras como etiquetas de
categorías" con el ejemplo exacto (`3r + 2g` para 3 rojos y 2 verdes). **[LIT]** Küchemann (1978)
y McNeil et al. (2010) documentan que tratar la variable como etiqueta de un objeto es una de las
concepciones erróneas más persistentes que hay.

De ahí salen las tres reglas de R69: el emoji va solo en el encabezado, nunca dentro de una
expresión, y la letra variable no debería ser la inicial del sustantivo que ilustra el emoji.
**Las capturas de Brilliant violan la tercera** (`o` para *ordered*, `b` para *bottles*): es el
punto donde no conviene copiarlos.

### 1.8 Qué importa de Brilliant

No se pudo verificar directamente un ejercicio suyo con tabla (las páginas se renderizan del lado
del cliente y detrás de paywall). Lo que sí está verificado es su filosofía, de `brilliant.org/about`:

> "no enseñamos cómo hacer algo antes de preguntar. En cambio, pre-testeamos sobre el material,
> dejando que el que aprende intente encontrar una solución antes de aprender el procedimiento."

**Lo importable no es "usar tablas": es la estructura predicción → consecuencia → explicación.** El
alumno compromete una hipótesis y recién ahí ve qué produce. De ahí sale la decisión de repintar al
confirmar y no al tocar la opción (§2.2).

---

## Parte 2 — Decisiones de diseño y su evidencia

### 2.1 Anti-descarte: A1, A2, A3

El formato es MC, así que el alumno siempre puede intentar descartar en vez de modelar. **No se
puede prohibir el descarte, pero se lo puede volver más caro que entender.** Sean `f` la correcta y
`gᵢ` los distractores, evaluados sobre las filas que ya muestran un valor:

- **A1, fila trampa** — tiene que existir una fila visible donde **todos** los candidatos den el
  mismo valor. Es lo que impide que la primera fila que el alumno mira resuelva el ítem.
- **A2** — cada distractor coincide con `f` en al menos una fila visible. Si difiere en todas, se
  descarta de un vistazo y no compite.
- **A3** — cada distractor difiere de `f` en al menos una fila visible, o el ítem no es decidible.

**Lección que costó descubrir:** la formulación intuitiva de A1 —"que ninguna fila refute a todos
los distractores"— es **aritméticamente insatisfacible**. Cualquier fila lo bastante lejana separa a
todos los candidatos, y sin una fila así el ítem violaría A3. Lo exigible es la fila trampa, no la
ausencia de fila decisiva.

**Familia productiva para armar la trampa:** $\{2n,\ n+2,\ n^{2},\ 2^{n}\}$ **valen $4$ en $n=2$**
las cuatro. Casi todos los ítems de `reglas` se armaron eligiendo la correcta de ese conjunto y dos
distractores del resto, con $n=2$ como fila trampa. **[INF]** Vale para cualquier curso: buscar el
punto donde las funciones candidatas se cruzan.

### 2.2 El repintado va al confirmar, no al tocar

Copiar a Brilliant sería repintar al tocar la opción. **La evidencia lo desaconseja.** Si el alumno
puede recorrer las opciones viendo la tabla responder, el ítem deja de ser de generalización y pasa
a ser una máquina de ensayo y error con buena interfaz: exactamente la inducción ingenua de Radford,
automatizada. Y lo peor es que **es una estrategia que funciona**, así que la aprende y la
generaliza a todo el banco.

Repintar al confirmar conserva el contraste (el runner da dos intentos) y respeta la secuencia
predicción → consecuencia que el propio Brilliant declara como principio.

### 2.3 Los dos regímenes de consecutividad, y cómo generalizarlos

En `conteo` la regla quedó partida en dos, y **esa partición es lo más transferible del documento**:

- **Fórmula cerrada** → entradas **no consecutivas** con espaciados irregulares.
- **Regla del producto y recursión factorial** → entradas **consecutivas**, a propósito.

El motivo: en combinatoria la lectura recursiva no es un atajo que evita entender. $n! = n\cdot(n-1)!$
y "una etapa más multiplica el conteo" **son** el mecanismo. Bloquearla sería bloquear el contenido.

**La pregunta a hacerse en cada topic nuevo, en cualquier curso:**

> ¿Leer hacia abajo una columna es un atajo que **reemplaza** la comprensión, o es el **mecanismo**
> que quiero enseñar?

Si reemplaza → entradas no consecutivas. Si es el mecanismo → consecutivas. **[INF]** En `analisis`
esto va a separar, por ejemplo, `functions/linear` (la diferencia constante reemplaza: no
consecutivas) de una eventual unidad de sucesiones o recurrencias (la diferencia **es** el
contenido: consecutivas).

### 2.4 La familia de explosión: cuándo A1 y A2 no aplican

En `factoriales` A1 y A2 son insatisfacibles: nada se parece a un factorial en dos puntos seguidos.
No es un defecto del ejercicio, es aritmética. **Y está bien, porque ahí el trabajo de la tabla es
otro.**

**[LIT-2ª]** Wagenaar & Sagaria (1975, *Perception & Psychophysics* 18): el crecimiento exponencial
se **subestima groseramente**, y *"no es inusual que dos tercios de los sujetos produzcan
estimaciones por debajo del 10% del valor normativo"*. El dato clave: **ni la instrucción explícita
ni la experiencia cotidiana mejoraron las extrapolaciones**. Réplicas de 2022 y 2023 lo confirman.

**[LIT]** Thomas, Kapp & Pöhler (2026, *Frontiers in Education*), 161 estudiantes de 17-18 años:
44% interpretó $n!$ como producto decreciente y **solo 12% reconoció el significado combinatorio**;
en $5!$, 69% acertó el resultado y **solo 32% pudo explicarlo**.

Una tabla que muestra $3\to6$, $5\to120$, $8\to40320$ en una pantalla entrega la explosión **de un
vistazo**, que es exactamente el canal que la instrucción verbal no alcanza.

**Consecuencia de diseño:** en la familia de explosión, el distractor bueno **no es una fórmula
rival, es la correcta desfasada**. $(n-1)!$ pinta la columna correcta corrida un renglón: el alumno
no lee un número mal, ve un desfasaje. Es el error conceptual hecho imagen.

**[INF]** Esta familia se traslada directo a `algebra/white/aritmetica/powers` y a
`analisis/white/functions/exponential`.

### 2.5 El problema profundo del traslado a conteo (y su análogo en otros dominios)

**[LIT]** Lockwood (2013, *JMB* 32) modela el pensamiento combinatorio con tres componentes:
fórmulas, procesos de conteo y **conjuntos de resultados**. En su diagrama, la relación entre
fórmula y conjunto está dibujada con línea punteada porque es la más débil. **[LIT]** Wasserman
(2019, *FLM* 39(3)) va más lejos: el simbolismo combinatorio **es** el impedimento, porque
$\binom{n}{k}$ y $n!$ denotan cardinalidades y **no hay ningún símbolo que denote el conjunto**.

Implicación incómoda: una tabla `n → n!` con opciones simbólicas entrena justo el eslabón
fórmula↔cardinalidad, que ya está sobre-representado, y **el conjunto de resultados no aparece en
ningún lado**.

De ahí sale **R73, la fila ancla enumerable**: cuando la salida es una cardinalidad, la primera
fila es un caso tan chico que el conjunto se puede enumerar, y la celda lo muestra (`2 (AB, BA)`).

**A favor:** **[LIT-2ª]** Lockwood (2015, *IJRUME* 1(3)) encontró que **solo 10 de 22
universitarios usaron espontáneamente la estrategia de resolver casos más chicos; 12 nunca la
usaron**. La tabla es una versión andamiada y obligatoria de una heurística experta que la mayoría
no despliega sola.

**[INF] Cómo se generaliza la pregunta a otro curso:** *¿qué objeto está representando esta columna,
y ese objeto tiene una representación que la tabla oculta?* En conteo era el conjunto. En
`analisis/functions` es la **gráfica**, y ahí ya tenemos `GRAF` para cubrirla. En
`algebra/matrices` sería la matriz misma.

### 2.6 Contraindicaciones

| Contenido | Por qué no |
|---|---|
| **Cuando la dificultad real es el modelado** | La tabla **regala los números**. Si la pregunta es "¿acá importa el orden?", una tabla de conteos la responde por el alumno. Es la contraindicación más importante, y la única **confirmada empíricamente**: ver abajo. |

> **Confirmación en testeo (ago-2026).** Se generaron 2 ítems con tabla en `probabilidad/white/conteo/reglas/ESTR` como piloto, con el cupo deliberadamente chico por esta misma contraindicación. El testeo manual las descartó: al desglosar los pasos y sus opciones, la tabla ya hacía el trabajo de modelado que `ESTR` viene a evaluar. Se reemplazaron por ítems clásicos y el cupo se movió a `FORM`, que subió de 4 a 6 tablas.
>
> **La regla que queda, para cualquier curso:** antes de poner una tabla en una skill de planteo o clasificación, hay que poder responder *¿qué queda por decidir después de mirar la tabla?* Si la respuesta es "nada que no esté ahí", el ítem se vació.
>
> Corolario a favor: en las skills de **formulación** el formato no tiene reservas. La tabla es la evidencia y la fórmula es la decisión, así que mirarla no adelanta la respuesta.
| **Límites** | Una tabla de valores **no puede** establecer un límite y engaña activamente. Ver §3.2: es la trampa nº1 de `analisis`. |
| Relaciones de dos parámetros | Dos columnas no representan $\binom{n}{k}$ variando ambos. |
| Recursiones sin fórmula cerrada accesible | Fibonacci, particiones, desarreglos: el formato promete una fórmula que no existe al alcance. |
| Salidas no enteras o feas | La relación se pierde en el ruido aritmético. |
| Justificación y demostración | **[LIT-2ª]** Lockwood, Swinyard & Caughman (2015): reinventar la fórmula correcta **no implica** poder justificarla. El formato es estructuralmente incapaz de entrenar justificación. |

### 2.7 Un problema de sistema que conviene tener anotado

**[LIT-2ª]** La teoría de la variación (Marton; *intelligent practice* de Craig Barton) depende de
la **yuxtaposición**: el efecto viene de ver ítems que difieren en una sola dimensión, uno al lado
del otro. **Un sistema de repetición espaciada, por diseño, dispersa y mezcla los ítems: el efecto
se pierde casi entero.**

**[INF]** Mitigación posible, fuera del alcance del formato pero anotada: **micro-bloques** de 2-3
ítems que el scheduler libere juntos, variando una dimensión por vez ($n+3$ → $n+5$ → $3n$ →
$3n+1$). Es una familia que enseña más junta que dispersa.

### 2.8 Cardinalidad: 3 o 4 opciones

**[LIT-2ª]** Rodriguez (2005, *EM:IP* 24(2)), meta-análisis de 80 años: **tres opciones maximizan
la confiabilidad por unidad de tiempo**.

Lo que se hizo en `conteo`, y el criterio a reusar: **3 opciones donde A1-A3 aprietan** (con cuatro
candidatos es mucho más difícil que todos coincidan en la fila trampa y que cada uno sea un error
real), **4 donde A1 y A2 no aplican** (familia de explosión), porque ahí la cuarta sale gratis.

---

## Parte 3 — Traslado a `analisis` y `algebra`

### 3.1 `analisis` es el hogar nativo del formato

El function-table se inventó para esto. `white/functions` es el mejor encaje de todo el producto.

| Topic | Skills | Encaje | Notas |
|---|---|---|---|
| `functions/definition` | LEXI/CLSF | **fuerte, pero en modo estático** | No es una tabla de generalización: no hay familia parametrizada ni fórmula que descubrir. Es el modo `reveal` ausente, donde **la tabla es la función**. Ver §3.1.1. |
| `functions/linear` | LEXI/FORM/GRAF | **muy fuerte** | El caso canónico. El error clásico está documentado: **[LIT-2ª]** Stacey (1989), usar la diferencia entre filas como coeficiente y olvidar el término independiente ($y=dx$ en vez de $y=dx+b$). Entradas **no consecutivas**. |
| `functions/quadratic` | LEXI/FORM/GRAF | fuerte | La diferencia segunda es constante: cuidado, es una lectura recursiva que funciona y puede reemplazar el modelado. Reforzar con entradas irregulares. |
| `functions/exponential` | LEXI/FORM/GRAF | **muy fuerte** | Aplica §2.4 completo: el sesgo de subestimación exponencial es el mismo que justifica `factoriales`. Es el segundo mejor candidato del producto. |
| `functions/logarithmic` | LEXI/FORM/GRAF | fuerte | La tabla inversa de la exponencial. Buen contraste si se generan en la misma tanda. |
| `functions/polynomial` | LEXI/FORM/GRAF | medio | Valores crecen rápido; cuidar el techo de 5 caracteres por celda (R74). |
| `functions/rational` | LEXI/FORM/GRAF | medio | Ojo con las salidas no enteras (§2.6). |
| `functions/trigonometric` | LEXI/FORM/GRAF | **débil** | Salidas irracionales; la tabla ilumina poco frente a `GRAF`. |
| `derivatives/differentiation_rules` | FORM/ESTR/RESL | medio | Tabla $f \to f'$: es un mapeo, no una covariación. Funciona, pero pierde el argumento pedagógico central. |
| `limits/*` | — | **contraindicado** | Ver §3.2. |
| `integrals/*` | — | débil | El objeto es un área o una primitiva, no una familia parametrizada por un entero. |

### 3.1.1 El punto ciego de esta tabla: solo evalúa el modo `column`

*(Agregado ago-2026, tras el relevamiento de guías de TP de UBA/UTN/UNLP.)*

Todo lo de arriba razona sobre `reveal.mode = "column"`, la tabla de generalización. Con ese lente
`functions/definition` no aparece, y por eso faltaba en la tabla. Pero `authoring-context.md` declara
un tercer modo —**`reveal` ausente, la tabla como contexto estático**— que este documento no analizaba
en ninguna parte.

La diferencia conceptual: en modo columna **la tabla es evidencia de una fórmula oculta**; en modo
estático **la tabla es la función**. Cuatro fuentes de cátedra declaran explícitamente la tabla como una
de las representaciones canónicas de función, junto con la fórmula, el gráfico y la descripción verbal:
CiBEx (UNLP-Exactas, Figura 2.1, *"las 4 formas usadas usualmente"*), *Al infinito y más allá*
(UNLP-Informática, 2023), Rossini (2018) y el ingreso de UTN-FRBB, que titula una sección
*"Mediante una tabla de datos"*.

En modo estático **A1, A2 y A3 no aplican**, porque no hay `by_option` que compita. Es el traslado más
barato del formato y el de menor riesgo.

**Dos hallazgos del relevamiento que corrigen intuiciones de este documento:**

- **`functions/definition` en modo estático NO tiene precedente curricular para dominio/imagen.** El
  relevamiento no encontró ni un ejercicio universitario argentino que pida deducir dominio o imagen de
  una tabla de valores: ese trabajo lo hacen invariablemente los gráficos. Coincide con lo que ya
  advertía §2.5 (el objeto que la columna oculta acá es la gráfica, y `GRAF` ya la cubre). Lo que sí
  justifica tablas en este topic es R68 —los 9 ítems de `unicidad-rota-disfrazada` y
  `trampa-inyectividad` ya son tablas dibujadas con `\begin{aligned}` y `\mapsto`— más el encuadre de
  las cuatro representaciones. **Son dos justificaciones de fuerza muy distinta y conviene no
  confundirlas.**
- **`functions/trigonometric` sigue siendo débil para nosotros, aunque el corpus esté lleno de tablas
  trigonométricas.** La tabla de valores notables parcialmente sembrada es el uso de tabla más universal
  de las tres universidades, pero es **tabla-planilla** (el alumno la completa) y no **tabla-dato** (el
  alumno la lee para decidir). Solo la segunda es trasladable a opción múltiple. No corregir el "débil"
  de la fila de arriba apoyándose en esa frecuencia.

**El formato con más precedentes del corpus, y que este documento no contemplaba:** la tabla de $f$ y
$g$ para calcular $f(g(1))$, $g(f(2))$, $(f\circ g)(6)$. Aparece casi idéntica en cinco fuentes
independientes (UBA CBC 51 y 72, CiBEx, *Al infinito*, FCE-UNLP). Es tabla-dato pura y es modo estático.
Hoy no tiene dónde ir: composición de funciones aparece **una sola vez en toda la unidad**
`white/functions`, dentro de la explicación de un ítem de inversa.

### 3.2 La trampa nº1 de `analisis`: límites

**Es el topic donde un autor desprevenido va a querer usar una tabla primero, y es exactamente
donde no hay que usarla.**

Una tabla de valores **no puede** establecer un límite: los contraejemplos estándar ($\sin(1/x)$
cerca de 0, funciones definidas por casos sobre los racionales) muestran tablas perfectamente
convincentes que llevan a la respuesta equivocada. Enseñar límites por tabla instala una concepción
errónea difícil de desarmar, y `blue/limits/lateral_limits` —una tabla acercándose por cada lado—
es literalmente el dispositivo engañoso clásico.

**Verificado (ago-2026), y el resultado afila la regla en vez de confirmarla.** El relevamiento de
guías de TP encontró lo contrario de lo esperado: **toda UNLP usa tablas numéricas de aproximación al
límite** —CiBEx Actividad 4.1, *Al infinito y más allá* Ejemplo 2.7, los apuntes de Matemática I de
FCE-UNLP, *Cálculo diferencial* de UNLP-Ingeniería— y **la UBA no las usa nunca**, verificado sobre las
guías de las cuatro materias y sobre la teórica oficial `Limites2020.pdf` de la cátedra de Análisis 66
(cero apariciones de la palabra "tabla").

La contraindicación sobrevive, pero por una razón más precisa que "las tablas engañan". Donde se usan,
la tabla aparece **una sola vez, al abrir la unidad, y no se repite**: es andamiaje para *presentar* la
noción antes de la definición, y la consigna trae la respuesta ya anticipada (*"¿están de acuerdo que
los valores de $f(x)$ calculados en la Tabla 4.1 están cerca del número 10?"*). Nuestro formato hace lo
inverso: pide **decidir** un valor eligiendo entre opciones. Esa inversión es la que instala la
concepción errónea, porque premia leer el límite de la tabla.

**La regla operativa, entonces:** una tabla puede *presentar* una tendencia, nunca *decidirla*. Como el
formato `table` solo sabe hacer lo segundo, `limits/*` sigue contraindicado — pero si alguna vez existe
un modo de tabla puramente ilustrativo sin opción que la resuelva, esta puerta se reabre.

### 3.3 `algebra`: encaje más acotado

> **Actualizado (ago-2026) con la ronda de `white/aritmetica`.** Se escribieron **30 ejercicios
> con tabla** en cinco de los seis topics de la unidad. Lo que la ronda corrigió de este análisis
> está marcado abajo; el detalle completo, con el relevamiento curricular de 12 fuentes primarias
> que lo respalda, está en `algebra/table-injection-report.md`.

| Topic | Skills | Encaje | Notas |
|---|---|---|---|
| `aritmetica/powers` | LEXI/RESL/FORM | **muy fuerte** ✅ | Confirmado. $n \to 2^{n}$, familia de explosión (§2.4). **6 ítems en `FORM` (modo `column`) y 4 en `RESL` (modo `cell`)**. Es el único topic de la unidad donde `column` funciona sin forzar nada. |
| `aritmetica/logarithms` | LEXI/RESL/FORM | fuerte ✅ | Confirmado, pero **no por la tabla inversa**: lo que rinde es la **tabla de traducción** forma logarítmica ↔ forma exponencial, que tiene precedente verificado en el cuadernillo de UTN FRRQ. 4 ítems en `FORM` + 2 en `RESL`, todos `cell`. |
| `aritmetica/scientific_notation` | RESL/FORM | fuerte ⚠️ | Confirmado el encaje, **corregido el modo**: no admite `column`, porque sus objetos son números sueltos de escalas distintas y no términos de una familia parametrizada por un entero. Van 4 + 2, todos `cell`. La tabla de órdenes de magnitud además **define un término que el topic usaba 4 veces sin definir nunca**. |
| `aritmetica/fracciones` | LEXI/ESTR/RESL | medio ➕ | **No figuraba en este análisis** y entró: no tiene `FORM`, que es el host natural, pero el modo `cell` (desglose de repartos sucesivos) le calza en `RESL`. 3 ítems. `ESTR` quedó afuera a propósito: es la skill de modelado, o sea la contraindicación principal del formato. |
| `aritmetica/absolute_value` | RESL/FORM | medio ➕ | **Tampoco figuraba.** Entró por una razón que no es la del formato: la tabla `x → distancia a un valor` es el único lugar del topic donde aparece la lectura geométrica que usa el CBC. 3 ítems `column` + 2 `cell`. |
| `aritmetica/radicals` | LEXI/RESL/FORM | medio ❌ | Descartado por decisión, no por análisis. Sus sub-familias son manipulación simbólica de una expresión, no familias parametrizadas por un entero, y competía mal contra `powers` por el mismo cupo. |
| `matrices/determinants` | LEXI/CLSF/RESL | medio | Familia de matrices parametrizada por $n$ → su determinante. Nicho pero legítimo. |
| `spaces/dimension` | LEXI/CLSF/RESL | medio | Familia de subespacios parametrizada → dimensión. |
| `vectors/*` | ver nota | **casi nulo, auditado** 🔍 | Ver §3.5. Un único ítem sobrevivió a la auditoría completa de los 6 topics. |
| `black/transformations` | — | fuera de alcance | Declarado en `course.json` pero no cableado en el catálogo del front. |

### 3.4 `blue/vectors`: auditoría completa, veredicto casi negativo

> **Actualizado (ago-2026).** La fila de arriba ("débil") venía de una línea sin auditar que solo
> cubría `norm` y `operations`. Se auditaron los 6 topics completos (210 ejercicios, leídos
> `question`/`options`/`feedback_incorrect`, no las descripciones de los `topic-context.md`).
> Resultado: de más de una docena de candidatos que parecían fuertes en una lectura superficial,
> **todos menos uno cayeron al leer el contenido real.**

**El único ítem que sobrevivió**: `operations/RESL`, sub-familia `resl-norma-vector-escalado` (2
ítems, modo `column`). Tapa un hueco real y acotado — nadie en la unidad enseña que
$\lVert k\vec v\rVert = |k|\lVert\vec v\rVert$ y no $k\lVert\vec v\rVert$. `norm` nunca trabaja
vectores escalados, y la sub-familia hermana `resl-escalar-vector` calcula el vector resultante,
nunca su norma.

**Por qué el resto no entra, con evidencia, no solo criterio:**

- **`norm/RESL` → `resl-comparacion-normas`** (comparar la distancia de 2 drones): parecía el
  candidato más fuerte de toda la unidad — la `explanation` ya usa `\begin{aligned}` con 2 renglones
  paralelos. Cae igual: las 5 `options` reales son prosa de razonamiento (*"el segundo, **aunque**
  tenga menor componente en $x$"*), y el error que se evalúa es no poder combinar las dos
  componentes de un vistazo. Una tabla con $x^2$, $y^2$ y la suma precalculados **regala
  exactamente ese paso** — la contraindicación más importante del formato (§2.6).
- **`norm/RESL` → `resl-distancia-entre-puntos`**: el error de signo que parecía el hueco a tapar
  **ya está cubierto** por los 5 `feedback_incorrect` existentes.
- **`operations/RESL` → `resl-combinacion-suma-escalar`**: puro cálculo, sin decisión que la tabla
  agregue — decorativo.
- **`orthogonality/CLSF` → "¿cuál de estos 3 pares es ortogonal?"**: cae en un anti-patrón nuevo,
  distinto al de las matrices — **una tabla que solo repite lo que ya está en las `options`**. Los
  3 pares candidatos ya están ahí; `authoring-context.md` ya documenta esto para el ancla del
  enunciado (*"si ya está escrito en las opciones… duplica las opciones o regala el ejercicio"*),
  y el mismo argumento aplica a una tabla.
- **`orthogonality/CLSF` → "¿cruza en ángulo recto?" y `orthogonality/RESL` → "¿cuál es
  perpendicular?"**: más limpios (el vector de referencia está en el enunciado, no repetido), pero
  no hay diseño honesto: mostrar los productos escalares de los candidatos regala la respuesta;
  dejarlos en blanco no agrega nada que la skill no haga ya.
- **`orthogonality/CLSF` → "chico ≠ cero"**: el objetivo es intrínsecamente comparativo, pero ya
  está exhaustivamente cubierto por 15 `feedback_incorrect` distintos.
- **`product/LEXI` → `por-que-exclusivo-r3`**: la **única** familia $n \to f(n)$ auténtica de toda
  la unidad ($n=2,3,4 \to$ cantidad de perpendiculares comunes). Descartada de todos modos: la
  skill es `LEXI` = justificación, y §2.6 cita evidencia directa (Lockwood, Swinyard & Caughman
  2015) de que reinventar la fórmula correcta no implica poder justificarla.
- **`product/CLSF` → `predecir-direccion-vector-escalado`** ($\alpha \to$ sentido): parámetro
  entero real, pero el patrón es $\operatorname{signo}(\alpha)$ y se deduce del parámetro de un
  vistazo — exactamente lo que la regla 76 prohíbe.
- **`scalar/RESL` → `resl-producto-escalar-vector-unitario`** ($k \to$ posición del $1$ en $e_k$):
  correspondencia real, pero con solo 3 posiciones posibles y un mecanismo trivial, los 5 ítems ya
  cubren el patrón sin tabla.

**Dos razones estructurales que pesan contra la unidad entera**, para que la próxima ronda no
vuelva a auditar desde cero:

1. **8 de las 24 sub-familias son `LEXI`** (justificación pura), la contraindicación más citada del
   formato — incluye el único parámetro entero real de la unidad.
2. **El alumno en `blue` todavía no tiene matrices** (`course-context.md`, estado por cinturón).
   Una tabla de 2 columnas con vectores como filas se parece visualmente a una matriz, el mismo
   riesgo de confusión que §3.4 (abajo) documenta para `violet/matrices`, pero acá llega antes de
   que el alumno tenga el concepto para distinguirlos.

### 3.5 La trampa nº1 de `algebra`: confundir "mostrar una matriz" con "usar el campo `table`"

**R62 nació en `algebra/violet/matrices`**, del feedback *"acá pondría a la matriz como ejemplo"*.
Es tentador leer eso como "usemos el campo `table` para las matrices". **No.**

- Una **matriz** es un objeto matemático y va en `$$\begin{bmatrix}...\end{bmatrix}$$`, como
  cualquier fórmula.
- El campo **`table`** es una tabla de datos con encabezados en palabras y una columna que se
  recalcula según la opción.

Usar `table` para renderizar una matriz rompe R68 en espíritu y agrega una interacción que el
objeto no pide. Son dos necesidades distintas que se parecen en pantalla.

**La misma trampa, en versión aritmética (encontrada en la ronda de `white/aritmetica`):** el material de UNLP tiene un cuadro teórico *"propiedades de las operaciones con potencias"*, con filas `Producto de igual base | $a^{m}\cdot a^{n} = a^{m+n}$`. Es lo más cerca que llega el corpus argentino a tabular `powers`, y por eso es tentador convertirlo en un ítem a completar. **No.** Sería memorización tabulada: la tabla no revela nada que la fórmula no diga ya. Quedó escrito como anti-patrón en la regla 76.

**Y una tercera trampa, específica de las sub-familias grandes:** cuando una sub-familia con tabla pasa de 2 ítems a 4, aparece un riesgo que con 2 no existía — si la correcta es siempre del mismo tipo (siempre la exponencial), el formato enseña una meta-estrategia en vez de un concepto. La mitigación está en la regla 77: rotar cuál es la correcta y rotar la posición de la fila trampa. En `powers/FORM` eso significó que **en dos de los cuatro ítems la exponencial es distractora**, que además es el ítem que ataca de frente el sesgo de §2.4.

### 3.6 Protocolo para repetir la investigación

Lo que funcionó en esta sesión, en orden:

1. **Definir antes de investigar.** Cuatro decisiones cerradas por adelantado (semántica, taxonomía,
   rol del emoji, volumen) evitaron que la investigación divagara. Ninguna de las cuatro se
   revirtió; sí se revirtieron dos decisiones *derivadas* que la evidencia dio vuelta (§2.2 y el
   criterio de ancho).
2. **Agentes en paralelo, uno por frente.** Traza del pipeline en el codebase · extracción del
   tracker · digesto de los docs de autoría · investigación pedagógica web · programas
   universitarios. Los frentes no se pisan y cada uno vuelve con material citable.
3. **Exigir el etiquetado de evidencia.** Pedirle al agente que marque [LIT] / [LIT-2ª] / [INF] y
   que **diga explícitamente cuándo no encontró nada** cambió la calidad del resultado: así se supo
   que *no existe literatura sobre tablas entrada-salida en combinatoria*, y que toda esa sección
   era extrapolación. Sin esa instrucción habría vuelto con afirmaciones de confianza uniforme.
4. **Medir en vez de estimar.** Tres veces en esta sesión una estimación razonable resultó falsa:
   A1 parecía satisfacible y no lo era; el ancho de columna "siempre cambia" en modo `cell` y
   resultó depender del encabezado; el pulso "funcionaba al acertar" y en realidad funcionaba por
   accidente. Las tres se resolvieron midiendo.
5. **Auditar el propio contenido contra las reglas nuevas.** El primer ejemplo escrito no pasaba
   A1 ni A2. Escribir la regla y después pasarle los ejemplos propios encontró el problema antes
   que el testeo manual.

Para `analisis` y `algebra` el frente de **programas universitarios** cambia de filtro: el tracker
usa la columna D con `Análisis` y `Álgebra`, y la misma consulta gviz sirve. Ojo con lo que se
aprendió ahí: **las filas mixtas** (`Análisis, Probabilidad`) quedan fuera de un filtro por igualdad
exacta, y en esta sesión eso escondía al grupo más grande de toda la base.

### 3.7 Lo que la implementación enseñó, para quien extienda el formato

Cinco trampas técnicas, todas verificadas en el código:

1. **`_shuffle_options` desalinea en silencio.** Baraja las opciones en cada sesión; cualquier
   estructura paralela a `options` tiene que permutarse con el mismo orden. No tira error: cada
   opción pinta la columna de otra.
2. **El índice revelado no puede salir de `cur.selection`.** `onRevisar` lo resetea a `null` al
   errar, así que la columna equivocada aparecería y desaparecería en el mismo frame. Se deriva de
   `wrongOptions`/`solved`.
3. **La altura de una celda de tabla no se fija con `height`.** En CSS de tablas es un mínimo y el
   contenido igual la estira. Va en un contenedor propio, o revelar corre las opciones de abajo.
4. **`initial`/`animate` de Motion solo disparan al montar.** Sin un `key` que cambie, la animación
   no se repite en el segundo intento. Y si dos elementos hermanos comparten `key`, React descarta
   uno.
5. **El seeder ignora en silencio los campos que no conoce.** Agregar un campo al JSON sin tocar
   `seed_content.py` lo pierde sin error ni warning.

---

## Fuentes

**Leídas en texto completo:**

- Radford, L. (2006). *Algebraic thinking and the generalization of patterns*. PME-NA 28. https://www.luisradford.ca/pub/60_pmena06.pdf
- Ellis, A. et al. (2013). *Correspondence and covariation*. PME-NA 35, 119-126. https://files.eric.ed.gov/fulltext/ED584480.pdf
- Stephens, A., Fonger, N., Blanton, M. & Knuth, E. (2016). AERA. https://files.eric.ed.gov/fulltext/ED566523.pdf
- Moss, D., Boyce, S. & Lamberg, T. (2020). *IEJME* 15(2). https://files.eric.ed.gov/fulltext/EJ1235427.pdf
- Wasserman, N. (2019). *Duality in combinatorial notation*. *FLM* 39(3). https://flm-journal.org/Articles/5324ACE6181DF572F5733488DBCBB4.pdf

**Consultadas por abstract o fuente secundaria:**

- Stephens, Ellis, Blanton & Brizuela (2020). *JRME* 51(5), 631.
- MacGregor & Stacey (1995). *MERJ* 7, 69-85 · Stacey (1989). *ESM* 20, 147-164.
- Lockwood, E. (2013). *JMB* 32(2) · (2015). *IJRUME* 1(3) · Lockwood, Swinyard & Caughman (2015). *IJRUME* 1(1).
- Wagenaar & Sagaria (1975). *Perception & Psychophysics* 18, 416-422.
- Thomas, Kapp & Pöhler (2026). *Frontiers in Education*. https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2026.1678978/full
- Rodriguez, M. (2005). *EM:IP* 24(2) · Küchemann (1978) · Marton & Tsui (2004) · Barton, https://variationtheory.com/
- Brilliant: https://brilliant.org/about/

**No encontrado, y vale decirlo:** no existe literatura sobre tablas entrada-salida aplicadas a
combinatoria o probabilidad. Toda la Parte 2 que toca conteo es extrapolación razonada desde
educación combinatoria (Lockwood, Wasserman, Batanero) y desde el sesgo de crecimiento exponencial.
Tampoco se encontró literatura que dé un número óptimo de filas, ni una descripción verificable de
un ejercicio de Brilliant con tabla.
