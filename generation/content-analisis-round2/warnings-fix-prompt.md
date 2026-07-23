# Corrección de warnings — ronda 2 `analisis`

Este documento es para **corregir los warnings** que dejó la ronda 2 del curso `analisis`.
No se generan ni se quitan ejercicios: se **arreglan en el lugar** los defectos de formato y
de contenido que marca `validate_content.py`. Si vas a tocar contenido de `analisis`,
**empezá por acá** y después seguí el `generation-prompt.md` maestro para el detalle del
workflow.

Todos los comandos se corren **desde `backend/`**. Trabajás en la branch
`content-analisis-round2` (PR #104). No commitees a `main`.

---

## Estado del que partís

El contenido de `analisis` ya valida con **0 ERRORS**, pero tiene **~3600 WARNINGS**. Esos
warnings son deuda real de calidad, no ruido: el único artefacto de medición que había
(párrafos de prosa cortados por fórmulas centradas) ya se corrigió en el validador
(`prose_segments()`, commit `d767776`). Lo que queda hay que resolverlo tocando el contenido.

Un ERROR es una violación inequívoca (explanation < 300, `\n\n` pegado a `$$`, feedback mal
formado, tag inválido, etc.): **nunca se commitea con ERRORS**. Un WARNING es una heurística
que puede tener falsos positivos: se revisa con criterio (ver "Meta" abajo).

---

## Antes de tocar nada, leé

1. `backend/content/authoring-context.md` **completo**. Es la fuente de verdad de formato y
   estilo. Las reglas que más vas a usar acá: **4** y **15** (paridad de opciones), **18**
   (fórmula central del enunciado), **21** (densidad de inline), **26** (`\text{}`), **32**
   (aperturas repetidas), la sección **"Formato de párrafos"** (cómo se miden los tramos de
   prosa entre fórmulas) y **"Fórmulas anchas: partir en pasos"**.
2. `backend/content/analisis/course-context.md` (qué sabe el alumno en cada belt).
3. El `topic-context.md` del topic en el que estás trabajando: su **tabla de distribución por
   sub-familia** (con los slugs de `tags`) y su **checklist manual** al final.
4. Este documento, entero, antes de empezar el primer topic.

---

## Cómo diagnosticar

Corré el validador por topic, con salida JSON para poder leer cada finding:

```bash
python content/validate_content.py --course analisis --topic <belt>/<unit>/<topic> --json
```

Por ejemplo: `--topic white/functions/rational`. Cada finding trae:

- `level`: `ERROR` o `WARNING`.
- `check`: familia (`explanations`, `options`, `feedbacks`, `questions`, `structure`).
- `rule`: la regla concreta (`21`, `párrafos`, `4`, `18`, `fórmulas anchas`, `tags`, ...).
- `file`, `item`: el archivo y el índice de ejercicio (`#3` = cuarto ejercicio del array).
- `message`: el detalle, con un fragmento del texto ofensor.

Sin `--json` te da una lista legible; con `--topic` acota a un topic; sin `--topic` corre
todo el curso. Flags útiles: `--check options,structure` para correr solo algunas familias.

**No embebemos acá la lista de casos**: se desactualiza en cuanto corregís el primero. La
lista viva sale siempre del validador.

---

## El ciclo, una vez por topic

Trabajás **un topic a la vez, cerrándolo completo** antes de pasar al siguiente:

1. **Diagnosticar**: corré el validador sobre el topic y agrupá sus warnings por `rule`.
2. **Corregir**: aplicá el criterio de cada tipo (catálogo abajo), ejercicio por ejercicio.
3. **Seedear**: `python seed_content.py --course analisis` — tiene que correr sin errores y
   reportar los ejercicios del topic como `updated`. Esto también revalida integridad JSON.
4. **Re-validar**: volvé a correr el validador sobre el topic. Objetivo: **0 ERRORS** y los
   warnings resueltos o justificados.
5. **Checklist manual**: corré el checklist del final del `topic-context.md`, mirando los
   puntos que el validador no cubre (regla 25/30/31 y las reglas duras del topic).
6. **Commitear** (solo si 3/4/5 cierran): un commit por topic, con el formato del
   `generation-prompt.md` (qué se corrigió por regla, qué warnings quedaron y por qué, y el
   conteo por `tags` de cada skill).

**Orden sugerido de topics** (respeta la dependencia conceptual, igual que el prompt
maestro): `white → blue → violet → brown`, y dentro de cada unidad, el orden de la tabla del
`generation-prompt.md`. **`white/functions` concentra ~2/3 de todos los warnings**, así que
es el grueso del trabajo.

**Regla de oro (heredada de la ronda 2): la cantidad de ejercicios de cada `.json` no
cambia.** No toques `external_id`, `belt`, `topic`, `exercise_type` (los pone el seeder).

---

## Meta: resolver o justificar (no forzar 0)

Cada warning se **corrige**, salvo que después de mirarlo con criterio decidas que el
ejercicio está bien como está (ej. una oración que genuinamente necesita 3 inline para no
perder precisión). En ese caso lo dejás, pero **cada warning que quede se justifica en una
línea del mensaje de commit**.

**Prohibido "gamear" el número.** El objetivo es que el ejercicio quede mejor, no que el
contador baje. Antipatrones concretos ya vistos en esta ronda, no los repitas:

- Insertar `\n\n` en cualquier lado solo para partir un párrafo largo, sin que el corte
  respete un límite de oración real.
- Alargar los distractores con relleno que no aporta distracción, para emparejar longitud
  con la correcta (regla 4 lo prohíbe explícito).
- Cambiar `\dfrac`→`\frac` en un enunciado **sin** mover la fórmula a su bloque `$$`: eso no
  arregla la regla 18, solo cambia el tamaño; el defecto (fórmula tejida inline) sigue.
- Tocar el validador, el `topic-context.md` o cualquier doc de contexto para que el warning
  desaparezca. Los docs de contexto son **solo lectura** durante esta tarea.

Si dudás de si un warning es falso positivo, resolvé el defecto de fondo; si no hay defecto
de fondo, justificalo. Nunca lo silencies por el camino corto.

---

## Catálogo de warnings

Cada tipo abajo: **qué mide**, la **regla** que lo respalda, un **ejemplo ❌/✅**, y el
**criterio de fix**. Están agrupados por cluster según el tipo de trabajo que requieren.

### Cluster B — cortar / mover (semi-mecánico, pero revisá que no rompa el formato)

#### `explanations / párrafos` — tramo de prosa > 200 caracteres

**Qué mide.** El largo de prosa (sin contar el LaTeX) de cada **tramo entre fórmulas
centradas** `$$...$$`. Ver sección "Formato de párrafos" de `authoring-context.md`: el tope
de 200 aplica a cada tramo, no al párrafo entero.

**Criterio.** La mayoría de estos tramos son **dos o más oraciones**: se parten en un límite
de oración con `\n\n`. La minoría es **una sola oración larga**: no se parte, se reescribe
más corta (cae en el criterio del Cluster C).

**⚠️ Aviso duro.** El `\n\n` **nunca** puede quedar pegado a un `$` o `$$` (eso es ERROR,
regla 2). El formato obliga a un solo `\n` junto a las fórmulas centradas. Si el corte cae
justo después de un bloque `$$`, primero agregá una oración de cierre corta pegada al bloque
con un solo `\n`, y recién después el `\n\n`:

```
❌  ...el resultado es 120.\n$$V_{6,2}=30$$\n\nAhora bien, la confusión típica...
    (el \n\n quedó pegado al cierre del $$ → rompe)

✅  ...el resultado es 120.\n$$V_{6,2}=30$$\nHay 30 asignaciones.\n\nLa confusión típica...
    (oración de cierre con \n, después el \n\n)
```

#### `explanations / 21` — 3+ fragmentos LaTeX inline en un mismo tramo

**Qué mide.** Cantidad de `$...$` sueltos tejidos en un mismo tramo de prosa. **Regla 21.**

**Criterio.** Es la misma raíz que el anterior y la regla 21 lista sus dos remedios: (a)
dividir el tramo en párrafos más cortos (`\n\n`), o (b) sacar la fórmula central a un bloque
`$$...$$`. Cuando los inline están **repartidos en varias oraciones**, alcanza con partir.
Cuando es **una sola oración densa** ("...con $m=\frac{1}{2}$ y $b=3$, la forma $mx+b$..."),
hay que reescribir: pasar la fórmula clave a bloque o verbalizar los símbolos.

```
❌  Que es la forma $mx + b$ con $m = \frac{1}{2}$ y $b = 3$. Es lineal.
✅  Que es exactamente la forma lineal con pendiente un medio y ordenada tres.
```

#### `explanations / 26` — `\text{}` de 3+ palabras dentro de una fórmula

**Qué mide.** Una glosa larga en `\text{}` metida en un bloque `$$`. **Regla 26.**

**Criterio.** Sacá la frase del `$$` y ponela en la prosa que rodea la fórmula.

```
❌  $$F_1(x) - F_2(x) = C_1 - C_2, \quad \text{constante para todo } x$$
✅  $$F_1(x) - F_2(x) = C_1 - C_2$$\nEsa diferencia es constante para todo $x$.
```

#### `questions / 32` — misma apertura literal en 3+ ítems del archivo

**Qué mide.** Una plantilla de enunciado repetida (`Observá la función:`, `Hallá:`) en 3 o
más ejercicios del mismo archivo. **Regla 32.**

**Criterio.** Variá 2-3 de las aperturas por otras equivalentes, sin cambiar el sentido del
enunciado (precedente: `factoriales/RESL.json` de la unidad `conteo`, donde "Calculá el
valor de la siguiente expresión:" se varió a "Resolvé la siguiente resta de factoriales:" /
"Encontrá el resultado de la siguiente fracción:").

### Cluster C — reescritura con juicio semántico

#### `options / 4` y `options / 15` — la correcta se delata por su forma

**Qué mide.** La opción correcta es la única **notablemente más larga** (regla 4) o
**notablemente más corta** (regla 15) que el resto, o lleva una **glosa/paréntesis
aclaratorio que ningún distractor tiene**. **Reglas 4 y 15.** Es el warning de **mayor
impacto pedagógico**: el alumno puede acertar por la forma, sin saber el contenido.

**Criterio.** Igualar el registro sin filtrar la respuesta. Dos caminos legítimos:
- Acortar la correcta a su idea esencial.
- Dar a los distractores algo que **compita de verdad** (una razón plausible), no relleno.

Nunca resolverlo alargando distractores con paja.

```
❌  ["La lineal, porque $+10$ es mayor que $10\%$",
     "La exponencial, porque el crecimiento porcentual acumula más a largo plazo",  ← correcta, mucho más larga
     "Siempre son iguales", "Depende del valor inicial"]
✅  ["La lineal, porque $+10$ supera al $10\%$ al principio",
     "La exponencial, porque el porcentaje se acumula",
     "Son iguales en el largo plazo", "Depende del valor inicial"]
```

```
❌  ["Regla exponencial (base $e$)", "Regla de la potencia", "Regla del logaritmo"]  ← solo un distractor con paréntesis
✅  ["Regla exponencial", "Regla de la potencia", "Regla del logaritmo"]
```

#### `feedbacks / fórmulas anchas` — cadena de 3+ igualdades en `feedback_correct`

**Qué mide.** El `feedback_correct` encadena 3 o más `=` (una derivación completa). Ver
"Fórmulas anchas: partir en pasos" de `authoring-context.md`.

**Criterio.** El feedback deja el **resultado + una razón corta**; la derivación paso a paso
va en `explanation`.

```
❌  $f(28) = \log_3(28 - 1) = \log_3(27) = 3$ porque $3^3 = 27$.
✅  $f(28) = 3$, porque $3^3 = 27$.
```

#### `feedbacks / anti-acusación` — feedback que arranca culpando

**Qué mide.** El `feedback_incorrect` arranca con un tono acusatorio (`Falta...`,
`Olvidás...`, `Confundís...`). El feedback debe explicar de dónde sale el error, no acusar.

**⚠️ No es un find/replace único.** El `Falta` viene en **dos formas** y cada una se
reescribe distinto:
- `Falta` + **verbo** infinitivo (`Falta derivar el término...`, `Falta dividir por...`):
  reformular a "No se derivó el término..." / "Ese resultado no divide por...".
- `Falta` + **sustantivo** (`Falta el signo negativo...`, `Falta el factor $2$...`):
  reformular a "Ese resultado omite el signo negativo..." / "A esa expresión le falta el
  factor $2$..." (describiendo qué falta, sin señalar al alumno).

Reescribí cada uno mirando la oración completa; conjugá el verbo donde haga falta.

```
❌  Falta derivar el término lineal $5x$, cuya derivada es $5$.
✅  Ese resultado no derivó el término lineal $5x$; su derivada es $5$.

❌  Falta el signo negativo antes de la integral remanente.
✅  A esa expresión le falta el signo negativo antes de la integral remanente.
```

#### `questions / 18` — fórmula central tejida inline en el enunciado

**Qué mide.** El enunciado gira en torno a una función/fórmula, pero está **empotrada dentro
de la oración** en vez de tener su bloque `$$` centrado. **Regla 18.** (Muchos usan `\dfrac`
inline, pero el problema no es el comando: es la posición.)

**Criterio.** Sacá la fórmula a su propio bloque `$$...$$`, con texto propio antes y/o
después. Adentro de `$$` la fracción ya renderiza en tamaño display, así que `\frac` alcanza.

```
❌  En $f(x) = \dfrac{x^2 - 1}{x - 1}$, ¿para qué valor de $x$ no está definida?
✅  Considerá la función:\n$$f(x) = \frac{x^2 - 1}{x - 1}$$\n¿Para qué valor de $x$ no está definida?
```

**⚠️ Aviso.** No uses el mismo texto guía (`Considerá la función:`) en 3+ ejercicios del
mismo archivo, o creás warnings de regla 32. Variá: "Partiendo de:", "Para la función:",
"Dada:", etc.

### Cluster D — distribución de sub-familias (`structure / tags`)

**Qué mide.** El validador compara el conteo de cada slug de `tags` contra la tabla de
distribución del `topic-context.md`.

**Criterio, en dos casos:**
- **Slug con MENOS ejercicios que el target** (la gran mayoría): es el gap normal de la
  ronda 3 (blue/violet/brown están en 15 ejercicios, no en los 50 del target final). **Se
  ignora**, justificándolo en una línea del commit ("distribución parcial, se completa en
  ronda 3").
- **Slug con MÁS ejercicios que el target**: pasa **solo en `white`** (que ya está en sus 50
  finales), ej. `logarithmic/FORM evaluar-f: 35 vs 12`. Ahí hay un desbalance real. Fix:
  **re-etiquetar** los ejercicios mal clasificados hacia las sub-familias sub-representadas
  de la misma skill, o —si un ejercicio genuinamente no encaja en ningún slug faltante—
  reescribir su enfoque para que cubra uno de los que faltan. **Sin cambiar la cantidad total
  del archivo.** Es el trabajo más pesado; hacelo al final de cada topic de white, después de
  cerrar los warnings de formato.

---

## Apéndice: números de referencia

Distribución de los ~3600 warnings al momento de escribir este prompt (corré el validador
para el conteo vivo). Sirve para saber cuántos esperar por tipo y detectar si algo se
disparó al corregir.

| Tipo | ~n | Cluster | Fix |
|---|---:|---|---|
| explanations / 21 | 1441 | B (~⅓ reescritura) | dividir tramo o sacar fórmula a `$$` |
| explanations / párrafos | 1145 | B (~14% reescritura) | cortar en límite de oración con `\n\n` |
| structure / tags | 234 | D (207 ignorar, 27 reales) | re-etiquetar/redistribuir en white |
| feedbacks / fórmulas anchas | 218 | C | mover derivación a explanation |
| options / 4 | 177 | C | igualar registro de opciones |
| feedbacks / anti-acusación | 173 | C | reformular (verbo vs sustantivo) |
| questions / 18 | 158 | C | sacar fórmula central a `$$` |
| explanations / 26 | 28 | B | mover `\text{}` a la prosa |
| options / 15 | 25 | C | igualar registro de opciones |
| questions / 32 | 20 | B | variar aperturas repetidas |

Por unidad, la tasa de warnings por ítem es pareja (~1.7–2.1); el volumen de `white` es solo
porque tiene 1150 de los 1780 ítems del curso.
