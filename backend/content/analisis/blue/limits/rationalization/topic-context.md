# Topic: rationalization (Racionalización)

Belt: `blue`, Unit: `limits`, Topic: `rationalization`

Skills en este topic: `LEXI`, `RESL`. **50 ítems cada uno (100 en total)** al cerrar el refactor.

**Estado.** Este tópico reemplaza a `racionalizacion` (rename ES→EN). La carpeta fue renombrada (`blue/limits/rationalization/`) y los `external_id` se van a regenerar en la próxima seed (`blue_rationalization_lexi_01…`), lo que rompe el progreso guardado en DB — asumido y aceptado. Los ejercicios viejos (`ESTR`, `RESL`) se dejan tal cual en el folder por ahora; el refactor a la nueva distribución se hace en otro turno. **Nota**: el folder no tiene `LEXI.json` todavía (se creará al generar los 50 ítems nuevos del refactor).

Este doc especifica el alcance nuevo, las reglas duras de restricción y la distribución objetivo por skill.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** **sustitución directa**, diagnóstico de la **indeterminación** $\tfrac{0}{0}$, concepto general de **límite**, y el método de **factorización** (diferencia de cuadrados, factor común) del tópico anterior.
- **Lo que está aprendiendo acá:** el concepto de **conjugado** de una expresión con raíz cuadrada, la aplicación de la **identidad fundamental** $(\sqrt{u} - c)(\sqrt{u} + c) = u - c^2$ para quebrar la raíz, y la simplificación algebraica tras la racionalización.
- **Lo que NO sabe todavía:** regla de L'Hôpital, derivadas, racionalización con **raíces cúbicas** (fuera del alcance de este cinturón), conjugados complejos, raíces anidadas.

### Regla dura de restricción

**Está prohibido** usar o mencionar en enunciados, opciones, feedback y explicaciones:

- **Regla de L'Hôpital**.
- **Derivadas** en cualquier forma.
- **Raíces cúbicas** ($\sqrt[3]{\cdot}$) o índices mayores que $2$.
- **Raíces anidadas** ($\sqrt{\sqrt{\cdot}}$) o expresiones con dos raíces cuadradas distintas en el mismo lado del cociente.
- **Conjugados complejos** (con $i$).

La única técnica permitida para salvar la indeterminación $\tfrac{0}{0}$ acá es **multiplicar numerador y denominador por el conjugado** de la expresión con raíz cuadrada, aplicar la **diferencia de cuadrados**, cancelar el factor común $(x - a)$ y sustituir.

Los ítems que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 2 skills)

