# Topic: Reglas de conteo

Belt: `white`, Unit: `conteo`, Topic: `reglas`

Skills en este topic: `FORM`, `ESTR`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `FORM`, `ESTR`, `RESL`.

Concepto: la **regla del producto** (decisiones secuenciales o independientes, se multiplican las opciones de cada paso) y la **regla de la suma** (alternativas mutuamente excluyentes, se suman los casos). Este topic es la base de todo el resto de la unidad: `factoriales`, `permutaciones`, `variaciones` y `combinaciones` son casos particulares donde ya no alcanza con producto/suma directos y hace falta una fórmula específica.

**Frontera con el resto de la unidad:** ningún ejercicio de este topic usa factorial, $P_n$, $V_{n,k}$ ni $\binom{n}{k}$. Si un problema requiere ordenar un conjunto completo o elegir un subconjunto sin reponer elementos, es un ejercicio de `permutaciones`/`variaciones`/`combinaciones`, no de `reglas`. Acá el conteo siempre sale de multiplicar/sumar cantidades de opciones por paso, con o sin repetición permitida entre pasos (pero cada paso se resuelve por conteo directo, no por una fórmula de arreglo).

---

## FORM, 50 ejercicios

Armar la **expresión** que cuenta el total (no calcular el valor numérico, eso es `RESL`).

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Regla del producto pura, 2-3 decisiones secuenciales con repetición permitida entre pasos | 15 | `producto-puro` |
| Regla de la suma pura, alternativas mutuamente excluyentes ("o") | 10 | `suma-pura` |
| Combinación producto + suma (ej. suma de dos productos, o producto con un paso que tiene alternativas) | 12 | `producto-y-suma` |
| Producto con restricción (un paso con menos opciones por una condición, ej. primer dígito no puede ser $0$, o un carácter no se repite) | 8 | `producto-con-restriccion` |
| Armar la expresión desde un diagrama de árbol descrito en prosa (contar ramas) | 5 | `desde-arbol` |
| **Total** | **50** | |

Cantidades exactas, no aproximadas. Sin bucket "contexto general": si un ejercicio no encaja en una fila, no se genera.

---

## ESTR, 50 ejercicios

Elegir **qué regla conviene aplicar**, sin calcular el resultado. Los distractores son la regla equivocada, no un número.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer que aplica la regla del producto (tareas secuenciales o independientes, conectadas por "y") | 15 | `reconocer-producto` |
| Reconocer que aplica la regla de la suma (alternativas excluyentes, conectadas por "o") | 15 | `reconocer-suma` |
| Reconocer que hace falta combinar ambas reglas en el mismo problema | 12 | `reconocer-combinada` |
| Reconocer que el problema **no** se resuelve con producto/suma directos porque involucra ordenar o elegir un subconjunto sin reposición (frontera con el resto de la unidad, sin nombrar todavía permutación/variación/combinación) | 8 | `reconocer-fuera-de-alcance` |
| **Total** | **50** | |

**Sobre la última fila:** el distractor correcto para esta sub-familia describe la situación ("hay que elegir un subconjunto y después importa el orden en el que quedaron elegidos") sin usar los términos técnicos `permutación`/`variación`/`combinación`, que todavía no se introdujeron en este topic.

---

## RESL, 50 ejercicios

Calcular el **resultado numérico**.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Producto puro | 15 | `producto-puro` |
| Suma pura | 10 | `suma-pura` |
| Combinación producto + suma | 15 | `producto-y-suma` |
| Producto con restricción | 10 | `producto-con-restriccion` |
| **Total** | **50** | |

**Cardinalidad**: siguiendo `authoring-context.md`, respuesta numérica corta → 4 opciones (grilla 2×2). Los distractores numéricos salen de las confusiones de la tabla de abajo, no de errores aritméticos arbitrarios.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Regla del producto (decisiones secuenciales) | Sumar las opciones de cada paso en vez de multiplicarlas |
| Regla de la suma (alternativas excluyentes) | Multiplicar las alternativas en vez de sumarlas |
| Producto con restricción | Ignorar la restricción y contar como si todas las opciones estuvieran disponibles en ese paso |
| Producto con restricción | Aplicar la restricción a todos los pasos en vez de solo al paso que corresponde |
| Combinación producto + suma | Resolver solo una parte (el producto o la suma) y omitir la otra rama del problema |
| Desde diagrama de árbol | Contar los nodos intermedios en vez de las ramas completas (caminos de raíz a hoja) |

---

## Reglas específicas del topic

- **Contextos válidos**: claves/contraseñas, menús combinados, placas/códigos alfanuméricos, caminos entre ciudades, señales con banderas/colores, diagramas de árbol de decisiones. Evitar contextos ya reservados para topics posteriores (podios, comités, anagramas: esos son de `permutaciones`/`combinaciones`).
- **"Y" vs. "o" en el enunciado**: la palabra que conecta las decisiones es la pista central del ejercicio (regla crítica: nombrar la estructura, no explicarla). Un enunciado de regla del producto conecta decisiones con "y luego", "seguido de"; uno de regla de la suma con "o", "en cualquiera de los casos".
- **Restricciones explícitas y verificables**: "el primer carácter no puede ser $0$", "no se puede repetir el mismo color dos veces seguidas". Nunca una restricción ambigua que admita más de una lectura.

## Checklist del topic

- [ ] Ningún ejercicio usa factorial, $P_n$, $V_{n,k}$ ni $\binom{n}{k}$
- [ ] La palabra conectora del enunciado ("y"/"o") es consistente con la regla que evalúa el ejercicio
- [ ] En restricciones, el enunciado dice explícitamente sobre qué paso aplica
- [ ] `tags` con el slug de la tabla de distribución, conteo por slug verificado contra el target
- [ ] Cardinalidad: FORM/ESTR conceptuales → 3 opciones; RESL numérico → 4 opciones ≤35 caracteres
