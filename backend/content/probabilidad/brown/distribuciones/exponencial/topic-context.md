# Topic: Distribución exponencial

Belt: `brown`, Unit: `distribuciones`, Topic: `exponencial`

Skills en este topic: `GRAF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `GRAF`, `FORM`.

Concepto: $X\sim Exp(\lambda)$ modela el tiempo continuo entre eventos sucesivos de un proceso de Poisson con tasa $\lambda$. $f(x)=\lambda e^{-\lambda x}$, $x\geq 0$. $E[X]=1/\lambda$. Única distribución continua con pérdida de memoria (análoga a `geometrica` en el caso discreto).

**Nota de dependencia con integrales**: cuando un ejercicio necesite $P(a\leq X\leq b)$, dar la fórmula cerrada ya resuelta ($P(X\leq x)=1-e^{-\lambda x}$) en vez de pedir la integral (ver `probabilidad/course-context.md`).

**Marco de la unidad:** ver la nota de marco compartido en `uniforme/topic-context.md`. `GRAF` evalúa reconocer-forma / efecto-parametro / probabilidad-como-area; `FORM` evalúa formula-densidad / esperanza-y-perdida-memoria / probabilidad-acumulada-cerrada.

---

## GRAF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer la forma de la densidad exponencial (decae monótona desde un valor positivo en $x=0$, nunca cruza el eje, nula para $x<0$) | 5 | `reconocer-forma` |
| Leer el efecto de cambiar $\lambda$ sobre la curva (mayor $\lambda$ decae más rápido y arranca más alto) | 5 | `efecto-parametro` |
| Leer una probabilidad como área sombreada bajo la curva entre dos valores de $x$ | 5 | `probabilidad-como-area` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Densidad $f(x)=\lambda e^{-\lambda x}$, $x\geq 0$, identificar $\lambda$ desde un contexto | 5 | `formula-densidad` |
| $E[X]=1/\lambda$ y propiedad de pérdida de memoria, con lectura interpretativa | 5 | `esperanza-y-perdida-memoria` |
| Fórmula cerrada $P(X\leq x)=1-e^{-\lambda x}$ ya resuelta | 5 | `probabilidad-acumulada-cerrada` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## Contextos variados

- Tiempo entre llegadas sucesivas de clientes a un local, con tasa promedio conocida.
- Vida útil de un componente electrónico antes de fallar, con tasa de falla constante.
- Tiempo entre fallas sucesivas de una máquina en una fábrica.
- Tiempo que tarda un mensaje en recibir respuesta en un canal de soporte, desde que se envía.
- Tiempo entre sismos leves sucesivos registrados por un sismógrafo, con tasa promedio conocida.
- Duración de una llamada telefónica de atención al cliente, con tasa de finalización constante.

---

## Diseño de gráficos reales (`graph_fn`, `graph_view`, `graph_shade`, `graph_free_aspect`)

- `reconocer-forma` **no lleva imagen** (`graph_fn`/`graph_view`/`graph_shade`/`graph_free_aspect` todos `null`). Mostrar la curva y preguntar "¿qué forma tiene?" con opciones tipo "decae/campana/rectángulo" es trivial a simple vista; la forma se describe en prosa dentro del `question`, sin gráfico (hallazgo confirmado en testing real, ronda de graph_fn de brown/distribuciones, ago-2026).
- `efecto-parametro` no necesita `graph_shade` ni imagen; compara dos fórmulas de densidad con distinto $\lambda$ en el propio `question`.
- `probabilidad-como-area` usa `graph_shade: [c, d]` sobre el tramo cuya área se pregunta. **Regla crítica: el `question` nunca da los límites `c`/`d` del sombreado en texto ni en las opciones como números sueltos.** El alumno tiene que leer del gráfico dónde arranca y dónde termina el sombreado; si el enunciado ya lo dice, el gráfico es decorativo. Las opciones pueden comparar expresiones $P(a\leq X\leq b)$ con límites que sí extienden más allá de lo sombreado (ej. `$P(X\leq b)$`, `$P(X\geq a)$`), forzando a mirar dónde el sombreado realmente empieza y termina.
- **`graph_free_aspect: true` obligatorio en todo ítem de este topic con `graph_fn` no nulo.** La densidad exponencial arranca en $\lambda$ (a menudo bien por debajo de 1) y decae hacia 0 en un eje $x$ potencialmente ancho; forzar 1:1 infla el eje $y$ y aplana la curva. Elegir `graph_view` con margen ~10-15% del rango real de datos en cada eje, sin colchón extra pensado para compensar una auto-expansión que ya no ocurre.
- **Elegir $\lambda$ de forma que el pico $f(0)=\lambda$ caiga en un rango "prolijo" (~0,3 a ~1), nunca un $\lambda$ chico tipo $0{,}1$ o $0{,}25$ que arranca la curva casi pegada al eje.** Un pico muy bajo se renderiza chato y sin gracia contra la grilla sin importar el margen del `graph_view`; el problema es la magnitud del dato, no el ajuste de vista (hallazgo confirmado en testing real, ronda de graph_fn de brown/distribuciones, ago-2026). Con $\lambda$ más grande (ej. $0{,}5$) el dominio visible también se acorta (la cola relevante mide unas pocas unidades), lo que además concentra la curva en menos espacio horizontal y la hace lucir más pronunciada.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Forma de la densidad | Confundir la exponencial con la normal (simétrica) o con la uniforme (constante) |
| Efecto del parámetro | Creer que una $\lambda$ mayor decae más lento (en realidad decae más rápido, la media $1/\lambda$ es menor) |
| Probabilidad como área | Leer la altura de la curva en un punto como si fuera la probabilidad, en vez del área bajo el tramo sombreado |
| Esperanza | Usar $E[X]=\lambda$ en vez de $1/\lambda$ |
| Pérdida de memoria | Creer que el tiempo ya transcurrido afecta la distribución del tiempo restante |
| Soporte | Aceptar densidad no nula para $x<0$ |

---

## Reglas específicas del topic

- **$\lambda$ en valores simples** (ej. $\lambda=0{,}5$, $\lambda=2$) para que $E[X]=1/\lambda$ dé un número manejable.
- **Contextos válidos**: ver tabla de arriba.
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).
- **Toda `explanation` de este topic (`GRAF` y `FORM`) incluye un párrafo breve que interpreta intuitivamente el concepto central del ejercicio.** En `esperanza-y-perdida-memoria` esa interpretación es doble: $E[X]=1/\lambda$ es el tiempo promedio de espera si se repitiera el proceso muchas veces (una $\lambda$ grande, muchos eventos por unidad de tiempo, da un tiempo de espera promedio chico); y la pérdida de memoria significa que llevar un rato esperando sin que ocurra el evento no acerca ni aleja el próximo, el "reloj" vuelve a arrancar en cada instante. En `probabilidad-acumulada-cerrada` la interpretación conecta el área sombreada con la chance real de que el evento ocurra antes de cierto tiempo.

## Checklist del topic

- [ ] Ningún ejercicio pide resolver una integral; las fórmulas de probabilidad acumulada vienen ya cerradas
- [ ] $\lambda$ es un valor simple que da $1/\lambda$ manejable
- [ ] Todo ítem con `graph_fn` no nulo lleva `graph_free_aspect: true`
- [ ] Toda `explanation` tiene su párrafo de interpretación intuitiva
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: GRAF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
