# Topic: Definición de función

Belt: `white`, Unit: `functions`, Topic: `definition`

Skills en este topic: `LEXI`, `CLSF`.

---

## LEXI, 50 ítems

### Distribución objetivo

| Concepto | Sub-tipo | Cantidad exacta |
|----------|----------|----------------:|
| Dominio | conjunto explícito o natural | 12 |
| Variable independiente / dependiente |, | 9 |
| Imagen | como conjunto (¿cuál es el conjunto imagen?) | 8 |
| Imagen | puntual (respecto de $x$, ¿qué es $f(x)$?) | 4 |
| Codominio |, | 6 |
| Preimagen | como cálculo (¿qué entradas dan $y$?) | 5 |
| Preimagen | puntual (respecto de $f(x)=y$, ¿qué rol cumple $x$?) | 2 |
| Unicidad (cupo estricto, ver abajo) |, | 4 |
| **Total** | | **50** |

**Cantidades exactas, no aproximadas.** La Gem debe respetar exactamente estos números; no más ítems de imagen o unicidad "porque salieron mejor".

**No hay bucket "contexto general".** Cada ítem debe encajar en uno de los conceptos de arriba. Si un ítem no encaja en ninguno, es porque no pertenece a este skill, descartalo, no lo forces.

**Sub-tipos de imagen y preimagen:**
- *Imagen como conjunto*: "Tomás $\{-2, -1, 0, 1, 2\}$ y elevás al cuadrado. ¿Cuál es el conjunto imagen?"
- *Imagen puntual*: "$f(x) = 2x$, $f(6) = 12$. Respecto del 6, ¿qué es el 12?", vocabulario de imagen aplicado a un caso puntual.
- *Preimagen como cálculo*: "$f(x) = x^2$. ¿Cuáles son las preimágenes de 9?"
- *Preimagen puntual*: "$V(x) = x^3$, $V(4) = 64$. Respecto de 64, ¿qué es el 4?", vocabulario de preimagen aplicado a un caso puntual.

Imagen, codominio y preimagen deben estar balanceados entre sí. Los ítems de estos tres conceptos son **cuantitativos y lógicos**: el alumno identifica el conjunto concreto, calcula las preimágenes de un valor, o distingue entre lo que la función "promete" (codominio) y lo que realmente produce (imagen). No generar ítems que sean puramente de vocabulario en abstracto ("¿qué es la imagen?").

### Unicidad, cupo estricto: 4 ítems, ni más ni menos

**OBLIGATORIO, no negociable.** Distribución fija dentro del cupo de 4 ítems:

- **2 ítems tipo "utilidad práctica"** (obligatorios): uno de cajero automático que muestra dos saldos distintos según quién consulta, y uno de termómetro que da dos lecturas simultáneas del mismo ambiente. La pregunta debe ser del tipo "¿qué garantía te da la unicidad acá?" o "¿qué pasaría si esta regla no fuera función?", NO "¿cumple la unicidad?".
- **2 ítems tipo "¿es función o no?" clásicos**: uno que sí lo sea (un contexto donde se respeta unicidad) y uno que no (un contexto donde una entrada tiene dos salidas).

**Contextos adicionales aceptables si hace falta variar**: app que asigna dos precios al mismo producto según el momento; GPS que calcula dos rutas de distancia distinta para el mismo origen y destino. Pero los dos de cajero+termómetro son obligatorios.

Los ítems de contraejemplo repetitivo ("dos descuentos al mismo producto", "dos asientos al mismo pasajero", "dos casilleros al mismo socio") **NO se generan más de una vez**. Un solo ítem clásico de "una entrada con dos salidas" alcanza.

### Cardinalidad

2-3 opciones por defecto. 4 solo cuando hay genuinamente 4 confusiones clásicas distintas que vale la pena separar. Evaluar ítem por ítem.

Preguntas binarias naturales (usar 2 opciones): "¿El dominio incluye o no incluye el 0?", "¿El codominio y la imagen coinciden aquí?", "¿Esta regla cumple unicidad?".

### `feedback_incorrect`

Requerido. Array del mismo largo que `options`, `null` en `correct_index`. 1 oración por distractor.

**Confusiones típicas por concepto:**

| Concepto preguntado | Confusión a diagnosticar |
|---------------------|--------------------------|
| Dominio | "confunde dominio con imagen" / "confunde dominio con codominio" / "confunde dominio con la fórmula de la función" |
| Imagen | "confunde imagen con codominio, la imagen son los valores que la función *realmente* toma, no todos los que podría tomar" / "confunde imagen con dominio" |
| Codominio | "confunde codominio con imagen, el codominio es el conjunto *declarado* de salidas posibles, no los que realmente se alcanzan" |
| Preimagen de k | "confunde la preimagen con f(k), la preimagen de k es lo que entra para obtener k, no lo que sale al evaluar en k" / "confunde preimagen con codominio restringido" |
| Variable independiente | "invierte la relación: la variable independiente es la entrada, no la salida" |
| Variable dependiente | "invierte la relación: la variable dependiente es la salida, que *depende* de la entrada" |
| Unicidad | "confunde unicidad con inyectividad, unicidad exige que cada *entrada* tenga una sola salida; inyectividad exige que cada *salida* provenga de una sola entrada" |

