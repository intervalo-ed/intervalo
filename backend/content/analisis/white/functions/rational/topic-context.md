## Patrón de modernización: tema `rational`

Llevado de 47 → 200 ejercicios (50 × LEXI / CLSF / FORM / GRAF).

**Auditoría previa aplicada:**
- `feedback_incorrect` vaciado en los 47 originales.
- `graf_11.graph_view` corregido de dict `{xMin,xMax,...}` a lista `[-4, 4, -4, 4]`.
- 6 `graph_view` ajustados para que xRange ≈ yRange (ver scripts de auditoría).
- 3 CLSF con gráfico recibieron párrafo de contexto antes de la pregunta.
- 4 GRAF originales sin `graph_fn` lo recibieron (`1/x`, `1/(x-2)`, etc.).

**Biblioteca de `graph_fn` para racionales:**
```
1/x               [-6, 6, -6, 6]      # hipérbola básica, AV x=0, AH y=0
1/(x-2)           [-4, 8, -6, 6]      # AV x=2, AH y=0
1/(x+1)           [-6, 4, -6, 6]      # AV x=-1
1/(x-3)+1         [-3, 9, -5, 7]      # AV x=3, AH y=1
2/(x+1)           [-6, 4, -6, 6]      # AV x=-1, escalada
(x+1)/(x-2)       [-4, 8, -5, 7]      # AH y=1 (grado igual)
-1/x              [-6, 6, -6, 6]      # hipérbola reflejada
1/(x^2)           [-5, 5, -1, 8]      # ambas ramas positivas
```

**Proporcionalidad de graph_view:** mantener xRange ≈ yRange para que la
gráfica se vea cuadrada. Para hipérbolas alejadas del origen, extender ambos
rangos simétricamente.

**GRAF tipos:**
- A: leer propiedad (AV, AH, dominio, imagen, valor f(c)).
- B: identificar fórmula entre 4 opciones (distractores: reflejo, desplazamiento).
- C: contexto cotidiano con función `k/x` (trabajo compartido, velocidad, presupuesto, concentración).

**sync-catalog NO necesario**: GRAF ya existía para `rational` en el catálogo.

---

## Patrón de modernización: tema `rational`

Llevado de 47 → 200 ejercicios (50 × LEXI/CLSF/FORM/GRAF) en rama `modernizacion-rational`.

### Sintaxis mathjs para `graph_fn`

```
1/x                     [-5, 5, -5, 5]
1/(x-1)                 [-4, 6, -5, 5]
1/(x+2)                 [-7, 3, -5, 5]
1/(x-3)+1               [-2, 8, -4, 6]
2/x                     [-5, 5, -6, 6]
-1/x                    [-5, 5, -5, 5]
(x+1)/(x-2)             [-4, 8, -6, 6]
x/(x-2)                 [-3, 7, -4, 6]
(x+1)/x                 [-5, 5, -4, 6]
2/(x+1)                 [-5, 5, -6, 6]
1/(x^2)                 [-4, 4, -1, 8]
1/(x^2-4)               [-6, 6, -4, 4]
3*x/(x^2-1)             [-5, 5, -6, 6]
-2*x/(x+1)              [-6, 4, -6, 2]
2*x/(x+3)               [-8, 2, -4, 6]
(3*x-4)/(x-2)           [-3, 7, -2, 8]
```

**Regla de proporción de `graph_view`:** xRange ≈ yRange (aproximadamente cuadrado).
Para funciones con AV en `x=a`, centrar el view en `a` y dar suficiente espacio
a ambos lados para ver claramente las dos ramas.

### Correcciones de auditoría aplicadas

- `feedback_incorrect` → `""` en todos los 47 ejercicios originales.
- `white_rational_graf_11`: `graph_view` dict → lista `[-4, 4, -4, 4]`.
- `white_rational_graf_03/05/07/09`: agregado `graph_fn` (eran GRAF sin gráfico).
- `graph_view` ajustado en 6 ejercicios (lexi_02, lexi_09, clsf_01, clsf_08, graf_06, graf_10).
- CLSF con gráfico (clsf_01, clsf_05, clsf_08): agregado párrafo de contexto antes de la pregunta.

