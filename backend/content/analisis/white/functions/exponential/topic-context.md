## Patrón de modernización: tema `exponential` (LEXI / CLSF / FORM / GRAF)

### Eje conceptual

Una exponencial aparece cuando el cambio es **proporcional al valor actual** — crecimiento o decaimiento en porcentaje fijo por período:

| Señal en el enunciado | Familia |
|-----------------------|---------|
| "se duplica cada período" / "crece un X% por año" | exponencial creciente |
| "se reduce a la mitad" / "pierde el X% anual" | exponencial decreciente |
| "tasa fija por unidad / suma constante" | lineal |
| "un máximo / mínimo, curvatura única" | cuadrática |
| "múltiples picos / fases" | polinómica |
| "escala logarítmica / pH / Richter" | logarítmica |

**Diferencia cotidiana clave:** "suma \\$500 por mes" → lineal; "crece un 10% mensual" → exponencial.

### Biblioteca de contextos validados

Bacterias que se duplican, interés compuesto, depreciación de un auto, desintegración radiactiva (vida media), enfriamiento de un objeto (Newton), propagación de usuarios/app. Montos con `\\$`. Sin nombres propios.

### Auditoría de los 36 originales (junio 2026)

- `feedback_incorrect` estaba lleno en los 36 → vaciado a `""` en batch.
- `clsf_13` tenía pista en la opción correcta `(siempre creciente)` → eliminada.
- `clsf_01`, `clsf_05`, `clsf_08` sin párrafo de contexto → se agregó intro.
- `graph_view` no cuadrado en 7 ejercicios → se ajustaron bases y vistas.

### Cobertura por skill (exponential, 200 ejercicios)

**LEXI (50):** forma canónica $f(x) = a \cdot b^x$, dominio $\mathbb{R}$, imagen $(0,+\infty)$, asíntota horizontal, monotonía según base, $f(0)=a$, tasa de crecimiento ($r = b-1$), período de duplicación, vida media, número de Euler $e$, transformaciones (desplazamiento horizontal/vertical, reflexión), propiedades algebraicas, inyectividad, inversa (logaritmo), sin raíces reales, comparación de bases, comportamiento en $\pm\infty$.

**CLSF (50):** desde cotidiano (bacterias, interés, depreciación, enfriamiento), desde fórmula (formas transformadas), desde gráfico (asíntota desplazada, creciente vs decreciente, distinguir de logarítmica), imagen con desplazamiento, monotonía global, sin extremos locales. Distractor frecuente: **Exponencial ↔ Logarítmica**.

**FORM (50):** armar fórmula desde cotidiano ($B(t)=P_0 \cdot 2^t$, $M(t)=C(1+r)^t$, $V(t)=V_0(1-r)^t$), leer $a$ y $b$, evaluar $f(\text{valor})$, determinar $a$ y $b$ desde dos puntos, desplazamiento vertical, propiedades algebraicas, 5 ejercicios leer-desde-gráfico con `graph_fn`.

**GRAF (50):** *Tipo A (25)*: leer propiedades — creciente/decreciente, asíntota, $f(0)$, imagen, raíces, $f(1)$ para leer base, comportamiento en $\pm\infty$. *Tipo B (15)*: identificar la fórmula. *Tipo C (10)*: contexto cotidiano (bacterias, inversión, depreciación, enfriamiento, usuarios).

### `graph_fn` para GRAF exponential

Sintaxis mathjs. Usar bases ≈ 1,5 o escalar para fit cuadrado:

```
Crecientes:
  pow(1.5, x)              [-5,5,-0.5,8.5]    # base 1.5, f(0)=1
  pow(2, x)                [-4,4,-0.5,8.5]    # base 2
  exp(x)                   [-3,5,-0.5,8.5]    # base e
  2 * pow(1.5, x)          [-5,5,-0.5,10]     # a=2, f(0)=2
  3 * pow(2, x)            [-4,3,-0.5,10]     # a=3, f(0)=3

Decrecientes:
  pow(0.5, x)              [-4,4,-0.5,8.5]    # base 0.5
  pow(0.7, x)              [-6,4,-0.5,8.5]    # decae suave
  3 * pow(0.6, x)          [-4,6,-0.5,10]     # a=3

Con desplazamiento vertical:
  pow(2, x) + 2            [-4,4,-0.5,9.0]    # asíntota y=2, f(0)=3
  pow(0.5, x) + 1          [-4,6,-0.5,9.0]    # asíntota y=1, decreciente
  pow(2, x) - 1            [-4,5,-1.5,8.5]    # asíntota y=-1, tiene raíz en x=0
```

