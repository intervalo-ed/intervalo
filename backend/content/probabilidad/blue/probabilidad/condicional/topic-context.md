# Topic: Probabilidad condicional

Belt: `blue`, Unit: `probabilidad`, Topic: `condicional`

Skills en este topic: `ESTR`, `FORM`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `ESTR`, `FORM`, `RESL`.

Concepto: la **probabilidad condicional** $P(A \mid B) = \dfrac{P(A \cap B)}{P(B)}$, $P(B) > 0$, restringe el espacio muestral efectivo al evento $B$ que ya se sabe que ocurrió.

**Frontera con el resto de la unidad:** todavía no se nombra "independencia" (eso viene después, aunque conceptualmente esté a un paso: $P(A|B)=P(A)$ es el caso particular). No se usa total ni Bayes (que reutilizan esta fórmula pero con la incógnita despejada al revés).

**Contextos variados.** Alternar dados, monedas, cartas de un mazo reducido, encuestas y tablas de contingencia 2x2. Ningún experimento debe superar ~30% de los ítems de una misma sub-familia.

---

## ESTR, 15 ejercicios

Elegir el **planteo**, sin calcular.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer que hace falta la fórmula condicional (se pide un evento dado que otro ya ocurrió) | 6 | `reconocer-condicional` |
| Distractor: en realidad es probabilidad simple, no hay condición real en la pregunta | 4 | `distractor-probabilidad-simple` |
| Reconocer si corresponde $P(A|B)$ o $P(B|A)$ según cuál evento aparece como condición en el enunciado | 5 | `reconocer-direccion-condicional` |
| **Total** | **15** | |

**Cardinalidad**: conceptual → 3 opciones.

---

## FORM, 15 ejercicios

Trabajar la **fórmula** en sí (no el planteo textual, eso es `ESTR`).

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| $P(A\mid B) = \dfrac{P(A\cap B)}{P(B)}$ directa | 6 | `formula-directa` |
| Despejar $P(A \cap B)$ desde $P(A\mid B)$ y $P(B)$ conocidos | 5 | `despejar-interseccion` |
| Identificar la fórmula incorrecta entre variantes (cociente invertido, con $P(A)$ en vez de $P(A\cap B)$) | 4 | `identificar-formula-correcta` |
| **Total** | **15** | |

**Cardinalidad**: conceptual → 3 opciones.

---

## RESL, 15 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Calcular $P(A\mid B)$ desde probabilidades ya dadas | 6 | `resl-desde-datos` |
| Calcular $P(A\mid B)$ contando directamente en un espacio muestral chico enumerado (dados, cartas, tabla de contingencia 2x2) | 5 | `resl-conteo-directo` |
| Despejar $P(A\cap B)$ desde $P(A\mid B)$ conocido (regla de la multiplicación) | 4 | `resl-despejar-interseccion` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2).

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Fórmula condicional | Invertir el cociente, calculando $P(B)/P(A\cap B)$ |
| Dirección del condicional | Calcular $P(B\mid A)$ cuando se pidió $P(A\mid B)$ (confundir cuál es el evento condición) |
| Condicional vs. conjunta | Calcular $P(A\cap B)$ en vez de $P(A\mid B)$, olvidando restringir al espacio de $B$ |
| Conteo directo | Contar los casos favorables sobre el espacio muestral completo en vez de sobre los casos donde ya ocurrió $B$ |
| Reconocimiento ESTR | Tratar como condicional una pregunta que en realidad no impone ninguna condición (probabilidad simple disfrazada con una oración larga) |
| Despeje | Dividir $P(A\mid B)$ por $P(B)$ en vez de multiplicarlos al despejar la intersección |

---

## Reglas específicas del topic

- **Reintroducir la fórmula** (regla crítica 31) en cada ejercicio que la usa, sea o no la pregunta directa.
- **Despeje: fórmula base antes del resultado (regla 43):** en `despejar-interseccion` (FORM) y `resl-despejar-interseccion` (RESL), la `explanation` muestra primero $P(A\mid B) = P(A\cap B)/P(B)$ y recién después el despeje a $P(A\cap B) = P(A\mid B)\cdot P(B)$; nunca arranca directo en el resultado despejado.
- **Decimales simples en RESL (nota de diseño):** en `resl-desde-datos`, evitar cocientes de dos decimales que no sean intuitivos a simple vista (ej. preferir valores donde el cociente dé un decimal de una cifra); el objetivo es que el alumno calcule la respuesta, no que la adivine por descarte entre las 4 opciones.
- **Sin independencia implícita:** en ningún ejercicio se debe asumir ni usar $P(A \cap B) = P(A)P(B)$, ni la igualdad $P(A|B)=P(A)$. Todas las intersecciones deben darse explícitamente o calcularse por conteo/tabla; ese caso particular se reserva para el topic `independencia`.
- **Conteo directo con espacio muestral chico**: dados (1-6), monedas, cartas de un mazo reducido, o una tabla de contingencia 2x2 simple donde el alumno deba enfocar su conteo en una sola fila o columna; el evento $B$ siempre se puede enumerar explícitamente para que se vea la restricción del espacio ("de los resultados donde salió par, ¿cuáles además son ≥4?").
- **Fracciones sin simplificar en `resl-conteo-directo`**: cuando la fracción salga de un conteo (ej. $\dfrac{15}{40}$), priorizar dejarla sin simplificar para que el alumno relacione numerador/denominador con el enunciado, cuidando que las 4 opciones mantengan longitud y formato parejos entre sí.
- **Notación consistente:** usar la barra vertical $\mid$ para condicional (en LaTeX: `\mid`, nunca barra `/` común ni `\setminus`).
- **Sin aclaraciones entre paréntesis en ningún campo del ejercicio** (regla crítica del `authoring-context.md`): toda aclaración va como oración propia en la prosa.

## Checklist del topic

- [ ] Cada ejercicio reintroduce la fórmula $P(A\mid B) = P(A\cap B)/P(B)$
- [ ] Ningún ejercicio usa la palabra "independiente" ni el caso $P(A|B)=P(A)$
- [ ] Los ejercicios de conteo directo restringen explícitamente el espacio a los casos donde ocurrió la condición
- [ ] La barra vertical de probabilidad condicional usa siempre `\mid` en LaTeX
- [ ] Ningún campo usa paréntesis para aclaraciones (`question`, `options`, `feedback_correct`, `feedback_incorrect`, `explanation`)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: ESTR/FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
- [ ] `despejar-interseccion`/`resl-despejar-interseccion` muestran la fórmula condicional base antes del despeje
- [ ] Los cocientes de `resl-desde-datos` dan decimales de una cifra, verificables mentalmente
