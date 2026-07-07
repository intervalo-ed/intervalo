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

## Estado (auditoría jul-2026), lo que falta para alinear con `authoring-context.md`

Este documento describía el contenido conceptual pero no había pasado por la auditoría de formato/gamificación que sí tienen `linear` y `quadratic`. Verificado programáticamente sobre los 4 JSON:

1. **`feedback_incorrect` falta o es un duplicado ilegítimo del `feedback_correct`** en los 200 ítems:
   - Vacío (`""`): LEXI 39, CLSF 36, FORM 40, GRAF 50.
   - `string` no vacío pero **duplicado/parafraseo de `feedback_correct`** (legacy, mismo bug que en `quadratic`; en algunos casos incluso revela la respuesta correcta explícitamente, ej. "La correcta es $f(x)=x^3-2x+5$"): LEXI 11, CLSF 14, FORM 10, GRAF 0.
   - Ningún ítem tiene hoy el `array<string|null>` correcto. Completar/reescribir los 200 desde cero como `array` paralelo a `options`, `null` en el índice correcto, voz descriptiva nunca acusatoria (`authoring-context.md` §Pistas).
2. **`\n\n` pegado a bloques `$$...$$`**: LEXI 13, CLSF 2, FORM 38 (la mayoría del archivo), GRAF 26. Mismo patrón que `quadratic`: pasos de álgebra intermedios en `explanation` abren cada fórmula con `\n\n$$...$$\n\n` en vez de un solo `\n`.
3. **Em-dash `—`/en-dash `–`**: LEXI 7, CLSF 3, FORM 3, GRAF 0.
4. **Explicaciones con viñetas `•`/sub-ítems `-`**: LEXI 13, CLSF 24, FORM 13, GRAF 18. Reescribir a los 3 párrafos de prosa (concepto → aplicación → cierre) de `authoring-context.md` §Estructura de la explicación.
5. **`explanation` bajo 250 caracteres**: FORM 18, GRAF 11 (LEXI y CLSF ya cumplen). Engordar el párrafo de concepto general, no rellenar con relleno.
6. **Cierres con humor/antropomorfismo**: no se detectaron casos claros en los 4 JSON (a diferencia de `quadratic`). Igual revisar al tocar cada ítem: el cierre por defecto es advertencia/consejo neutro.
7. **`correct_index` sesgado**: LEXI {0:5,1:16,2:24,3:5}, CLSF {0:7,1:21,2:15,3:7}, FORM {0:11,1:24,2:11,3:4}, GRAF {0:18,1:23,2:8,3:1}. GRAF es el más urgente (casi nada en índice 3). Rebalancear a ~{0:12,1:13,2:12,3:13} reordenando `options` (mismo contenido, nueva posición) y sincronizando `feedback_incorrect`.
8. **Convivencia Cuadrática/Polinómica**: verificado, sin violaciones en los 50 de CLSF. Mantener la regla al reescribir/reordenar opciones.

### Confusiones fuente para `feedback_incorrect`, por skill

**LEXI:** grado confundido con cantidad de raíces reales (el grado es el máximo posible, no lo que efectivamente aparece si hay complejas o multiplicidad); coeficiente principal ($a_n$) ↔ término independiente ($a_0$); forma estándar ↔ factorizada al identificar cuál se muestra; raíz simple/doble/triple (toca vs. cruza vs. cruza con inflexión); dominio (siempre $\mathbb{R}$) ↔ imagen (depende de la paridad); extremos opuestos (grado impar) ↔ misma dirección (grado par) invertidos; contar mal el máximo de extremos locales ($n-1$); confundir paridad del polinomio con paridad del grado; creer que $x^3$ tiene un extremo local (es monótona creciente sin extremos); confundir punto de inflexión con extremo local; olvidar que las raíces complejas vienen en pares conjugados; error de signo o término cruzado faltante en las identidades notables (BCP, diferencia de cuadrados, cubo del binomio, suma/diferencia de cubos).

**CLSF:** forma S (grado 3, un pico y un valle) ↔ W/M (grado 4, dos valles o dos picos) contadas mal; extremos en misma dirección (par) ↔ dirección opuesta (impar) invertidos; confundir con racional (que sí tiene asíntotas, la polinómica no); confundir con exponencial/logarítmica por "crece rápido"; un contexto con múltiples fases (sube-baja-sube) leído como cuadrático (que solo tiene un extremo); imagen acotada (grado par) ↔ $\mathbb{R}$ (grado impar).

**FORM:** coeficiente principal ($a_n$) ↔ término independiente ($a_0$) al leer forma estándar; $f(0)$ confundido con otro término; grado del producto (se suman los grados) ↔ grado de la suma (queda el mayor de los grados) invertidos; signo de la raíz al pasar de factorizada a raíces ($r=3 \to (x-3)$, no $(x+3)$); multiplicidad mal contada (doble/triple); olvidar el coeficiente principal al expandir la forma factorizada; signo del coeficiente principal invertido al leer la dirección de los extremos en un gráfico; término cruzado faltante o con signo invertido en las identidades notables.

**GRAF:** raíz simple (cruza) ↔ doble (toca sin cruzar) ↔ triple (cruza con inflexión); forma S ↔ W/M contadas mal (cantidad de extremos); signo del coeficiente principal invertido según la dirección de los extremos; $f(0)$ (ordenada al origen) ↔ raíz; imagen acotada (par) ↔ $\mathbb{R}$ (impar); buscar mínimo/máximo global en un polinomio de grado impar (no existe, diverge en ambas direcciones); extremo local confundido con extremo global; monotonía por tramos leída al revés.

### Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal:**
- [ ] `feedback_incorrect` completo en los 50 ítems por skill: `array` del largo de `options`, `null` en el correcto (incluye reescribir los `string` legacy que duplican `feedback_correct`)
- [ ] Ningún `\n\n` pegado a un bloque `$$...$$`
- [ ] Ningún em-dash `—` ni en-dash `–`
- [ ] Ninguna explicación con viñetas `•` ni sub-ítems `-`
- [ ] Cierres de `explanation` en advertencia/consejo, sin humor ni antropomorfismo
- [ ] `explanation` supera los 250 caracteres entre las 3 partes
- [ ] `correct_index` variado, no concentrado en un solo índice (objetivo ~12-13 por índice)
- [ ] Montos con `\$` escapado
- [ ] "Cuadrática" y "Polinómica" nunca en la misma grilla de opciones (CLSF)

