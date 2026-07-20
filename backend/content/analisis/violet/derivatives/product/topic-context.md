# Topic: product (Regla del Producto)

Belt: `violet`, Unit: `derivatives`, Topic: `product`

Skills en este topic: `ESTR`, `RESL`. **50 ejercicios cada uno (100 en total)** al cerrar el refactor.

Este topic tiene 2 ítems (uno por skill): `ESTR`, `RESL`. **50 ejercicios cada uno (100 en total)** al cerrar el refactor.

**Estado.** Este tópico surgió del split de `product_quotient` en `product/` + `quotient/`. Los `external_id` se regeneran al reseedear (`violet_product_estr_01…`, `violet_product_resl_01…`), lo que rompe el progreso guardado en DB — asumido y aceptado. Los ejercicios del split viejo (`ESTR` = 6, `RESL` heredado del merge DERI/APLI) se **trasladaron** a las skills nuevas de este tópico como material de referencia; la distribución completa (50 por skill) se hace en otro turno.

El contenido "APLI" que existía antes del merge DERI/INTG/APLI → RESL queda absorbido en **RESL** — coherente con la fusión de skills a nivel curso.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** definición formal de derivada por límite, interpretación geométrica de $f'(a)$, **reglas de derivación** para funciones elementales (potencia, constante, exponencial, logaritmo, trigonométricas), **linealidad** (suma/resta/escalar). Todo lo de los tópicos `limit_definition`, `geometric_interpretation` y `differentiation_rules`.
- **Lo que está aprendiendo acá:** la **regla del producto**, $(u \cdot v)' = u'v + uv'$. Cuándo aplicarla, cómo identificar los factores $u$ y $v$, y cuándo **evitarla** por existir una alternativa algebraica más eficiente.
- **Lo que NO sabe todavía:** regla del **cociente** (tópico siguiente), regla de la **cadena**, derivación implícita, derivadas de compuestas con argumento interno no trivial.

### Regla dura

En este tópico se **aplica la regla del producto** sobre funciones que ya son productos explícitos de factores derivables por reglas elementales. Nada de compuestas.

**Prohibido**:

- Regla del **cociente**: sin $\left(\tfrac{u}{v}\right)'$. Si aparece un cociente, reescribir como potencia negativa solo si el denominador es un monomio ($\tfrac{1}{x^n} \to x^{-n}$); si no, el ejercicio sale de scope.
- Regla de la **cadena**: los factores $u$ y $v$ tienen argumento interno = $x$ solo. Nada de $u(x) = \sin(2x + 1)$ o $v(x) = e^{-x}$.
- **Justificar por límite** la regla del producto — se toma como fórmula conocida derivada del cociente incremental de la definición.
- **Producto de 3 o más factores** — solo binario $u \cdot v$.
- **Contextos cotidianos en RESL** (ver §RESL).

Los ejercicios que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 2 skills)

