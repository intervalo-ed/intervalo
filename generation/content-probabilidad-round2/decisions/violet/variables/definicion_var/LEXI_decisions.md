# Decisiones, LEXI.json (topic: violet/variables/definicion_var)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| definicion-variable-aleatoria | 6 | 1 | 5 | 6 |
| definicion-discreta-continua | 5 | 1 | 4 | 5 |
| definicion-soporte | 4 | 1 | 3 | 4 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

`LEXI` queda mayormente en abstracto por diseño del topic (sus 3 sub-familias
evalúan vocabulario/definición formal), salvo `definicion-soporte`, que sí usa
una ilustración concreta sin que sea el foco de la pregunta:

- **definicion-variable-aleatoria** (5 nuevos): todos abstractos, centrados en
  la notación $X:\Omega\to\mathbb{R}$ y la distinción función/evento/resultado/
  experimento (símbolo $\Omega$ en la notación, evento vs. variable, "$X$" como
  función vs. valor puntual en el contexto de dos dados, dominio de $X$,
  codominio declarado vs. soporte efectivo).
- **definicion-discreta-continua** (4 nuevos): abstractos, sobre la definición
  de discreta, de continua, si una discreta puede tener decimales, y qué
  significa "contable".
- **definicion-soporte** (3 nuevos): moneda lanzada dos veces (dominio de $X$),
  ruleta de 4 sectores (soporte), urna con 5 bolillas numeradas (soporte). El
  ejercicio ya existente usaba el dado; ningún contexto se repite dentro de la
  sub-familia (4 ejercicios, 4 contextos distintos: dado, moneda, ruleta,
  urna), por debajo del tope de ~30%.

## Decisiones de contenido

- Todos los ejercicios nuevos reintroducen la notación $X:\Omega\to\mathbb{R}$
  o la definición de discreta/continua en la propia `explanation` (regla
  crítica 31), aunque ya haya aparecido en otro ejercicio del ítem.
- `correct_index` se redistribuyó activamente moviendo la opción correcta a
  distintas posiciones (reordenando `options` + `feedback_incorrect` en
  paralelo) para evitar que quedara constante en 0 en todo el archivo, que es
  lo que hubiera pasado con la redacción inicial de los 12 ejercicios nuevos.
  Distribución final del archivo completo: índice 0 → 7, índice 1 → 4, índice
  2 → 4.
- Varios ejercicios se redactaron primero con párrafos de `explanation` que
  superaban los 200 caracteres por tramo de prosa, o con 3+ fragmentos LaTeX
  inline en el mismo tramo (regla 21); se dividieron en más párrafos cortos
  (`\n\n`) sin cambiar el contenido matemático. Un ejercicio (dominio de $X$)
  tenía una opción "solamente" que no encontraba equivalente en las otras dos,
  violando la regla de paridad; se sacó la palabra de relleno.
- Sin desvíos del plan del `topic-context.md` más allá de lo ya descrito.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic
violet/variables/definicion_var` corre con 0 ERRORS y 0 WARNINGS sobre los 2
ítems del topic.
