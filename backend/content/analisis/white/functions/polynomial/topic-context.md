## Patrón de modernización: tema `polynomial` (LEXI / FORM / GRAF)

> **CLSF archivado (jul-2026):** se sacó de este topic al podar a un máximo de 3 ítems (skills) por topic. Contenido preservado en `backend/content/archive/analisis/white/functions/polynomial/CLSF.json`. No generar CLSF para este topic en rondas futuras; el resto de este documento sigue mencionando CLSF en registros de auditoría históricos (rutas `polynomial_CLSF_NN`, distribuciones, hallazgos), que quedan como referencia, no como guía de generación.

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

### Distribución objetivo, con `tags` (ver `authoring-context.md` §Etiquetas)

Taxonomía diseñada leyendo los 200 ejercicios reales (jul-2026, mismo proceso que `linear`/`quadratic`). El slug es el valor exacto que va en `"tags": ["<slug>"]` de cada ejercicio.

**LEXI (50):**

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Identidades notables (BCP, dif. cuadrados, cubo binomio, suma/dif. cubos) | 7 | `identidades-notables` |
| Multiplicidad de raíz (simple/doble/triple, toca vs. cruza) | 5 | `multiplicidad-raiz` |
| Comportamiento en extremos según grado/signo | 4 | `comportamiento-extremos-infinito` |
| Identificar si una expresión es/no es polinomio (o monomio) | 3 | `identificar-polinomio` |
| Grado de un polinomio dado (incl. caso grado 0) | 3 | `grado-identificacion` |
| Nombre/lectura de coeficiente principal y término independiente | 3 | `coeficiente-termino-nombre` |
| Cantidad máxima de raíces reales | 3 | `raices-cantidad-maxima` |
| Cantidad máxima de extremos locales | 3 | `extremos-locales-maximo` |
| Imagen según grado/paridad | 3 | `imagen-polinomio` |
| Forma estándar vs. factorizada (para qué sirve, cómo se llama) | 3 | `forma-estandar-factorizada` |
| Concepto de extremo local (qué significa un máx/mín local) | 2 | `extremo-local-concepto` |
| Paridad de la función (par/impar, no confundir con paridad del grado) | 2 | `paridad-funcion` |
| Grado de un producto/suma de polinomios | 2 | `grado-operaciones` |
| Raíces complejas conjugadas | 2 | `raices-complejas-conjugadas` |
| Dominio de un polinomio | 2 | `dominio-polinomio` |
| Punto de inflexión | 1 | `punto-inflexion` |
| Concepto de extremo global (mínimo/máximo global) | 1 | `extremo-global-concepto` |
| Contar términos de un polinomio dado | 1 | `contar-terminos` |
| **Total** | **50** | |

**CLSF (50):**

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Clasificar familia desde fórmula explícita | 8 | `clasificacion-desde-formula` |
| Identificar si una expresión es/no es polinomio | 6 | `identificar-polinomio` |
| Clasificar familia/grado desde un modelo cotidiano en prosa (montaña rusa, temperatura, caudal, ruta) | 7 | `clasificacion-desde-contexto` |
| Imagen según grado/paridad/coeficiente | 5 | `imagen-polinomio` |
| Clasificar familia desde gráfico (`graph_fn` o descripción de forma) | 4 | `clasificacion-desde-grafico` |
| Leer raíces/coeficiente/extremos desde un `graph_fn` (sin clasificar familia) | 3 | `propiedades-desde-grafico` |
| Grado y signo del coeficiente principal desde gráfico descrito | 3 | `grado-signo-desde-grafico` |
| Monotonía global (creciente/decreciente en todo ℝ) | 3 | `monotonia-global` |
| Monotonía por intervalo (dado extremos locales) | 2 | `monotonia-intervalo` |
| Comportamiento en extremos según grado/signo (abstracto, sin contexto) | 2 | `comportamiento-extremos-infinito` |
| Dominio de un polinomio | 1 | `dominio-polinomio` |
| Cantidad máxima de raíces reales | 1 | `raices-cantidad-maxima` |
| Cantidad máxima de extremos locales | 1 | `extremos-locales-maximo` |
| Distinguir racional de polinómica (conceptual) | 1 | `distincion-racional-polinomica` |
| Paridad de la función | 1 | `paridad-funcion` |
| Raíces y grado desde forma factorizada explícita | 1 | `raices-grado-desde-formula` |
| Multiplicidad de raíz | 1 | `multiplicidad-raiz` |
| **Total** | **50** | |

