## Patrón de modernización: tema `logarithmic`

> **CLSF archivado (jul-2026):** se sacó de este topic al podar a un máximo de 3 ítems (skills) por topic. Contenido preservado en `backend/content/archive/analisis/white/functions/logarithmic/CLSF.json`. No generar CLSF para este topic en rondas futuras; el resto de este documento sigue mencionando CLSF en registros de auditoría históricos, que quedan como referencia, no como guía de generación.

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

## Estado (auditoría jul-2026), lo que falta para alinear con `authoring-context.md`

Verificado programáticamente sobre los 4 JSON (post-auditoría de junio, que ya había vaciado `feedback_incorrect`: sigue vacío en los 200, sin bug de duplicado).

1. **`feedback_incorrect` falta en los 200 ejercicios** (los 4 skills en `""`, sin excepción). Completar como `array<string|null>` paralelo a `options`, `null` en el índice correcto, voz descriptiva nunca acusatoria (`authoring-context.md` §Pistas).
2. **`\n\n` pegado a bloques `$$...$$`**: LEXI 28/50 (más de la mitad), CLSF 18, FORM 24, GRAF 2. LEXI y FORM son los más afectados.
3. **Em-dash `—`/en-dash `–`**: LEXI 5 (#8,11,26,41,47), CLSF 9 (#0,4,18,20,22,25,35,42,44), FORM 1 (#12), GRAF 1 (#10).
4. **Explicaciones con viñetas `•`/sub-ejercicios `-`**: LEXI 3 (#8,10,42), CLSF 13, FORM 1 (#26), GRAF 0 (limpio).
5. **`explanation` bajo 300 caracteres** (mínimo vigente en `authoring-context.md`, no 250): LEXI 24/50, CLSF 12, FORM 34/50, **GRAF 45/50 (casi todo el archivo)**, conteos contra el umbral viejo de 250, verificar de nuevo contra 300 (van a subir). Mismo patrón que en `exponential`: falta el párrafo de concepto general o el cierre de advertencia/consejo.
6. **Cierres con humor/antropomorfismo**: no se detectaron casos (verificado con scan de palabras clave). Igual revisar al escribir cierres nuevos.
7. **`correct_index` sesgado, el más desparejo del tema**: LEXI {0:4,1:9,2:27,3:10}, CLSF {0:4,1:11,2:22,3:13}, FORM {0:5,1:15,2:22,3:8}, **GRAF {0:1,1:5,2:13,3:31}** (31/50 en índice 3, casi nada en 0). Rebalancear a ~{0:12,1:13,2:12,3:13} reordenando `options` (mismo contenido, nueva posición) y sincronizando `feedback_incorrect`.

### Confusiones fuente para `feedback_incorrect`, por skill

**LEXI:** dominio ($(0,+\infty)$) ↔ imagen ($\mathbb{R}$) invertidos, al revés que en exponencial (acá el dominio es el restringido); asíntota vertical (en $x=0$ o desplazada) confundida con una asíntota horizontal (la logarítmica no tiene); el punto fijo $(1,0)$ confundido con $(0,1)$ o con el punto $(b,1)$ que sirve para leer la base; base $b>1$ (creciente) ↔ $0<b<1$ (decreciente) invertidos; propiedad del producto $\log(a\cdot b) = \log a + \log b$ confundida con $\log(a+b)$; propiedad del cociente con el signo invertido; propiedad de la potencia $\log(a^n) = n\log a$ olvidando multiplicar por $n$; cambio de base $\log_b(x) = \ln(x)/\ln(b)$ invertido como $\ln(b)/\ln(x)$; confundir cuál función es la inversa de cuál (exponencial ↔ logarítmica); creer que $\log(0)$ existe o que $\log(1) \neq 0$.

**CLSF:** **Logarítmica ↔ Exponencial** (inversas, el distractor más frecuente del tema, en espejo con `exponential`); un crecimiento que se frena leído como exponencial (es logarítmico) o viceversa; "cuántos períodos para llegar a..." (se despeja el tiempo, es logarítmica) confundido con "cuánto vale después de..." (es exponencial); confundir con una raíz o con otra función de crecimiento lento.

**FORM:** al armar $t = \log_b(\text{factor})$ desde un contexto (inversión, bacterias, deuda, depreciación), confundir qué va adentro del logaritmo o la base a usar; propiedad del cociente con el signo invertido (restar cuando corresponde sumar o viceversa); propiedad de la potencia olvidando el factor $n$; error de cambio de base al evaluar numéricamente; confundir qué variable se despeja (tiempo vs. monto).

**GRAF:** asíntota vertical confundida con horizontal; dominio ↔ imagen invertidos; el punto $(1,0)$ y el punto $(b,1)$ mal leídos para identificar la base; monotonía invertida según el signo de la base; comportamiento cerca de la asíntota (decrece sin cota) confundido con el comportamiento en $+\infty$ (crece sin cota, pero muy lento).

### Hallazgos de auditoría (ronda 1, jul-2026)

Auditoría en vivo vía `/test`, muestra al azar de 12 ejercicios (no exhaustiva, ver expectativa de alcance en `generation-prompt.md`).

**Esta es la tercera confirmación seguida de que un grupo de reglas es sesgo sistémico de la generación original**, no un defecto puntual de este topic. Ya se habían visto en `polynomial` y `exponential`; acá reaparecen otra vez sin relación conceptual con esos temas:

- Rótulos tipo `"Nota:"` / `"Regla general:"` abriendo un párrafo (regla crítica 11).
- Opción correcta que se delata por longitud, en ambos sentidos: más larga (`CLSF_29`) o más corta (`CLSF_39`) que el resto (regla crítica 4/15).
- Límites usados en `explanation` para justificar una conclusión (regla crítica 12) — `LEXI_42`, `LEXI_10`.
- Fórmula display larga sin partir en pasos (`FORM_47`).

**Nuevo en esta ronda (no reincidencia), confirmado 3 veces solo en esta muestra:** el símbolo ✓ aparece en `LEXI_20`, `FORM_05` y `GRAF_29`. Se agregó como regla crítica 14 en `authoring-context.md`; auditar el 100% de los ejercicios de cualquier topic (incluidos los ya cerrados) por si quedó algún caso suelto.

Ejercicios concretos de esta ronda:

- `white_logarithmic_FORM_09`: rótulos `"Nota:"` y `"Regla general:"` en la `explanation`. Además, guía de contenido nueva: explicar **por qué** el argumento del logaritmo no puede ser negativo o cero (no alcanza con enunciar la restricción), ver sección de guías de contenido más abajo.
- `white_logarithmic_FORM_06`: bloque `\begin{aligned}` con una línea de puro texto (`\text{porque}`) sin `&`, mientras las otras líneas sí tenían `&`; el render colapsó. Ver regla crítica 16 nueva en `authoring-context.md`.
- `white_logarithmic_LEXI_42`: opción correcta demasiado larga; rótulo `"Nota:"`; límite ($\lim_{x\to0^+}$) usado en `explanation`, fuera de la frontera de `white`.
- `white_logarithmic_FORM_47`: fórmula display con 4 igualdades encadenadas y términos largos, debió partirse en desarrollo vertical.
- `white_logarithmic_LEXI_20`: símbolo ✓ en la `explanation`.
- `white_logarithmic_CLSF_29`: opción correcta notablemente más larga que las demás.
- `white_logarithmic_FORM_05`: símbolo ✓ en la `explanation`; el último párrafo no cerraba con punto. Ver regla crítica 17 nueva.
- `white_logarithmic_LEXI_10`: `explanation` usó notación de límite ($\lim_{x\to0^+}\ln(x)=-\infty$) para justificar la asíntota vertical, fuera de la frontera de `white`. Reformular con razonamiento intuitivo (ej. "a medida que $x$ se acerca a $0$ por la derecha, hay que elevar la base a exponentes cada vez más negativos y grandes en valor absoluto para obtener un número tan chico, así que el resultado crece sin límite hacia $-\infty$").
- `white_logarithmic_CLSF_39`: opción correcta notablemente más **corta** y menos elaborada que las 3 distractoras (caso simétrico de la regla 4, ver regla crítica 15 nueva).
- `white_logarithmic_LEXI_16`: guía de contenido nueva: para ejercicios de propiedades del logaritmo (producto/cociente/potencia), preferir derivar la propiedad desde la definición como inversa de la exponencial en vez de solo enunciar cuándo aplica y cuándo no. Ver sección de guías de contenido más abajo.
- `white_logarithmic_GRAF_29`: flechas `→` usadas en prosa dentro de una lista numerada en `explanation` (ya prohibido, ver *Redacción del enunciado*); símbolo ✓ también presente.

### Guías de contenido específicas de `logarithmic` (no son reglas de formato, son de profundidad conceptual)

1. **Ejercicios de dominio de logaritmo** (`FORM` con `log(x-c)`, `log(ax+b)`, etc.): no alcanza con enunciar "el argumento debe ser positivo". Explicar el *por qué*: el logaritmo pregunta a qué exponente hay que elevar la base para obtener el argumento, y ninguna potencia real de una base positiva da como resultado un número negativo o cero, por eso el argumento tiene que ser estrictamente positivo.
2. **Ejercicios de propiedades del logaritmo** (`LEXI` producto/cociente/potencia): preferir derivar la propiedad desde la relación inversa con la exponencial (que el alumno ya vio en `exponential`), no solo mostrar la igualdad y decir cuándo se puede aplicar. Ejemplo: la propiedad del producto sale de que sumar exponentes de una misma base equivale a multiplicar las potencias, y el logaritmo "deshace" la potencia.

### Distribución objetivo, con `tags` (ver `authoring-context.md` §Etiquetas)

Taxonomía diseñada leyendo los 200 ejercicios reales (jul-2026).

**LEXI (50):**

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Evaluar un logaritmo directamente (potencias exactas conocidas) | 15 | `evaluar-log-directo` |
| Propiedades algebraicas del logaritmo (producto, cociente, potencia) | 6 | `propiedades-algebraicas-log` |
| Identificar si una expresión es/no es logarítmica | 2 | `identificar-logaritmica` |
| Nombre/concepto de asíntota vertical | 2 | `asintota-vertical-nombre-concepto` |
| Dominio (básico, sin desplazamiento) | 2 | `dominio-basico` |
| Identificar cuál función tiene asíntota vertical entre varias | 2 | `identificar-asintota-vertical-entre-opciones` |
| Imagen (básica) | 2 | `imagen-basica` |
| Función inversa (log ↔ exponencial) | 2 | `funcion-inversa-logaritmo` |
| Asíntota vertical con desplazamiento horizontal | 2 | `asintota-vertical-desplazada` |
| Relación inversa entre exponencial y logaritmo (conceptual) | 1 | `relacion-inversa-exponencial-log` |
| Monotonía según la base | 1 | `monotonia-segun-base` |
| Razonamiento de por qué el dominio excluye $x \leq 0$ | 1 | `dominio-razonamiento` |
| Cambio de base | 1 | `cambio-de-base` |
| Inyectividad del logaritmo (si $\log_b a=\log_b c$ entonces $a=c$) | 1 | `propiedad-inyectividad-log` |
| Reflexión por signo negativo ($-\log_b(x)$) | 1 | `reflexion-signo-negativo` |
| Comportamiento cerca de la asíntota ($x \to 0^+$) | 1 | `comportamiento-cerca-asintota` |
| Ausencia de asíntota horizontal | 1 | `asintota-horizontal-no-existe` |
| Identificar un contexto cotidiano logarítmico | 1 | `contexto-cotidiano-identificar` |
| Dominio con desplazamiento horizontal | 1 | `dominio-desplazado` |
| Comparación entre bases distintas | 1 | `comparacion-bases-log` |
| Dominio de $\log_b(-x)$ (reflejado) | 1 | `dominio-reflejado` |
| Ausencia de extremos locales | 1 | `extremos-locales-inexistentes` |
| Punto clave de la gráfica ($(b,1)$, $(e,1)$) | 1 | `punto-clave-grafica` |
| Resolver ecuación logarítmica simple | 1 | `resolver-ecuacion-logaritmica` |
| **Total** | **50** | |

**CLSF (50):**

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Clasificar familia desde fórmula explícita | 12 | `clasificacion-desde-formula` |
| Clasificar familia desde gráfico (`graph_fn` o descripción) | 10 | `clasificacion-desde-grafico` |
| Clasificar familia desde un modelo cotidiano en prosa | 6 | `clasificacion-desde-contexto` |
| Dominio (básico) | 4 | `dominio-basico` |
| Distinción exponencial vs. logarítmica (conceptual) | 3 | `distincion-exponencial-logaritmica` |
| Identificar si una expresión es/no es logarítmica | 2 | `identificar-logaritmica` |
| Monotonía según la base | 2 | `monotonia-segun-base` |
| Identificar cuál de dos fórmulas dadas es logarítmica | 2 | `identificar-logaritmica-entre-dos-formulas` |
| Imagen (básica) | 2 | `imagen-basica` |
| Monotonía global (creciente en todo el dominio) | 1 | `monotonia-global` |
| Identificar la función decreciente entre opciones | 1 | `identificar-decreciente-entre-opciones` |
| Distractor: la función mostrada es lineal, no logarítmica | 1 | `distractor-lineal` |
| Ausencia de extremos locales | 1 | `extremos-locales-inexistentes` |
| Inyectividad de la logarítmica | 1 | `inyectividad-logaritmica` |
| Distractor: la función mostrada es exponencial, no logarítmica | 1 | `distractor-exponencial` |
| Ausencia de extremo global (sin máximo) | 1 | `extremo-global-inexistente` |
| **Total** | **50** | |

**FORM (50):**

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Evaluar $f(\text{valor})$ | 12 | `evaluar-f` |
| Identificar fórmula desde gráfico | 9 | `grafico-a-formula` |
| Propiedades algebraicas del logaritmo | 7 | `propiedades-algebraicas-log` |
| Dominio desde la fórmula (con desplazamiento/escala) | 6 | `dominio-desde-formula` |
| Asíntota vertical desde la fórmula | 5 | `asintota-vertical-desde-formula` |
| Evaluar en contexto cotidiano (bacterias, inversión, deuda, auto) | 4 | `evaluar-contexto` |
| Raíz / cruce con el eje $X$ | 3 | `raiz-cruce-eje-x` |
| Leer base o coeficiente desde la fórmula | 2 | `leer-base-coeficiente` |
| Función inversa (log ↔ exponencial) | 1 | `funcion-inversa-logaritmo` |
| Armar fórmula desde un contexto cotidiano | 1 | `armar-formula-contexto` |
| **Total** | **50** | |

**GRAF (50):** mantiene los tipos A (leer propiedades)/B (identificar fórmula)/C (contexto), con slug por sub-familia.

*Tipo A — leer propiedades desde el gráfico (25):*

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Leer un valor puntual ($f(4)$, $f(e)$, etc.) | 7 | `lectura-valor-puntual` |
| Asíntota vertical | 4 | `lectura-asintota` |
| Raíz / cruce con el eje $X$ | 4 | `lectura-raiz-cruce-x` |
| Monotonía (creciente/decreciente) | 3 | `lectura-monotonia` |
| Dominio | 2 | `lectura-dominio` |
| Imagen | 2 | `lectura-imagen` |
| Ausencia de extremos locales | 1 | `lectura-extremos-locales` |
| Comportamiento en infinito | 1 | `lectura-comportamiento-infinito` |
| Ausencia de extremo global (sin máximo) | 1 | `lectura-extremo-global` |
| **Subtotal Tipo A** | **25** | |

*Tipo B — identificar fórmula dado el gráfico (15):* todos bajo `grafico-a-formula` (misma habilidad que en FORM).

*Tipo C — contexto cotidiano + gráfico (10):*

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Tiempo/períodos necesarios dado un factor de crecimiento | 8 | `contexto-tiempo-desde-factor` |
| Factor de crecimiento dado un tiempo (inverso) | 1 | `contexto-factor-desde-tiempo` |
| Diferencia de tiempo entre dos factores | 1 | `contexto-diferencia-tiempos` |
| **Subtotal Tipo C** | **10** | |

### Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal:**
- [ ] `feedback_incorrect` completo en los 50 ejercicios por skill: `array` del largo de `options`, `null` en el correcto
- [ ] Ningún `\n\n` pegado a un bloque `$$...$$` (foco en LEXI y FORM)
- [ ] Ningún em-dash `—` ni en-dash `–`
- [ ] Ninguna explicación con viñetas `•` ni sub-ejercicios `-`
- [ ] Cierres de `explanation` en advertencia/consejo, sin humor ni antropomorfismo
- [ ] `explanation` supera los 300 caracteres entre las 3 partes (foco especial en GRAF y FORM)
- [ ] `correct_index` variado, no concentrado en un solo índice (objetivo ~12-13 por índice; GRAF necesita el rebalanceo más grande del tema)
- [ ] Montos con `\$` escapado
- [ ] Distractor Logarítmica↔Exponencial presente en CLSF donde corresponda
- [ ] Ninguna `explanation` invoca derivadas ni límites (ver "Hallazgos de auditoría", `LEXI_42` y `LEXI_10`; tercera confirmación de sesgo sistémico)
- [ ] Ningún campo contiene el símbolo ✓/✗/✘ (ver "Hallazgos de auditoría", `LEXI_20`, `FORM_05`, `GRAF_29`)
- [ ] Ninguna opción correcta se delata por longitud, ni más larga ni más corta que el resto (ver `CLSF_29` y `CLSF_39`)
- [ ] Ningún `\begin{aligned}` tiene una línea de puro texto sin `&` (ver `FORM_06`)
- [ ] Todo párrafo cierra con punto, incluido el último de cada campo (ver `FORM_05`)
- [ ] Ninguna flecha `→` usada en prosa fuera de una fórmula (ver `GRAF_29`)
- [ ] Ejercicios de dominio de logaritmo explican por qué el argumento debe ser positivo, no solo lo enuncian (ver guía de contenido 1)
- [ ] Cada ejercicio tiene `"tags": ["<slug>"]` con el slug de su fila en la tabla de distribución de su skill; contar por slug y verificar que coincide con la cantidad de la tabla

