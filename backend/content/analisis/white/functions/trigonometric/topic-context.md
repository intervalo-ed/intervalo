## Patrón de modernización: tema `trigonometric`

Llevado de 47 → 200 ejercicios (50 × LEXI / CLSF / FORM / GRAF).

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

