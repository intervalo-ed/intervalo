# Topic: Distribución uniforme continua

Belt: `brown`, Unit: `distribuciones`, Topic: `uniforme`

Skills en este topic: `GRAF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `GRAF`, `FORM`.

Concepto: $X\sim U(a,b)$, densidad constante $f(x)=\dfrac{1}{b-a}$ en $[a,b]$. $E[X]=(a+b)/2$. Reutiliza directamente lo visto en `blue/variables/densidad` (rectángulo), ahora nombrado como distribución con parámetros propios.

**Nota de dependencia con integrales**: como en `blue/variables/densidad`, el área bajo $f(x)$ es siempre un rectángulo, calculable geométricamente sin técnica de integración (ver `probabilidad/course-context.md`).

**Marco de la unidad (mismo para las 3 distribuciones continuas):** `GRAF` evalúa tres roles de lectura (reconocer la forma de la densidad / leer el efecto de cambiar un parámetro sobre la curva / leer una probabilidad como área sombreada); `FORM` evalúa tres roles de aplicación (identificar parámetros y densidad / esperanza con su lectura interpretativa / probabilidad con fórmula cerrada, sin integrar). Ver `distribuciones` en conjunto: el mismo esqueleto se repite en `exponencial` y `normal`, cada uno instanciándolo con lo propio de su modelo.

---

## GRAF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer la forma rectangular de la densidad uniforme (altura constante, nula fuera de $[a,b]$) | 5 | `reconocer-forma` |
| Leer el efecto de cambiar el intervalo $[a,b]$ sobre la altura del rectángulo (intervalo más ancho → rectángulo más bajo) | 5 | `efecto-parametro` |
| Leer una probabilidad como área de un subintervalo sombreado | 5 | `probabilidad-como-area` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Densidad $f(x)=\dfrac{1}{b-a}$, identificar $a$ y $b$ desde un contexto | 5 | `formula-densidad` |
| $E[X]=(a+b)/2$, con lectura interpretativa | 5 | `formula-esperanza` |
| $P(c\leq X\leq d)=\dfrac{d-c}{b-a}$ para un subintervalo $[c,d]\subseteq[a,b]$ | 5 | `formula-probabilidad-subintervalo` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## Contextos variados

- Tiempo de espera en la fila de un banco, entre 0 y un máximo de minutos.
- Posición donde se detiene una manecilla o un puntero dentro de un tramo corto de una escala.
- Hora de llegada de un colectivo dentro de una franja horaria fija (corta, unos pocos minutos), sin preferencia por ningún momento.
- Posición donde cae un dardo o se detecta una partícula, dentro de un rango físico corto (unos pocos cm o mm).
- Tiempo que tarda en descargarse un archivo chico, entre un mínimo y un máximo de pocos segundos.
- Nivel de líquido restante en un dispensador antes de la próxima recarga, entre vacío y lleno, en una escala corta.

**Para ítems `GRAF` (con imagen), elegir siempre la versión de estos contextos con el rango numérico más corto posible** (ver regla de alturas prolijas en *Diseño de gráficos reales* abajo): nunca una ruleta de 360°, una regla de 30 cm o una franja horaria de varias horas, aunque sea el escenario "más realista". Los ítems `FORM` (sin imagen) no tienen esta restricción, ahí alcanza con la regla general de intervalos enteros 2 a 8.

---

## Diseño de gráficos reales (`graph_fn`, `graph_view`, `graph_shade`, `graph_free_aspect`)

- `reconocer-forma` **no lleva imagen** (`graph_fn`/`graph_view`/`graph_shade`/`graph_free_aspect` todos `null`). Mostrar el rectángulo y preguntar "¿qué forma tiene?" con opciones tipo "rectángulo/campana/curva que decae" es trivial a simple vista, no requiere razonar nada; la forma se describe en prosa dentro del `question` y la pregunta se resuelve por definición, no por lectura visual (hallazgo confirmado en testing real, ronda de graph_fn de brown/distribuciones, ago-2026).
- `efecto-parametro` no necesita `graph_shade` ni imagen; compara dos fórmulas de densidad en el propio `question` (ver ejemplo ya generado).
- `probabilidad-como-area` usa `graph_shade: [c, d]` sobre el subintervalo cuya área se pregunta. **Regla crítica: el `question` nunca repite los límites `c`/`d` del sombreado en texto.** Si el enunciado ya dice "el área sombreada entre $x=10$ y $x=18$", el gráfico queda decorativo, no hace falta mirarlo para resolver. El gráfico tiene que ser la única fuente de esos límites; el alumno los lee del eje, no los recibe redactados.
- **`graph_free_aspect: true` obligatorio en todo ítem de este topic con `graph_fn` no nulo.** El eje $y$ de una densidad uniforme suele quedar en un rango angosto (ej. $[0, 0{,}3]$) frente a un eje $x$ más ancho; forzar 1:1 infla el eje $y$ y deja el rectángulo como una franja fina. Elegir `graph_view` con margen ~10-15% del rango real de datos en cada eje, sin colchón extra pensado para compensar una auto-expansión que ya no ocurre (ver sección Gráficos de `authoring-context.md`).
- **Elegir el intervalo $[a,b]$ chico (largo 3 a 6) para que la altura $1/(b-a)$ caiga en un rango "prolijo" (~0,15 a ~0,5), nunca un intervalo largo tipo $[0,30]$ que da una altura minúscula (ej. $1/30\approx0{,}03$).** Una altura muy chica se renderiza como un rectángulo aplastado y sin gracia contra la grilla, sin importar cuán ajustado esté el `graph_view`; el problema es la magnitud del dato, no el margen elegido (hallazgo confirmado en testing real, ronda de graph_fn de brown/distribuciones, ago-2026). Reformular el contexto con un rango físico más corto (un canal de pocos milímetros, un intervalo de pocos segundos) en vez de forzar un intervalo largo "más realista".

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Altura de la densidad | Usar $h=b-a$ en vez de $h=1/(b-a)$ (invertir la fracción) |
| Efecto del parámetro | Creer que un intervalo más ancho da un rectángulo más alto (en realidad es más bajo, para que el área siga siendo 1) |
| Probabilidad de subintervalo | Calcular sobre la longitud total del dominio en vez de sobre el subintervalo pedido |
| Esperanza | Usar el punto medio de un subintervalo mencionado en el enunciado en vez del dominio completo $[a,b]$ |
| Lectura de intervalo | Confundir dónde la densidad vale $0$ con los extremos $a$ y $b$ donde empieza a valer $h$ |

---

## Reglas específicas del topic

- **Intervalos enteros cortos** (longitud 2 a 8) para que los cálculos sean manejables a mano.
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).
- **Toda `explanation` de este topic (`GRAF` y `FORM`) incluye un párrafo breve que interpreta intuitivamente el concepto central del ejercicio.** En `formula-esperanza` esa interpretación explica que $E[X]=(a+b)/2$ es el punto medio del intervalo precisamente porque la densidad es pareja: no hay ningún valor "más probable" que otro, así que el promedio a largo plazo cae justo en el centro. En `efecto-parametro`/`probabilidad-como-area` la interpretación conecta la geometría (área de un rectángulo) con la probabilidad (nunca hay valores más ni menos probables dentro de $[a,b]$, la probabilidad de cualquier subintervalo depende solo de su longitud).

## Checklist del topic

- [ ] Todo intervalo $[a,b]$ es entero con longitud entre 2 y 8
- [ ] Ningún ejercicio requiere técnica de integración, solo geometría de rectángulos
- [ ] Todo ítem con `graph_fn` no nulo lleva `graph_free_aspect: true`
- [ ] Toda `explanation` tiene su párrafo de interpretación intuitiva
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: GRAF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
