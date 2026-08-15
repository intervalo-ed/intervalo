## Patrón de modernización: tema `trigonometric`

> **CLSF archivado (jul-2026):** se sacó de este topic al podar a un máximo de 3 ítems (skills) por topic. Contenido preservado en `backend/content/archive/analisis/white/functions/trigonometric/CLSF.json`. No generar CLSF para este topic en rondas futuras; el resto de este documento sigue mencionando CLSF en registros de auditoría históricos, que quedan como referencia, no como guía de generación.

Llevado de 47 → 150 ejercicios activos (50 × LEXI / FORM / GRAF; CLSF archivado). Recortado en ronda posterior (ago-2026) a 90 ejercicios activos (30 × LEXI / FORM / GRAF), recorte proporcional por subfamilia — ver tabla de distribución más abajo, ya actualizada al estado post-recorte.

**Convenciones de notación:**
- Texto de ejercicio: `\operatorname{sen}(x)` (notación española).
- `graph_fn` y cálculos internos: `sin(x)`, `cos(x)` (mathjs).
- Nunca `sen` en `graph_fn`.

**Auditoría previa aplicada:**
- `feedback_incorrect` vaciado en los 47 originales.
- `graf_11.graph_view` corregido de dict a lista `[-6.5, 6.5, -2, 2]`.
- `lexi_06`, `graf_01`: `[-0.5,7,-2,2]` → `[-7,7,-2,2]`.
- `graf_10`: `[-0.5,7,-2,2]` → `[-5,5,-2,2]`.
- `form_02`: `[-7,7,-3,3]` → `[-7,7,-2,2]`.
- `graf_02/05/07/09`: `graph_fn` agregado.
- `clsf_01/05/08`: párrafo de contexto agregado.

**Biblioteca de `graph_fn`:**
```
sin(x)              [-7, 7, -2, 2]
cos(x)              [-7, 7, -2, 2]
2*sin(x)            [-7, 7, -3, 3]
-sin(x)             [-7, 7, -2, 2]
-cos(x)             [-7, 7, -2, 2]
3*sin(x)            [-7, 7, -4, 4]
3*cos(x)            [-7, 7, -4, 4]
sin(x)+1            [-7, 7, -1, 3]
sin(x)-1            [-7, 7, -3, 1]
cos(x)-2            [-7, 7, -4, 0]
-cos(x)+1           [-7, 7, -1, 3]
2*cos(x)            [-7, 7, -3, 3]
2*sin(x)+1          [-7, 7, -2, 4]
2*sin(2*x)          [-5, 5, -3, 3]
sin(2*x)            [-5, 5, -2, 2]
cos(2*x)            [-5, 5, -2, 2]
sin(2*x)+1          [-5, 5, -1, 3]
sin(x/2)            [-10, 10, -2, 2]
```

**Parámetros clave:**
- Amplitud = `|A|`; período = `2π/|B|`; máx = `D + |A|`; mín = `D - |A|`.
- Imagen = `[D − |A|, D + |A|]`.

**Grilla del eje x (π vs decimal) — automática según `graph_fn`:**
El gráfico (`math-graph.tsx`) pone el eje x en múltiplos de π (etiquetas π/2, π,
3π/2, 2π…) cuando detecta **función trig (`sin`/`cos`/`tan`) y NINGÚN `pi` en la
fórmula**, porque ahí x es un ángulo en radianes (`sin(x)`, `cos(2*x)`,
`sin(x/2)`). Los **aplicados**, donde x es tiempo/unidad real, **siempre llevan
`pi`** en `graph_fn` (`311*sin(100*pi*x)`, `10*sin(pi/12*(x-6))+20`,
`8*cos(pi/6*(x-1))+15`) → ahí el eje x queda **decimal**. El eje y es siempre
decimal (amplitud). Consecuencia para autoría: una sinusoide de ángulo puro NO
debe incluir `pi` (ni en un corrimiento como `sin(x - pi/3)`), o se la tratará
como aplicada (grilla decimal).

**Contextos cotidianos** (no pH, Richter, decibeles):
- Temperatura diaria/estacional: amplitud = (máx−mín)/2, eje = (máx+mín)/2.
- Mareas: período ≈ 12 h, amplitud = diferencia de nivel.
- Corriente alterna: `311·sin(100πt)` para 220 V / 50 Hz.
- Horas de luz solar: ciclo anual de 365 días.