Reglas de authoring que se aplican al escribir los 100 ítems:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`: (a) concepto algebraico aplicado (diagnóstico visual: veo raíz + $\tfrac{0}{0}$ → racionalizar), (b) desarrollo formal en `\begin{aligned}` (multiplicar por conjugado → diferencia de cuadrados → cancelación → sustitución), (c) cierre con la evaluación final o advertencia técnica. Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (estrictamente prohibido en todo el contenido)**, sin humor.
3. **Economía del feedback**: `feedback_correct` directo ("Al multiplicar por el conjugado obtenemos $X$, cancelamos $Y$, y el límite resulta $Z$"). **No** volcar el álgebra completa ahí; el desarrollo va en `explanation` con `\begin{aligned}`.
4. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Voz descriptiva en segunda persona amable ("revisá el signo al aplicar la diferencia de cuadrados", "fijate que…"). Nunca "el alumno confunde…".
5. **Negrita en primera mención** de conceptos clave: **racionalización**, **conjugado**, **diferencia de cuadrados**, **indeterminación**, **factor común**. Nunca negritas dentro de `options`.
6. **Carga cognitiva**: números que caen en cuadrados perfectos chicos ($4, 9, 16, 25$), tendencias en enteros, sin cálculos aritméticos pesados en la sustitución final. Evaluamos el álgebra del conjugado, no aritmética.
7. **Ortotipografía**: decimales con **coma** (`4,3`). Usar "valor" para coordenadas de $x$ y "función" en lugar de "curva" / "trazo" cuando se habla del objeto matemático.
8. **`correct_index` variado**, no concentrado en un solo índice.

---

## `feedback_incorrect` en los 100 ítems

Completar con `array<string|null>` paralelo a `options`, `null` en el índice correcto. Voz descriptiva del concepto, en segunda persona amable. Una oración por distractor, autosuficiente.

---

## LEXI, 50 ítems

### Qué evalúa
Reconocimiento visual del **conjugado**, afianzamiento de la **identidad de diferencia de cuadrados** aplicada a raíces, y justificación algebraica de la técnica (por qué "arriba y abajo", cuándo aplicarla).

### Cardinalidad
**Exactamente 3 opciones** por ítem.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Identificación del conjugado | Dada una expresión con raíz (ej. $\sqrt{x + 4} - 2$), elegir su conjugado exacto. **Cuidar**: el signo interno de la raíz no se altera, solo se invierte el signo entre los dos términos externos. | `identificacion-del-conjugado` | 15 |
| B. Identidad fundamental | Evaluar el resultado abstracto de multiplicar una raíz por su conjugado. Confirmar que $(\sqrt{u} - c)(\sqrt{u} + c) = u - c^2$; identificar el resultado en casos concretos. | `identidad-fundamental-conjugado` | 15 |
| C. Diagnóstico de técnica | Distinguir cuándo corresponde **racionalizar** (hay raíz cuadrada + $\tfrac{0}{0}$) y cuándo **factorizar** (no hay raíz, solo polinomios). Un caso híbrido también puede requerir ambas. | `diagnostico-racionalizar-vs-factorizar` | 10 |
| D. Propósito lógico | Preguntas teóricas: por qué se multiplica arriba **y** abajo (para multiplicar por $1$, no alterar la función), cuál es el objetivo de quebrar la raíz (liberar el factor $(x - a)$ para cancelar), qué pasa si multiplico solo el numerador. | `proposito-logico-conjugado` | 10 |

### `feedback_incorrect`, confusiones fuente
- **Conjugado con signo interno alterado**: para $\sqrt{x + 4} - 2$ dar $\sqrt{x - 4} + 2$ (invertir el signo dentro de la raíz). Recordar: el conjugado invierte solo el signo entre los dos términos externos, no dentro del radicando.
- **Conjugado con la raíz eliminada**: dar $(x + 4) + 2$ como conjugado de $\sqrt{x + 4} - 2$. El conjugado mantiene la raíz; lo que se elimina aparece **después** de multiplicar y aplicar la diferencia de cuadrados.
- **Identidad $(a - b)^2$ confundida con $(a - b)(a + b)$**: pensar que el producto por el conjugado da un cuadrado del binomio y no una diferencia de cuadrados. La suma de los términos internos se cancela, no se duplica.
- **Racionalización sin $\tfrac{0}{0}$**: proponer racionalizar cuando la sustitución directa da un valor finito. La racionalización se aplica solo si la sustitución directa da indeterminación.
- **Multiplicar solo el numerador**: proponer transformar solo la parte de arriba sin la de abajo. Eso **cambia** la función; hay que multiplicar por $\tfrac{\text{conjugado}}{\text{conjugado}}$ para que sea multiplicar por $1$.
- **Factorización propuesta con raíz presente**: elegir "factorizar por diferencia de cuadrados $x^2 - a^2$" cuando la expresión tiene $\sqrt{x} - a$. La diferencia de cuadrados como técnica de factoreo no rompe raíces; hay que forzarla vía conjugado.

### Reglas específicas
- **Negrita en primera mención** de `racionalización`, `conjugado`, `diferencia de cuadrados`, `indeterminación`.
- Sub-A y sub-B trabajan con expresiones simbólicas simples ($\sqrt{u} \pm c$); sub-C y sub-D son teóricas puras.
- **Textos exactos** en opciones de diagnóstico (sub-C): `"Factorizar"`, `"Racionalizar"`, `"Sustitución directa"`, `"Indeterminación no resoluble"`.
- **Nunca** insinuar que se puede resolver una raíz cúbica con la misma técnica del conjugado cuadrático (fuera de alcance).

---

## RESL, 50 ítems

### Qué evalúa
Ejecutar la **multiplicación por el conjugado**, simplificar la **diferencia de cuadrados**, cancelar el factor común $(x - a)$ y evaluar el límite por sustitución directa.

### Cardinalidad
**Exactamente 4 opciones** por ítem (grilla 2×2). Valores numéricos cortos (**$\leq 35$ caracteres**).

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Raíz en el numerador | Límites donde la indeterminación viene de una raíz en la parte superior. Ejemplo: $\lim_{x \to 0} \tfrac{\sqrt{x + 9} - 3}{x}$. Multiplicar por conjugado del numerador. | `raiz-en-el-numerador` | 20 |
| B. Raíz en el denominador | Límites donde el conjugado se aplica para limpiar la parte inferior. Ejemplo: $\lim_{x \to 4} \tfrac{x - 4}{\sqrt{x} - 2}$. Multiplicar por conjugado del denominador. | `raiz-en-el-denominador` | 20 |
| C. Cancelación con signos ocultos | Límites donde, tras racionalizar, el factor resultante tiene signos invertidos y hay que extraer un $-1$ para poder cancelar. Ejemplo: $\lim_{x \to 4} \tfrac{4 - x}{\sqrt{x} - 2}$: $4 - x = -(x - 4)$. | `cancelacion-signos-ocultos` | 10 |

### `feedback_incorrect`, confusiones fuente
- **Multiplicar solo arriba o solo abajo**: al racionalizar el numerador, no multiplicar el denominador por el mismo conjugado. La fracción $\tfrac{\text{conjugado}}{\text{conjugado}} = 1$; si se rompe, se cambia la función.
- **Signo de la diferencia de cuadrados invertido**: en $(\sqrt{x + 9} - 3)(\sqrt{x + 9} + 3)$ dar $(x + 9) + 9$ o $9 - (x + 9)$. Es $(x + 9) - 9 = x$.
- **Cancelar antes de completar la diferencia de cuadrados**: cancelar $\sqrt{x}$ con $\sqrt{x}$ dentro de la raíz. No se puede: primero hay que aplicar la identidad completa.
- **Olvidar el factor cancelable en la sustitución**: sustituir $x = a$ en el cociente **sin** cancelar el factor $(x - a)$, obtener $\tfrac{0}{\text{algo}}$ o $\tfrac{\text{algo}}{0}$. Cancelar primero, sustituir después.
- **No manejar el signo oculto en sub-C**: en $\lim_{x \to 4} \tfrac{4 - x}{\sqrt{x} - 2}$ dar $+4$ olvidando que $4 - x = -(x - 4)$: el resultado va con signo menos.
- **Racionalizar por el conjugado del lado equivocado**: en un límite donde la raíz está en el numerador, multiplicar por el conjugado del denominador. La estrategia estándar es racionalizar el lado donde está la raíz que genera la indeterminación.
- **Aritmética final invertida**: tras cancelar y sustituir, resolver mal el cociente (típico: $\tfrac{1}{2\sqrt{a}}$ con signo o denominador mal armado).

### Reglas específicas
- **Cociente con $\tfrac{0}{0}$ obligatorio** en el enunciado (verificar por sustitución directa). Si no hay indeterminación, el ejercicio no pertenece a este tópico.
- **Al menos una raíz cuadrada** en la expresión (si no hay raíz, va a `factorization`).
- **Números que caen en cuadrados perfectos chicos**: radicandos que resultan en $\sqrt{4} = 2$, $\sqrt{9} = 3$, $\sqrt{16} = 4$, $\sqrt{25} = 5$ tras sustituir.
- **Explicaciones con `\begin{aligned}`** mostrando: diagnóstico → multiplicación por conjugado → diferencia de cuadrados → cancelación → sustitución. Una línea por paso.
- **Resultado numérico final** en las opciones (nunca una expresión sin evaluar).
- **Ninguna aplicación de L'Hôpital**; ninguna factorización adicional más allá de la diferencia de cuadrados forzada.
- **Decimales con coma** (`4,3`).

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 2 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna mención de L'Hôpital, derivadas, raíces cúbicas, raíces anidadas ni conjugados complejos
- [ ] Explicaciones en 3 párrafos de prosa; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `feedback_correct` conciso; desarrollo completo en `explanation` con `\begin{aligned}`
- [ ] `correct_index` variado
- [ ] Radicandos que dan cuadrados perfectos chicos; sin nombres propios
- [ ] Decimales con coma

**LEXI:**
- [ ] 50 ítems; **exactamente 3 opciones** por ítem
- [ ] Distribución A/B/C/D respetada (15/15/10/10)
- [ ] Negrita en primera mención de `racionalización`, `conjugado`, `diferencia de cuadrados`, `indeterminación`
- [ ] Textos exactos en opciones de diagnóstico (`"Factorizar"`, `"Racionalizar"`, `"Sustitución directa"`, `"Indeterminación no resoluble"`)

**RESL:**
- [ ] 50 ítems; **exactamente 4 opciones** por ítem, cada opción $\leq 35$ caracteres
- [ ] Distribución A/B/C respetada (20/20/10)
- [ ] Todo enunciado presenta $\tfrac{0}{0}$ por sustitución directa **y** al menos una raíz cuadrada (verificado)
- [ ] Explicaciones con la secuencia diagnóstico → conjugado → diferencia de cuadrados → cancelación → sustitución
- [ ] Ningún resultado dejado como expresión sin evaluar
- [ ] Sub-C con el paso de extracción de $-1$ documentado en la explicación
- [ ] Ninguna aplicación de L'Hôpital ni factorización de polinomios sin raíces
