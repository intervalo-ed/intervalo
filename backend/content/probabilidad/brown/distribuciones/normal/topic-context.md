# Topic: Distribución normal

Belt: `brown`, Unit: `distribuciones`, Topic: `normal`

Skills en este topic: `GRAF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `GRAF`, `FORM`.

Concepto: $X\sim N(\mu,\sigma^2)$, densidad en forma de campana simétrica centrada en $\mu$, dispersión controlada por $\sigma$. Se estandariza con $Z=(X-\mu)/\sigma$ a $N(0,1)$. Cierra `brown/distribuciones`.

**Nota de dependencia con integrales**: cualquier probabilidad de la normal se busca vía la variable estandarizada $Z$ y valores de tabla ya dados (nunca se pide integrar la densidad), consistente con la nota de `probabilidad/course-context.md`.

**Marco de la unidad:** ver la nota de marco compartido en `uniforme/topic-context.md`. Acá el esqueleto se adapta porque la normal no tiene una fórmula cerrada de probabilidad sin tabla de valores $Z$: `GRAF` evalúa reconocer-forma / identificar-media / comparar-dispersion; `FORM` evalúa identificar-parametros / formula-estandarizacion / propiedad-simetria.

---

## GRAF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer la forma de campana simétrica (máximo en el centro, colas que decaen sin tocar el eje) | 5 | `reconocer-forma` |
| Identificar el centro $\mu$ desde el gráfico (eje de simetría, punto máximo) | 5 | `identificar-media` |
| Comparar dispersión entre dos curvas normales (mayor $\sigma$ = más achatada y ancha) | 5 | `comparar-dispersion` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Identificar $\mu$ y $\sigma$ desde la fórmula de la densidad o desde un contexto | 4 | `identificar-parametros` |
| Estandarización $Z=(X-\mu)/\sigma$ | 6 | `formula-estandarizacion` |
| Simetría de la normal ($P(X<\mu)=0{,}5$), con lectura interpretativa | 5 | `propiedad-simetria` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## Contextos variados

- Estaturas de una población adulta, centradas en una media con una desviación conocida.
- Tiempo que tarda un corredor en completar una carrera, en una población de corredores entrenados.
- Peso de paquetes despachados por una fábrica, con una media y desviación estándar de proceso.
- Puntaje de un examen estandarizado, con media y desviación conocidas de la población de rendidores.
- Duración de la batería de un dispositivo entre cargas, con media y desviación conocidas de fabricación.
- Temperatura corporal medida en un consultorio a lo largo de un día, alrededor de un valor típico.

**Para `identificar-media` (GRAF, con imagen), ninguno de los contextos de arriba sirve tal cual**: todos tienen $\sigma$ grande en términos absolutos (8, 50, valores de proceso de fábrica), lo que da un pico chato sin importar el `graph_view` (ver regla de alturas prolijas abajo). Ahí usar en cambio contextos de magnitud chica desde el arranque: error de un instrumento de medición (mm), diferencia entre hora real y programada de un evento (minutos), desviación de una medida respecto de un valor de referencia. Los demás contextos de la lista siguen sirviendo sin cambios para `reconocer-forma` (sin imagen), `comparar-dispersion` (sin imagen) y todo `FORM`.

---

## Diseño de gráficos reales (`graph_fn`, `graph_view`, `graph_shade`, `graph_free_aspect`)

- **`reconocer-forma` no lleva imagen** (`graph_fn`/`graph_view`/`graph_shade`/`graph_free_aspect` todos `null`). Con la curva a la vista, "¿es una campana o un rectángulo?" se contesta de un vistazo sin razonar nada; la forma se describe en prosa dentro del `question` (hallazgo confirmado en testing real, ronda de graph_fn de brown/distribuciones, ago-2026).
- **`identificar-media`** usa un `graph_fn` real de una campana concreta (ej. `(1/(sigma*sqrt(2*pi)))*exp(-((x-mu)^2)/(2*sigma^2))` con `sigma`/`mu` reemplazados por valores numéricos), con `graph_free_aspect: true`. El `question` no menciona $\mu$ en ningún lado; el único lugar donde aparece es en la `explanation`, después de responder.
  - **Usar siempre $\sigma$ chico (entre ~0,5 y 5), nunca un $\sigma$ grande aunque el contexto real lo tuviera** (ej. no usar $\sigma=50$ para un puntaje de examen). La altura del pico es $1/(\sigma\sqrt{2\pi})$: con $\sigma$ chico el pico cae en un rango vertical "prolijo" (entre ~0,08 y ~0,8) que se lee bien contra las líneas de grilla; con $\sigma$ grande el pico queda en un valor decimal minúsculo (ej. $0{,}008$) y la curva se renderiza chata y sin gracia sin importar cuán ajustado esté el `graph_view`, un problema que **no se arregla con el margen del `graph_view`**, hay que elegir $\sigma$ chico desde el planteo del ejercicio (hallazgo confirmado en testing real, ronda de graph_fn de brown/distribuciones, ago-2026).
  - **Preferir contextos donde $\mu$ también sea un número chico** (cerca de 0, no en la centena o el millar), consistente con $\sigma$ chico: un error de medición, una diferencia de tiempo, una desviación respecto de un valor de referencia. Mantiene los ticks del eje $x$ en un rango legible y a la misma escala visual que el pico.
- **`comparar-dispersion`** no usa gráfico único: se comparan dos curvas mostrando sus dos fórmulas de densidad (una con $\sigma$ chico, otra con $\sigma$ grande) en dos bloques `$$...$$` separados dentro del enunciado, sin graficar ambas superpuestas (`graph_fn: null`, `graph_view: null`).
- **Ningún GRAF de este topic usa `graph_shade`**: no se pide leer una probabilidad como área (eso excede la frontera del topic, ver regla específica abajo).

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Estandarización | Invertir la fórmula, usando $Z=(\mu-X)/\sigma$ o $Z=\sigma/(X-\mu)$ |
| Dispersión | Creer que un $\sigma$ mayor da una curva más alta y angosta (en realidad es más achatada y ancha, el área bajo la curva sigue siendo $1$) |
| Simetría | Creer que $P(X<\mu)\neq 0{,}5$ o que depende de $\sigma$ |
| Identificar parámetros | Confundir $\sigma$ con $\sigma^2$ al leer la notación $N(\mu,\sigma^2)$ |
| Centro | Confundir el punto de inflexión de la curva con el máximo (el máximo está exactamente en $\mu$) |

---

## Reglas específicas del topic

- **Parámetros con valores simples** ($\mu$, $\sigma$ enteros o con un decimal), consistente con el resto de la unidad.
- **Ningún ejercicio pide el valor numérico de una probabilidad de tabla** (eso excede la frontera de este topic sin una tabla de valores $Z$ provista); los cálculos se limitan a estandarización, simetría e identificación de parámetros.
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).
- **Toda `explanation` de este topic (`GRAF` y `FORM`) incluye un párrafo breve que interpreta intuitivamente el concepto central del ejercicio.** En `formula-estandarizacion` esa interpretación explica que $Z$ mide "a cuántos desvíos estándar de distancia de la media" cae un valor, una vara común para comparar observaciones de distintas escalas. En `propiedad-simetria` la interpretación conecta la forma simétrica de la campana con el hecho de que estar por debajo o por encima de la media son igual de probables, sin importar cuán dispersa esté la curva. En `comparar-dispersion` la interpretación explica qué significa en la práctica una $\sigma$ mayor: más variabilidad entre observaciones individuales, no un cambio en el promedio.

## Checklist del topic

- [ ] Ningún ejercicio requiere consultar una tabla de valores $Z$ no provista en el enunciado
- [ ] Los ejercicios de dispersión comparan correctamente la forma (más ancha = mayor $\sigma$)
- [ ] `identificar-media` lleva `graph_fn` real con `graph_free_aspect: true`, $\sigma$ chico (~0,5 a 5) y $\mu$ también chico (cerca de 0, no en la centena/millar); `reconocer-forma` y `comparar-dispersion` no llevan `graph_fn` (`null`)
- [ ] Toda `explanation` tiene su párrafo de interpretación intuitiva
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: GRAF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
