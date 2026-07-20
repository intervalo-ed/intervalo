# Topic: Función de distribución acumulada

Belt: `blue`, Unit: `variables`, Topic: `acumulada`

Skills en este topic: `FORM`, `GRAF`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `FORM`, `GRAF`, `RESL`.

Concepto: la **función de distribución acumulada** $F(x) = P(X\leq x)$, no decreciente, con $F\to 0$ cuando $x\to-\infty$ y $F\to 1$ cuando $x\to+\infty$. Propiedad clave: $P(a<X\leq b) = F(b)-F(a)$.

**Frontera con el resto de la unidad:** reutiliza `puntual` (discreta, suma acumulada de $p(x)$) y `densidad` (continua, área acumulada bajo $f(x)$) ya trabajados. No usa todavía esperanza ni varianza.

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Definición $F(x)=P(X\leq x)$ | 5 | `definicion-acumulada` |
| Propiedad $P(a<X\leq b)=F(b)-F(a)$ | 5 | `propiedad-diferencia` |
| Propiedades generales de $F$ (no decreciente, límites $0$ y $1$) | 5 | `propiedades-generales` |
| **Total** | **15** | |

---

## GRAF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Leer $F(a)$ y $F(b)$ del gráfico para calcular $P(a<X\leq b)$ | 6 | `lectura-diferencia-acumulada` |
| Leer el comportamiento asintótico de $F$ (tiende a $0$ y a $1$) | 5 | `lectura-limites-acumulada` |
| Reconocer si $F$ corresponde a una variable discreta (saltos) o continua (curva sin saltos) | 4 | `lectura-discreta-vs-continua` |
| **Total** | **15** | |

---

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Calcular $F(x)$ desde una densidad uniforme simple | 6 | `resl-acumulada-desde-densidad` |
| Calcular $P(a<X\leq b)$ usando $F(b)-F(a)$ | 6 | `resl-diferencia-acumulada` |
| Calcular $F(x)$ desde una función puntual discreta (suma acumulada de $p(x)$) | 3 | `resl-acumulada-desde-puntual` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

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

- **Reutilizar los mismos tipos de densidad/función puntual** de `densidad`/`puntual` (uniforme, lineal simple, dominios discretos chicos), nunca introducir una distribución nueva en este topic.
- **Cada ejercicio reintroduce** la propiedad $P(a<X\leq b)=F(b)-F(a)$ cuando la usa (regla crítica 31).

## Checklist del topic

- [ ] Toda densidad/función puntual reutilizada es uniforme, lineal simple o discreta chica (ya vista en topics anteriores)
- [ ] Ningún ejercicio acepta $F(x)$ fuera de $[0,1]$
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: FORM conceptual → 3 opciones; GRAF/RESL numérico → 4 opciones ≤35 caracteres
