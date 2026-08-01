# Topic: Función de distribución acumulada

Belt: `violet`, Unit: `variables`, Topic: `acumulada`

Skills en este topic: `FORM`, `GRAF`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `FORM`, `GRAF`, `RESL`.

Concepto: la **función de distribución acumulada** $F(x) = P(X\leq x)$, no decreciente, con $F\to 0$ cuando $x\to-\infty$ y $F\to 1$ cuando $x\to+\infty$. Propiedad clave: $P(a<X\leq b) = F(b)-F(a)$.

**Frontera con el resto de la unidad:** reutiliza `puntual` (discreta, suma acumulada de $p(x)$) y `densidad` (continua, área acumulada bajo $f(x)$) ya trabajados. No usa todavía esperanza ni varianza.

**Nota de dependencia con integrales** (ver `densidad/topic-context.md` y `probabilidad/course-context.md`): igual que en `densidad`, cuando se calcule $F(x)$ desde una densidad continua usar exclusivamente densidades **uniformes** (rectángulo), donde $F(x)$ es un área geométrica simple (base × altura) hasta el punto $x$, nunca una densidad que exija antiderivada no trivial.

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Definición $F(x)=P(X\leq x)$ | 5 | `definicion-acumulada` | Reconocer la definición de $F(x)$ como la probabilidad acumulada hasta $x$ | $F(x)=P(X\leq x)$, distinción con $p(x)$ (puntual) y $f(x)$ (densidad) |
| Propiedad $P(a<X\leq b)=F(b)-F(a)$ | 5 | `propiedad-diferencia` | Reconocer que la probabilidad de un intervalo se expresa como diferencia de acumuladas | $P(a<X\leq b)=F(b)-F(a)$, resta de dos evaluaciones de $F$ |
| Propiedades generales de $F$ (no decreciente, límites $0$ y $1$) | 5 | `propiedades-generales` | Reconocer las propiedades que cumple toda función de distribución acumulada | Monotonía no decreciente, $F\to 0$ cuando $x\to-\infty$, $F\to 1$ cuando $x\to+\infty$, rango $[0,1]$ |
| **Total** | **15** | | | |

---

## GRAF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Leer $P(a<X\leq b)$ como área sombreada bajo una densidad uniforme | 6 | `lectura-diferencia-acumulada` | Leer el área sombreada entre la densidad y el eje $x$ sobre $[a,b]$ como $P(a<X\leq b)=F(b)-F(a)$ | Área de rectángulo sombreado, equivalencia área↔diferencia de acumuladas |
| Leer el comportamiento asintótico de $F$ (tiende a $0$ y a $1$) | 5 | `lectura-limites-acumulada` | Reconocer en el gráfico real de $F(x)$ que tiende a $0$ por la izquierda y a $1$ por la derecha | Asíntotas horizontales de $F$, monotonía no decreciente leída visualmente |
| Reconocer si $F$ corresponde a una variable discreta (saltos) o continua (curva sin saltos) | 4 | `lectura-discreta-vs-continua` | Distinguir en el gráfico real de $F(x)$ una acumulada de variable discreta (función escalonada) de una continua (curva suave) | Función escalonada vs. curva continua, correspondencia con `puntual`/`densidad` |
| **Total** | **15** | | | |

### Diseño de gráficos reales (`graph_fn`/`graph_view`/`graph_shade`)

A partir de esta ronda, GRAF puede usar gráficos reales (`web/src/components/math-graph.tsx`), igual que en `analisis`. **No hace falta que los 15 ejercicios de GRAF tengan `graph_fn` real**: alternar entre gráfico real y gráfico descrito por texto en el propio enunciado (`graph_fn: null`, mismo patrón que el resto del curso) da variedad y evita que la skill se sienta repetitiva. Regla mecánica sugerida: dentro de cada sub-familia, ~60-70% con gráfico real y el resto descrito por texto. Patrón por sub-familia cuando el gráfico es real:

- **`lectura-diferencia-acumulada`**: graficar la **densidad** $f(x)$ (no $F(x)$) como rectángulo uniforme vía `Piecewise((h, (x>=a)&(x<=b)))` (fuera de $[a,b]$ no se dibuja, equivalente visual a $f=0$), y usar `graph_shade: [c, d]` con $a\leq c<d\leq b$ para sombrear en azul el tramo cuya área pide el enunciado. La pregunta lee el área sombreada, no dos valores de $F$.
- **`lectura-limites-acumulada`**: graficar $F(x)$ real y continua vía `Piecewise((0, x<x0), ((x-x0)/(x1-x0), (x>=x0)&(x<=x1)), (1, x>x1))` (rampa lineal entre $F=0$ y $F=1$, propia de una densidad uniforme). `graph_shade: null`.
- **`lectura-discreta-vs-continua`**: graficar $F(x)$ escalonada vía `Piecewise((0, x<0), (p_0, (x>=0)&(x<x_1)), (p_0+p_1, (x>=x_1)&(x<x_2)), …, (1, x>=x_{ultimo}))`, reutilizando una función puntual de 2-3 valores. `graph_shade: null`.
- **`graph_free_aspect: true` es obligatorio en los 3 casos de arriba** (todo ítem con `graph_fn` real de este topic; no aplica cuando `graph_fn` es `null`). Sin esto, Mafs fuerza el aspecto 1:1 e infla el eje $y$ muy por encima de $[0,1]$ para igualar el aspecto del eje $x$, dejando la curva como una franja fina en el medio del gráfico — ver sección Gráficos de `authoring-context.md`.
- **`graph_view` con `graph_free_aspect: true` no necesita ser cuadrado ni llevar colchón extra** (la regla de aspecto 1:1 de `authoring-context.md` es para pendientes de `analisis`, y con el flag activo Mafs ya no auto-expande ningún eje): elegir $x$ e $y$ de forma independiente, cada uno con su propio margen prolijo (~10-15% del rango de datos a cada lado), sin dejar aire de más para "compensar" nada.
  - **`lectura-diferencia-acumulada`** (densidad uniforme, altura $h$ sobre $[a,b]$): $x$ con margen de ~12% del ancho de $[a,b]$ a cada lado; $y$ de `-0.1·h` a `1.15·h` aprox.
  - **`lectura-limites-acumulada`** (rampa $F$ entre 0 y 1): $x$ con margen suficiente para ver el tramo plano antes de $x_0$ y después de $x_1$; $y$ de `-0.12` a `1.12`.
  - **`lectura-discreta-vs-continua`** (escalón $F$): mismo criterio que la rampa, $y$ de `-0.12` a `1.12`; $x$ con margen a cada lado del primer/último salto para que el tramo constante final se note plano.

