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
5. **`explanation` bajo 250 caracteres, el defecto dominante del tema**: LEXI 46/50, CLSF 36/50, FORM 48/50, **GRAF 49/50 (prácticamente todo el archivo)**. El patrón es 1-2 oraciones de concepto sin aplicación desglosada ni cierre. Hay que sumar el paso de aplicación al caso concreto y/o un cierre de advertencia/consejo.
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
- [ ] `explanation` supera los 250 caracteres entre las 3 partes (foco urgente: prácticamente todo el tema)
- [ ] `correct_index` variado, no concentrado en índice 0 (objetivo ~12-13 por índice; es el rebalanceo más grande de la unidad)
- [ ] Montos con `\$` escapado

