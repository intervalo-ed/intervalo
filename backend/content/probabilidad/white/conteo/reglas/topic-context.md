# Topic: Reglas de conteo

Belt: `white`, Unit: `conteo`, Topic: `reglas`

Skills en este topic: `FORM`, `ESTR`.

Este topic tiene 2 ítems (uno por skill): `FORM`, `ESTR`.

> **RESL archivado (ago-2026):** se sacó de este topic por decisión pedagógica: acá el cálculo no aporta sobre el planteo. Una vez que el alumno eligió la regla (`ESTR`) y armó la expresión (`FORM`), evaluar $9 \times 10 \times 10$ es aritmética sin contenido combinatorio, y el ítem no agrega señal de diagnóstico que las otras dos skills no den ya. Mismo criterio que el archivado de `ESTR` en `analisis/violet/derivatives/limit_definition`. Contenido preservado en `backend/content/archive/probabilidad/white/conteo/reglas/RESL.json`, incluidos los 4 ejercicios con tabla de la sub-familia `total-desde-tabla`. No generar `RESL` para este topic en rondas futuras. El cupo no se redistribuye (mismo criterio que los archivados anteriores). Las menciones históricas de `RESL` en el resto de este documento quedan como referencia, no como guía de generación.

Concepto: la **regla del producto** (decisiones secuenciales o independientes, se multiplican las opciones de cada paso) y la **regla de la suma** (alternativas mutuamente excluyentes, se suman los casos). Este topic es la base de todo el resto de la unidad: `factoriales`, `permutaciones`, `variaciones` y `combinaciones` son casos particulares donde ya no alcanza con producto/suma directos y hace falta una fórmula específica.

**Frontera con el resto de la unidad:** ningún ejercicio de este topic usa factorial, $P_n$, $V_{n,k}$ ni $\binom{n}{k}$. Si un problema requiere ordenar un conjunto completo o elegir un subconjunto sin reponer elementos, es un ejercicio de `permutaciones`/`variaciones`/`combinaciones`, no de `reglas`. Acá el conteo siempre sale de multiplicar/sumar cantidades de opciones por paso, con o sin repetición permitida entre pasos (pero cada paso se resuelve por conteo directo, no por una fórmula de arreglo).

---

## FORM, 19 ejercicios

Armar la **expresión** que cuenta el total, no calcular el valor numérico. El cálculo se evalúa en los topics siguientes de la unidad; `RESL` está archivado acá.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Regla del producto pura, 2-3 decisiones secuenciales con repetición permitida entre pasos | 5 | `producto-puro` |
| Regla de la suma pura, alternativas mutuamente excluyentes ("o") | 3 | `suma-pura` |
| Combinación producto + suma (ej. suma de dos productos, o producto con un paso que tiene alternativas) | 4 | `producto-y-suma` |
| Producto con restricción (un paso con menos opciones por una condición, ej. primer dígito no puede ser $0$, o un carácter no se repite) | 2 | `producto-con-restriccion` |
| Armar la expresión desde un diagrama de árbol descrito en prosa (contar ramas) | 1 | `desde-arbol` |
| **Con tabla** (`table`, modo `column`): la tabla muestra cuántos resultados hay según un parámetro, y las opciones son expresiones candidatas para la fila simbólica | 4 | `patron-tabla` |
| **Total** | **19** | |

Cantidades exactas, no aproximadas. Sin bucket "contexto general": si un ejercicio no encaja en una fila, no se genera.

---

## ESTR, 17 ejercicios

Elegir **qué regla conviene aplicar**, sin calcular el resultado. Los distractores son la regla equivocada, no un número.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer que aplica la regla del producto (tareas secuenciales o independientes, conectadas por "y") | 5 | `reconocer-producto` |
| Reconocer que aplica la regla de la suma (alternativas excluyentes, conectadas por "o") | 4 | `reconocer-suma` |
| Reconocer que hace falta combinar ambas reglas en el mismo problema | 4 | `reconocer-combinada` |
| Reconocer que el problema **no** se resuelve con producto/suma directos porque involucra ordenar o elegir un subconjunto sin reposición (frontera con el resto de la unidad, sin nombrar todavía permutación/variación/combinación) | 2 | `reconocer-fuera-de-alcance` |
| **Con tabla** (`table`, modo `cell`): la tabla desglosa las opciones de cada paso y deja la fila `Total` vacía; las opciones son las reglas, y el total aparece recién al confirmar | 2 | `regla-desde-tabla` |
| **Total** | **17** | |

