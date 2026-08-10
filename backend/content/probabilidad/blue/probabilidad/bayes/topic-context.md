# Topic: Teorema de Bayes

Belt: `blue`, Unit: `probabilidad`, Topic: `bayes`

Skills en este topic: `ESTR`, `FORM`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `ESTR`, `FORM`, `RESL`.

Concepto: el **teorema de Bayes** invierte una probabilidad condicional, permitiendo actualizar la probabilidad de un evento a la luz de una nueva observación. Su formulación es $P(A \mid B) = \dfrac{P(B \mid A) \cdot P(A)}{P(B)}$. Combina una probabilidad a priori $P(A)$ con la verosimilitud $P(B \mid A)$ para obtener la probabilidad a posteriori de la hipótesis $A$.

**Frontera con el resto de la unidad:** este es el clímax del cinturón azul. Combina todo lo visto: condicional (es el objetivo final), regla del producto (numerador) y probabilidad total (denominador).

**Contextos variados.** Tests diagnósticos, control de calidad, urnas/cajas, filtros de spam. Ningún experimento debe superar ~30% de los ítems de una misma sub-familia.

---

## ESTR, 15 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Identificar el rol lógico (priori, verosimilitud, posteriori) del dato en texto, sin glosas explicativas en las opciones | 8 | `estr-direccion-condicional-bayes` |
| Identificar qué dato falta en el texto para poder aplicar el teorema (ej. la probabilidad a priori poblacional) | 7 | `estr-identificar-dato-faltante` |
| **Total** | **15** | |

**Cardinalidad**: conceptual/textual → 3 opciones. Para `estr-direccion-condicional-bayes`, las opciones deben ser solo los nombres teóricos, obligando al alumno a deducir el rol.

---

## FORM, 15 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Identificar el numerador (la rama favorable) para invertir la probabilidad pedida | 8 | `form-identificar-numerador` |
| Armar el teorema reconociendo la fracción completa (rama específica sobre probabilidad total) | 7 | `form-armar-teorema` |
| **Total** | **15** | |

**Cardinalidad**: expresiones formales/simbólicas → 3 opciones.

---

## RESL, 15 ejercicios

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer el cálculo dejando la fracción indicada (con los productos y sumas explícitos, sin simplificar) | 8 | `resl-fraccion-indicada` |
| Resolver numéricamente el problema usando frecuencias naturales (cantidades enteras) en vez de decimales | 7 | `resl-frecuencias-naturales` |
| **Total** | **15** | |

**Cardinalidad**: expresiones numéricas y fracciones → 4 opciones (grilla 2×2).

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Priori vs. verosimilitud | Confundir la probabilidad a priori de un evento con su tasa de acierto/falla (verosimilitud) |
| Fracción armada | Dividir solo por la probabilidad de la otra rama o por la verosimilitud, olvidando que el denominador de Bayes es siempre la probabilidad total |
| Inversión pura | Asumir que $P(A \mid B) = P(B \mid A)$, respondiendo con el valor de la verosimilitud directo |
| Frecuencias naturales | Usar el total absoluto del grupo (espacio muestral original) en vez del total del subgrupo que cumple la condición para formar el denominador |
| Dato faltante | No notar que falta la probabilidad a priori poblacional y asumir un valor arbitrario o equiprobable sin que el enunciado lo respalde |

---

## Reglas específicas del topic

- **Carga aritmética:** para evitar operaciones mentales pesadas, los cálculos directos se resuelven exclusivamente mediante contextos de **frecuencias naturales** (cantidades enteras) donde la fracción se arma rápidamente, por ejemplo diez camionetas sobre quince vehículos totales.
- **Fracciones indicadas:** cuando el enunciado plantee porcentajes decimales o no redondos, la respuesta en RESL debe ser la expresión de la fracción sin resolver. Si la fracción completa (numerador + denominador con 2+ términos cada uno) supera el ancho de un bloque display, partirla en un paso de armado y otro de fracción, o usar `\begin{aligned}`, en vez de dejarla en una sola línea que puede cortarse contra el borde de pantalla (regla 38).
- **Fórmula abstracta siempre en sumatoria (regla 40):** en `explanation`, la fórmula general de Bayes va con `\sum_i P(D\mid A_i)\cdot P(A_i)` en el denominador, nunca nombrando las ramas sumadas una por una, sin importar cuántos escenarios tenga el problema concreto. No aplica a `options` en `form-armar-teorema`, donde comparar variantes con nombres es el punto del ejercicio.
- **Párrafo de intuición (regla 44):** en `form-identificar-numerador` y `form-armar-teorema`, la `explanation` no se queda solo en el mecanismo ("el numerador es la rama X"); agrega una oración de por qué esa rama es la favorable y por qué el denominador suma todas las de la partición.
- **Contexto breve antes de la notación (nota de redacción):** si el enunciado arranca directo con "Se quiere calcular $P(\dots\mid\dots)$...", agregar una oración previa de contexto (qué representa el test/escenario), sin sacar información ni superar la regla 36.
- **Opciones ESTR exigentes:** en `estr-direccion-condicional-bayes`, las opciones deben nombrar el concepto crudo (por ejemplo "la verosimilitud") o a lo sumo la notación simbólica (por ejemplo "la verosimilitud $P(M \mid S)$"). Nunca dar la definición masticada.
- **Reintroducir la fórmula completa** (regla crítica 31) en cada ejercicio, con el denominador desarrollado explícitamente cuando el escenario lo amerita.
- **El resultado suele ser contraintuitivo** (un test con alta sensibilidad puede tener baja probabilidad posterior si la enfermedad es rara): esto es contenido, no un error a evitar; la `explanation` puede señalarlo como parte del cierre (regla crítica 7), nunca como sorpresa retórica vacía.
- **Sin aclaraciones entre paréntesis en ningún campo del ejercicio** (regla crítica del `authoring-context.md`): toda aclaración va como oración propia en la prosa.

## Checklist del topic

- [ ] Los problemas de `resl-frecuencias-naturales` usan enteros que conducen a sumas mentales sencillas
- [ ] En ESTR, las opciones de roles lógicos no están justificadas ni masticadas
- [ ] El denominador en los problemas correctos de `resl-fraccion-indicada` representa siempre la suma de todas las ramas
- [ ] Cada ejercicio reintroduce la fórmula de Bayes antes de la pregunta
- [ ] Ningún campo usa paréntesis para aclaraciones (`question`, `options`, `feedback_correct`, `feedback_incorrect`, `explanation`)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: ESTR/FORM conceptual → 3 opciones; RESL expresiones numéricas → 4 opciones
- [ ] La fórmula abstracta de Bayes en `explanation` usa `\sum_i` en el denominador, no ramas nombradas sumadas
- [ ] Cada `explanation` de FORM suma una oración de intuición, no solo el mecanismo