Reglas de authoring que se aplican al escribir los 100 ejercicios:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`, con enfoque **algorítmico**: (a) identificamos $u$ y $v$ y calculamos $u'$ y $v'$ usando `\begin{aligned}`, (b) aplicamos la fórmula $u'v + uv'$, (c) simplificamos y cerramos con advertencia técnica. Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (prohibido estricto)**, sin humor.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Contrastar el error común con el procedimiento correcto ("armaste $u'v - uv'$ como si fuera cociente", "derivaste el producto como producto de derivadas: $u'v'$"). Voz descriptiva, segunda persona amable.
4. **Negrita en primera mención** de conceptos clave: **regla del producto**, **factor**, **linealidad**. Nunca negritas dentro de `options`.
5. **Variables inline** ($x$, $u$, $v$, $a$) en la prosa.
6. **Ortotipografía**: decimales con **coma** (`4,3`). Sin nombres propios.
7. **`correct_index` variado**, no concentrado en un solo índice.

---

## ESTR, 50 ejercicios

### Qué evalúa
**Auditoría de la toma de decisiones previa al cálculo**. No se ejecuta la derivación completa: se decide **qué regla aplicar** y **cómo desglosar la expresión** en factores. Sin cálculo numérico final.

### Cardinalidad
**Exactamente 3 opciones** por ejercicio.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Falsos positivos y alternativas algebraicas | Detectar cuándo la regla del producto es válida pero **estratégicamente ineficiente o innecesaria**. Constante multiplicada por función ($f(x) = 4 \sin x$ es linealidad, no producto), polinomios distribuibles antes de derivar ($f(x) = (x+2)(x-2) = x^2 - 4$), potencias reescribibles ($f(x) = x^2 \cdot x^3 = x^5$). | `falsos-positivos-alternativas-algebraicas` | 25 |
| B. Identificación del esqueleto y factores | Desglosar correctamente la función inicial en $u$ y $v$, aislando las partes funcionales antes de empezar a derivar. Funciones mixtas sin signo de multiplicación explícito ($f(x) = x^2 \ln x$, $f(x) = \sqrt{x} \, e^x$, $f(x) = x \sin x$). | `identificacion-esqueleto-y-factores` | 25 |

### `feedback_incorrect`, confusiones fuente

- **Regla del producto como único camino**: proponer $(4 \sin x)' = 0 \cdot \sin x + 4 \cos x$ como si el $4$ requiriera la regla del producto. Es **múltiplo escalar** (linealidad): $4 \cdot (\sin x)' = 4 \cos x$.
- **Distribución omitida**: derivar $(x+2)(x-2)$ con la regla del producto sin notar que $= x^2 - 4$, cuya derivada es $2x$ directamente por potencia.
- **Producto de potencias no fusionado**: aplicar la regla a $x^2 \cdot x^3$ en lugar de reescribir como $x^5$ y usar la regla de la potencia.
- **Regla alternativa mal armada**: reescribir bien la expresión pero derivar con signo o coeficiente equivocado ($(x+2)(x-2) = x^2 - 4$, derivada = $2x$; error: dar $2x - 4$ o $x$).
- **Agrupar mal las bases**: en $f(x) = x^2 \ln x$, tomar $u = x$ y $v = x \ln x$ en vez de $u = x^2$, $v = \ln x$. El corte natural es entre familias distintas de funciones elementales.
- **Aislar el exponente en el factor equivocado**: en $f(x) = \sqrt{x} \, e^x$, tomar $u = x$ y $v = \tfrac{1}{2} e^x$ en vez de $u = x^{1/2}$, $v = e^x$.
- **No reconocer separación de familias**: elegir un único factor $u$ que ya combina dos familias (polinómica y trigonométrica), dejando $v = 1$.

### Reglas específicas
- **Ningún cálculo numérico final** en ESTR — solo elección de método/descomposición.
- **Opciones con textos exactos** para elección de planteo: `"Regla del producto"`, `"Múltiplo escalar"`, `"Distribuir y derivar por potencia"`, `"Reescribir como potencia única"`, `"Regla de la potencia"`. **Nunca "linealidad" sola** como texto de opción (ver hallazgos de auditoría más abajo): el alumno no está tan familiarizado con el término, siempre aludir directo a "múltiplo escalar".
- **Sub-A**: la respuesta correcta es siempre la **alternativa algebraica**, no la regla del producto. El distractor mayoritario es "regla del producto".
- **Sub-B**: opciones que muestran distintas particiones $u/v$ como texto exacto (por ejemplo, `"u = x^2, v = \ln x"`), no en prosa descriptiva.
- **Negrita en primera mención** de `regla del producto`, `linealidad`, `múltiplo escalar`.

---

## RESL, 50 ejercicios

### Qué evalúa
**Ejecución técnica** de la regla del producto: identificar $u$ y $v$, calcular $u'$ y $v'$, armar $u'v + uv'$ y **evaluar en un punto** $x = a$ donde al menos un término de la suma se anula.

### Cardinalidad
**Exactamente 4 opciones** por ejercicio (grilla 2×2). Expresiones cortas (**$\leq 35$ caracteres**).

### Restricciones estrictas
- **Sin contextos cotidianos**. La habilidad evalúa mecánica pura de la fórmula, no modelado.
- **Anulación forzada**: en toda evaluación puntual en $x = a$, **al menos uno de los términos de la suma** ($u'(a) v(a)$ o $u(a) v'(a)$) debe anularse resultando en $0$. Esto simplifica el cálculo final y desplaza el foco a la elección correcta de qué término se anula y por qué, en vez de a la aritmética.

`tags` (ver `authoring-context.md` §Etiquetas): cada ejercicio lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Anulación por raíz de la función | El punto de evaluación $x = a$ es una **raíz de uno de los factores iniciales** ($u(a) = 0$ o $v(a) = 0$). Ejemplo: $f(x) = (x^2 - 4) e^x$ evaluada en $x = 2$. Se anula el término $u(a) v'(a) = 0 \cdot e^2 = 0$, queda $u'(2) v(2) = 4 e^2$. | `anulacion-por-raiz-producto` | 15 |
| B. Anulación por extremo local (derivada nula) | El punto de evaluación $x = a$ **anula la derivada de uno de los factores** ($u'(a) = 0$ o $v'(a) = 0$). Ejemplo: $f(x) = \cos(x) \cdot e^x$ evaluada en $x = 0$. Como $(\cos x)'\|_{x=0} = -\sin 0 = 0$, se anula $u'(0) v(0) = 0$, queda $u(0) v'(0) = 1 \cdot 1 = 1$. | `anulacion-por-derivada-nula-producto` | 15 |
| C. Anulación cruzada completa | El punto de evaluación colapsa **ambos términos simultáneamente** ($u(a) = 0$ y $v'(a) = 0$, o $u'(a) = 0$ y $v(a) = 0$). El resultado final de la pendiente es $0$. | `anulacion-cruzada-completa` | 10 |
| D. Evaluación con datos abstractos | Se brindan los **valores puntuales** de $f(a), f'(a), g(a), g'(a)$, forzando a que uno o más sean $0$ explícitamente. Ejemplo: "Si $f(2) = 0$, $f'(2) = 5$, $g(2) = 4$, $g'(2) = -1$, calculá $(f \cdot g)'(2)$". Obliga al uso de la **estructura abstracta pura** de la fórmula, sin cálculo de derivadas. Respuesta: $5 \cdot 4 + 0 \cdot (-1) = 20$. | `evaluacion-datos-abstractos-producto` | 10 |

### `feedback_incorrect`, confusiones fuente

- **Fórmula del cociente en vez del producto**: dar $u'v - uv'$ (signo menos) confundiendo con la regla del cociente. La regla del producto **suma** los dos términos.
- **Producto de derivadas**: dar $u' \cdot v'$ como derivada del producto. La regla es $u'v + uv'$, no la derivada del producto es el producto de las derivadas.
- **Un solo término**: dar solo $u'v$ o solo $uv'$ olvidando el otro sumando.
- **Cambio de posición $u/v$**: dar $uv' + u'v$ en orden distinto (matemáticamente igual, no es error) — no marcar como incorrecto salvo que combine con otro error.
- **Anulación mal identificada (sub-C)**: creer que solo un término se anula cuando en realidad se anulan los dos, dando un valor no nulo cuando el correcto es $0$.
- **Evaluación con datos abstractos rota (sub-D)**: usar $f(a) g(a)$ (valor de la función producto) en vez de $f'(a) g(a) + f(a) g'(a)$ (valor de la derivada del producto).
- **Signo perdido en $(\cos x)'$**: en sub-B con $u(x) = \cos x$, dar $u'(0) = 1$ en vez de $u'(0) = -\sin 0 = 0$. Ojo con el signo negativo del coseno.
- **Anulación por raíz confundida con derivada nula**: en sub-A ($f(x) = (x^2 - 4)e^x$ en $x = 2$), anular $u'(2)$ en vez de $u(2)$. La raíz vive en la función original, no en su derivada.

### Reglas específicas
- **Explicaciones con estructura algorítmica**: (1) identificar $u$, $v$, $u'$, $v'$ en un `\begin{aligned}`, (2) aplicar $u'(a) v(a) + u(a) v'(a)$ señalando cuál término se anula y por qué, (3) simplificar al valor final y cerrar con advertencia sobre la confusión típica (signo, término olvidado, cambio con cociente).
- **Ninguna función compuesta** en $u$ o $v$: argumentos internos = $x$ solo. Nada de $u(x) = \sin(2x)$.
- **Producto binario únicamente**: sin $u \cdot v \cdot w$.
- **Puntos de evaluación simples**: enteros pequeños ($0, 1, 2, 3, -1$) o múltiplos simples de $\pi$ ($0, \pi/2, \pi$). Nada de fracciones complejas.
- **Resultado como expresión simplificada final**: no dejar $4 \cdot e^2 + 0$; escribir $4 e^2$. Si el resultado es $0$, decir $0$.
- **Sub-D con datos abstractos** presentados en el enunciado como igualdades numéricas: `"Si $f(a) = \ldots$, $f'(a) = \ldots$, $g(a) = \ldots$, $g'(a) = \ldots$"`. No pedir calcular derivadas dentro de sub-D.
- **Decimales con coma** (`4,3`).

---

## Hallazgos de auditoría (ronda 2, jul-2026)

Auditoría en vivo (`/test`) sobre ejercicios ya existentes:

- **`ESTR_01`** (`ex_165`): la opción usaba `"Linealidad (múltiplo escalar)"`, con "linealidad" como término poco familiar para el alumno. Corregido en el texto exacto prescripto arriba (§ESTR → Reglas específicas): ahora es `"Múltiplo escalar"` a secas, y se agregó a la tabla de vocabulario prohibido de `authoring-context.md`.
- **`RESL_07`** (`ex_186`): la primera oración de la `explanation` amontonaba demasiado LaTeX inline (identificar $u,v,u',v'$ todo tejido en una sola oración). Además, el `\begin{aligned}` alineaba con columna de `=` dos líneas de **datos sueltos evaluados** ($u'(0)=0, v(0)=1$ y $u(0)=3, v'(0)=1$) junto con una tercera línea que sí era el **resultado real** de aplicar la fórmula, mezclando dos cosas distintas en la misma alineación. **Confirma la regla crítica 30**, nueva en `authoring-context.md` esta ronda (el hallazgo que más claramente la motivó fue el mismo patrón en `chain_rule/RESL_12`). Reescribir así: los datos evaluados van en una oración de prosa (o líneas simples sin `&`), y el `aligned` con columna de `=` queda solo para el cálculo real que aplica la fórmula.
  - ❌ (patrón encontrado): `$$\begin{aligned} u'(0) &= 0, \quad v(0) = 1 \\ u(0) &= 3, \quad v'(0) = 1 \\ f'(0) &= u'(0)v(0) + u(0)v'(0) = 0 + 3 \end{aligned}$$`
  - ✅: `Con $u(0)=3$, $v(0)=1$, $u'(0)=0$ y $v'(0)=1$:\n$$f'(0) = u'(0)v(0) + u(0)v'(0) = 0\cdot 1 + 3\cdot 1 = 3$$`

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 2 skills):**
- [ ] `feedback_incorrect` completo en los 50 ejercicios: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna aplicación de regla del cociente o cadena; ninguna función compuesta en $u$ o $v$
- [ ] Ningún desarrollo por límite; producto binario únicamente
- [ ] Explicaciones en 3 párrafos de prosa; estructura algorítmica; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios; variables inline en la prosa
- [ ] **Ninguna opción dice "linealidad" a secas** (reincidencia confirmada en `ESTR_01`); siempre "múltiplo escalar"
- [ ] **Ningún `\begin{aligned}` alinea con `=` datos evaluados de forma independiente junto con el cálculo real** (reincidencia confirmada en `RESL_07`, regla crítica 30): datos sueltos van en prosa, la alineación queda solo para el cálculo que aplica la fórmula
- [ ] **Ningún párrafo de `explanation` acumula 2+ fragmentos LaTeX inline sueltos** en la oración que identifica $u,v,u',v'$ (regla 21)
- [ ] **"Sabiendo que" y "Para derivar" reescritos como cláusula completa** (fragmentos sin objeto propio, el `:` no los arregla); **"Considerá la función" con el `:` agregado** antes del bloque `$$...$$` (ya es cláusula completa). Redacción variada ejercicio a ejercicio (regla crítica 32)

**ESTR:**
- [ ] 50 ejercicios; **exactamente 3 opciones** por ejercicio
- [ ] Distribución A/B respetada (25/25)
- [ ] Ningún cálculo numérico final; solo elección de método/descomposición
- [ ] Sub-A con distractor mayoritario = "regla del producto"; sub-B con opciones tipo `"u = x^2, v = \ln x"` textuales
- [ ] Textos exactos en opciones de elección de planteo (ver §Reglas específicas)

**RESL:**
- [ ] 50 ejercicios; **exactamente 4 opciones** por ejercicio, cada opción $\leq 35$ caracteres
- [ ] Sin contextos cotidianos
- [ ] Distribución A/B/C/D respetada (15/15/10/10)
- [ ] Todos los ejercicios cumplen la **anulación forzada** ($u'(a) v(a) = 0$ o $u(a) v'(a) = 0$)
- [ ] Explicaciones con estructura algorítmica (identificar $u,v,u',v'$ → aplicar fórmula señalando anulación → simplificar)
- [ ] Ningún argumento interno no trivial; producto binario únicamente
- [ ] Sub-D con datos abstractos presentados como igualdades numéricas en el enunciado