**FORM (50):**

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Evaluar $p(\text{valor})$ | 9 | `evaluar-f` |
| Identificar fórmula desde gráfico (`graph_fn`) | 7 | `grafico-a-formula` |
| Expandir cubo de binomio $(a\pm b)^3$ | 6 | `expandir-cubo-binomio` |
| Leer coeficientes desde forma estándar o factorizada | 4 | `leer-coeficientes` |
| Expandir binomio cuadrado perfecto $(a\pm b)^2$ | 4 | `expandir-bcp` |
| Factorizar suma/diferencia de cubos | 4 | `factorizar-suma-diferencia-cubos` |
| Grado de un polinomio dado | 3 | `grado-desde-formula` |
| Raíces desde forma factorizada (incl. multiplicidad) | 3 | `raices-desde-formula` |
| Grado de un producto/suma de polinomios | 2 | `grado-operaciones` |
| Armar forma factorizada dadas las raíces | 2 | `armar-forma-factorizada` |
| Factorizar diferencia de cuadrados | 2 | `factorizar-diferencia-cuadrados` |
| Factorizar trinomio a binomio cuadrado perfecto | 2 | `factorizar-bcp` |
| Contar términos de un polinomio dado | 1 | `contar-terminos` |
| Expandir producto de tres factores (binomio al cuadrado por lineal) | 1 | `expandir-producto-tres-factores` |
| **Total** | **50** | |

**GRAF (50):** conserva los tipos A/B/C ya documentados arriba, con slug por sub-familia dentro de cada tipo.

*Tipo A — leer propiedades desde `graph_fn` (25):*

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Extremos locales (cantidad) | 4 | `lectura-extremos-locales` |
| Raíces (cantidad) | 3 | `lectura-raices` |
| Grado (par/impar, mínimo posible) | 3 | `lectura-grado` |
| Comportamiento en extremos ($x \to \pm\infty$) | 3 | `lectura-comportamiento-extremos` |
| Ordenada al origen, $f(0)$ | 2 | `lectura-ordenada-origen` |
| Multiplicidad de raíz (toca vs. cruza) | 2 | `lectura-multiplicidad-raiz` |
| Imagen (acotada o ℝ) | 2 | `lectura-imagen` |
| Extremo global (mínimo/máximo global) | 2 | `lectura-extremo-global` |
| Signo del coeficiente principal | 1 | `lectura-signo-coeficiente` |
| Monotonía global | 1 | `lectura-monotonia-global` |
| Signo de la función en un intervalo | 1 | `lectura-signo-intervalo` |
| Dominio | 1 | `lectura-dominio` |
| **Subtotal Tipo A** | **25** | |

*Tipo B — identificar fórmula dado el gráfico (15):* todos bajo `grafico-a-formula` (mismo slug que en FORM, es la misma habilidad aplicada en GRAF).

*Tipo C — contexto cotidiano + gráfico (10):*

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Extremos locales del modelo (picos/valles) | 4 | `contexto-extremos` |
| Raíces del modelo (veces que vuelve a cero) | 2 | `contexto-raices` |
| Signo del coeficiente principal en contexto | 1 | `contexto-signo-coeficiente` |
| Extremo global en contexto | 1 | `contexto-extremo-global` |
| Monotonía en contexto | 1 | `contexto-monotonia` |
| Comportamiento en extremos en contexto | 1 | `contexto-comportamiento-extremos` |
| **Subtotal Tipo C** | **10** | |

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

