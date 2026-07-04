## Patrón de modernización: tema `logarithmic`

**Rama:** `modernizacion-logarithmic` | **Fecha:** 2026-06-17 | **PR:** pendiente

### Partida
36 ejercicios originales (11 LEXI + 14 CLSF + 11 FORM + 0 GRAF).

### Resultado
200 ejercicios: 50 × LEXI / CLSF / FORM / GRAF.

### Auditoría de los 36 originales (script `audit_logarithmic.py`)
- `feedback_incorrect` vaciado a `""` en todos (36/36).
- Párrafo de contexto agregado a `clsf_01`, `clsf_05`, `clsf_08` (tenían pregunta de gráfico sin descripción previa).
- `graph_view` corregido en 7 ejercicios con gráfico: estándar para `log2(x)` sin desplazamiento → `[-0.5, 8.5, -3, 5]`; ajustes análogos para variantes.

### Convenciones específicas de logarítmicas

**graph_fn en mathjs:**
- base 2: `log2(x)`
- natural: `ln(x)`
- base arbitraria b: `log(x)/log(b)` (mathjs usa `log` como logaritmo natural)
- negado: `-log2(x)`
- desplazado: `log2(x)+1`, `log2(x-1)`, `log2(x+1)`, `log2(x)-1`
- escalado: `2*log2(x)`
- base < 1: `log(x)/log(0.5)`

**graph_view estándar** (dominio visible hasta x≈8.5 para que xRange≈yRange≈8-9):
```
log2(x)              [-0.5, 8.5, -3, 5]
log(x)/log(3)        [-0.5, 8.5, -3, 5]
ln(x)                [-0.5, 8.5, -2, 5]
log(x)/log(4)        [-0.5, 8.5, -2, 4]
-log2(x)             [-0.5, 8.5, -4, 4]
log(x)/log(0.5)      [-0.5, 8.5, -4, 4]
log2(x)+1            [-0.5, 8.5, -2, 6]
log2(x)-1            [-0.5, 8.5, -4, 4]
log2(x)+2            [-0.5, 8.5, -1, 7]
log2(x-1)            [0.5, 9.5, -3, 4]
log2(x+1)            [-1.5, 7.5, -3, 4]
ln(x-1)              [0.5, 9.5, -2, 4]
2*log2(x)            [-0.5, 8.5, -4, 6]
log2(x-1)+1          [0.5, 9.5, -2, 5]
```

**Contextos cotidianos** (sin pH, Richter ni decibeles):
- Inversión: "¿cuántos años para llegar a $M$?" → tiempo = logaritmo del factor de crecimiento.
- Bacterias: "¿cuántas horas para multiplicarse por N?" → logaritmo del factor.
- Deuda: "¿cuántos meses para que la deuda se duplique/triplique?" → ídem.
- Depreciación inversa: "¿cuántos años para que el auto valga la mitad?" → logaritmo del factor de depreciación.

**Puntos clave de $\log_b(x)$:**
- Siempre pasa por $(1, 0)$.
- Pasa por $(b, 1)$ — clave para identificar la base.
- Asíntota vertical en $x = 0$ (o en $x = c$ si hay desplazamiento horizontal).
- Imagen = $\mathbb{R}$ siempre.
- Dominio = $(0, +\infty)$ para la básica, $(c, +\infty)$ con desplazamiento horizontal $-c$.

**sync-catalog obligatorio** porque GRAF es skill nueva para `logarithmic`:
`bun run scripts/sync-catalog.ts` desde `web/`.

---

