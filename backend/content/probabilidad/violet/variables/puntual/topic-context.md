# Topic: Función de probabilidad puntual

Belt: `violet`, Unit: `variables`, Topic: `puntual`

Skills en este topic: `FORM`, `GRAF`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `FORM`, `GRAF`, `RESL`.

Concepto: la **función de probabilidad puntual** $p(x) = P(X=x)$ de una variable discreta, con la condición $\sum_x p(x) = 1$.

**Frontera con el resto de la unidad:** solo variables **discretas**; la versión continua (densidad) es el topic siguiente. No usa todavía acumulada, esperanza ni varianza.

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Condición de normalización $\sum_x p(x)=1$ | 5 | `condicion-normalizacion` | Reconocer la condición de normalización que debe cumplir toda función de probabilidad puntual | $p(x)\geq 0$, $\sum_x p(x)=1$, distinción suma (discreta) vs. integral (continua) |
| Despejar un $p(x)$ faltante conociendo el resto | 5 | `despejar-valor-faltante` | Despejar un valor puntual desconocido usando que la suma total es 1 | Normalización aplicada al despeje, resta de 1 menos el resto de la suma |
| Expresar $P(X\in \text{evento})$ como suma de $p(x)$ sobre varios valores | 5 | `formula-evento-compuesto` | Expresar $P(X\in\text{evento})$ como fórmula de suma de $p(x)$ sobre varios valores, sin resolver el número final | Evento compuesto como unión de valores puntuales, notación de suma parcial |
| **Total** | **15** | | | |

---

## GRAF, 15 ejercicios

Gráfico de barras de $p(x)$.

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Leer la altura de una barra faltante usando normalización | 5 | `lectura-barra-faltante` | Calcular la altura de una barra que falta en el gráfico usando la condición de normalización | Lectura de gráfico de barras, normalización aplicada visualmente |
| Leer $P(X=x)$ puntual directo del gráfico | 5 | `lectura-puntual-directa` | Leer directamente $P(X=x)$ como la altura de una barra puntual del gráfico | Lectura directa de altura de barra, correspondencia valor de $x$ ↔ altura |
| Leer $P(\text{evento compuesto})$ sumando alturas de varias barras | 5 | `lectura-evento-compuesto` | Leer $P(\text{evento compuesto})$ sumando las alturas de varias barras del gráfico | Suma visual de alturas, evento compuesto leído gráficamente |
| **Total** | **15** | | | |

---

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Calcular $P(X=x)$ desde un experimento simple (monedas, dados) | 6 | `resl-puntual-directo` | Calcular $P(X=x)$ desde un experimento simple contando resultados favorables | Espacio muestral equiprobable, conteo de resultados que dan un valor puntual |
| Calcular $P(\text{evento compuesto})$, ej. $P(X\leq k)$, sumando valores puntuales | 6 | `resl-evento-compuesto` | Calcular $P(\text{evento compuesto})$ sumando varios valores puntuales ya calculados | Suma de $p(x)$ sobre varios valores, distinción de puntual vs. acumulado |
| Verificar si una función dada es una función de probabilidad puntual válida (la suma no da $1$) | 3 | `resl-verificar-validez` | Verificar si una función dada es una función de probabilidad puntual válida | Chequeo de $\sum_x p(x)=1$ y $p(x)\geq 0$, detección de funciones inválidas |
| **Total** | **15** | | | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

### Contextos variados

- **Conteo de éxitos en pocos ensayos**: cantidad de caras al lanzar 2 o 3 monedas, cantidad de éxitos en pocos ensayos independientes (ej. tiros al arco, preguntas acertadas).
- **Valores de un dado**: resultado de un dado equilibrado, suma o diferencia de dos dados con dominio acotado.
- **Conteos cortos en contexto aplicado**: cantidad de clientes que llegan en un intervalo corto, cantidad de artículos defectuosos en una muestra chica, cantidad de llamadas en un lapso breve.
- Ningún experimento debe superar ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Normalización | Despejar el valor faltante sumando en vez de restar de $1$ la suma del resto |
| Evento compuesto | Sumar solo un valor puntual cuando el evento incluye varios (ej. $P(X\leq 2)$ tratado como $P(X=2)$) |
| Lectura de gráfico | Confundir la altura de la barra con la posición en el eje $x$ |
| Verificación de validez | Aceptar como válida una función cuyas alturas no suman $1$, o que incluye un valor negativo |
| Puntual vs. acumulada | Calcular $P(X\leq k)$ como si fuera un solo valor puntual $p(k)$, sin sumar los anteriores |

---

## Reglas específicas del topic

- **Dominio finito y chico**: 3 a 5 valores posibles de $X$ (ej. $\{0,1,2,3\}$), para que las sumas de verificación sean manejables a mano.
- **Contextos cotidianos (regla crítica 43)**: `GRAF` y `RESL` usan siempre un contexto concreto de la tabla de arriba (monedas, dados, conteos aplicados), nunca "una variable aleatoria $X$" abstracta sin nombrar. `FORM` es la excepción intencional: evalúa reconocer la condición de normalización y las fórmulas en general, no aplicarlas a un caso, así que queda abstracto.
- **Contextos**: ver tabla de "Contextos variados" más arriba.
- **Cada ejercicio reintroduce la condición de normalización** cuando la usa para despejar (regla crítica 31).

## Checklist del topic

- [ ] El dominio de $X$ tiene entre 3 y 5 valores en todos los ejercicios
- [ ] Los ejercicios de evento compuesto suman correctamente 2 o más valores puntuales
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: FORM conceptual → 3 opciones; GRAF/RESL numérico → 4 opciones ≤35 caracteres
