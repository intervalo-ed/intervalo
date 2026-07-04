## Patrón de modernización: tema `polynomial` (LEXI / CLSF / FORM / GRAF)

### Eje conceptual

Un polinomio de grado ≥ 3 aparece cuando hay **múltiples fases** — la función sube, baja y puede volver a subir:

| Señal en enunciado o gráfico | Tipo |
|------------------------------|------|
| "sube, baja, vuelve a subir" / múltiples picos | polinómica grado ≥ 3 |
| Forma **S** (un pico, un valle, extremos opuestos) | grado 3 |
| Forma **W / M** (dos valles / dos picos, extremos iguales) | grado 4 |
| "tasa fija, proporcional" | lineal |
| "un máximo / mínimo, curvatura única" | cuadrática |
| "porcentaje / multiplicativo" | exponencial |

**Señales gráficas:**
- Extremos en **misma dirección** → grado **par** (+ coef positivo: ambos arriba; negativo: ambos abajo).
- Extremos en **dirección opuesta** → grado **impar**.
- Raíz **simple** = cruza eje x; raíz **doble** = toca sin cruzar; raíz **triple** = cruza con inflexión.
- Máximo $n−1$ extremos locales para grado $n$.

### Biblioteca de contextos validados

Montaña rusa (perfil de altura), temperatura mensual o anual, caudal de río (estacionalidad), perfil de elevación de ruta serrana, ventas con múltiples temporadas. Sin nombres propios. Montos con `\\$`. Evitar: volumen de caja (cortes de esquinas), resistencia de materiales.

### Regla de convivencia Cuadrática / Polinómica

En CLSF: **nunca colocar "Cuadrática" y "Polinómica" en la misma grilla de 4 opciones.** Distractores para polinómica: Lineal, Exponencial, Logarítmica, Racional.

### Identidades notables en FORM

Incluidas en FORM polynomial (y algunos FORM quadratic):

| Identidad | Forma |
|-----------|-------|
| BCP | $(a\pm b)^2 = a^2 \pm 2ab + b^2$ |
| Diferencia de cuadrados | $(a+b)(a-b) = a^2-b^2$ |
| Cubo del binomio | $(a\pm b)^3 = a^3 \pm 3a^2b + 3ab^2 \pm b^3$ |
| Suma de cubos | $a^3+b^3 = (a+b)(a^2-ab+b^2)$ |
| Diferencia de cubos | $a^3-b^3 = (a-b)(a^2+ab+b^2)$ |

### Cobertura por skill (polynomial, 200 ejercicios)

**LEXI (50):** grado, coef. principal y su signo, término independiente = f(0), forma estándar vs factorizada, raíces/ceros (cantidad ≤ grado), multiplicidad (simple/doble/triple), dominio = ℝ, imagen (ℝ si impar; acotada si par), comportamiento en ±∞, extremos locales (máx n−1), paridad (polinomio par/impar), monotonía de x³, punto de inflexión, raíces complejas conjugadas, Teorema Fundamental. Identidades notables: BCP, diferencia cuadrados, cubo del binomio, suma/diferencia de cubos.

**CLSF (50):** desde fórmula (vs racional/radical/exponencial/logarítmica), desde gráfico (S=cúbica, W/M=cuártica, cambios de dirección), cotidiano (montaña rusa, temperatura, caudal), comportamiento en infinito (paridad y signo), imagen (acotada/ℝ), extremos locales e imagen según paridad, monotonía, distinguir racional (asíntota) de polinómica (no tiene). Grillas con `graph_fn` para 3 ejercicios.

**FORM (50):** coeficientes desde forma estándar, f(0) = término independiente, evaluar f(valor), grado del producto/suma, forma factorizada ↔ raíces (incluye raíz doble/triple), coeficiente principal en factorizada, gráfico → fórmula (5 ejercicios con `graph_fn`). Identidades notables: BCP (×8), diferencia de cuadrados (×2), cubo del binomio (×6), suma/diferencia de cubos (×4).

**GRAF (50):** *Tipo A (25)*: leer propiedades desde gráfico — raíces, grado (por forma S/W/M y extremos locales), signo coef. principal (por dirección de extremos), f(0) = intersección eje y, multiplicidad de raíz (cruza vs toca), imagen (acotada o ℝ), mínimo/máximo global (solo en par), extremos locales, monotonía, dominio. *Tipo B (15)*: identificar la fórmula entre 4 opciones dado el gráfico. *Tipo C (10)*: contexto cotidiano + gráfico (montaña rusa, temperatura, caudal, ruta serrana, ventas).

### `graph_fn` para GRAF polynomial

Sintaxis mathjs; escalar para que raíces y extremos sean visibles en la ventana cuadrada:

```
Cúbicas:
  x*(x-2)*(x+2)/4           # raíces -2,0,2  coef+
  -x*(x-2)*(x+2)/4          # raíces -2,0,2  coef-
  pow(x,3)/8                 # raíz triple en 0, globalmente creciente
  -pow(x,3)/8                # raíz triple en 0, globalmente decreciente
  pow(x,2)*(x-3)/5           # raíz doble en 0, simple en 3

Cuárticas:
  (pow(x,2)-1)*(pow(x,2)-4)/4    # raíces ±1,±2  coef+  (W)
  -(pow(x,2)-1)*(pow(x,2)-4)/4   # raíces ±1,±2  coef-  (M)
  (pow(x,2)-1)*(pow(x,2)-9)/8    # raíces ±1,±3  coef+
  pow(x+2,2)*pow(x-2,2)/16       # raíces dobles en ±2
```

---

