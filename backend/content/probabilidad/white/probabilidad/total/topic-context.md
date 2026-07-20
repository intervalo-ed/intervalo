# Topic: Probabilidad total

Belt: `white`, Unit: `probabilidad`, Topic: `total`

Skills en este topic: `ESTR`, `FORM`, `RESL`.

Concepto: el **teorema de la probabilidad total** $P(B) = \sum_i P(B\mid A_i)\cdot P(A_i)$, donde $\{A_i\}$ es una partición de $\Omega$ (mutuamente excluyentes y colectivamente exhaustivos). Combina `condicional` con una suma ponderada por escenario.

**Frontera con el resto de la unidad:** último paso antes de `bayes`, que reutiliza exactamente este cálculo como denominador. Acá nunca se invierte el condicional (no se pregunta "dado que pasó $B$, ¿de qué escenario vino?"), eso es Bayes.

---

## ESTR, 50 ítems

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer que hace falta partición + probabilidad total (el evento final depende de escenarios previos con probabilidades distintas) | 22 | `reconocer-probabilidad-total` |
| Distractor: alcanza con una probabilidad condicional simple, no hace falta descomponer en escenarios | 14 | `distractor-condicional-simple` |
| Reconocer si una partición propuesta realmente cubre $\Omega$ (verificar que las probabilidades de los escenarios sumen $1$) | 14 | `verificar-particion` |
| **Total** | **50** | |

---

## FORM, 50 ítems

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Fórmula general con 2 escenarios | 18 | `formula-dos-escenarios` |
| Fórmula general con 3 o más escenarios | 16 | `formula-tres-o-mas-escenarios` |
| Identificar la fórmula incorrecta entre variantes (términos invertidos, producto mal armado) | 16 | `identificar-formula-correcta` |
| **Total** | **50** | |

---

## RESL, 50 ítems

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Cálculo con 2 escenarios (líneas de producción, canales de envío, dos proveedores) | 20 | `resl-dos-escenarios` |
| Cálculo con 3 o más escenarios | 16 | `resl-tres-o-mas-escenarios` |
| Despejar una probabilidad condicional desconocida a partir de $P(B)$ total ya conocido | 14 | `resl-despejar-condicional` |
| **Total** | **50** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Ponderación por escenario | Promediar las probabilidades condicionales sin ponderar por $P(A_i)$ (ej. promedio simple en vez de ponderado) |
| Partición | Usar pesos $P(A_i)$ que no suman $1$, señal de que la partición no cubre todo $\Omega$ |
| Armado del producto | Confundir $P(B\mid A_i)$ con $P(A_i\mid B)$ al armar cada término de la suma |
| 3+ escenarios | Olvidar sumar algún término de la partición, dejando el cálculo incompleto |
| Reconocimiento ESTR | Tratar un problema de probabilidad total como si alcanzara con una condicional simple, ignorando que hay más de un escenario posible |
| Despeje | Despejar mal la incógnita cuando falta uno de los términos de la suma |

---

## Reglas específicas del topic

- **La partición siempre suma $1$** en los pesos $P(A_i)$ dados en el enunciado (o se deduce de "el resto viene de...").
- **Contextos válidos**: líneas de producción con distinta tasa de defectos, canales de envío con distinta tasa de demora, proveedores con distinta tasa de fallas, urnas/cajas elegidas al azar antes de extraer.
- **Reintroducir la fórmula** (regla crítica 31) en cada ítem, con la partición explícita antes de la pregunta puntual.

## Checklist del topic

- [ ] Los pesos $P(A_i)$ de la partición suman $1$ en todo ítem
- [ ] Cada ítem reintroduce la fórmula de probabilidad total antes de la pregunta
- [ ] Ningún ítem invierte el condicional (eso es `bayes`, no `total`)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: ESTR/FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
