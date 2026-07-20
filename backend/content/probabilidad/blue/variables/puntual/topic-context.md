# Topic: Función de probabilidad puntual

Belt: `blue`, Unit: `variables`, Topic: `puntual`

Skills en este topic: `FORM`, `GRAF`, `RESL`.

Concepto: la **función de probabilidad puntual** $p(x) = P(X=x)$ de una variable discreta, con la condición $\sum_x p(x) = 1$.

**Frontera con el resto de la unidad:** solo variables **discretas**; la versión continua (densidad) es el topic siguiente. No usa todavía acumulada, esperanza ni varianza.

---

## FORM, 15 ítems

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Condición de normalización $\sum_x p(x)=1$ | 5 | `condicion-normalizacion` |
| Despejar un $p(x)$ faltante conociendo el resto | 5 | `despejar-valor-faltante` |
| Expresar $P(X\in \text{evento})$ como suma de $p(x)$ sobre varios valores | 5 | `formula-evento-compuesto` |
| **Total** | **15** | |

---

## GRAF, 15 ítems

Gráfico de barras de $p(x)$.

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Leer la altura de una barra faltante usando normalización | 5 | `lectura-barra-faltante` |
| Leer $P(X=x)$ puntual directo del gráfico | 5 | `lectura-puntual-directa` |
| Leer $P(\text{evento compuesto})$ sumando alturas de varias barras | 5 | `lectura-evento-compuesto` |
| **Total** | **15** | |

---

## RESL, 15 ítems

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Calcular $P(X=x)$ desde un experimento simple (monedas, dados) | 6 | `resl-puntual-directo` |
| Calcular $P(\text{evento compuesto})$, ej. $P(X\leq k)$, sumando valores puntuales | 6 | `resl-evento-compuesto` |
| Verificar si una función dada es una función de probabilidad puntual válida (la suma no da $1$) | 3 | `resl-verificar-validez` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

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
- **Contextos**: cantidad de caras en $n$ monedas, cantidad de éxitos en pocos ensayos, valores de un dado, cantidad de clientes en un intervalo corto.
- **Cada ítem reintroduce la condición de normalización** cuando la usa para despejar (regla crítica 31).

## Checklist del topic

- [ ] El dominio de $X$ tiene entre 3 y 5 valores en todos los ítems
- [ ] Los ítems de evento compuesto suman correctamente 2 o más valores puntuales
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: FORM conceptual → 3 opciones; GRAF/RESL numérico → 4 opciones ≤35 caracteres
