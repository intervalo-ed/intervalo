# Topic: Producto

Belt: `blue`, Unit: `vectors`, Topic: `product`

Skills en este topic: `LEXI`, `CLSF`. **Sin `RESL`** (rediseño de la unidad, ago-2026): la cuenta general del producto cruz es pesada para un ejercicio manual (seis términos), y el dato más distintivo de esta operación no es el cálculo sino la **dirección** del vector resultante — eso es lo que exploran las dos skills que quedan. **Sin `GRAF`**: se pospone para una ronda futura.

Este topic tiene 2 ítems (uno por skill): `LEXI`, `CLSF`.

Concepto: el **producto cruz** (o producto vectorial) de dos vectores de $\mathbb{R}^3$ devuelve un tercer vector, perpendicular a ambos:
$$\vec{w} = \vec{u}\times\vec{v}$$
A diferencia de la suma o el producto escalar, el orden de los factores importa: $\vec{u}\times\vec{v} = -(\vec{v}\times\vec{u})$. Sexto y último topic de la unidad, después de `definition`, `operations`, `norm`, `scalar` y `orthogonality`: el alumno ya conoce el producto escalar y la ortogonalidad, y puede apoyarse en ambos (regla crítica 31, cada ítem igual reintroduce lo que necesita desde cero).

**Nota de referencia editorial**: registro "Paenza", sin nombrar la "regla de la mano derecha" como técnica (evita jerga de física aplicada); en cambio, se trabaja con vectores canónicos simples alineados a puntos cardinales/arriba-abajo, de forma que la aritmética quede trivial y el foco esté 100% en la dirección (regla 43).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Por qué el resultado del producto cruz es un vector, no un número | 5 | `por-que-resultado-es-vector` | Entender que el resultado necesita dirección propia (perpendicular a ambos originales), por eso no alcanza con un escalar | Contraste con el producto escalar, que sí da un número |
| Por qué el producto cruz solo está definido en $\mathbb{R}^3$ | 5 | `por-que-exclusivo-r3` | Entender que se necesita una tercera dirección, fuera del plano de los dos vectores originales, para que exista una perpendicular común | Dimensión mínima necesaria para una perpendicular única a dos vectores |
| Por qué el orden de los factores importa | 5 | `por-que-orden-importa` | Entender que invertir el orden invierte el sentido del resultado, sin cambiar su magnitud | Anticommutatividad, $\vec{u}\times\vec{v} = -(\vec{v}\times\vec{u})$ |
| **Total** | **15** | | | |

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Predecir la dirección del resultado en el caso base, con vectores alineados a direcciones simples | 5 | `predecir-direccion-basica` | Fijar un caso de referencia: dos vectores en un plano, predecir hacia qué lado sale el resultado | Perpendicularidad al plano de los dos vectores originales |
| Predecir la dirección del resultado cuando se invierte el orden de los factores | 5 | `predecir-direccion-orden-invertido` | Aplicar la propiedad de orden sobre un caso ya conocido, sin recalcular desde cero | Anticommutatividad aplicada a la predicción de sentido |
| Predecir la dirección del resultado cuando uno de los vectores se escala por un número positivo o negativo | 5 | `predecir-direccion-vector-escalado` | Reconocer que el signo del escalar decide si el sentido se mantiene o se invierte | Efecto del signo de un escalar sobre la dirección del resultado |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones para `LEXI` y `CLSF` (ambas conceptuales, sin cálculo numérico de componentes).

---

## Contextos variados

**Registro Paenza, sin jerga de nicho** (regla 43, ver nota editorial arriba): todos los ítems de `CLSF` usan la misma pareja de referencia (un vector hacia el este, otro hacia el norte) para que el alumno no tenga que recalcular la orientación de base en cada ítem, solo aplicar la propiedad que corresponda (orden invertido o escalar con signo).

- **`LEXI`**: puede quedar en abstracto, con contraste directo contra el producto escalar y la ortogonalidad (topics anteriores).
- **`CLSF`**: siempre con vectores canónicos simples (alineados a este/norte/arriba/abajo), nunca con componentes numéricas que obliguen a calcular.

Ningún experimento supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 2 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Resultado es un vector | Pensar que el producto cruz da un número, confundiéndolo con el producto escalar |
| Exclusivo de $\mathbb{R}^3$ | Pensar que la restricción tiene que ver con la norma o con la perpendicularidad en sí, no con la falta de una tercera dirección |
| Orden importa | Pensar que invertir el orden cambia la magnitud del resultado, en vez de su sentido |
| Predecir dirección básica | Confundir la dirección del resultado con la de alguno de los vectores originales |
| Predecir con orden invertido | Repetir la misma dirección del caso base, sin aplicar la inversión de sentido |
| Predecir con vector escalado | No distinguir entre escalar por un número positivo (mantiene sentido) y por uno negativo (lo invierte) |

---

## Reglas específicas del topic

- **`CLSF` nunca pide calcular componentes**: todos los vectores son canónicos y alineados a direcciones simples (este, norte, arriba, abajo), la única tarea es razonar sobre el sentido del resultado.
- **No usar la expresión "regla de la mano derecha"** ni ninguna técnica mnemotécnica de física aplicada; describir la orientación en términos llanos ("hacia arriba", "hacia abajo", "saliendo del plano").
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que el orden importe es que $\vec{u}\times\vec{v}=-(\vec{v}\times\vec{u})$; la razón de que sea exclusivo de $\mathbb{R}^3$ es que hace falta una tercera dirección, fuera del plano de los dos vectores, para tener una perpendicular común.
- **Notación de vectores**: siempre con flecha superior (`\vec{v}`), según convención transversal del curso.

## Hallazgos de testing (ronda 1)

- **`LEXI` (`por-que-exclusivo-r3`):** la opción correcta decía "hace falta una tercera dirección para la perpendicular", un fraseo que sonaba raro. Fix: reescrita como "para que exista una perpendicular a los otros dos".
- **Pendiente, sin resolver:** en testing se pidió un ítem que calcule numéricamente un producto vectorial y pida la dirección resultante (tipo `RESL`), algo que esta ronda decidió no incluir por considerarlo difícil de plantear con las skills locked (`LEXI`+`CLSF`, sin `RESL`). Queda como decisión abierta para una ronda futura: si se agrega, requiere sumar `RESL` a `course.json` para este topic.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún contexto exige conocimiento previo de una carrera puntual (registro Paenza, sin "regla de la mano derecha")
- [ ] `CLSF` nunca pide calcular componentes, solo predecir sentido con vectores canónicos
- [ ] Cada ítem de `LEXI` reintroduce la razón detrás de lo que pregunta (regla 44), apoyándose en `scalar`/`orthogonality` cuando corresponde
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `LEXI` y `CLSF`
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