### Reglas específicas de este topic

**Negrita en primera mención.** En `question` y `explanation`, envolver en `**negrita**` la primera aparición de: `**dominio**`, `**imagen**`, `**codominio**`, `**preimagen**`, `**unicidad**` (y variantes como "único", "una sola salida" cuando refieren al concepto de unicidad). Solo la primera mención por campo, no repetir.

**Sin pistas delatoras.** Si la opción correcta necesita una glosa para ser inequívoca, dar una glosa equivalente a TODAS las opciones, no solo a la correcta. Si ninguna la necesita, ninguna la lleva.

**Variedad de apertura en `explanation`.** Alternar entre:
- Definición formal: "El **dominio** es el conjunto de entradas que la regla transforma."
- Pregunta retórica: "¿Qué conjunto le 'entra' a la función? Eso es el **dominio**."
- Contraejemplo: "¿Qué pasaría si el **dominio** incluyera un valor que la regla no puede procesar? La función estaría indefinida ahí."

No repetir la misma estructura de apertura en ítems consecutivos del mismo concepto.

**Contextos cotidianos válidos.** Precios de productos, notas de alumnos, tarifas de transporte, temperaturas, puntos de fidelidad, asignación de turnos o lockers, cantidades de bochas/porciones, consumo de datos. Sin nombres propios, usar roles genéricos ("un vendedor", "una empresa", "un remis", "un colegio").

---

## CLSF, 50 ítems

### Distribución objetivo

| Tipo de clasificación | Cantidad |
|-----------------------|----------|
| ¿Es función?, unicidad rota en tabla de pares o diagrama | ~20 |
| ¿Es función?, unicidad rota disfrazada en contexto cotidiano | ~10 |
| ¿Es inyectiva / sobreyectiva / biyectiva? | ~10 |
| Clasificar por tipo de representación (tabla, diagrama de flechas, fórmula, lista de pares) | ~10 |
| **Total** | **50** |

### Cardinalidad

- **"¿Es función?"**: 2 opciones (Sí / No). Son preguntas binarias, no rellenar a 4.
- **"¿Es inyectiva/sobreyectiva/biyectiva?"**: 3-4 opciones (las categorías que realmente aplican al caso; no fabricar categorías que no correspondan).
- **"¿Por qué NO es función?"**: 3 opciones (la razón correcta + 2 confusiones clásicas).

### `feedback_incorrect` para CLSF

Tipo "¿es función?":
- Distractor "Sí": "Una entrada tiene dos salidas, lo que rompe la unicidad."
- Distractor "No" cuando es función: especificar qué malentendido llevó ahí (ej. "el hecho de que dos entradas compartan salida no rompe la unicidad, eso sería un problema de inyectividad, no de función").

Tipo inyectiva/sobreyectiva/biyectiva:
- Nombrar exactamente qué propiedad se confundió y por qué no aplica en este caso.

### Reglas específicas para CLSF

**"Cuadrática" y "Polinómica" no pueden convivir en la misma grilla.** Si la respuesta correcta es una familia, los distractores deben ser familias genuinamente distintas (no sub/superconjuntos de la correcta).

**Inyectiva ≠ Unicidad.** Los ítems de clasificación deben ser cuidadosos con esta distinción. No mezclar los dos conceptos en el mismo ítem como si fueran equivalentes.

---

## Checklist del topic, verificar antes de adjuntar el JSON

Además del checklist global del `gem-instructions.md`, verificá lo específico de este topic:

**LEXI:**
- [ ] 50 ítems exactos
- [ ] Distribución: 12 dominio, 9 var indep/dep, 8 imagen conjunto, 4 imagen puntual, 6 codominio, 5 preimagen cálculo, 2 preimagen puntual, 4 unicidad
- [ ] El ítem del cajero automático (dos saldos) está presente
- [ ] El ítem del termómetro (dos lecturas simultáneas) está presente
- [ ] Solo 1 ítem clásico de "una entrada con dos salidas" (no repetir el patrón)
- [ ] Ningún ítem de imagen/codominio/preimagen es puramente definicional en abstracto, todos identifican, calculan o distinguen conjuntos concretos
- [ ] Variedad de apertura en las `explanation`: al menos 5 arrancan con pregunta retórica, al menos 5 con contraejemplo, resto con definición formal

**CLSF:**
- [ ] 50 ítems exactos
- [ ] Distribución: ~20 unicidad explícita, ~10 unicidad disfrazada, ~10 iny/sobre/biy, ~10 por tipo de representación
- [ ] Todas las preguntas "¿es función?" tienen 2 opciones (Sí/No), no 3 ni 4
- [ ] Ninguna opción de tipo de familia mezcla "Cuadrática" con "Polinómica de grado N" como distractores compatibles