---

## Estado (auditoría jul-2026), lo que falta para alinear con `authoring-context.md`

Verificado programáticamente sobre los 4 JSON (post-auditoría de junio, que ya había vaciado `feedback_incorrect` a `""` en batch: sigue vacío en los 200, sin el bug de duplicado con `feedback_correct` que sí aparece en otros temas).

1. **`feedback_incorrect` falta en los 200 ítems** (los 4 skills en `""`, sin excepción). Completar como `array<string|null>` paralelo a `options`, `null` en el índice correcto, voz descriptiva nunca acusatoria (`authoring-context.md` §Pistas).
2. **`\n\n` pegado a bloques `$$...$$`**: LEXI 3 (#3,4,9), CLSF 3 (#10,12,49), FORM 0 (limpio), GRAF 0 (limpio).
3. **Em-dash `—`/en-dash `–`**: LEXI 5 (#9,24,25,33,42), CLSF 2 (#29,32), FORM 4 (#11,14,34,40), GRAF 3 (#9,21,46).
4. **Explicaciones con viñetas `•`/sub-ítems `-`**: LEXI 4 (#10,14,42,46), CLSF 18 (#0,4,5,7,8,11,13,14,25,26,28,38,39,40,41,42,45,49), FORM 4 (#0,11,12,32), GRAF 18 (#11,16,17,25-39 en bloque). Reescribir a los 3 párrafos de prosa.
5. **`explanation` bajo 300 caracteres** (mínimo vigente en `authoring-context.md`, no 250), el defecto más extendido del tema: LEXI 7, CLSF 7, FORM 32/50 (más de la mitad), **GRAF 45/50 (casi todo el archivo)**, conteos tomados contra el umbral viejo de 250, verificar de nuevo contra 300 (van a subir). El patrón repetido en GRAF es "señal visual + regla + fórmula corta" sin un párrafo de cierre; sumar una advertencia/consejo o ampliar el concepto general para cruzar el mínimo.
6. **Cierres con humor/antropomorfismo**: no se detectaron casos en los 4 JSON. Igual verificar al escribir cierres nuevos: por defecto son advertencia/consejo neutro.
7. **`correct_index` sesgado**: LEXI {0:7,1:19,2:20,3:4}, CLSF {0:5,1:15,2:23,3:7}, FORM {0:10,1:19,2:17,3:4}, GRAF {0:17,1:17,2:14,3:2}. Rebalancear a ~{0:12,1:13,2:12,3:13} reordenando `options` (mismo contenido, nueva posición) y sincronizando `feedback_incorrect`.

### Confusiones fuente para `feedback_incorrect`, por skill

**LEXI:** dominio ($\mathbb{R}$) ↔ imagen ($(0,+\infty)$) invertidos; $f(0)=a$ confundido con la base $b$; base $b>1$ (creciente) ↔ $0<b<1$ (decreciente) invertidos; creer que la exponencial tiene raíces reales (nunca toca la asíntota); tasa de crecimiento $r=b-1$ confundida con la base $b$ misma; período de duplicación ↔ vida media invertidos; desplazamiento vertical (mueve la asíntota) ↔ desplazamiento horizontal (mueve $f(0)$ pero no la asíntota) confundidos; la inversa (logaritmo) confundida con la función misma o creer que no es inyectiva; comparación de bases: mayor base crece más rápido a la derecha, no necesariamente vale más en $x=0$; comportamiento en $\pm\infty$ invertido (hacia $-\infty$ se acerca a la asíntota si $b>1$, hacia $+\infty$ diverge).

**CLSF:** **Exponencial ↔ Logarítmica** (el distractor más frecuente del tema, ver eje conceptual); "tasa fija / suma constante" leído como exponencial cuando es lineal; crecimiento rápido confundido con cuadrática o polinómica (que sí tienen un extremo o múltiples fases, la exponencial no); imagen con desplazamiento vertical mal calculada; creer que la exponencial tiene extremos locales o cambios de monotonía (siempre es estrictamente creciente o decreciente, nunca ambas).

**FORM:** valor inicial $a$ ↔ factor multiplicativo $b$ intercambiados al armar la fórmula; en interés compuesto, confundir la tasa $r$ con el factor completo $(1+r)$; en depreciación, signo de la tasa (crecer en vez de decrecer o viceversa); error al despejar $a$ y $b$ desde dos puntos dados; desplazamiento vertical confundido con $f(0)$ (el desplazamiento mueve la asíntota, $f(0)$ es el valor de la función ahí); en propiedades algebraicas ($b^x \cdot b^y = b^{x+y}$, etc.), sumar donde corresponde multiplicar o viceversa; al leer desde gráfico, confundir $f(0)$ con la base $b$ (que se lee de $f(1)/f(0)$, no directamente).

**GRAF:** creciente ↔ decreciente invertidos según la dirección visual de la curva; asíntota horizontal confundida con una raíz (la curva se acerca pero nunca cruza, no hay raíces reales); $f(0)$ confundido con la base $b$ (la base se lee comparando $f(1)$ con $f(0)$, no leyendo un solo punto); imagen ↔ dominio invertidos; comportamiento en $\pm\infty$ invertido (cuál lado se achata contra la asíntota y cuál diverge, según el signo de la base).

### Hallazgos de auditoría (ronda 1, jul-2026)

Auditoría en vivo vía `/test`, muestra al azar de 8 ítems (no exhaustiva, ver expectativa de alcance en `generation-prompt.md`).

**Importante: esta muestra confirma que las siguientes reglas son sesgo sistémico de la generación anterior, no casos aislados.** Las mismas 5 violaciones aparecieron primero en `polynomial` (ver su `topic-context.md`, sección "Correcciones de formato transversales de esta ronda") y ahora de nuevo acá, en un topic sin relación conceptual. **Confirmado por tercera vez en `logarithmic`** (ver su `topic-context.md`, sección "Hallazgos de auditoría"), que además sumó violaciones nuevas propias (símbolo ✓, paridad de longitud en ambos sentidos, `aligned` con línea de texto suelta, puntuación terminal). Esto significa que **muy probablemente aparecen en el resto de los topics de `white/functions` todavía no auditados** (`rational`, `trigonometric`). Al ejecutar cualquier `generation-prompt.md` de esos topics, revisar el 100% de los ítems contra estas reglas, no confiar en que sea un defecto puntual:

1. **Párrafos de `explanation` demasiado largos** (regla ya vigente, ≤200 caracteres, ideal ~100).
2. **Opción correcta más larga o más elaborada que las demás** (regla crítica 4), incluso cuando ninguna lleva glosa aclaratoria explícita.
3. **`feedback_correct` con fórmula encadenada larga que se sale de pantalla** (regla agregada tras el refactor de `quadratic`, confirmada de nuevo acá).
4. **Rótulos tipo `"Nota:"` abriendo un párrafo** (regla crítica 11).
5. **Límites/derivadas usados en `explanation` para justificar una conclusión** (regla crítica 12, agregada tras el refactor de `polynomial`; esta es la segunda confirmación en dos topics seguidos).

Ítems concretos de esta ronda:

- `white_exponential_FORM_48`: la opción correcta incluía `"= 25"` de más (`"$5^2 = 25$"` vs. distractores más cortos como `"$2$"`), llamando la atención de más; párrafos de `explanation` largos. (La fórmula display `$$\frac{5^{x+2}}{5^x} = 5^{(x+2)-x} = 5^2 = 25$$` en sí **no** tuvo que partirse en vertical: es corta y entra cómoda en una línea, ver aclaración nueva en `authoring-context.md` §Enumeraciones de valores calculados.)
- `white_exponential_CLSF_34`: opción correcta notablemente más larga/elaborada que las demás; párrafos de `explanation` largos.
- `white_exponential_CLSF_50`: párrafos de `explanation` largos, dividir en más párrafos.
- `white_exponential_LEXI_47`: opción correcta más larga que las demás; párrafos largos.
- `white_exponential_LEXI_36`: `feedback_correct` con cadena de comparaciones (`$3^5=243 > 2^5=32 > ...$`) que se salió un poco de pantalla.
- `white_exponential_LEXI_44`: usó `"Nota:"` como rótulo de párrafo en `explanation`, reemplazar por frase narrativa.
- `white_exponential_LEXI_10`: hallazgo nuevo (no reincidencia): las 4 opciones son bases exponenciales, 3 decimales/fraccionarias menores a 1 y la correcta es la única entera mayor a 1; el patrón de *formato numérico* delata la respuesta aunque ninguna sea más larga. Ver regla nueva en `authoring-context.md` regla crítica 4.
- `white_exponential_CLSF_38`: la `explanation` usó notación de límite ($\lim_{x\to-\infty}$) para justificar el comportamiento en infinito, fuera de la frontera matemática de `white`. Reescribir con razonamiento intuitivo (ej. "elevar una base menor a 1 a un exponente muy negativo equivale a elevar su recíproco, mayor a 1, a un exponente positivo grande").

### Distribución objetivo, con `tags` (ver `authoring-context.md` §Etiquetas)

Taxonomía diseñada leyendo los 200 ítems reales (jul-2026).

**LEXI (50):**

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Propiedades algebraicas de potencias | 4 | `propiedades-algebraicas-potencias` |
| Asíntota horizontal (nombre, ecuación, desplazamiento) | 4 | `asintota-horizontal` |
| Monotonía según la base ($b>1$ vs. $0<b<1$) | 4 | `monotonia-segun-base` |
| Parámetro base/tasa de crecimiento en contexto | 4 | `parametro-base-crecimiento` |
| Comportamiento en infinito ($x \to \pm\infty$) | 3 | `comportamiento-infinito` |
| Dominio e imagen (básico) | 3 | `dominio-imagen-basica` |
| Identificar si una expresión es/no es exponencial | 2 | `identificar-exponencial` |
| Valor inicial $f(0)$ | 2 | `valor-inicial-f0` |
| Período de duplicación / vida media | 2 | `periodo-duplicacion-vida-media` |
| Número $e$, concepto | 2 | `numero-e-concepto` |
| Imagen con desplazamiento vertical | 2 | `imagen-desplazamiento-vertical` |
| Sin raíces reales | 2 | `sin-raices-reales` |
| Comparación de bases | 2 | `comparacion-bases` |
| Exclusión de $b=1$ o base negativa | 2 | `exclusion-base-1-o-negativa` |
| Resolver ecuación exponencial simple | 2 | `resolver-ecuacion-exponencial-simple` |
| Ubicación de la variable en el exponente | 1 | `ubicacion-variable-exponente` |
| Punto de corte con el eje $Y$ | 1 | `punto-corte-eje-y` |
| Razonamiento de por qué el dominio es $\mathbb{R}$ | 1 | `dominio-razonamiento` |
| Transformación horizontal | 1 | `transformacion-horizontal` |
| Inyectividad de la exponencial | 1 | `inyectividad-exponencial` |
| Función inversa (logaritmo) | 1 | `funcion-inversa-logaritmo` |
| Identificar la afirmación falsa | 1 | `afirmacion-falsa-identificar` |
| Ausencia de extremos locales | 1 | `extremos-locales-inexistentes` |
| Comparación crecimiento lineal vs. exponencial | 1 | `crecimiento-lineal-vs-exponencial` |
| Inecuación exponencial | 1 | `inecuacion-exponencial` |
| **Total** | **50** | |

> Nota: `white_exponential_LEXI_22` ("¿Cuál propiedad especial tiene $f(x)=e^x$ en cálculo? Su derivada es $e^x$") invoca **derivada**, fuera de la frontera de `white`. Al refactorizar, reformular sin ese concepto (ej. describir a $e$ como la única base cuya curva tiene una propiedad de crecimiento particular, sin nombrarla como derivada) o reclasificar el ítem.

**CLSF (50):**

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Clasificar familia desde un modelo cotidiano en prosa | 10 | `clasificacion-desde-contexto` |
| Clasificar familia desde fórmula explícita | 9 | `clasificacion-desde-formula` |
| Clasificar familia desde gráfico (`graph_fn` o descripción) | 8 | `clasificacion-desde-grafico` |
| Identificar si una expresión es/no es exponencial | 4 | `identificar-exponencial` |
| Comportamiento en infinito | 3 | `comportamiento-infinito` |
| Imagen con desplazamiento vertical | 2 | `imagen-desplazamiento-vertical` |
| La función no puede tomar el valor 0 | 2 | `no-toma-valor-cero` |
| Monotonía por intervalo (creciente/decreciente en todo $\mathbb{R}$) | 2 | `monotonia-intervalo` |
| Identificar fórmula desde gráfico | 2 | `grafico-a-formula` |
| Monotonía según la base | 1 | `monotonia-segun-base` |
| Identificar la función decreciente entre opciones | 1 | `identificar-decreciente-entre-opciones` |
| Identificar crecimiento exponencial en una descripción de contexto | 1 | `identificar-crecimiento-exponencial-contexto` |
| Ausencia de extremos locales | 1 | `extremos-locales-inexistentes` |
| Inyectividad de la exponencial | 1 | `inyectividad-exponencial` |
| Distinción exponencial vs. logarítmica | 1 | `distincion-exponencial-logaritmica` |
| Dominio (básico) | 1 | `dominio-basico` |
| Distinción exponencial vs. lineal (comparar dos modelos) | 1 | `distincion-exponencial-lineal-comparacion` |
| **Total** | **50** | |

**FORM (50):**

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Evaluar $f(\text{valor})$ | 10 | `evaluar-f` |
| Identificar fórmula desde gráfico | 8 | `grafico-a-formula` |
| Evaluar en contexto cotidiano (bacterias, inversión, etc.) | 7 | `evaluar-contexto` |
| Armar fórmula desde un contexto cotidiano | 6 | `armar-formula-contexto` |
| Propiedades algebraicas de potencias | 6 | `propiedades-algebraicas-potencias` |
| Leer base o coeficiente $a$ desde la fórmula | 4 | `leer-base-coeficiente` |
| Dominio (básico) | 2 | `dominio-basico` |
| Determinar $a$ y $b$ desde dos puntos | 2 | `determinar-a-b-desde-dos-puntos` |
| Tasa de crecimiento expresada como porcentaje | 2 | `tasa-crecimiento-porcentaje` |
| Asíntota horizontal desplazada | 1 | `asintota-horizontal-desplazada` |
| Imagen con desplazamiento vertical | 1 | `imagen-desplazamiento-vertical` |
| Comparar dos modelos (cuál vale más en un punto) | 1 | `comparar-dos-modelos` |
| **Total** | **50** | |

**GRAF (50):** mantiene los tipos A (leer propiedades)/B (identificar fórmula)/C (contexto), con slug por sub-familia.

*Tipo A — leer propiedades desde el gráfico (25):*

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Leer un valor puntual ($f(1)$, $f(-2)$, etc.) | 5 | `lectura-valor-puntual` |
| Ordenada al origen, $f(0)$ | 4 | `lectura-ordenada-origen` |
| Monotonía (creciente/decreciente, en qué intervalo) | 3 | `lectura-monotonia` |
| Comportamiento en infinito | 3 | `lectura-comportamiento-infinito` |
| Raíces (tiene o no tiene cero) | 3 | `lectura-raices` |
| Asíntota horizontal | 2 | `lectura-asintota` |
| Imagen | 2 | `lectura-imagen` |
| Extremos locales (ausencia) | 1 | `lectura-extremos-locales` |
| Dominio | 1 | `lectura-dominio` |
| Comparar bases desde el gráfico (cuál es más empinada) | 1 | `comparar-bases-grafico` |
| **Subtotal Tipo A** | **25** | |

*Tipo B — identificar fórmula dado el gráfico (15):* todos bajo `grafico-a-formula` (misma habilidad que en FORM).

*Tipo C — contexto cotidiano + gráfico (10):*

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Evaluar en contexto (bacterias, inversión, moto, usuarios, etc.) | 7 | `evaluar-contexto` |
| Comportamiento en infinito en contexto | 1 | `comportamiento-infinito-contexto` |
| Asíntota en contexto (temperatura de equilibrio) | 1 | `asintota-contexto` |
| Ordenada al origen en contexto | 1 | `lectura-ordenada-origen-contexto` |
| **Subtotal Tipo C** | **10** | |

### Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal:**
- [ ] `feedback_incorrect` completo en los 50 ítems por skill: `array` del largo de `options`, `null` en el correcto
- [ ] Ningún `\n\n` pegado a un bloque `$$...$$`
- [ ] Ningún em-dash `—` ni en-dash `–`
- [ ] Ninguna explicación con viñetas `•` ni sub-ítems `-`
- [ ] Cierres de `explanation` en advertencia/consejo, sin humor ni antropomorfismo
- [ ] `explanation` supera los 300 caracteres entre las 3 partes (foco especial en GRAF y FORM)
- [ ] `correct_index` variado, no concentrado en un solo índice (objetivo ~12-13 por índice)
- [ ] Montos con `\$` escapado
- [ ] Distractor Exponencial↔Logarítmica presente en CLSF donde corresponda
- [ ] Ninguna `explanation` invoca derivadas, límites ni integrales (ver "Hallazgos de auditoría", `white_exponential_CLSF_38` y `LEXI_22`)
- [ ] Ninguna opción correcta se delata por longitud NI por formato numérico distinto al patrón del resto (ver "Hallazgos de auditoría", `LEXI_10`)
- [ ] `feedback_correct` no encadena una derivación completa que se salga de pantalla (ver "Hallazgos de auditoría", `LEXI_36`)
- [ ] Ningún párrafo abre con un rótulo tipo `"Nota:"`, `"Ojo:"` (ver "Hallazgos de auditoría", `LEXI_44`)
- [ ] Cada ítem tiene `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill; contar por slug y verificar que coincide con la cantidad de la tabla