**Sobre `regla-desde-tabla`, cupo deliberadamente chico:** la contraindicación principal del formato tabla es que **cuando la dificultad real es el modelado, la tabla regala los números**, y `ESTR` es justamente la skill de modelado. Al listar los pasos y sus opciones, la tabla ya hizo parte del trabajo. Quedan 2 como piloto; el resto del cupo del topic se resuelve en `FORM`, donde el formato encaja sin reservas. Si el testeo muestra que adelgazan demasiado el ítem, se bajan a 0 antes que subirlos.

**Sobre la última fila:** el distractor correcto para esta sub-familia describe la situación ("hay que elegir un subconjunto y después importa el orden en el que quedaron elegidos") sin usar los términos técnicos `permutación`/`variación`/`combinación`, que todavía no se introdujeron en este topic.

---

## RESL, 19 ejercicios  *(ARCHIVADO ago-2026, ver aviso arriba: no generar)*

Calcular el **resultado numérico**.

### Distribución objetivo

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Producto puro | 5 | `producto-puro` |
| Suma pura | 3 | `suma-pura` |
| Combinación producto + suma | 4 | `producto-y-suma` |
| Producto con restricción | 3 | `producto-con-restriccion` |
| **Con tabla** (`table`, modo `cell`): la tabla desglosa cuántas opciones admite cada paso y deja la fila `Total` vacía | 4 | `total-desde-tabla` |
| **Total** | **19** | |

**Cardinalidad**: siguiendo `authoring-context.md`, respuesta numérica corta → 4 opciones (grilla 2×2). Los distractores numéricos salen de las confusiones de la tabla de abajo, no de errores aritméticos arbitrarios. **Excepción: los ejercicios con `table` de este topic van con 3 opciones** (ver *Reglas específicas*).

**Qué gana `total-desde-tabla`:** el desglose por paso deja de vivir en la prosa, así que el enunciado se acorta y la restricción queda enfrentada visualmente a la fila que la sufre. El ítem sigue evaluando el cálculo, no el planteo.

---

## `feedback_incorrect`, confusiones típicas (las 2 skills vigentes)

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

### Ejercicios con tabla (`patron-tabla`, `regla-desde-tabla`)

Reglas 68-75 de `authoring-context.md` más lo específico de este topic:

- **3 opciones, siempre.** Coincide con la cardinalidad conceptual del topic, y no es
  cosmética: las restricciones anti-descarte (regla 71) son mucho más difíciles de satisfacer con
  cuatro candidatos, y con tres cada distractor puede ser un error real y no relleno. Con 3
  opciones tampoco se activa la grilla 2×2, que es lo deseable teniendo una tabla arriba.
- **Fila trampa obligatoria (A1).** Tiene que existir una fila visible donde **todos** los
  candidatos den el mismo valor, para que la primera fila que el alumno mire no resuelva el ítem.
  La familia $\{2n,\ n+2,\ n^{2},\ 2^{n}\}$ **vale $4$ en $n=2$** para las cuatro, así que casi
  todos los ítems de este topic se arman eligiendo la correcta de ese conjunto y dos distractores
  del resto, con $n=2$ como fila trampa.
- **Régimen de consecutividad (regla 72): consecutivas.** Este topic es regla del producto, donde
  "una etapa más multiplica el conteo" **es** el mecanismo, así que la lectura recursiva entre
  filas es razonamiento válido y no un atajo.
- **La tabla no puede desarmar el planteo.** En `patron-tabla` la columna de entrada es un
  parámetro (cantidad de posiciones, de símbolos, de etapas), nunca el desglose paso a paso: eso
  es lo que evalúa `ESTR` y regalarlo vacía el ítem.
- **Contextos**: los mismos del topic (claves, códigos, menús, caminos, banderas). El encabezado de
  la columna nombra la cantidad, no el objeto.

## Checklist del topic

- [ ] Ningún ejercicio usa factorial, $P_n$, $V_{n,k}$ ni $\binom{n}{k}$
- [ ] La palabra conectora del enunciado ("y"/"o") es consistente con la regla que evalúa el ejercicio
- [ ] En restricciones, el enunciado dice explícitamente sobre qué paso aplica
- [ ] `tags` con el slug de la tabla de distribución, conteo por slug verificado contra el target
- [ ] Cardinalidad: FORM/ESTR conceptuales → 3 opciones
- [ ] **Ejercicios con `table`: 3 opciones, fila trampa presente (A1), entradas consecutivas**