### Tipos de ejercicio GRAF

- **Tipo A** (~20): leer propiedades del gráfico (AV, AH, dominio, imagen, ceros, monotonía, cuadrantes).
- **Tipo B** (~15): identificar la fórmula entre 4 opciones dadas la gráfica.
- **Tipo C** (~4): contexto cotidiano simple (trabajo en equipo, velocidad, presupuesto, concentración).

**sync-catalog NO necesario**: GRAF ya existía en el catálogo para `rational`.

---

## Estado (auditoría jul-2026), lo que falta para alinear con `authoring-context.md`

Este documento tiene dos secciones "Patrón de modernización" duplicadas de sesiones anteriores (contenido solapado, no se reescriben acá por edición mínima). Verificado programáticamente sobre los 4 JSON:

1. **`feedback_incorrect` falta en los 200 ítems** (los 4 skills en `""`, sin excepción). Completar como `array<string|null>` paralelo a `options`, `null` en el índice correcto, voz descriptiva nunca acusatoria (`authoring-context.md` §Pistas).
2. **`\n\n` pegado a bloques `$$...$$`**: mínimo en este tema, LEXI 1 (#10), CLSF 3 (#10,12,13), FORM 1 (#10), GRAF 0. No es un problema extendido acá.
3. **Em-dash/en-dash**: ninguno detectado en los 4 JSON.
4. **Viñetas `•`/sub-ítems `-`**: casi inexistentes, CLSF 1 (#11), FORM 5 (#39,40,42,48,49), GRAF 1 (#10), LEXI 0.
5. **`explanation` bajo 300 caracteres** (mínimo vigente en `authoring-context.md`, no 250), **el defecto dominante del tema**: LEXI 46/50, CLSF 36/50, FORM 48/50, **GRAF 49/50 (prácticamente todo el archivo)**, conteos tomados contra el umbral viejo de 250, verificar de nuevo contra 300 (van a subir). El patrón es 1-2 oraciones de concepto sin aplicación desglosada ni cierre. Hay que sumar el paso de aplicación al caso concreto y/o un cierre de advertencia/consejo.
6. **Cierres con humor/antropomorfismo**: no se detectaron casos.
7. **`correct_index`, el sesgo más extremo de toda la unidad**: LEXI {0:43,1:3,2:2,3:2}, CLSF {0:40,1:4,2:4,3:2}, FORM {0:42,1:4,2:2,3:2}, GRAF {0:42,1:3,2:2,3:3}. **En los 4 skills, la correcta está casi siempre en el índice 0** (84-86% de los ítems). Rebalancear a ~{0:12,1:13,2:12,3:13} reordenando `options` (mismo contenido, nueva posición) y sincronizando `feedback_incorrect`; en la práctica hay que tocar el orden de opciones de la enorme mayoría de los 200 ítems del tema.

### Confusiones fuente para `feedback_incorrect`, por skill

**LEXI:** función racional (cociente de polinomios) confundida con otras familias (cuadrática, exponencial, raíz); dominio (excluye ceros del denominador) ↔ imagen invertidos; asíntota vertical (ceros del denominador tras simplificar) confundida con los ceros del numerador (interceptos con el eje $X$); asíntota horizontal según comparación de grados (num < denom → $y=0$; num = denom → cociente de coeficientes principales; num > denom → no hay AH) mal aplicada; intercepto con eje $X$ ↔ intercepto con eje $Y$ ($f(0)$); signo de la función cerca de la asíntota vertical invertido según el lado; transformaciones (desplazamiento vertical/horizontal, reflexión, escalado) con el parámetro equivocado; creer que la racional es discontinua en todo su dominio o continua en todo $\mathbb{R}$ (es continua en su dominio, discontinua solo donde no está definida).

**CLSF:** reconocer racional desde gráfico (dos ramas separadas por una asíntota vertical) confundido con otra familia; racional confundida con polinómica (la polinómica no tiene asíntotas); simetría respecto al origen de $k/x$ mal interpretada; reflejo (coeficiente negativo) confundido con desplazamiento; imagen restringida ($\mathbb{R}\setminus\{AH\}$) confundida con el dominio; una racional que se simplifica a un polinomio con hueco (ej. $\frac{x^2-4}{x-2}$) confundida con una racional "de verdad" con asíntota.

**FORM:** encontrar dónde no está definida (denominador $=0$) confundido con resolver el numerador; asíntota horizontal mal calculada por error en la comparación de grados o en el cociente de coeficientes principales; dominio en notación de intervalos con el punto excluido mal ubicado o mal notado; asíntota vertical con error al resolver denominador $=0$; intercepto con eje $Y$ dado por inexistente cuando el denominador se anula en $x=0$; al armar fórmula desde gráfico, confundir qué parámetro controla la AV y cuál la AH.

**GRAF:** contar mal la cantidad total de asíntotas (confundir con ceros); AH ↔ AV confundidas; signo de la función cerca de la AV por la izquierda/derecha invertido; signo de la función en un intervalo dado (positivo/negativo) mal evaluado; al armar fórmula desde gráfico, mismo error que en FORM (parámetro de AV confundido con el de AH).

### Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal:**
- [ ] `feedback_incorrect` completo en los 50 ítems por skill: `array` del largo de `options`, `null` en el correcto
- [ ] Ningún `\n\n` pegado a un bloque `$$...$$`
- [ ] Ningún em-dash `—` ni en-dash `–`
- [ ] Ninguna explicación con viñetas `•` ni sub-ítems `-`
- [ ] Cierres de `explanation` en advertencia/consejo, sin humor ni antropomorfismo
- [ ] `explanation` supera los 300 caracteres entre las 3 partes (foco urgente: prácticamente todo el tema; el umbral es 300, no 250, corregido tras auditoría de `polynomial`)
- [ ] `correct_index` variado, no concentrado en índice 0 (objetivo ~12-13 por índice; es el rebalanceo más grande de la unidad)
- [ ] Montos con `\$` escapado
- [ ] Cada ítem lleva `"tags": ["<slug>"]` según la tabla de distribución de su skill (ver sección más abajo), y el conteo por slug coincide con el target
- [ ] Fórmula central del `question` separada del texto en su propio bloque `$$...$$`, nunca tejida inline (sobre todo fracciones); ver hallazgos de esta ronda
- [ ] Opciones compuestas (2+ valores relacionados) sin re-etiquetar cada valor si la pregunta ya fija el orden
- [ ] Sin preámbulo en CLSF/GRAF que restablezca en prosa rasgos que el gráfico ya muestra directamente

### Hallazgos de auditoría (ronda 1, jul-2026)

15 ítems corregidos por el usuario en esta ronda (`correciones_analisis_funciones_racional_13_7.md`). El hallazgo más nuevo y con más peso (6/15 ítems, 40% del batch) es que **la fórmula central del enunciado no puede ir tejida inline dentro de la pregunta, sobre todo si es una fracción**: tiene que ir en su propio bloque `$$...$$` centrado, con el texto acompañándola en oraciones separadas. Esto extiende a `question` una preferencia que hasta ahora solo estaba documentada para `explanation` (ver regla crítica 18 en `authoring-context.md`).

- `FORM_08`, `CLSF_20`: `explanation` sin separación de párrafos y sin fórmula centrada fuera del texto.
- `LEXI_45`, `CLSF_43`, `FORM_14`, `GRAF_02`: `explanation` sin ningún `\n\n` entre párrafos (mismo sesgo sistémico que polynomial/exponential/logarithmic, ahora confirmado en un 5° topic).
- `FORM_03`: fórmula del enunciado (`f(x) = \frac{x^2-1}{x-1}`) tejida inline en la pregunta; debía ir separada, centrada y sola. `explanation` tampoco separada por párrafos.
- `CLSF_04`: mismo problema, el enunciado debía tener la pregunta en una oración y la fórmula centrada en otra.
- `FORM_34`: dos fórmulas (`g(x)` y `f(x)`) apretadas en la misma línea del enunciado; debían separarse en dos oraciones/bloques. `explanation` tampoco separada por párrafos.
- `LEXI_15`, `CLSF_46`: misma fórmula-inline-en-pregunta, remarcando que aplica "especialmente porque es una fracción".
- `GRAF_31`: sin separación de párrafos en `explanation`, y la opción correcta notablemente más larga que las demás (paridad de longitud, regla crítica 4/15 ya documentada).
- `FORM_43`: opciones con etiquetas redundantes ("Eje $X$: ...; eje $Y$: ...") cuando la pregunta ya fija el orden. Nueva regla crítica 19.
- `CLSF_46` (además de lo de arriba): la opción correcta incluía la justificación técnica completa entre paréntesis ("con agujero en $x=2$"), delatando la respuesta (regla crítica 4, ya documentada).
- `FORM_14`: `explanation` sin separación de párrafos.
- `GRAF_02`: `explanation` sin separación de párrafos.
- `CLSF_37`: paréntesis en las opciones mal usado (justificación técnica solo en la correcta) y distractor "Polinómica de grado 2" problemático (regla crítica 4/registro de opciones).
- `CLSF_15`: el enunciado tenía un párrafo inicial describiendo rasgos que el propio gráfico ya muestra ("dos ramas separadas... se aplanan..."), redundante. Nueva aclaración a la sección *Planteos de GRAF*.
- `CLSF_39`: **ítem roto**, la pregunta ("¿cuál función tiene imagen $\mathbb{R}$?") no coincide con las opciones dadas (ninguna opción tiene imagen $\mathbb{R}$ real, todas tienen alguna restricción). Hay que corregir o regenerar este ítem específico al refactorizar, no es un problema de formato sino de contenido incorrecto.
- `LEXI_47`: opciones con aclaraciones entre paréntesis ("Dos ($x=2$ y $x=-2$)") que dan pistas de más; debían quedar todas igual de escuetas. `explanation` sin separación de párrafos.

### Distribución objetivo, con `tags`

Diseñada leyendo los 200 ítems reales (dump de `question`+opción correcta por skill). Los conteos son sobre el archivo actual; al refactorizar, mantené el total por sub-familia.

**LEXI** (50 ítems):

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocimiento de función racional (qué es/no es) | 4 | `reconocimiento-funcion-racional` |
| Dominio y restricciones (denominador = 0) | 7 | `dominio-restriccion` |
| Asíntota vertical (cantidad, existencia, concepto) | 5 | `asintota-vertical` |
| Asíntota horizontal (comparación de grados) | 7 | `asintota-horizontal` |
| Asíntota oblicua | 2 | `asintota-oblicua` |
| Agujero vs. asíntota vertical | 3 | `agujero-vs-asintota` |
| Interceptos con los ejes | 4 | `interceptos-ejes` |
| Paridad de la función (par/impar) | 2 | `paridad-funcion` |
| Comportamiento en el infinito / límites laterales | 5 | `comportamiento-en-infinito` |
| Transformaciones (desplazamiento, reflexión, escala) | 4 | `transformaciones` |
| Imagen / rango | 3 | `imagen-rango` |
| Continuidad en el dominio | 2 | `continuidad-en-dominio` |
| Extremos y monotonía | 1 | `extremos-monotonia` |
| Conteo de ramas | 1 | `conteo-ramas` |
| **Total** | **50** | |

**CLSF** (50 ítems):

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Es racional, dada una fórmula | 10 | `es-racional-desde-formula` |
| NO es racional (raíz, exponencial, logaritmo) | 4 | `no-es-racional` |
| Reconocimiento desde gráfico (rasgos descriptos en prosa) | 11 | `reconocimiento-desde-grafico` |
| Agujero vs. asíntota vertical, desde fórmula factorizable | 4 | `agujero-vs-asintota-formula` |
| Monotonía por tramos | 3 | `monotonia-por-tramos` |
| Dominio desde fórmula | 3 | `dominio-desde-formula` |
| Imagen desde fórmula o elección múltiple | 3 | `imagen-desde-formula` |
| Descripción abstracta (propiedades sin fórmula ni gráfico) → familia | 8 | `descripcion-abstracta-a-familia` |
| Cantidad de asíntotas verticales, elegir cuál cumple | 1 | `cantidad-asintotas-verticales` |
| AV sin AH (o viceversa), elegir cuál cumple | 1 | `av-sin-ah` |
| Afirmaciones generales verdadero/falso sobre racionales | 2 | `afirmaciones-generales-vf` |
| **Total** | **50** | |

**FORM** (50 ítems):

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Dominio (valores excluidos / notación de intervalos) | 8 | `dominio-form` |
| Asíntota horizontal, cálculo desde fórmula | 6 | `asintota-horizontal-calculo` |
| Asíntota vertical, cálculo desde fórmula | 4 | `asintota-vertical-calculo` |
| Cantidad de asíntotas verticales | 2 | `cantidad-asintotas-verticales-form` |
| Fórmula desde gráfico (elegir entre 4 opciones) | 4 | `formula-desde-grafico-form` |
| Evaluación puntual $f(a)$ | 4 | `evaluacion-puntual` |
| Evaluación en un agujero (no está definida) | 2 | `evaluacion-en-agujero` |
| Evaluación aproximada leída del gráfico | 1 | `evaluacion-desde-grafico` |
| Lectura directa del gráfico (AV/AH/valor, "observá la gráfica") | 3 | `lectura-grafico-directa` |
| Interceptos con los ejes | 6 | `interceptos-ejes-form` |
| Fórmula desde propiedades (AV+AH+punto dados) | 2 | `formula-desde-propiedades` |
| Transformaciones (desplazamiento) | 1 | `transformaciones-form` |
| Combinado AV+AH+valor puntual en un mismo ítem | 5 | `combinado-av-ah-valor` |
| Comportamiento en el infinito | 1 | `comportamiento-infinito-form` |
| Hallar un parámetro $k$ dado un punto de paso | 1 | `hallar-parametro-k` |
| **Total** | **50** | |

**GRAF** (50 ítems, reagrupa los tipos A/B/C ya documentados arriba):

*Tipo A — leer propiedad directamente del gráfico (31 ítems):*

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Cantidad de asíntotas totales | 2 | `cantidad-asintotas-totales` |
| Cantidad de asíntotas verticales | 3 | `cantidad-asintotas-verticales-graf` |
| Ubicación de la asíntota vertical | 3 | `ubicacion-asintota-vertical` |
| Valor de la asíntota horizontal | 3 | `valor-asintota-horizontal` |
| Cuadrantes de las ramas | 2 | `cuadrantes-ramas` |
| Dirección de las ramas hacia la asíntota | 2 | `direccion-ramas` |
| Monotonía en un intervalo | 2 | `monotonia-intervalo-graf` |
| Interceptos con el eje $X$ | 2 | `interceptos-x-graf` |
| Interceptos con el eje $Y$ | 2 | `interceptos-y-graf` |
| Valor aproximado en un punto | 2 | `valor-aproximado` |
| Dominio desde el gráfico | 1 | `dominio-desde-grafico` |
| Existencia de extremos | 1 | `existencia-extremos` |
| Imagen desde el gráfico | 1 | `imagen-desde-grafico` |
| Simetría / paridad | 1 | `simetria-paridad-graf` |
| Límites laterales en la AV | 2 | `limites-laterales-av` |
| Cantidad de ramas | 1 | `cantidad-ramas` |
| Signo de la función en un intervalo | 1 | `signo-en-intervalo` |

*Tipo B — identificar fórmula desde el gráfico (15 ítems):* slug único `formula-desde-grafico` (igual que en la ronda anterior, no se sub-divide).

*Tipo C — contexto cotidiano con $k/x$ (4 ítems):* slug único `contexto-cotidiano-racional`.

