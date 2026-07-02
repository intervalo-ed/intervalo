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
