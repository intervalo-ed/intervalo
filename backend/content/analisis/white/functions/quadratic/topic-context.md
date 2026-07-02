## Patrón GRAF: tema `quadratic`

50 GRAF cotidianos (`white_quadratic_graf_01..50`) que modelan fenómenos con un **punto óptimo**.
Cuatro focos del tema: **vértice, eje de simetría, raíces, concavidad**.

### Regla de gráfico (análogo de `|m|≤3` de lo lineal)
Las parábolas crecen rápido y con render 1:1 se van de la vista; si las raíces quedan fuera del
encuadre, la curva "flota" y no se interpreta (le pasó al ejercicio del corral, ya corregido).

- **Coeficiente líder chico**: `|a| ≤ 0.5` (típico `±0.25`, `±0.5`). Parábola suave.
- **Forma vértice al autorar**: `a*pow(x-h,2) + k`, para ubicar vértice y raíces a propósito.
- **`graph_view` cuadrado con el arco completo dentro**. Abajo (máximo): vértice arriba-centro y las
  dos raíces sobre el eje. Arriba (mínimo): el valle entero, vértice abajo-centro. Vista `[-1,11,-1,11]`
  o `[-1,13,-1,13]` si el span llega a 12.
- Vértice, raíces y el valor leído en coordenadas legibles (enteros o medios).

### Modelado
- **Máximo (cóncava abajo, `a<0`):**
  - *Tiro/proyectil* (en el tiempo): pelota, globo de agua, fuegos artificiales, clavadista, golf, salto.
  - *Arco/chorro* (en el espacio, $x$ = distancia): tiro libre, manguera, salto de moto, delfín.
  - *Optimización-máximo*: precio→ganancia, velocidad→rendimiento, mesas→ganancia, recaudación.
- **Mínimo (cóncava arriba, `a>0`):** cable/guirnalda colgando (punto más bajo), rampa en U de skate,
  temperatura de la madrugada (hora más fría), nivel de un río en sequía, costo medio, velocidad en una
  curva. El valle queda por encima del eje → estos **no** usan raíces/duración.

### Arquetipos de pregunta
Vértice-y (valor máx/mín) · vértice-x (cuándo/dónde el óptimo) · concavidad (máx o mín → signo de `a`) ·
raíz (toca el suelo, solo abajo) · duración/dos raíces (solo abajo) · eje de simetría (misma altura dos
veces) · lectura $f(v)$ · sube vs baja (crece antes del vértice, decrece después) · ordenada al origen
`c` (valor de partida, $f(0)$).

**Los mínimos (cóncava arriba) NO usan raíces ni duración**: el valle queda por encima del eje → la
parábola nunca toca el cero. Los arquetipos válidos para arriba son: vértice-y, vértice-x, concavidad,
lectura f(v), eje de simetría, sube vs baja.

### Estado actual `white_quadratic_graf_*` (junio 2026)

50 GRAF completos (`graf_01..50`). Distribución:

| Familia | Concavidad | Cant. |
|---------|-----------|:-----:|
| Tiro / proyectil (en el tiempo) | abajo | 22 |
| Arco / chorro (en el espacio) | abajo | 9 |
| Optimización — máximo | abajo | 9 |
| Mínimos (cable, temperatura, rampa, río, costo…) | **arriba** | **10** |

Los 9 arquetipos están cubiertos al menos una vez. Los tres que faltaban al arrancar (duración/dos
raíces, sube-vs-baja, valor de partida `c`) se incorporaron en `graf_11..50`.

**Lección del corral (graf_08 original):** la función `-1*pow(x-2,2)+4` con `a=-1` dejaba las raíces al
borde de la vista y la curva parecía flotar sin contexto. Se reemplazó por limonada con `a=-0.5` y vista
`[-1,11,-1,11]`. Regla de oro: verificar numéricamente que las dos raíces (para abajo) caen dentro del
`graph_view` antes de cerrar el ejercicio.

---

## Patrón de modernización: tema `quadratic` (LEXI / CLSF / FORM)

Completado en junio 2026. Los cuatro skills quedan en **50 ejercicios cada uno** (`white_quadratic.json`, 200 total).

### Eje conceptual

Una cuadrática aparece cuando hay un **punto óptimo** (máximo o mínimo):

| Señal en el enunciado | Familia |
|-----------------------|---------|
| "área" / "producto de dos longitudes" / "lado²" | cuadrática |
| "sube y después baja" / "máximo / mínimo" | cuadrática |
| "tiro / caída libre / gravedad" | cuadrática |
| "precio × cantidad vendida" con demanda decreciente | cuadrática |
| "tasa fija / por unidad / proporcional" | lineal |
| "porcentaje / se multiplica / bacterias / interés compuesto" | exponencial |
| "escala logarítmica / pH / Richter / rendimiento decreciente" | logarítmica |

El distractor más común: **lineal vs cuadrática** (tasa constante vs. producto de dos magnitudes lineales).

### Biblioteca de contextos (variar números, no repetir personajes)

Tiro/proyectil (pelota, globo de agua, clavadista), arco/chorro (manguera, tiro libre), optimización (precio→ganancia de entradas/librería/limonada), área (terreno, cantero, corral con perímetro fijo, pizza), caída libre, cable colgante, temperatura mínima nocturna. Montos con `\\$` en JSON. Sin nombres propios.

### Cobertura por skill (lo que cubrió cada uno)

**LEXI (50):** léxico abstracto y light: parábola, vértice, eje de simetría, raíces/ceros, ordenada al origen, concavidad, coeficiente principal, forma estándar/vértice/factorizada, imagen/dominio, máximo vs mínimo, raíz simple vs doble. Distractores: vértice↔raíz, eje de simetría↔eje y, dominio↔imagen.

**CLSF (50):** clasificar desde situación (cuadrática/lineal/exp/log), desde gráfico (parábola vs recta), monotonía por intervalos, concavidad desde el fenómeno (¿tiene máximo o mínimo?), imagen acotada por el vértice. Pregunta siempre auto-contenida con `\n\n` entre contexto y pregunta.

**FORM (50):**
- Leer a, b, c desde forma estándar (×6); eje de simetría -b/2a; f(0) = c.
- Forma vértice ↔ coordenadas en ambos sentidos; evaluar f(valor); encontrar raíces desde forma canónica.
- Forma factorizada ↔ raíces: leer raíces, escribir factorizada dadas las raíces, raíz doble.
- Armar fórmula desde cotidiano: área cuadrado, corral con perímetro fijo, tiro (h₀+v₀t−½gt²), ganancia = precio×cantidad, caída libre, chorro, optimización.
- Gráfico → fórmula (5 ejercicios con `graph_fn`/`graph_view`): vértice + signo de a + apertura.
- Evaluar y resolver: f(valor), ¿cuándo f(t)=0?, raíces desde forma estándar factorable, ecuación cuadrática desde contexto.

### Distractores frecuentes en FORM

- Signo de h en la forma vértice: raíz +3 → factor (x−3), no (x+3).
- c ≠ raíz: c es f(0), no donde la función se anula.
- b sin signo: −6 no es lo mismo que 6 en -b/2a.
- a>0 / a<0 invertido al leer apertura del gráfico.

---