**GRAF tipos:**
- A: leer propiedad (período, amplitud, imagen, máximos, raíces, eje de oscilación).
- B: identificar fórmula (distractores: seno vs coseno, amplitud vs período, signo).
- C: contexto cotidiano con gráfico real (temperatura, mareas, corriente).

**sync-catalog NO necesario**: GRAF ya existía para `trigonometric`.

---

## Estado (auditoría jul-2026), lo que falta para alinear con `authoring-context.md`

El tema más limpio de la unidad en formato: verificado programáticamente, prácticamente sin `\n\n$$` glue, sin em-dash, sin viñetas, sin explicaciones cortas. Solo dos pendientes reales:

1. **`feedback_incorrect` falta en los 200 ejercicios** (los 4 skills en `""`, sin excepción). Completar como `array<string|null>` paralelo a `options`, `null` en el índice correcto, voz descriptiva nunca acusatoria (`authoring-context.md` §Pistas).
2. **Antropomorfismo del seno/coseno, un problema localizado en LEXI y CLSF** (no aparece en FORM/GRAF): varios cierres de `explanation` personifican las funciones trigonométricas con rasgos humanos, violación directa de la regla crítica 7 (`authoring-context.md`). Encontrados:
   - **LEXI** #15 ("el coseno llega... con toda la energía. El seno prefiere arrancar despacio"), #18 ("¡Qué disciplina!"), #23 ("el piso en que vive"), #24 ("el seno llega tarde a la fiesta... la invitación decía"), #47 ("el seno siempre llega tarde, pero llega"), #48 ("sin drama con el eje $X$").
   - **CLSF** #28 ("el seno pesimista que en vez de subir, decide bajar primero"), #33 ("el seno ahora duerme... pero sigue soñando"), #42 ("el coseno siempre empieza con lo mejor. El seno prefiere arrancar... y ganarlo").
   - Reescribir estos cierres a advertencia/consejo neutro (ej. nombrar la diferencia real: coseno arranca en su máximo, seno arranca en cero) sin personificación.
3. **Defectos menores de formato** (no requieren pasada completa, solo tocar los ejercicios puntuales): `\n\n$$` glue en CLSF #10; em-dash en LEXI #29, CLSF #39, GRAF #16; viñetas en LEXI #10, CLSF #11-12, FORM #10, GRAF #10.
4. **`correct_index` con sesgo moderado** (menor que en el resto de la unidad, pero corregible): LEXI {0:4,1:17,2:21,3:8}, CLSF {0:6,1:18,2:15,3:11}, FORM {0:7,1:16,2:17,3:10}, GRAF {0:5,1:10,2:21,3:14}. Rebalancear a ~{0:12,1:13,2:12,3:13}.

### Confusiones fuente para `feedback_incorrect`, por skill

**LEXI:** seno ↔ coseno confundidos en valores clave ($\operatorname{sen}(0)=0$ vs $\cos(0)=1$); período $2\pi/|B|$ invertido (multiplicar por $B$ en vez de dividir); amplitud ↔ período confundidos; imagen $[D-|A|, D+|A|]$ mal calculada (olvidar el valor absoluto o el desplazamiento $D$); monotonía (creciente/decreciente) en un intervalo dado invertida.

**CLSF:** reconocer trigonométrica desde el gráfico (oscilación regular y periódica) confundida con otra familia; contar mal la cantidad de ciclos completos en un intervalo; distinguir seno de coseno desde el gráfico (dónde arranca: cero vs. máximo); reflejo (signo negativo, ej. $-\cos(x)$) confundido con un desplazamiento; un contexto aplicado (consumo eléctrico estacional, corriente alterna) mal reconocido como no periódico.

**FORM:** amplitud ↔ período confundidos al leer $f(x) = A\operatorname{sen}(Bx+C)+D$; máximo/mínimo con desplazamiento vertical ($D+|A|$ / $D-|A|$) mal calculado; error de fase al resolver dónde la función cruza el eje; al armar fórmula desde gráfico, amplitud confundida con el eje de oscilación $D$; período de $\cos(\pi x)$ u otras $B$ no enteras mal aplicado en la fórmula $2\pi/|B|$.