---

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Calcular $F(x)$ desde una densidad uniforme simple | 6 | `resl-acumulada-desde-densidad` | Calcular $F(x)$ como área geométrica acumulada bajo una densidad uniforme hasta el punto $x$ | Área de rectángulo (base × altura) hasta $x$, $F(x)$ como acumulación geométrica |
| Calcular $P(a<X\leq b)$ usando $F(b)-F(a)$ | 6 | `resl-diferencia-acumulada` | Calcular numéricamente $P(a<X\leq b)$ restando dos evaluaciones de $F$ ya calculadas | Resta de $F(b)-F(a)$, aplicación numérica de la propiedad |
| Calcular $F(x)$ desde una función puntual discreta (suma acumulada de $p(x)$) | 3 | `resl-acumulada-desde-puntual` | Calcular $F(x)$ sumando los valores de $p(x)$ hasta $x$ inclusive | Suma acumulada discreta, inclusión del valor $x$ en la suma |
| **Total** | **15** | | | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

### Contextos variados

- **Continuo (uniforme)**: tiempo de espera equiprobable en un intervalo, posición de un punto al azar en un segmento, hora de llegada dentro de una franja horaria (mismos contextos que `densidad`).
- **Discreto**: cantidad de caras al lanzar 2 o 3 monedas, resultado de un dado, conteos cortos en contexto aplicado (clientes, artículos defectuosos) (mismos contextos que `puntual`).
- Ningún experimento debe superar ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Diferencia acumulada | Calcular $F(b)+F(a)$ en vez de $F(b)-F(a)$ |
| Diferencia acumulada | Confundir $P(a<X\leq b)$ con $P(a\leq X\leq b)$ en el caso discreto, donde el extremo $a$ sí puede aportar probabilidad |
| Acumulada desde densidad | Confundir $F(x)$ (área acumulada hasta $x$) con $f(x)$ (altura de la densidad en $x$) |
| Acumulada desde puntual | Olvidar sumar todos los valores hasta $x$ inclusive, quedándose con el último puntual solo |
| Discreta vs. continua | Confundir una acumulada con saltos (discreta) con una curva suave (continua) al leer el gráfico |
| Límites de $F$ | Aceptar como válido un valor de $F(x)$ mayor a $1$ o menor a $0$ |

---

## Reglas específicas del topic

- **Reutilizar los mismos tipos de densidad/función puntual** de `densidad`/`puntual` (uniforme, lineal simple, dominios discretos chicos), nunca introducir una distribución nueva en este topic. En `resl-acumulada-desde-densidad` usar solo densidad **uniforme** (no lineal), para que $F(x)$ sea siempre área de rectángulo.
- **Contextos cotidianos (regla crítica 43)**: `GRAF` y `RESL` usan siempre un contexto concreto (los mismos de `densidad`/`puntual`, ver tabla de "Contextos variados" más arriba), nunca "una variable aleatoria $X$" abstracta sin nombrar. `FORM` es la excepción intencional: evalúa reconocer la definición/propiedad en general, así que queda abstracto.
- **Cada ejercicio reintroduce** la propiedad $P(a<X\leq b)=F(b)-F(a)$ cuando la usa (regla crítica 31).
- **En `explanation`**, cuando se calcule $F(x)$ desde una densidad uniforme, mostrar la fórmula geométrica (base × altura) antes que notación de integral, igual que en `densidad` (ver su regla equivalente).

## Checklist del topic

- [ ] Toda densidad/función puntual reutilizada es uniforme, lineal simple o discreta chica (ya vista en topics anteriores); `resl-acumulada-desde-densidad` usa solo uniforme
- [ ] Ningún ejercicio acepta $F(x)$ fuera de $[0,1]$
- [ ] `resl-acumulada-desde-densidad` calcula $F(x)$ como área geométrica, no con notación $\int$
- [ ] GRAF mezcla `graph_fn` real (~60-70%) y descripción por texto (`graph_fn: null`) dentro de cada sub-familia; `graph_shade` solo en ejercicios reales de `lectura-diferencia-acumulada`
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: FORM conceptual → 3 opciones; GRAF/RESL numérico → 4 opciones ≤35 caracteres
