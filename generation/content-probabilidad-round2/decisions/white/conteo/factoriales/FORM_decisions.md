# Decisiones, FORM.json (topic: white/conteo/factoriales)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `expansion-directa` | 4 | 1 | 3 | 4 |
| `cociente-simplificado` | 4 | 1 | 3 | 4 |
| `relacion-recursiva` | 3 | 1 | 2 | 3 |
| `casos-especiales` | 2 | 1 | 1 | 2 |
| `suma-resta-factoriales` | 2 | 1 | 1 | 2 |
| **Total** | **15** | **5** | **10** | **15** |

## Contextos usados

Este topic es explícitamente **sin contexto narrativo** ("Frontera con el
resto de la unidad" en `topic-context.md`: son manipulaciones y evaluaciones
directas de la expresión $n!$, sin personas ni objetos a ordenar/elegir). No
hay tabla de "Contextos variados" que rotar; la variedad se logró variando el
**valor de $n$** usado en cada ejercicio nuevo, sin repetir ninguno ya usado
en el mismo sub-tipo:

- `expansion-directa`: $n=4$, $n=6$, $n=7$ (existía $n=5$).
- `cociente-simplificado`: $6!/4!$, $7!/4!$, $5!/3!$ (existía $8!/6!$).
- `relacion-recursiva`: $5!$ a partir de $4!$, $8!$ a partir de $7!$ (existía $7!$ a partir de $6!$).
- `casos-especiales`: $1!-0!$ (existía $0!+1!$; misma pareja de constantes, única combinación posible en esta sub-familia de solo 2 valores, cambiando suma por resta).
- `suma-resta-factoriales`: $6!+2! \overset{?}{=} 8!$ (existía $4!+3! \overset{?}{=} 7!$).

## Decisiones de contenido

- **$n$ acotado a $\leq 8$ y elegido para evitar warnings de ancho.** Se
  midió `render_len` de las opciones (regla 4, umbral `MIN_ABS_GAP=5`) y del
  bloque display de la `explanation` (regla 38, `DISPLAY_RENDER_MAX=40`)
  antes de fijar los valores de $n$ para `expansion-directa`. Con $n=8$ la
  opción correcta (`$8\times7\times6\times5\times4\times3\times2\times1$`,
  36 chars de render) superaba el límite de 35 de la regla 39 además de la
  regla 4; se descartó $n=8$ y se usó $n=7$ en su lugar (ver *Warnings que
  quedaron*, igual quedó con warning menor).
- **`casos-especiales` reutiliza los mismos dos valores ($0!$, $1!$) que el
  ejercicio existente**, porque es la única sub-familia cuyo dominio son
  literalmente esos dos casos especiales (no hay un tercer valor "especial"
  disponible); se varió la operación (resta en vez de suma) para no
  duplicar el ejercicio.
- `correct_index` de los 10 ejercicios nuevos se distribuyó explícitamente
  para balancear el archivo completo: los 5 ejercicios preexistentes ya
  concentraban 4/5 en `correct_index=0`. Se reordenaron `options` +
  `feedback_incorrect` en paralelo (nunca se tocó su contenido, solo el
  orden) para que el archivo completo quedara en `{0: 7, 1: 3, 2: 3, 3: 2}`
  sobre 15 ítems, dentro del máximo de 50% que exige el validador
  (`structure: regla correct_index`).
- Sin otros desvíos del plan.

## Warnings que quedaron

- `options` (regla 4), ítem `expansion-directa` con $n=6$: la opción
  correcta (`$6\times5\times4\times3\times2\times1$`, render 26) es
  notablemente más larga que la mediana de los distractores (6). Es
  inherente a la sub-familia: pedir la expresión expandida completa de un
  factorial de 6 términos siempre va a ser más larga que un distractor
  corto tipo `$6^{6}$` o `$6\times5$`. Reducir $n$ más allá de lo ya hecho
  (had $n=4$ sin warning) recorta la variedad de la sub-familia.
- `options` (regla 4) y `explanations` (regla 38), ítem `expansion-directa`
  con $n=7$: mismo motivo que el anterior, ya en el límite superior antes de
  cruzar el umbral duro de la regla 39 (que sí se evitó descartando $n=8$).
  Aceptado porque $n\leq 8$ es la única restricción dura del topic y $n=7$
  la cumple; forzar $n$ más chico en las 3 sub-familias de
  `expansion-directa` (ya usa 4, 5, 6, 7) haría el ítem menos variado sin
  eliminar el patrón (el warning reaparece en cualquier $n\geq6$ por el
  propio diseño de la sub-familia, que exige mostrar el producto completo).

## Ejercicios existentes con problema real

Ninguno encontrado en `FORM.json`. Los 5 ejercicios preexistentes (uno por
sub-familia) están correctos y se usaron como referencia de formato; no se
modificaron.