**GRAF:** contar mal máximos o ciclos completos en el intervalo mostrado; diferencia visual seno/coseno (dónde arranca la curva) mal identificada; período leído incorrectamente desde el gráfico; monotonía (creciente/decreciente) en un tramo invertida; en los aplicados, parámetros del modelo (amplitud, eje de oscilación, hora del máximo) confundidos entre sí.

### Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal:**
- [ ] `feedback_incorrect` completo en los 30 ejercicios por skill (LEXI/FORM/GRAF; CLSF archivado): `array` del largo de `options`, `null` en el correcto
- [ ] Sin antropomorfismo del seno/coseno en los cierres (LEXI y CLSF, ver lista de ejercicios arriba)
- [ ] `correct_index` variado, no concentrado en un solo índice (objetivo ~12-13 por índice)
- [ ] Notación española `\operatorname{sen}(x)` en texto, `sin(x)` solo en `graph_fn`
- [ ] Ningún `\begin{aligned}` envuelto en `$...$` inline: siempre `$$...$$`, un solo `\\` por salto de línea (bug ya reparado en esta ronda, ver hallazgos)
- [ ] Cada ejercicio lleva `"tags": ["<slug>"]` según la tabla de distribución de su skill (ver sección más abajo), conteo por slug coincide con el target
- [ ] En `options` con fracciones cortas para grilla 2×2, notación de barra (`1/3`) en vez de `\frac`/`\dfrac`
- [ ] Ningún párrafo de `explanation` acumula 2+ fragmentos LaTeX inline sueltos
- [ ] En opciones `CLSF` que ya son una fórmula, sin nombre de familia entre paréntesis al lado
- [ ] Fórmula central del `question` separada del texto cuando es una fracción/expresión compleja (regla crítica 18)

### Hallazgos de auditoría (ronda 1, jul-2026)

**Bug de render crítico, ya reparado en esta ronda** (no es parte del refactor pendiente, ya está resuelto en disco y reseedeado): 58 ejercicios (LEXI 6, CLSF 3, FORM 28, GRAF 21) tenían `\begin{aligned}...\end{aligned}` envuelto en `$...$` inline en vez de `$$...$$` display, más un `\\` duplicado en cada salto de línea. El parser de `MathText` excluye saltos de línea de su regex inline, así que el campo entero se mostraba como texto crudo sin renderizar. Reparado con un script mecánico (validado contra `json.loads`) y reseedeado. Ver regla crítica 17b en `authoring-context.md`.

10 ejercicios corregidos por el usuario en esta ronda (`correciones_analisis_funciones_trigon_13_7.md`), además del bug de arriba:
- `GRAF_47`: fórmula del enunciado (fracción, `T(m) = 8\cos(\pi/6 \cdot (m-1)) + 15`) tejida inline, debía ir separada y centrada (regla crítica 18, 2ª confirmación cross-topic tras `rational`).
- `LEXI_50`: propuesta de regla nueva (ahora regla crítica 20): opciones con fracciones cortas en notación de barra (`1/3`) en vez de `\dfrac`, para grilla 2×2 pareja.
- `GRAF_38`: símbolos ✓/✗ en la `explanation` (ya prohibidos, reaparición) y estructura de párrafo pobre en la segunda mitad, muchas fórmulas inline sin separar (dio origen a la regla crítica 21, umbral de 2+ inline por párrafo).
- `FORM_07`, `LEXI_02`, `GRAF_07`: sin separación de párrafos (`\n\n`) en `explanation`, mismo sesgo sistémico transversal a casi todos los topics auditados.
- `GRAF_32`: símbolos ✓/✗ de nuevo, y confirmación textual del umbral de la regla 21.
- `CLSF_36`: opciones con nombre de familia entre paréntesis redundante junto a la fórmula (dio origen a la regla crítica 22).
- `GRAF_02`: opción correcta notablemente más larga y con justificación entre paréntesis que las demás no tienen (regla 4/15, ya documentada), y una aclaración parentética innecesaria en la pregunta ("incluyendo los extremos").

### Distribución objetivo, con `tags`

