# Topic: Esperanza

Belt: `violet`, Unit: `variables`, Topic: `esperanza`

Skills en este topic: `FORM`, `RESL`.

Este topic tiene 2 ítems (uno por skill): `FORM`, `RESL`.

Concepto: la **esperanza** $E[X]=\sum_x x\cdot p(x)$ (discreta) o $E[X]=\int x\cdot f(x)\,dx$ (continua), el promedio ponderado a largo plazo. Es lineal: $E[aX+b]=a\cdot E[X]+b$.

**Frontera con el resto de la unidad:** reutiliza `puntual` (discreta) y `densidad` (continua, uniforme) ya trabajados. No usa todavía varianza.

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| $E[X]=\sum_x x\cdot p(x)$ discreta | 6 | `formula-discreta` | Reconocer la fórmula de esperanza discreta como promedio ponderado por $p(x)$ | $E[X]=\sum_x x\cdot p(x)$, distinción con el promedio aritmético simple |
| Linealidad $E[aX+b]=a\cdot E[X]+b$ | 5 | `propiedad-linealidad` | Reconocer que la esperanza de una transformación lineal se calcula transformando $E[X]$, sin recalcular la suma completa | $E[aX+b]=a\cdot E[X]+b$, distinción con $a(E[X]+b)$ |
| $E[X]=\int x f(x)\,dx$ continua (fórmula, sin resolver la integral) | 4 | `formula-continua` | Reconocer la fórmula de esperanza continua como integral ponderada por $f(x)$ | $E[X]=\int x f(x)\,dx$, analogía con la suma ponderada discreta |
| **Total** | **15** | | | |

---

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Calcular $E[X]$ discreta desde una tabla $p(x)$ | 7 | `resl-discreta` | Calcular numéricamente $E[X]$ ponderando cada valor por su probabilidad | Suma ponderada $x\cdot p(x)$, acumulación término a término |
| Calcular $E[aX+b]$ usando linealidad, con $E[X]$ ya conocido | 5 | `resl-linealidad` | Calcular $E[aX+b]$ aplicando la propiedad de linealidad sobre un $E[X]$ dado | $E[aX+b]=a\cdot E[X]+b$, aplicación numérica directa |
| Calcular $E[X]$ continua con una densidad uniforme (fórmula $(a+b)/2$ dada, sin integrar) | 3 | `resl-continua-uniforme` | Calcular $E[X]$ de una densidad uniforme aplicando el punto medio del intervalo | $E[X]=(a+b)/2$ para densidad uniforme sobre $[a,b]$ |
| **Total** | **15** | | | |

**Cardinalidad**: FORM conceptual → 3 opciones; RESL numérico → 4 opciones (grilla 2×2) ≤35 caracteres.

### Contextos variados

- **Discreto**: cantidad de fallas/defectos por lote, clientes que llegan a una caja en un minuto, cantidad de piezas defectuosas en una muestra (mismos contextos que `puntual`).
- **Continuo (uniforme)**: tiempo de espera en una fila o cajero automático, posición de un punto al azar en un segmento (mismos contextos que `densidad`).
- Ningún experimento debe superar ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| $E[X]$ discreta | Promediar los valores de $x$ sin ponderar por $p(x)$ (promedio simple en vez de ponderado) |
| Linealidad | Aplicar $E[aX+b]=a\cdot E[X]$ olvidando sumar $b$ |
| Linealidad | Multiplicar $b$ por $a$ también (creer que $E[aX+b]=a(E[X]+b)$) |
| $E[X]$ continua uniforme | Usar el punto medio del dominio completo en vez del intervalo donde la densidad es no nula |
| Cálculo discreto | Omitir algún término $x\cdot p(x)$ de la suma |

---

## Reglas específicas del topic

- **Dominio discreto chico** (3-5 valores), consistente con `puntual`.
- **Densidad continua uniforme únicamente**, reutilizando la fórmula ya vista $(a+b)/2$; no pedir la integral en este topic.
- **Cada ejercicio reintroduce la fórmula de esperanza** que usa (regla crítica 31).
- **Contextos cotidianos, incluso en `FORM` (excepción a la excepción de la regla crítica 43)**: a diferencia del resto de la unidad, donde `FORM`/`LEXI` quedan abstractos por diseño, en `esperanza` los ítems de `FORM` también se enmarcan en un contexto cotidiano liviano (ej. "la cantidad de fallas por lote en una fábrica es una variable aleatoria discreta $X$..."), sin que eso convierta la pregunta en un cálculo numérico: la pregunta sigue pidiendo la fórmula general, el contexto solo le da un escenario concreto en vez de dejarla en "Sea $X$ una variable aleatoria...". `RESL` sigue la regla 43 estándar (contexto obligatorio, con número concreto a calcular).

## Checklist del topic

- [ ] Los ejercicios discretos ponderan correctamente cada valor por su $p(x)$
- [ ] Los ejercicios continuos usan solo densidad uniforme con fórmula ya conocida
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
- [ ] `FORM` usa contexto cotidiano liviano (pregunta sigue siendo por la fórmula general, no por un número); `RESL` usa contexto con número concreto a calcular