1. **`feedback_incorrect` falta o es un duplicado ilegítimo del `feedback_correct`** en los 200 ejercicios:
   - Vacío (`""`): LEXI 39, CLSF 36, FORM 40, GRAF 50.
   - `string` no vacío pero **duplicado/parafraseo de `feedback_correct`** (legacy, mismo bug que en `quadratic`; en algunos casos incluso revela la respuesta correcta explícitamente, ej. "La correcta es $f(x)=x^3-2x+5$"): LEXI 11, CLSF 14, FORM 10, GRAF 0.
   - Ningún ejercicio tiene hoy el `array<string|null>` correcto. Completar/reescribir los 200 desde cero como `array` paralelo a `options`, `null` en el índice correcto, voz descriptiva nunca acusatoria (`authoring-context.md` §Pistas).
2. **`\n\n` pegado a bloques `$$...$$`**: LEXI 13, CLSF 2, FORM 38 (la mayoría del archivo), GRAF 26. Mismo patrón que `quadratic`: pasos de álgebra intermedios en `explanation` abren cada fórmula con `\n\n$$...$$\n\n` en vez de un solo `\n`.
3. **Em-dash `—`/en-dash `–`**: LEXI 7, CLSF 3, FORM 3, GRAF 0.
4. **Explicaciones con viñetas `•`/sub-ejercicios `-`**: LEXI 13, CLSF 24, FORM 13, GRAF 18. Reescribir a los 3 párrafos de prosa (concepto → aplicación → cierre) de `authoring-context.md` §Estructura de la explicación.
5. **`explanation` bajo 300 caracteres** (mínimo vigente en `authoring-context.md`, no 250 como decía una versión anterior de esta nota): FORM 18, GRAF 11 (LEXI y CLSF ya cumplían el umbral viejo, verificar de nuevo contra 300). Engordar el párrafo de concepto general, no rellenar con relleno.
6. **Cierres con humor/antropomorfismo**: no se detectaron casos claros en los 4 JSON (a diferencia de `quadratic`). Igual revisar al tocar cada ejercicio: el cierre por defecto es advertencia/consejo neutro.
7. **`correct_index` sesgado**: LEXI {0:5,1:16,2:24,3:5}, CLSF {0:7,1:21,2:15,3:7}, FORM {0:11,1:24,2:11,3:4}, GRAF {0:18,1:23,2:8,3:1}. GRAF es el más urgente (casi nada en índice 3). Rebalancear a ~{0:12,1:13,2:12,3:13} reordenando `options` (mismo contenido, nueva posición) y sincronizando `feedback_incorrect`.
8. **Convivencia Cuadrática/Polinómica**: verificado, sin violaciones en los 50 de CLSF. Mantener la regla al reescribir/reordenar opciones.

### Confusiones fuente para `feedback_incorrect`, por skill

**LEXI:** grado confundido con cantidad de raíces reales (el grado es el máximo posible, no lo que efectivamente aparece si hay complejas o multiplicidad); coeficiente principal ($a_n$) ↔ término independiente ($a_0$); forma estándar ↔ factorizada al identificar cuál se muestra; raíz simple/doble/triple (toca vs. cruza vs. cruza con inflexión); dominio (siempre $\mathbb{R}$) ↔ imagen (depende de la paridad); extremos opuestos (grado impar) ↔ misma dirección (grado par) invertidos; contar mal el máximo de extremos locales ($n-1$); confundir paridad del polinomio con paridad del grado; creer que $x^3$ tiene un extremo local (es monótona creciente sin extremos); confundir punto de inflexión con extremo local; olvidar que las raíces complejas vienen en pares conjugados; error de signo o término cruzado faltante en las identidades notables (BCP, diferencia de cuadrados, cubo del binomio, suma/diferencia de cubos).