Primera auditoría de este topic (no tenía tabla de sub-familias todavía). Diseñada leyendo los 200 ejercicios reales.

**LEXI** (30 ejercicios, recortado proporcionalmente desde 50 en ago-2026 — ver nota abajo):

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Valores notables (sen/cos en ángulos especiales) | 4 | `valores-notables` |
| Amplitud/parámetros, descripción abstracta (ver nota) | 3 | `descripcion-abstracta-otra-familia` |
| Paridad de la función (par/impar) | 2 | `paridad-funcion` |
| Período básico (concepto, sen/cos sin coeficiente) | 2 | `periodo-basico` |
| Transformaciones (desplazamiento, reflexión) | 2 | `transformaciones-trig` |
| Período con coeficiente $B$ | 2 | `periodo-con-b` |
| Reconocimiento de función trigonométrica (qué es/no es) | 1 | `reconocimiento-trigonometrica` |
| Conteo de extremos en un intervalo | 1 | `conteo-extremos-intervalo` |
| Definición de periodicidad | 1 | `definicion-periodicidad` |
| Identificar función desde comportamiento | 1 | `identificar-funcion-comportamiento` |
| Imagen/rango básica | 1 | `imagen-basica` |
| Dominio | 1 | `dominio-trig` |
| Monotonía en un intervalo | 1 | `monotonia-intervalo-lexi` |
| Identidad pitagórica | 1 | `identidad-pitagorica` |
| Raíces de función desplazada | 1 | `raices-desplazada` |
| Definición de tangente | 1 | `tangente-definicion` |
| Ceros de la función | 1 | `ceros-funcion` |
| Contexto cotidiano, reconocimiento | 1 | `contexto-cotidiano-reconocimiento` |
| Imagen/rango con transformación | 1 | `imagen-transformada` |
| Comparación seno/coseno (propiedades) | 1 | `comparacion-sen-cos` |
| Extremos (máx/mín) con transformación | 1 | `extremos-con-transformacion` |
| **Total** | **30** | |

> Nota: al recortar (ago-2026) se detectó que el `tags` real en el JSON de LEXI ya no coincidía con esta tabla desde antes del recorte — 5 ejercicios (ahora 3 tras recortar) llevan el slug `descripcion-abstracta-otra-familia` (nombre de subfamilia de CLSF, no de LEXI) en vez de `amplitud`, que no aparece en ningún ejercicio real de LEXI. Es una etiqueta heredada de una ronda anterior, no corregida en esta pasada (fuera de alcance: solo se tocaron cantidades). La tabla de arriba refleja los `tags` reales post-recorte, no la semántica original de la fila.

**CLSF** (50 ejercicios):

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Es trigonométrica, dada una fórmula | 18 | `es-trigonometrica-desde-formula` |
| NO es trigonométrica (distinguir de otra familia) | 2 | `no-es-trigonometrica` |
| Elegir cuál de 4 opciones ES trigonométrica | 2 | `es-trigonometrica-eleccion` |
| Reconocimiento desde gráfico (rasgos descriptos en prosa) | 11 | `reconocimiento-desde-grafico-clsf` |
| Descripción abstracta → trigonométrica | 3 | `descripcion-abstracta-trigonometrica` |
| Descripción abstracta → otra familia (distractor) | 3 | `descripcion-abstracta-otra-familia` |
| Contexto cotidiano, reconocimiento | 7 | `contexto-cotidiano-clsf` |
| Monotonía en un intervalo | 2 | `monotonia-intervalo-clsf` |
| Conteo de cambios de monotonía | 1 | `conteo-cambios-monotonia` |
| Dominio/restricción de la tangente | 1 | `dominio-tangente` |
| **Total** | **50** | |

