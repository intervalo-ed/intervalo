# Topic: Probabilidad condicional

Belt: `white`, Unit: `probabilidad`, Topic: `condicional`

Skills en este topic: `ESTR`, `FORM`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `ESTR`, `FORM`, `RESL`.

Concepto: la **probabilidad condicional** $P(A \mid B) = \dfrac{P(A \cap B)}{P(B)}$, $P(B) > 0$, restringe el espacio muestral efectivo al evento $B$ que ya se sabe que ocurrió.

**Frontera con el resto de la unidad:** todavía no se nombra "independencia" (eso viene después, aunque conceptualmente esté a un paso: $P(A|B)=P(A)$ es el caso particular). No se usa total ni Bayes (que reutilizan esta fórmula pero con la incógnita despejada al revés).

---

## ESTR, 50 ejercicios

Elegir la **estrategia**, sin calcular.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer que hace falta la fórmula condicional (se pide un evento dado que otro ya ocurrió) | 20 | `reconocer-condicional` |
| Distractor: en realidad es probabilidad simple, no hay condición real en la pregunta | 12 | `distractor-probabilidad-simple` |
| Reconocer si corresponde $P(A|B)$ o $P(B|A)$ según cuál evento aparece como condición en el enunciado | 18 | `reconocer-direccion-condicional` |
| **Total** | **50** | |

---

## FORM, 50 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| $P(A\mid B) = \dfrac{P(A\cap B)}{P(B)}$ directa | 20 | `formula-directa` |
| Despejar $P(A \cap B)$ desde $P(A\mid B)$ y $P(B)$ conocidos | 15 | `despejar-interseccion` |
| Identificar la fórmula incorrecta entre variantes (cociente invertido, con $P(A)$ en vez de $P(A\cap B)$) | 15 | `identificar-formula-correcta` |
| **Total** | **50** | |

---

## RESL, 50 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Calcular $P(A\mid B)$ desde probabilidades ya dadas | 18 | `resl-desde-datos` |
| Calcular $P(A\mid B)$ contando directamente en un espacio muestral chico enumerado (dados, cartas) | 18 | `resl-conteo-directo` |
| Despejar $P(A\cap B)$ desde $P(A\mid B)$ conocido | 14 | `resl-despejar-interseccion` |
| **Total** | **50** | |

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
| Despeje | Multiplicar en vez de dividir al despejar $P(A\cap B) = P(A\mid B)\cdot P(B)$ |

---

## Reglas específicas del topic

- **Reintroducir la fórmula** (regla crítica 31) en cada ejercicio que la usa, sea o no la pregunta directa.
- **Conteo directo con espacio muestral chico**: dados (1-6), monedas, cartas de un mazo reducido; el evento $B$ siempre se puede enumerar explícitamente para que el alumno vea la restricción del espacio ("de los resultados donde salió par, ¿cuáles además son ≥4?").
- **No nombrar "independencia" ni usar la igualdad $P(A|B)=P(A)$** en este topic; ese caso se reserva para el topic `independencia`.

## Checklist del topic

- [ ] Cada ejercicio reintroduce la fórmula $P(A\mid B) = P(A\cap B)/P(B)$
- [ ] Ningún ejercicio usa la palabra "independiente" ni el caso $P(A|B)=P(A)$
- [ ] Los ejercicios de conteo directo restringen explícitamente el espacio a los casos donde ocurrió la condición
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: ESTR/FORM conceptual → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
