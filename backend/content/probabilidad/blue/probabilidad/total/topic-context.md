# Topic: Probabilidad total

Belt: `blue`, Unit: `probabilidad`, Topic: `total`

Skills en este topic: `ESTR`, `FORM`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `ESTR`, `FORM`, `RESL`.

Concepto: el **teorema de la probabilidad total** $P(B) = \sum_i P(B\mid A_i)\cdot P(A_i)$, donde $\{A_i\}$ es una partición de $\Omega$ (mutuamente excluyentes y colectivamente exhaustivos). Combina `condicional` con una suma ponderada por escenario.

**Frontera con el resto de la unidad:** último paso antes de `bayes`, que reutiliza exactamente este cálculo como denominador. Acá nunca se invierte el condicional (no se pregunta "dado que pasó $B$, ¿de qué escenario vino?"), eso es Bayes.

**Contextos variados.** Líneas de producción con distinta tasa de defectos, canales de envío con distinta tasa de demora, proveedores con distinta tasa de fallas, urnas/cajas elegidas al azar antes de extraer. Ningún experimento debe superar ~30% de los ítems de una misma sub-familia.

---

## ESTR, 15 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer que hace falta partición + probabilidad total (el evento final depende de escenarios previos con probabilidades distintas) | 7 | `reconocer-probabilidad-total` |
| Distractor: alcanza con una probabilidad condicional simple, no hace falta descomponer en escenarios | 4 | `distractor-condicional-simple` |
| Reconocer si una partición propuesta realmente cubre $\Omega$ (verificar que las probabilidades de los escenarios sumen $1$) | 4 | `verificar-particion` |
| **Total** | **15** | |

**Cardinalidad**: conceptual/textual → 3 opciones.

---

## FORM, 15 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Fórmula general con 2 escenarios | 5 | `formula-dos-escenarios` |
| Fórmula general con 3 o más escenarios | 5 | `formula-tres-o-mas-escenarios` |
| Identificar la fórmula incorrecta entre variantes (términos invertidos, producto mal armado) | 5 | `identificar-formula-correcta` |
| **Total** | **15** | |

**Cardinalidad**: conceptual → 3 opciones.

---

## RESL, 15 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Cálculo con 2 escenarios (líneas de producción, canales de envío, dos proveedores) | 6 | `resl-dos-escenarios` |
| Cálculo con 3 o más escenarios | 5 | `resl-tres-o-mas-escenarios` |
| Despejar una probabilidad condicional desconocida a partir de $P(B)$ total ya conocido | 4 | `resl-despejar-condicional` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Ponderación por escenario | Promediar las probabilidades condicionales sin ponderar por $P(A_i)$ (ej. promedio simple en vez de ponderado) |
| Partición | Usar pesos $P(A_i)$ que no suman $1$, señal de que la partición no cubre todo $\Omega$ |
| Armado del producto | Confundir $P(B\mid A_i)$ con $P(A_i\mid B)$ al armar cada término de la suma |
| 3+ escenarios | Olvidar sumar algún término de la partición, dejando el cálculo incompleto (o parar en una sola rama y tomar ese producto parcial como resultado final) |
| Reconocimiento ESTR | Tratar un problema de probabilidad total como si alcanzara con una condicional simple, ignorando que hay más de un escenario posible |
| Despeje | Despejar mal la incógnita cuando falta uno de los términos de la suma |

---

## Reglas específicas del topic

- **La partición siempre suma $1$** en los pesos $P(A_i)$ dados en el enunciado (o se deduce de "el resto viene de...").
- **Contextos válidos**: líneas de producción con distinta tasa de defectos, canales de envío con distinta tasa de demora, proveedores con distinta tasa de fallas, urnas/cajas elegidas al azar antes de extraer.
- **Reintroducir la fórmula** (regla crítica 31) en cada ejercicio, con la partición explícita antes de la pregunta puntual.
- **Cálculo accesible en 3+ escenarios**: usar números amigables (múltiplos de 10, decimales redondos) en `resl-tres-o-mas-escenarios` para evitar tedio aritmético que no aporta a la confusión que se evalúa.
- **Fórmula abstracta siempre en sumatoria (regla 40):** en `explanation`, incluso para `formula-dos-escenarios`, la fórmula general va como $P(B) = \sum_i P(B\mid A_i)\cdot P(A_i)$, nunca nombrando $A_1$ y $A_2$ sumados explícitamente — acompañar con una oración que explique qué representa cada término. Distinto de `identificar-formula-correcta`, donde las `options` sí nombran las ramas a propósito (ahí es el punto del ejercicio).
- **Despeje: fórmula base antes del resultado (regla 43):** en `resl-despejar-condicional`, la `explanation` reintroduce la fórmula general de probabilidad total antes de mostrar el despeje paso a paso, nunca solo el despeje. Esa fórmula base, al nombrar $A_1$ y $A_2$ explícitamente (no puede ir en sumatoria porque el despeje necesita referenciar cada rama por separado), es angosta por término pero se acerca al límite de ancho con `\mid` de por medio: verticalizarla en 2 líneas (`$$P(B)=P(B\mid A_1)P(A_1)$$\n$$+\, P(B\mid A_2)P(A_2)$$`) en vez de dejarla en una sola línea, incluso si el conteo de caracteres da por debajo del umbral.
- **Decimales simples en RESL (nota de diseño):** en `resl-despejar-condicional` en particular, evitar que el despeje algebraico de 2+ pasos combinado con decimales de dos cifras sea la única vía a la respuesta; preferir valores que permitan verificar el resultado mentalmente.
- **Sin aclaraciones entre paréntesis en ningún campo del ejercicio** (regla crítica del `authoring-context.md`): toda aclaración va como oración propia en la prosa.

## Checklist del topic

- [ ] Los pesos $P(A_i)$ de la partición suman $1$ en todo ejercicio
- [ ] Cada ejercicio reintroduce la fórmula de probabilidad total antes de la pregunta
- [ ] Ningún ejercicio invierte el condicional (eso es `bayes`, no `total`)
- [ ] Los ejercicios de 3+ escenarios usan números amigables, sin aritmética tediosa innecesaria
- [ ] Ningún campo usa paréntesis para aclaraciones (`question`, `options`, `feedback_correct`, `feedback_incorrect`, `explanation`)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: ESTR/FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
- [ ] La fórmula abstracta de probabilidad total en `explanation` usa `\sum_i`, no ramas nombradas sumadas
- [ ] `resl-despejar-condicional` reintroduce la fórmula general antes del despeje, con decimales que permitan verificar mentalmente
