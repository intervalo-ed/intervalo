# Corrección de errores y warnings — ronda de validador `analisis`

Este documento reemplaza cualquier lectura previa que tengas del contenido de este archivo:
fue **reescrito por completo** con el estado real del validador a esta fecha. La versión
anterior describía reglas (`21`/`34`/`4`/`15`/`26`/`32`) y conteos (~4000 warnings, 0 errors)
de una ronda ya cerrada y mergeada (PR #104). Desde entonces `validate_content.py` sumó reglas
nuevas (**35, 36, 37, 38**) que se escribieron trabajando el curso `probabilidad`, y al
aplicarse retroactivamente sobre `analisis` aparecieron violaciones que antes no se detectaban
— incluidas **85 ERRORS reales**, algo que la ronda anterior no tenía.

No se generan ni se quitan ejercicios: se **arreglan en el lugar** los defectos de formato y
de contenido que marca el validador. Trabajás en la branch `content-analisis-round2`
(ya actualizada a la par de `main`). **No commitees a `main` ni a `staging` directo**: el PR
de esta rama hacia `staging` ya está abierto, tus commits van a esa rama y aparecen solos ahí.

---

## Estado del que partís (medido recién, en esta rama)

```
Archivos: 65 | Ítems: 1780 | ERRORS: 85 | WARNINGS: 2039
  explanations   WARNING  1095
  feedbacks      WARNING  157
  questions      ERROR      85
  questions      WARNING   553
  structure      WARNING   234
```

Un **ERROR** es una violación inequívoca de una regla dura: **nunca se commitea un topic con
ERRORS pendientes**. Un **WARNING** es una heurística que puede tener falsos positivos: se
revisa con criterio (ver "Meta" más abajo), no se fuerza a cero a cualquier costo.

Las **85 ERRORS son todas regla 37** (paréntesis aclaratorio) en el campo `questions` — ahí la
regla es dura, a diferencia de `explanations`/`feedbacks` donde la misma regla 37 solo genera
WARNING. Están concentradas casi enteramente en `white/functions` (ver tabla de abajo).

---

## Antes de tocar nada, leé

1. `backend/content/authoring-context.md` **completo**, con atención especial a las reglas
   **18** (fórmula central tejida), **21** (densidad de inline), **35** (ecuación ancha
   tejida / fórmula repetida inline+display), **36** (párrafos de `question` ≤130 chars,
   pregunta `¿...?` en su propio tramo), **37** (sin paréntesis aclaratorios en ningún campo)
   y **38** (bloques display sin `aligned` que hay que verticalizar).
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

Por ejemplo: `--topic white/functions/rational`. Cada finding trae `level` (ERROR/WARNING),
`check` (familia: `explanations`, `options`, `feedbacks`, `questions`, `structure`), `rule`
(número de regla), `file`, `item` (índice del ejercicio, `#3` = cuarto del array) y `message`
con el fragmento ofensor. Sin `--json` da una lista legible; sin `--topic` corre todo el curso.

**No embebemos acá la lista de casos**: se desactualiza en cuanto corregís el primero. La
lista viva sale siempre del validador.

---

## El ciclo, una vez por topic

Trabajás **un topic a la vez, cerrándolo completo** antes de pasar al siguiente:

1. **Diagnosticar**: corré el validador sobre el topic (`--json` para detalle), agrupá por
   `rule`.
2. **Corregir**: aplicá el criterio de cada tipo (catálogo abajo), ejercicio por ejercicio.
   Arrancá siempre por las **ERROR** del topic (regla 37 en `questions`) antes que los WARNING.
3. **Seedear**: `python seed_content.py --course analisis` — tiene que correr sin errores y
   reportar los ejercicios del topic como `updated`. Esto también revalida integridad JSON.
4. **Re-validar**: volvé a correr el validador sobre el topic. Objetivo: **0 ERRORS** siempre,
   y los warnings resueltos o justificados.
5. **Checklist manual** del `topic-context.md` del topic, ítem por ítem (mirá especialmente lo
   que el validador no cubre: coherencia de contexto, reglas duras propias del topic).
6. **Commitear** (solo si 3/4/5 cierran): un commit por topic, con el detalle de qué se
   corrigió por regla, qué warnings quedaron y por qué, y el conteo por `tags` de cada skill si
   tocaste `structure`.

**Regla de oro: la cantidad de ejercicios de cada `.json` no cambia.** No toques
`external_id`, `belt`, `topic`, `exercise_type` (los pone el seeder). Los docs de contexto
(`topic-context.md`, `authoring-context.md`, `validate_content.py`) son **solo lectura**
durante esta tarea.

---

## Orden sugerido de topics

`white/functions` concentra casi todos los ERRORS y la mayoría de los WARNINGS (tiene 1150 de
los 1780 ítems del curso). Andá por orden de impacto, de mayor a menor, y dentro de cada
belt/unit en el orden natural del curso:

| Topic | ERROR | WARNING | Prioridad |
|---|---:|---:|---|
| `white/functions/polynomial` | 19 | 242 | 1 |
| `white/functions/rational` | 18 | 241 | 2 |
| `white/functions/exponential` | 12 | 230 | 3 |
| `white/functions/trigonometric` | 11 | 197 | 4 |
| `white/functions/logarithmic` | 10 | 173 | 5 |
| `white/functions/linear` | 6 | 142 | 6 |
| `white/functions/quadratic` | 4 | 168 | 7 |
| `white/functions/definition` | 2 | 79 | 8 |
| `brown/integrals/reglas` | 1 | 41 | 9 |
| `blue/limits/infinite_limits` | 1 | 30 | 10 |
| `violet/derivatives/chain_rule` | 1 | 12 | 11 |
| `blue/limits/lateral_limits` | 0 | 51 | 12 |
| `blue/limits/definition` | 0 | 50 | 13 |
| `violet/derivatives/product` | 0 | 48 | 14 |
| `violet/derivatives/geometric_interpretation` | 0 | 47 | 15 |
| `blue/limits/continuity` | 0 | 44 | 16 |
| `brown/integrals/substitution` | 0 | 39 | 17 |
| `brown/integrals/definition` | 0 | 38 | 18 |
| `violet/derivatives/limit_definition` | 0 | 34 | 19 |
| `blue/limits/rationalization` | 0 | 28 | 20 |
| `brown/integrals/parts` | 0 | 26 | 21 |
| `blue/limits/factorization` | 0 | 25 | 22 |
| `brown/integrals/definite` | 0 | 22 | 23 |
| `violet/derivatives/differentiation_rules` | 0 | 21 | 24 |
| `violet/derivatives/quotient` | 0 | 11 | 25 |

(Números medidos recién en esta rama; volvé a correr el validador para el conteo vivo antes de
cada topic, sobre todo si ya corregiste alguno anterior — no hay solapamiento entre topics pero
sí conviene confirmar.)

---

## Meta: resolver o justificar (no forzar 0)

Cada warning se **corrige**, salvo que después de mirarlo con criterio decidas que el ejercicio
está bien como está. En ese caso lo dejás, pero **cada warning que quede se justifica en una
línea del mensaje de commit**. Todas las ERROR (regla 37 en `questions`) se corrigen siempre,
sin excepción — ahí no hay margen de criterio.

**Prohibido "gamear" el número.** El objetivo es que el ejercicio quede mejor, no que el
contador baje. Antipatrones concretos, no los repitas:

- Insertar `\n\n` en cualquier lado solo para partir un párrafo largo, sin que el corte respete
  un límite de oración real.
- Alargar los distractores con relleno que no aporta distracción, para emparejar longitud con
  la correcta.
- Cambiar `\dfrac`→`\frac` en un enunciado **sin** mover la fórmula a su bloque `$$`: eso no
  arregla la regla 18/35, solo cambia el tamaño; el defecto (fórmula tejida inline) sigue.
- Sacar el paréntesis de la regla 37 metiendo la aclaración entre comas o guiones sin
  integrarla de verdad a la prosa como cláusula propia — eso es forma, no fondo.
- Tocar el validador, el `topic-context.md` o cualquier doc de contexto para que el warning
  desaparezca. Son **solo lectura** durante esta tarea.

**⚠️ Aviso duro heredado de la ronda anterior.** El `\n\n` **nunca** puede quedar pegado a un
`$` o `$$` (eso es ERROR de otra regla). El formato exige un solo `\n` junto a las fórmulas
centradas; si el corte cae justo después de un bloque `$$`, agregá primero una oración de
cierre corta pegada al bloque con un solo `\n`, y recién después el `\n\n`.

---

## Catálogo de reglas

### `questions / 37` (ERROR) — paréntesis aclaratorio en el enunciado

**Qué mide.** Cualquier `(` fuera de zona matemática (`$...$`) en el `question`. Un dato dado
entre paréntesis (`"la probabilidad A (35%)"`, `"el complemento (1 menos P(A))"`) es una
aclaración disfrazada de notación. **Regla 37, nivel ERROR en `questions`.**

**Criterio.** Integrar la aclaración como cláusula propia de la prosa, sin paréntesis.

```
❌  Un polinomio de grado 3 (cúbico) tiene hasta 3 raíces reales.
✅  Un polinomio de grado 3, es decir cúbico, tiene hasta 3 raíces reales.

❌  Se sabe que $f(2) = 5$ (el valor de la función en $x=2$).
✅  Se sabe que $f(2) = 5$, el valor de la función cuando $x=2$.
```

Es el bloque de trabajo más grande y el único con ERROR real: arrancá cada topic por acá.

### `explanations` y `feedbacks` / 37 (WARNING) — mismo defecto, otros campos

Igual que arriba, pero en `explanation` o `feedback_correct`/`feedback_incorrect`. Mismo
criterio de reescritura; acá es warning porque son campos de refuerzo, no la pregunta en sí,
pero corregilo igual salvo que el paréntesis sea genuinamente matemático (nunca lo es si cae
fuera de un `$...$`).

### `questions` y `explanations` / 18 y 35 — fórmula/ecuación tejida inline

**Qué mide.** Dos variantes de la misma raíz:
- **Regla 18**: una fracción (`\dfrac`/`\frac`) tejida dentro de la oración en vez de tener su
  propio bloque `$$`.
- **Regla 35**: (a) una ecuación con `=` tejida inline cuyo render mide más de 18 caracteres —
  ya es lo bastante ancha como para merecer bloque propio; o (b) una fórmula tejida inline que
  **además** se repite en un bloque `$$` del mismo campo (redundancia).

**Criterio.** Sacá la fórmula a su propio bloque `$$...$$`, con texto propio antes y/o después.
Si el caso es (b) — fórmula repetida — no la dupliques: nombrala en prosa una sola vez, y el
bloque `$$` queda como la única aparición completa.

```
❌  En $f(x) = \dfrac{x^2 - 1}{x - 1}$, ¿para qué valor de $x$ no está definida?
✅  Considerá la función:\n$$f(x) = \frac{x^2 - 1}{x - 1}$$\n¿Para qué valor de $x$ no está definida?

❌  Para $a^2 \pm 2ab + b^2 = (a \pm b)^2$ notamos que...\n$$a^2+2ab+b^2=(a+b)^2$$
✅  Para el trinomio cuadrado perfecto notamos que...\n$$a^2+2ab+b^2=(a+b)^2$$
```

**⚠️ Aviso.** No repitas el mismo texto guía (`Considerá la función:`) en 3+ ejercicios del
mismo archivo, eso crea warnings de repetición de apertura (regla 32, ya vigente). Variá:
"Partiendo de:", "Para la función:", "Dada:", etc.

### `questions` / 21 — 3+ fragmentos LaTeX inline en el mismo tramo

**Qué mide.** Cantidad de `$...$` sueltos tejidos en un mismo tramo de prosa del enunciado
(umbral: 3+). **Regla 21.**

**Criterio.** (a) dividir el tramo en párrafos más cortos con `\n\n` cuando los inline están
repartidos en varias oraciones, o (b) sacar la fórmula central a un bloque `$$` cuando es una
sola oración densa.

```
❌  Si $f(x) = 2x+1$, $g(x) = x-3$ y $h(x)=f(g(x))$, ¿cuánto vale $h(4)$?
✅  Considerá $f(x) = 2x+1$ y $g(x) = x-3$.\n¿Cuánto vale $h(4) = f(g(4))$?
```

### `questions` / 36 — párrafo >130 chars, o pregunta pegada al planteo

**Qué mide.** Dos variantes:
- Un tramo de prosa del enunciado (sin contar LaTeX) de más de 130 caracteres — el umbral es
  más estricto que el de `explanation` (200) porque se lee bajo presión de tiempo.
- La pregunta `¿...?` encadenada en la misma oración/tramo que el planteo, en vez de tener su
  propio tramo tras un `\n\n` o un bloque `$$`.

**Criterio.** Cortar con `\n\n` en un límite de oración real (nunca a mitad de idea), dejando
la pregunta como su propio párrafo final. Si el planteo es una sola oración larga y no admite
corte limpio, reescribirla más corta en vez de partirla a la fuerza.

```
❌  Una función no está definida en $x=4$, pero para todo valor cercano se acerca a $9$, ¿cuál es el límite cuando $x \to 4$?
✅  Una función no está definida en $x=4$, pero para todo valor cercano se acerca a $9$.\n\n¿Cuál es el límite cuando $x \to 4$?
```

### `questions` / 38 — bloque display ancho sin `aligned`, o cadena de 3+ `=`

**Qué mide.** Un bloque `$$...$$` sin `\begin{aligned}` que renderiza demasiado ancho (>40
caracteres de render), típicamente una función a trozos (`\begin{cases}...\end{cases}`) o una
cadena de 3+ igualdades en una sola línea. **Regla 38.**

**Criterio.** Verticalizar: partir en pasos (`$$a=b$$` seguido de `$$b=c$$`, cada uno con su
propio `\n`) o pasar a `\begin{aligned}` cuando el contenido son varias ramas de una función a
trozos.

```
❌  $$f(x) = \begin{cases} 2x + 1, & x < 1 \\ x^2 + 2, & x \geq 1 \end{cases}$$  ← 44 chars de render, sin aligned
✅  $$f(x) = \begin{aligned} &2x + 1, && x < 1 \\ &x^2 + 2, && x \geq 1 \end{aligned}$$
```

(Revisá el render exacto con el validador: el umbral es de caracteres renderizados, no de
caracteres de la fuente LaTeX — los `\\`, `&`, `\begin{cases}` no cuentan igual que texto
visible.)

### `structure / tags` — distribución de sub-familias

**Qué mide.** El validador compara el conteo de cada slug de `tags` contra la tabla de
distribución del `topic-context.md`. **234 casos en total, 207 son MENOS y 27 son MÁS.**

**Criterio, en dos casos:**
- **Slug con MENOS ejercicios que el target** (la gran mayoría, todo `blue`/`violet`/`brown` y
  parte de `white`): es el gap normal de generación parcial. **Se ignora**, justificándolo en
  una línea del commit si tocaste ese archivo por otra razón.
- **Slug con MÁS ejercicios que el target**: pasa **solo en `white`**, que ya está en sus
  conteos finales — 27 casos concretos, todos en `white/functions` (ej.
  `logarithmic/FORM evaluar-f: 35 vs 12`, `polynomial/GRAF grafico-a-formula: 15 vs 7`). Ahí
  hay un desbalance real: **re-etiquetá** los ejercicios mal clasificados hacia las
  sub-familias sub-representadas de la misma skill, o si un ejercicio genuinamente no encaja en
  ningún slug faltante, reescribí su enfoque para que cubra uno de los que faltan. **Sin
  cambiar la cantidad total del archivo.** Hacelo al final de cada topic de `white`, después de
  cerrar los warnings de formato — corré `--check structure` para ver la lista completa de esos
  27 casos por topic.

---

## Verificación final (una vez cerrados todos los topics)

1. `python seed_content.py --course analisis --prune` desde `backend/` (limpia filas viejas si
   cambió la cantidad de ejercicios de algún ítem — no debería, pero es la red de seguridad).
2. `python content/validate_content.py --course analisis`: confirmar **0 ERRORS** en todo el
   curso, y cada WARNING restante justificado en algún commit.
3. `python content/validate_content.py --course probabilidad` y `--course algebra`: correr
   como red de seguridad, **no se tocan** esos cursos en esta tarea, solo confirmar que no se
   rompió nada por compartir `validate_content.py`.
4. Push de la branch `content-analisis-round2` — el PR hacia `staging` ya está abierto, tus
   commits aparecen ahí solos.

Sin merge a `staging` por tu cuenta: dejá el PR listo para que lo revisen.
