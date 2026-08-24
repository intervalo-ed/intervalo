# Topic: Regla de Laplace

Belt: `blue`, Unit: `probabilidad`, Topic: `laplace`

Skills en este topic: `FORM`, `RESL`.

Este topic tiene 2 ítems (uno por skill): `FORM`, `RESL`.

Concepto: la **regla de Laplace** asigna $P(A) = \dfrac{\#\text{favorables}}{\#\text{posibles}}$ en espacios muestrales finitos y **equiprobables**. Reutiliza directamente las técnicas de conteo de la unidad `conteo` (regla del producto/suma, permutaciones, variaciones, combinaciones) para contar favorables y posibles.

**Frontera con el resto de la unidad:** ningún ejercicio usa condicional, independencia, total ni Bayes; el foco es exclusivamente contar y dividir. La validez de Laplace (equiprobabilidad) es parte del contenido: reconocer cuándo NO aplica es tan importante como aplicarla bien.

---

## FORM, 15 ejercicios

Armar la **expresión** (fracción de conteo), sin resolver el número final.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Expresión directa por conteo simple (dados, monedas, cartas) | 5 | `formula-conteo-simple` |
| Expresión usando combinaciones para contar favorables y/o posibles (extracción sin reposición) | 4 | `formula-con-combinaciones` |
| Expresión con evento compuesto, usando complemento en el conteo ("al menos uno", "ninguno") | 4 | `formula-con-complemento` |
| Reconocer que Laplace **no aplica** (espacio no equiprobable) y por qué la expresión de favorables/posibles sería incorrecta | 2 | `reconocer-no-equiprobable` |
| **Total** | **15** | |

---

## RESL, 15 ejercicios

Calcular el **valor** de la probabilidad.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Conteo simple (dados, monedas, cartas) | 5 | `resl-conteo-simple` |
| Con combinaciones (extracción sin reposición) | 4 | `resl-con-combinaciones` |
| Con complemento en el conteo ("al menos uno", "ninguno") | 4 | `resl-con-complemento` |
| Evento compuesto por suma de valores (ej. suma de dos dados) | 2 | `resl-suma-valores` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2). Preferir fracciones cortas en notación de barra (`7/36`) en vez de `\dfrac{}{}`.

> **Reconstruido en ago-2026.** Era la unidad más dura de toda la plataforma: **20 % de acierto al primer intento** sobre 45 respuestas de 30 usuarios, 24 % de respuestas donde el alumno agotó las cuatro opciones y 48 s de mediana, contra ~20 s del resto. `FORM`, que pregunta exactamente lo mismo pero deja la expresión sin evaluar, estaba sano. La diferencia entre las dos skills era todo lo que `RESL` agregaba: la aritmética. Ver las dos reglas de abajo, que salieron de ahí.

### Techo aritmético (ago-2026)

**Los casos posibles se leen del enunciado o salen de una cuenta de un paso.** Concretamente: con combinaciones, $n \leq 10$ y $k = 2$, de modo que $\binom{n}{2} = \frac{n(n-1)}{2}$ se hace de cabeza; con dados, $6 \times 6 = 36$; con monedas, hasta $2^{3}$; o el total viene dado ("una rifa de 100 números").

Lo que se sacó y no vuelve: $\binom{40}{2}=780$, $\binom{15}{3}=455$, $\binom{36}{2}=630$, $6^{4}=1296$, $5^{4}=625$, $\binom{11}{3}=165$. Seis de los quince ejercicios los pedían. Un ítem con esos números no mide si el alumno entendió Laplace: mide si tiene paciencia para multiplicar. Un usuario ya lo había reportado con todas las letras en `permutaciones/RESL`: *«es una paja hacer este ejercicio mentalmente, está bueno el punto pero habría que hacerlo…»*.

Es el mismo criterio que `factoriales` ya aplica a la división final, y el que `conteo` aplica al ratio de magnitud entre opciones.

