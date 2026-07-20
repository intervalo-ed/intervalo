# Topic: Teorema de Bayes

Belt: `white`, Unit: `probabilidad`, Topic: `bayes`

Skills en este topic: `ESTR`, `FORM`, `RESL`.

Concepto: el **teorema de Bayes** $P(A\mid B) = \dfrac{P(B\mid A)\cdot P(A)}{P(B)}$, donde el denominador $P(B)$ se calcula con probabilidad total. Cierra la unidad `probabilidad`: combina `condicional`, `independencia` (para descartar) y `total` en un solo cálculo.

**Frontera con el resto de la unidad:** el rasgo distintivo frente a `condicional`/`total` es que acá el dato viene en una dirección ($P(B\mid A)$) y se pide la dirección contraria ($P(A\mid B)$). Si el enunciado pide la misma dirección del dato, es un ítem de `condicional`, no de `bayes`.

---

## ESTR, 50 ítems

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer que hace falta Bayes (se pide el condicional invertido respecto del dato) | 22 | `reconocer-bayes` |
| Distractor: alcanza con la fórmula condicional directa, no hace falta invertir | 14 | `distractor-condicional-directa` |
| Reconocer que primero hay que calcular el denominador con probabilidad total | 14 | `reconocer-denominador-total` |
| **Total** | **50** | |

---

## FORM, 50 ítems

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Fórmula de Bayes con 2 escenarios (denominador con 2 términos) | 20 | `formula-dos-escenarios` |
| Fórmula de Bayes con 3 o más escenarios | 15 | `formula-tres-o-mas-escenarios` |
| Identificar la fórmula incorrecta entre variantes (numerador/denominador invertido, factor faltante en el denominador) | 15 | `identificar-formula-correcta` |
| **Total** | **50** | |

---

## RESL, 50 ítems

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Cálculo con 2 escenarios (test diagnóstico, control de calidad) | 20 | `resl-dos-escenarios` |
| Cálculo con urnas/cajas elegidas al azar (2 opciones equiprobables a priori) | 16 | `resl-urnas` |
| Cálculo con 3 o más escenarios | 14 | `resl-tres-o-mas-escenarios` |
| **Total** | **50** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Dirección del condicional | Confundir el dato $P(B\mid A)$ con la incógnita $P(A\mid B)$, respondiendo directamente el dato sin invertir |
| Denominador | Olvidar calcular $P(B)$ por probabilidad total, usando solo $P(B\mid A)\cdot P(A)$ sin normalizar (queda un número que no es una probabilidad válida) |
| Prior vs. posterior | Confundir el prior $P(A)$ con el resultado final $P(A\mid B)$ (creer que la probabilidad de estar enfermo dado un test positivo es la misma que la prevalencia general de la enfermedad) |
| 3+ escenarios | Omitir algún término del denominador al armar la probabilidad total |
| Reconocimiento ESTR | Tratar un problema de Bayes como si bastara con la condicional directa, sin notar que el dato y la incógnita están en direcciones opuestas |
| Urnas/cajas | Olvidar ponderar por la probabilidad de elegir cada urna cuando no son equiprobables |

---

## Reglas específicas del topic

- **Reintroducir la fórmula completa** (regla crítica 31) en cada ítem, con el denominador desarrollado explícitamente cuando el escenario lo amerita.
- **Contextos válidos**: tests diagnósticos (enfermedad/sano, positivo/negativo), control de calidad (línea de producción/defecto), urnas o cajas elegidas al azar antes de extraer, filtros de spam.
- **El resultado suele ser contraintuitivo** (ej. un test con alta sensibilidad puede tener baja probabilidad posterior si la enfermedad es rara): esto es contenido, no un error a evitar; la `explanation` puede señalarlo como advertencia del cierre (regla crítica 7), nunca como sorpresa retórica vacía.

## Checklist del topic

- [ ] Cada ítem reintroduce la fórmula de Bayes con su denominador desarrollado
- [ ] La dirección del condicional pedido es siempre la opuesta a la del dato principal
- [ ] Los ítems de urnas/cajas no equiprobables ponderan correctamente por la probabilidad de elegir cada una
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: ESTR/FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
