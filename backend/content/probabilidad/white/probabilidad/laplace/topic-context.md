# Topic: Regla de Laplace

Belt: `white`, Unit: `probabilidad`, Topic: `laplace`

Skills en este topic: `FORM`, `RESL`.

Concepto: la **regla de Laplace** asigna $P(A) = \dfrac{\#\text{favorables}}{\#\text{posibles}}$ en espacios muestrales finitos y **equiprobables**. Reutiliza directamente las técnicas de conteo de la unidad `conteo` (regla del producto/suma, permutaciones, variaciones, combinaciones) para contar favorables y posibles.

**Frontera con el resto de la unidad:** ningún ítem usa condicional, independencia, total ni Bayes; el foco es exclusivamente contar y dividir. La validez de Laplace (equiprobabilidad) es parte del contenido: reconocer cuándo NO aplica es tan importante como aplicarla bien.

---

## FORM, 50 ítems

Armar la **expresión** (fracción de conteo), sin resolver el número final.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Expresión directa por conteo simple (dados, monedas, cartas) | 15 | `formula-conteo-simple` |
| Expresión usando combinaciones para contar favorables y/o posibles (extracción sin reposición) | 15 | `formula-con-combinaciones` |
| Expresión con evento compuesto, usando complemento en el conteo ("al menos uno", "ninguno") | 12 | `formula-con-complemento` |
| Reconocer que Laplace **no aplica** (espacio no equiprobable) y por qué la expresión de favorables/posibles sería incorrecta | 8 | `reconocer-no-equiprobable` |
| **Total** | **50** | |

---

## RESL, 50 ítems

Calcular el **valor** de la probabilidad.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Conteo simple (dados, monedas, cartas) | 15 | `resl-conteo-simple` |
| Con combinaciones (extracción sin reposición) | 15 | `resl-con-combinaciones` |
| Con complemento en el conteo ("al menos uno", "ninguno") | 12 | `resl-con-complemento` |
| Evento compuesto por suma de valores (ej. suma de dos dados) | 8 | `resl-suma-valores` |
| **Total** | **50** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2). Preferir fracciones cortas en notación de barra (`7/36`) en vez de `\dfrac{}{}`.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Suma de dos dados | Contar solo una combinación de valores en vez de todas las parejas equivalentes (ej. suma 7: contar solo $(3,4)$ y no las 6 parejas ordenadas) |
| Aplicabilidad de Laplace | Aplicar la regla en un espacio no equiprobable (ej. suma de dados tratada como 11 resultados igual de probables, del 2 al 12) |
| "Al menos uno" | Sumar las probabilidades individuales de cada elemento en vez de usar el complemento de "ninguno" |
| Favorables vs. posibles | Invertir el cociente (calcular posibles/favorables) |
| Con combinaciones | Olvidar dividir el conteo de favorables por el total de posibles, dejando solo el numerador como respuesta |
| Con combinaciones | Contar los posibles con una técnica y los favorables con otra incompatible (ej. posibles sin orden, favorables con orden) |

---

## Reglas específicas del topic

- **Equiprobabilidad explícita**: cada enunciado deja claro (dado balanceado, moneda balanceada, bolas indistinguibles al tacto, extracción al azar) que el espacio es equiprobable, salvo en la sub-familia `reconocer-no-equiprobable`, donde el enunciado da una pista de que no lo es (ej. "el dado está cargado", "las bolas tienen distinto tamaño y por eso no salen con igual chance").
- **Consistencia favorables/posibles**: si los posibles se cuentan con combinaciones (sin orden), los favorables se cuentan con la misma convención, nunca mezclando una técnica con orden y otra sin orden para el mismo evento.
- **Reutilizar contextos de `conteo`** (cartas, urnas, comités) está permitido y es deseable: refuerza que Laplace es la aplicación práctica de esas técnicas, no un tema nuevo desconectado.

## Checklist del topic

- [ ] Ningún ítem usa condicional, independencia, total o Bayes
- [ ] Los ítems de "no equiprobable" dan una pista explícita de por qué no lo es
- [ ] Favorables y posibles se cuentan con la misma convención de orden/reposición
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: numérica → 4 opciones, fracciones en notación de barra
