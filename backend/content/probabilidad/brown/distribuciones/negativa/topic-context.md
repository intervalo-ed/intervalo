# Topic: Distribución binomial negativa

Belt: `brown`, Unit: `distribuciones`, Topic: `negativa`

Skills en este topic: `CLSF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `CLSF`, `FORM`.

Concepto: generaliza la geométrica: cantidad de ensayos hasta acumular $r$ éxitos. $P(X=k)=\binom{k-1}{r-1}p^r(1-p)^{k-r}$, $E[X]=r/p$. Coincide con `geometrica` cuando $r=1$.

**Frontera con el resto del topic:** distinguir de `geometrica` (caso particular $r=1$) y de `binomial` ($n$ fijo, no se detiene al llegar a $r$ éxitos).

**Marco de la unidad:** ver la nota de marco compartido en `binomial/topic-context.md`. `CLSF` evalúa reconocer-propia / distractor-vecino / supuesto-violado; `FORM` evalúa identificar-parametros / formula-directa / esperanza-y-relacion-geometrica.

---

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer binomial negativa (ensayos hasta acumular $r>1$ éxitos) | 6 | `reconocer-negativa` |
| Distractor: la historia parece binomial negativa pero en realidad es geométrica ($r=1$) o binomial ($n$ fijo, no se detiene al llegar a $r$ éxitos) | 5 | `distractor-vecino` |
| Supuesto violado: la probabilidad de éxito cambia a medida que se acumulan éxitos (ej. un vendedor gana confianza y mejora su tasa de cierre) | 4 | `supuesto-violado` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Identificar $r$ y $p$ desde un contexto dado | 4 | `identificar-parametros` |
| Fórmula $P(X=k)=\binom{k-1}{r-1}p^r(1-p)^{k-r}$ | 6 | `formula-directa` |
| $E[X]=r/p$ y relación con la geométrica cuando $r=1$, con lectura interpretativa | 5 | `esperanza-y-relacion-geometrica` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## Contextos variados

- Vendedor que busca acumular $r$ ventas cerradas, con la misma probabilidad de cerrar cada intento.
- Currículums enviados hasta acumular $r$ respuestas positivas, con la misma probabilidad de respuesta cada vez.
- Intentos de un arquero hasta acumular $r$ goles convertidos, con porcentaje de acierto fijo.
- Rondas de un sorteo hasta que un mismo número salga $r$ veces.
- Inspecciones de calidad hasta detectar $r$ piezas defectuosas, con la misma probabilidad de defecto en cada pieza.
- Publicaciones en redes hasta lograr $r$ veces que una alcance cierta cantidad de interacciones, con la misma probabilidad cada vez.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Binomial negativa vs. geométrica | No notar que $r>1$ e igual aplicar la fórmula geométrica simple |
| Binomial negativa vs. binomial | Tratar el problema como $n$ ensayos fijos cuando en realidad el experimento se detiene al llegar al $r$-ésimo éxito ($n$ es aleatorio) |
| Supuesto violado | No notar que la probabilidad de éxito cambia a medida que se acumulan intentos o éxitos, y tratar la situación como binomial negativa igual |
| Fórmula | Usar $\binom{k}{r}$ en vez de $\binom{k-1}{r-1}$ (olvidar que el último ensayo siempre es un éxito) |
| Fórmula | Invertir los exponentes de $p$ y $(1-p)$ |
| Esperanza | Usar $E[X]=r\cdot p$ en vez de $r/p$ |

---

## Reglas específicas del topic

- **Contextos válidos**: ver tabla de arriba.
- **$r$ siempre $\geq 2$** en `reconocer-negativa` (para no solaparse con `geometrica`, que cubre $r=1$).
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).
- **Toda `explanation` de este topic (`CLSF` y `FORM`) incluye un párrafo breve que interpreta intuitivamente el concepto central del ejercicio.** En `esperanza-y-relacion-geometrica` esa interpretación explica que $E[X]=r/p$ es simplemente $r$ veces el promedio de intentos de una geométrica ($1/p$ cada "ronda" hasta el próximo éxito), porque acumular $r$ éxitos es repetir $r$ veces el mismo proceso de esperar un éxito.
- **`supuesto-violado`**: la historia describe alguien cuya probabilidad de éxito cambia a medida que acumula intentos o éxitos (vendedor que gana confianza, jugador que se cansa); las opciones incluyen una que nombra esa razón explícitamente.

## Checklist del topic

- [ ] Todo ejercicio de `reconocer-negativa` tiene $r\geq 2$ explícito
- [ ] `distractor-vecino` varía entre confundir con geométrica y con binomial
- [ ] `supuesto-violado` nombra explícitamente por qué $p$ deja de ser constante entre intentos
- [ ] Toda `explanation` tiene su párrafo de interpretación intuitiva
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
