# Topic: Función de densidad

Belt: `violet`, Unit: `variables`, Topic: `densidad`

Skills en este topic: `FORM`, `GRAF`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `FORM`, `GRAF`, `RESL`.

Concepto: la **función de densidad** $f(x)$ de una variable continua, con $P(a\leq X\leq b)=\int_a^b f(x)\,dx$ y $\int_{-\infty}^{\infty} f(x)\,dx=1$. $P(X=x)=0$ para cualquier valor puntual.

**Nota de dependencia con integrales** (ver `probabilidad/course-context.md`): usar exclusivamente densidades **uniformes** (rectángulo) o **lineales simples** ($f(x)=kx$ en un intervalo corto), donde el área se calcula como superficie geométrica (rectángulo o triángulo) sin necesidad de técnica de integración. Nunca una densidad que exija antiderivada no trivial en este topic.

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Expresión $P(a\leq X\leq b)=\int_a^b f(x)\,dx$ | 6 | `formula-probabilidad-area` | Reconocer que $P(a\leq X\leq b)$ se expresa como el área bajo la densidad, vía integral | $\int_a^b f(x)\,dx$, contraste con suma discreta y con evaluación puntual |
| Condición de normalización $\int f(x)\,dx=1$ sobre todo el dominio | 5 | `condicion-normalizacion` | Reconocer la condición de normalización de una densidad sobre todo su dominio | $\int_{-\infty}^{\infty} f(x)\,dx=1$ |
| Reconocer que $P(X=x)=0$ para cualquier valor puntual de una continua | 4 | `probabilidad-puntual-nula` | Reconocer que $P(X=x)=0$ para cualquier valor puntual de una variable continua | Distinción $f(x)$ (densidad) vs. $P(X=x)$ (probabilidad puntual, siempre 0) |
| **Total** | **15** | | | |

---

## GRAF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Leer la altura $h$ de una densidad uniforme (rectángulo) desde la condición de área $=1$ | 6 | `lectura-altura-uniforme` | Calcular la altura $h$ de una densidad uniforme (rectángulo) desde la condición de área total = 1 | Área de rectángulo, normalización aplicada geométricamente |
| Leer una probabilidad como área bajo la curva (rectángulo o triángulo simple) | 6 | `lectura-area-probabilidad` | Leer una probabilidad como área bajo la curva (rectángulo o triángulo simple) | Área geométrica como probabilidad de un intervalo |
| Comparar dos densidades por su forma (cuál está más concentrada/dispersa) | 3 | `comparacion-forma` | Comparar dos densidades por su forma para identificar cuál está más concentrada o dispersa | Forma de la curva vs. dispersión, sin confundir con "más probable en promedio" |
| **Total** | **15** | | | |

---

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Calcular una probabilidad como área de un rectángulo (densidad uniforme) | 6 | `resl-area-rectangulo` | Calcular una probabilidad como área de un rectángulo (densidad uniforme) | Área = base × altura, restringida al tramo $[a,b]$ pedido |
| Calcular la constante $k$ de normalización despejando de $\int f=1$ (densidad lineal $f(x)=kx$) | 5 | `resl-constante-normalizacion` | Calcular la constante $k$ de normalización despejando de $\int f=1$ en una densidad lineal | Despeje de $k$ en $f(x)=kx$, integral de una recta |
| Calcular una probabilidad como área de un triángulo (densidad lineal $f(x)=kx$) | 4 | `resl-area-triangulo` | Calcular una probabilidad como área de un triángulo (densidad lineal $f(x)=kx$) | Área de triángulo, densidad no uniforme sesgada |
| **Total** | **15** | | | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

### Contextos variados

- **Uniforme**: tiempo de espera entre eventos equiprobable en un intervalo, posición de un punto al azar en un segmento, hora de llegada dentro de una franja horaria.
- **Lineal simple**: cualquier magnitud continua acotada donde la densidad crece o decrece linealmente en su intervalo (ej. tiempos donde valores más altos son más probables).
- Ningún experimento debe superar ~30% de los ítems de una misma sub-familia.

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

- **Solo densidades uniformes o lineales simples**, con intervalos de longitud entera chica (2 a 5). Nunca pedir una antiderivada no trivial (ver nota de dependencia arriba). Contextos: ver tabla de "Contextos variados" más arriba.
- **Contextos cotidianos (regla crítica 43)**: `GRAF` y `RESL` usan siempre un contexto concreto de la tabla de arriba (tiempo de espera, posición al azar, hora de llegada), nunca "una variable aleatoria continua $X$" abstracta sin nombrar. `FORM` es la excepción intencional: evalúa reconocer la fórmula/condición en general, no aplicarla a un caso, así que queda abstracto.
- **Cada ejercicio reintroduce** la condición de normalización o la fórmula de probabilidad como área cuando la usa (regla crítica 31).
- **En `explanation`**, cuando se calcule un área, mostrar la fórmula geométrica (base × altura, o base × altura / 2) antes que notación de integral, salvo que el ejercicio pida explícitamente reconocer la notación $\int$ (sub-familia `formula-probabilidad-area`).

## Checklist del topic

- [ ] Toda densidad es uniforme o lineal simple, nunca requiere antiderivada no trivial
- [ ] Los intervalos del dominio son enteros y de longitud ≤5
- [ ] Ningún ejercicio confunde $f(x)$ con $P(X=x)$
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: FORM conceptual → 3 opciones; GRAF/RESL numérico → 4 opciones ≤35 caracteres