**CLSF:** forma S (grado 3, un pico y un valle) ↔ W/M (grado 4, dos valles o dos picos) contadas mal; extremos en misma dirección (par) ↔ dirección opuesta (impar) invertidos; confundir con racional (que sí tiene asíntotas, la polinómica no); confundir con exponencial/logarítmica por "crece rápido"; un contexto con múltiples fases (sube-baja-sube) leído como cuadrático (que solo tiene un extremo); imagen acotada (grado par) ↔ $\mathbb{R}$ (grado impar).

**FORM:** coeficiente principal ($a_n$) ↔ término independiente ($a_0$) al leer forma estándar; $f(0)$ confundido con otro término; grado del producto (se suman los grados) ↔ grado de la suma (queda el mayor de los grados) invertidos; signo de la raíz al pasar de factorizada a raíces ($r=3 \to (x-3)$, no $(x+3)$); multiplicidad mal contada (doble/triple); olvidar el coeficiente principal al expandir la forma factorizada; signo del coeficiente principal invertido al leer la dirección de los extremos en un gráfico; término cruzado faltante o con signo invertido en las identidades notables.

**GRAF:** raíz simple (cruza) ↔ doble (toca sin cruzar) ↔ triple (cruza con inflexión); forma S ↔ W/M contadas mal (cantidad de extremos); signo del coeficiente principal invertido según la dirección de los extremos; $f(0)$ (ordenada al origen) ↔ raíz; imagen acotada (par) ↔ $\mathbb{R}$ (impar); buscar mínimo/máximo global en un polinomio de grado impar (no existe, diverge en ambas direcciones); extremo local confundido con extremo global; monotonía por tramos leída al revés.

### Hallazgos de auditoría (ronda 1, jul-2026)

Auditoría en vivo vía `/test`, muestra al azar de 11 ejercicios (no exhaustiva, ver expectativa de alcance en `generation-prompt.md`). Los patrones que aparecieron acá son evidencia de que **hay que revisar los 200 ejercicios** contra las mismas reglas, no solo los 11 citados:

- `white_polynomial_LEXI_11`: párrafos de `explanation` demasiado largos; la opción correcta `$\mathbb{R}$ (todos los reales)` lleva una glosa aclaratoria que las demás no tienen, se delata; mezcla de registro (opciones en LaTeX + una opción en prosa libre).
- `white_polynomial_FORM_25`: párrafos largos; fórmula display con 2 igualdades encadenadas (`(2x+1)^2 = (2x)^2 + ... = 4x^2+4x+1`) debió partirse en 3 líneas verticales (`A`, `=B`, `=C`).
- `white_polynomial_FORM_02`: derivación de raíces metida inline dentro de la prosa (mucho LaTeX inline), debió mostrarse en bloque `aligned` vertical con oraciones cortas entre pasos.
- `white_polynomial_CLSF_15`: primera aparición de la fórmula de la función en `explanation` quedó tejida inline en la primera oración; debió mostrarse en bloque display propio.
- `white_polynomial_GRAF_09`: la `explanation` usó una derivada ($f'(x)$) para justificar monotonía, concepto fuera de la frontera matemática de `white` (no hay derivadas todavía); además el bloque `aligned` con la derivada quedó tan largo que se cortó a la mitad en pantalla.
- `white_polynomial_GRAF_04`: fórmula display centrada con una cadena de igualdades larga ($f(0) = \frac{(0^2-1)(0^2-4)}{4} = \frac{(-1)(-4)}{4} = \frac{4}{4} = 1$), debió mostrarse en desarrollo vertical (`f(0)`, `=B`, `=C`, `=D`, `=E`).
- `white_polynomial_CLSF_41`: primera aparición de la fórmula de la función en `explanation` tejida inline en el primer párrafo, debió ir en bloque display.
- `white_polynomial_CLSF_03`: la opción correcta lleva la aclaración `(grado 4)` entre paréntesis que ninguna otra opción tiene, se delata la respuesta; patrón detectado repetidas veces: las aclaraciones entre paréntesis en este topic tienden a ponerse solo en la opción correcta.
- `white_polynomial_FORM_27`: `explanation` con mucho LaTeX inline en la verificación del resultado; los pasos de más de una igualdad deben ir en bloque `aligned` vertical (una sola igualdad corta puede quedar en la misma línea, ver `authoring-context.md` §Fórmulas anchas).
- `white_polynomial_GRAF_25`: la primera oración del `question` no cierra en punto antes de mostrar la fórmula de la función; debió cerrar la oración y mostrar la fórmula en bloque display aparte.
- `white_polynomial_FORM_49`: `feedback_correct` (que debe ser 1 oración corta) cargó una fórmula LaTeX tan larga (derivación completa del producto de tres factores) que se salió de la pantalla; el desarrollo paso a paso pertenece a `explanation`, no a `feedback_correct`.

### Correcciones de formato transversales de esta ronda, checklist explícito

Patrones concretos a aplicar en los 200 ejercicios al refactorizar, más allá de los ya listados en "Estado (auditoría jul-2026)":

1. **Preferencia por fórmula centrada sobre LaTeX inline en `explanation`** cuando la fórmula es la función del ejercicio o un resultado central: sacarla a su propio bloque `$$...$$` en vez de tejerla en la oración.
2. **Opciones: preferir LaTeX/notación simbólica sobre prosa**, y nunca una glosa aclaratoria (`(todos los reales)`, `(grado 4)`) solo en la opción correcta.
3. **Derivaciones de 2+ igualdades**, tanto en `explanation` como (sobre todo) en `feedback_correct`: partir en bloque `aligned` vertical o en varios `$$...$$` apilados, nunca una cadena horizontal `A=B=C=D`. Una sola igualdad corta puede quedar en una línea.
4. **Ninguna línea individual de un `aligned` debe quedar ancha por sí sola** (ej. una expansión de varios términos en una sola fila): si un paso es inherentemente largo, sumar un paso intermedio o simplificar la expresión.
5. **Nunca invocar derivadas, límites ni integrales** en `explanation` ni `feedback_incorrect` (frontera de `course-context.md` para `white`): justificar monotonía/extremos con evaluación en puntos, comportamiento en extremos por grado/signo, o lectura directa del gráfico. **Confirmado como sesgo sistémico en 3 topics seguidos**: reapareció en `exponential` (`white_exponential_CLSF_38`) y de nuevo en `logarithmic` (`white_logarithmic_LEXI_42`, `LEXI_10`), ambos con notación de límite. No es un defecto puntual de este topic, revisar el 100% de los ejercicios de cualquier topic todavía no auditado (`rational`, `trigonometric`) contra esta regla por default.
6. **`feedback_correct` se mantiene en 1 oración corta con el resultado final**, nunca una derivación completa encadenada; los pasos intermedios van en `explanation`.
7. **Cerrar la oración en punto antes de una fórmula display**, nunca dejarla tejida a mitad de oración (regla ya vigente desde `definition`, reforzar en `question` de GRAF).

### Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal:**
- [ ] `feedback_incorrect` completo en los 50 ejercicios por skill: `array` del largo de `options`, `null` en el correcto (incluye reescribir los `string` legacy que duplican `feedback_correct`)
- [ ] Ningún `\n\n` pegado a un bloque `$$...$$`
- [ ] Ningún em-dash `—` ni en-dash `–`
- [ ] Ninguna explicación con viñetas `•` ni sub-ejercicios `-`
- [ ] Cierres de `explanation` en advertencia/consejo, sin humor ni antropomorfismo
- [ ] `explanation` supera los 300 caracteres entre las 3 partes
- [ ] `correct_index` variado, no concentrado en un solo índice (objetivo ~12-13 por índice)
- [ ] Montos con `\$` escapado
- [ ] "Cuadrática" y "Polinómica" nunca en la misma grilla de opciones (CLSF)
- [ ] Cada ejercicio tiene `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill (sección "Distribución objetivo" arriba); contar por slug y verificar que coincide con la cantidad de la tabla

