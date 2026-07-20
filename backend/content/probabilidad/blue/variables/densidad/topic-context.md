# Topic: Función de densidad

Belt: `blue`, Unit: `variables`, Topic: `densidad`

Skills en este topic: `FORM`, `GRAF`, `RESL`.

Concepto: la **función de densidad** $f(x)$ de una variable continua, con $P(a\leq X\leq b)=\int_a^b f(x)\,dx$ y $\int_{-\infty}^{\infty} f(x)\,dx=1$. $P(X=x)=0$ para cualquier valor puntual.

**Nota de dependencia con integrales** (ver `probabilidad/course-context.md`): usar exclusivamente densidades **uniformes** (rectángulo) o **lineales simples** ($f(x)=kx$ en un intervalo corto), donde el área se calcula como superficie geométrica (rectángulo o triángulo) sin necesidad de técnica de integración. Nunca una densidad que exija antiderivada no trivial en este topic.

---

## FORM, 15 ítems

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Expresión $P(a\leq X\leq b)=\int_a^b f(x)\,dx$ | 6 | `formula-probabilidad-area` |
| Condición de normalización $\int f(x)\,dx=1$ sobre todo el dominio | 5 | `condicion-normalizacion` |
| Reconocer que $P(X=x)=0$ para cualquier valor puntual de una continua | 4 | `probabilidad-puntual-nula` |
| **Total** | **15** | |

---

## GRAF, 15 ítems

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Leer la altura $h$ de una densidad uniforme (rectángulo) desde la condición de área $=1$ | 6 | `lectura-altura-uniforme` |
| Leer una probabilidad como área bajo la curva (rectángulo o triángulo simple) | 6 | `lectura-area-probabilidad` |
| Comparar dos densidades por su forma (cuál está más concentrada/dispersa) | 3 | `comparacion-forma` |
| **Total** | **15** | |

---

## RESL, 15 ítems

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Calcular una probabilidad como área de un rectángulo (densidad uniforme) | 6 | `resl-area-rectangulo` |
| Calcular la constante $k$ de normalización despejando de $\int f=1$ (densidad lineal $f(x)=kx$) | 5 | `resl-constante-normalizacion` |
| Calcular una probabilidad como área de un triángulo (densidad lineal $f(x)=kx$) | 4 | `resl-area-triangulo` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| $P(X=x)$ puntual | Creer que $P(X=x)$ es la altura $f(x)$ en vez de $0$ (confundir densidad con probabilidad puntual) |
| Área de rectángulo | Calcular altura $\times$ ancho total del dominio en vez de solo el tramo pedido $[a,b]$ |
| Normalización uniforme | Olvidar que $h \times (\text{largo del intervalo}) = 1$ y usar $h=1$ directamente |
| Área de triángulo | Olvidar el factor $\tfrac{1}{2}$ del área del triángulo |
| Constante de normalización | Despejar $k$ sin elevar al cuadrado el límite superior en $\int_0^b kx\,dx = k b^2/2$ |
| Comparación de forma | Confundir "más concentrada" (curva más alta y angosta) con "más probable en promedio" |

---

## Reglas específicas del topic

- **Solo densidades uniformes o lineales simples**, con intervalos de longitud entera chica (2 a 5). Nunca pedir una antiderivada no trivial (ver nota de dependencia arriba).
- **Cada ítem reintroduce** la condición de normalización o la fórmula de probabilidad como área cuando la usa (regla crítica 31).
- **En `explanation`**, cuando se calcule un área, mostrar la fórmula geométrica (base × altura, o base × altura / 2) antes que notación de integral, salvo que el ítem pida explícitamente reconocer la notación $\int$ (sub-familia `formula-probabilidad-area`).

## Checklist del topic

- [ ] Toda densidad es uniforme o lineal simple, nunca requiere antiderivada no trivial
- [ ] Los intervalos del dominio son enteros y de longitud ≤5
- [ ] Ningún ítem confunde $f(x)$ con $P(X=x)$
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: FORM conceptual → 3 opciones; GRAF/RESL numérico → 4 opciones ≤35 caracteres