**FORM** (30 ejercicios, recortado proporcionalmente desde 50 en ago-2026 — ver nota abajo):

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Evaluación puntual $f(a)$ | 10 | `evaluacion-puntual-form` |
| Lectura directa del gráfico (valor/amplitud/D) | 4 | `lectura-grafico-directa-trig` |
| Imagen/rango | 4 | `imagen-rango-form-trig` |
| Período, cálculo | 4 | `periodo-calculo-form` |
| Amplitud, cálculo | 1 | `amplitud-calculo-form` |
| Dominio | 1 | `dominio-form-trig` |
| Extremos (máx/mín) desde fórmula | 1 | `extremos-desde-formula` |
| Existencia de asíntotas | 1 | `asintotas-existencia-trig` |
| Fórmula desde gráfico | 1 | `formula-desde-grafico-form-trig` |
| Primer extremo con desfase | 1 | `primer-extremo-desfase` |
| Cruce con el eje $X$ | 1 | `cruce-eje-x` |
| Contexto cotidiano aplicado | 1 | `contexto-cotidiano-aplicado-form` |
| **Total** | **30** | |

> Nota: al recortar (ago-2026) se detectó que el `tags` real en el JSON de FORM ya no coincidía con esta tabla desde antes del recorte (drift acumulado de rondas previas): `evaluacion-puntual-form` tenía 18 ejercicios reales (no 8), `imagen-rango-form-trig` 8 (no 6), `lectura-grafico-directa-trig` 7 (no 6), `periodo-calculo-form` 6 (no 7), `amplitud-calculo-form` 2 (no 5), `formula-desde-grafico-form-trig` 2 (no 3); las filas `hallar-parametro-b`, `significado-parametro-b` y `formula-desde-propiedades-trig` no tenían ningún ejercicio real. El recorte proporcional se calculó sobre los `tags` reales, no sobre los números viejos de la tabla, y la tabla de arriba ya refleja esa realidad post-recorte (filas sin ejercicios reales se eliminaron).

**GRAF** (30 ejercicios, recortado proporcionalmente desde 50 en ago-2026 — ver nota abajo):

*Tipo A — leer propiedad directamente del gráfico (21 ejercicios):*

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Conteo de máximos | 2 | `conteo-maximos` |
| Conteo de períodos completos | 2 | `conteo-periodos-completos` |
| Monotonía en un intervalo | 2 | `monotonia-intervalo-graf-trig` |
| Imagen desde el gráfico | 2 | `imagen-desde-grafico-trig` |
| Conteo de ceros | 1 | `conteo-ceros` |
| Período desde el gráfico | 1 | `periodo-desde-grafico` |
| Paridad/simetría desde el gráfico | 1 | `paridad-desde-grafico` |
| Amplitud desde el gráfico | 1 | `amplitud-desde-grafico` |
| Diferencia visual seno/coseno | 1 | `diferencia-visual-sen-cos` |
| Valor máximo/mínimo desde el gráfico | 1 | `valor-max-min-grafico` |
| Dominio desde el gráfico | 1 | `dominio-desde-grafico-trig` |
| Ceros en valores específicos | 1 | `ceros-valores-especificos` |
| Evaluación puntual desde el gráfico | 1 | `evaluacion-puntual-grafico` |
| Primera raíz positiva | 1 | `primera-raiz-positiva` |
| Ubicación de máximos locales | 1 | `ubicacion-maximos-locales` |
| Eje de oscilación ($D$) | 1 | `eje-oscilacion` |
| Ubicación del mínimo | 1 | `ubicacion-minimo` |

*Tipo B — identificar fórmula desde el gráfico (6 ejercicios):* slug único `formula-desde-grafico-trig`.

*Tipo C — contexto cotidiano con gráfico real (3 ejercicios):* slug único `contexto-cotidiano-graf-trig`.

> Nota: al recortar (ago-2026) se detectó drift menor entre esta tabla y los `tags` reales previos al recorte: `dominio-desde-grafico-trig` tenía 2 ejercicios reales (no 1) y `contexto-cotidiano-graf-trig` tenía 5 (no 6); el resto de las filas coincidía. El recorte proporcional se calculó sobre los `tags` reales, no sobre los números viejos de la tabla.

## Hallazgos de auditoría (ronda 6, ago-2026)

Pasada de redacción sobre los enunciados para llevarlos al estándar de las reglas 47-51: 54 enunciados reescritos entre `FORM.json`, `GRAF.json` y `LEXI.json`, con una apertura que sitúa la onda o el ángulo en juego y la pregunta `¿...?` en su tramo final. Los dos enunciados de `LEXI` que quedaban como frase cortada sin ninguna pregunta pasaron a forma interrogativa (regla 51). No hubo cambios de contenido matemático.