### Forma de la respuesta: sin simplificar (ago-2026)

**La correcta va siempre como favorables/posibles, tal como sale de contar**: $4/40$, $6/36$, $5/15$, $9/15$. Nunca $1/10$, $1/6$, $1/3$, $3/5$.

Antes el corpus mezclaba las dos convenciones dentro del mismo topic: la correcta de `_04` era $4/40$ sin simplificar, pero la de `_05` era $1/6$ **y $6/36$ no estaba entre las opciones**. Ídem `_07` ($1/3$, sin $5/15$) y `_08` ($1/25$, sin $4/100$). Un alumno que aprende una convención falla la otra: llega al número correcto, no lo encuentra en la lista y termina probando. Eso explica el 24 % de opciones agotadas mejor que la dificultad conceptual.

Se elige la forma cruda y no la simplificada por dos razones: es la que produce la regla —el numerador y el denominador son los dos conteos que el ejercicio evalúa, y simplificar los borra—, y es la que ya usaba `FORM` en el mismo topic ($2/6$, $10/40$, $3/12$).

**Corolario obligatorio:** ninguna opción puede ser numéricamente igual a otra. Si la correcta es $6/36$, $1/6$ no puede ser distractor: serían dos respuestas correctas. Lo chequea el validador.

### `RESL` devuelve un valor, no una expresión

El ítem `_02` tenía como correcta $1-36/66$, sin evaluar. Eso es lo que evalúa `FORM`. En `RESL` la respuesta es siempre una fracción cerrada; el $1-\ldots$ del complemento se muestra en la `explanation`, no en las opciones.

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
- **Combinatoria en ambos lados de una fracción, notación horizontal (regla 42):** en `formula-con-combinaciones`, una opción como $\dfrac{\dbinom{5}{3}}{\dbinom{8}{3}}$ apila dos fracciones binomiales y arma una caja muy alta que domina la grilla 2×2. Escribirla horizontal: $\binom{5}{3}/\binom{8}{3}$.
- **Corolario de consistencia dentro del mismo array de opciones:** si alguna opción usa notación horizontal por combinatoria, las demás opciones que sean fracciones simples (sin `\binom`) van horizontales también, nunca `\dfrac` apilada — mezclar los dos estilos rompe el patrón visual de la grilla (caso real: `formula-con-combinaciones` tenía $\binom{5}{3}/\binom{8}{3}$ junto a $\dfrac{5}{8}$ apilada).
- **Distractores con peso real (criterio editorial, no automatizable):** los distractores de `reconocer-no-equiprobable` (y por extensión, cualquier sub-familia de este topic) tienen que representar un error de razonamiento plausible, no una opción tan literalmente absurda que se descarta sin pensar el concepto (ej. "la regla de Laplace solo aplica a dados o monedas" es débil; un distractor que aplique mal el criterio de equiprobabilidad es más fuerte).

## Checklist del topic

- [ ] Ningún ejercicio usa condicional, independencia, total o Bayes
- [ ] Los ejercicios de "no equiprobable" dan una pista explícita de por qué no lo es
- [ ] Favorables y posibles se cuentan con la misma convención de orden/reposición
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: numérica → 4 opciones, fracciones en notación de barra
- [ ] Ninguna opción apila dos fracciones binomiales (`\dbinom` en numerador y denominador); notación horizontal
- [ ] Los distractores representan un error de razonamiento plausible, no una opción trivialmente absurda
- [ ] **`RESL`: los posibles salen de una cuenta de un paso** ($\binom{n}{2}$ con $n \leq 10$, $6\times 6$, $2^{3}$, o dados en el enunciado)
- [ ] **`RESL`: la correcta va sin simplificar**, en la forma favorables/posibles
- [ ] **Ninguna opción es numéricamente igual a otra** dentro del mismo ejercicio
- [ ] **`RESL` no tiene opciones sin evaluar** del tipo $1-36/66$
