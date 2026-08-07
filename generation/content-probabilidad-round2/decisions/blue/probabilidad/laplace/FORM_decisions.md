# Decisiones, FORM.json (topic: blue/probabilidad/laplace)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `formula-conteo-simple` | 5 | 1 | 4 | 5 |
| `formula-con-combinaciones` | 4 | 1 | 3 | 4 |
| `formula-con-complemento` | 4 | 1 | 3 | 4 |
| `reconocer-no-equiprobable` | 2 | 1 | 1 | 2 |
| **Total** | **15** | 4 | 11 | **15** |

## Contextos usados

- `formula-conteo-simple` (ya había: dado, múltiplo de 3): nuevos en moneda(s) x2 (dos monedas, una cara), mazo español (palo de oro), urna con 3 colores (bolita verde), rifa numérica (múltiplo de 5). Ningún contexto se repite más de una vez entre los 4 nuevos (25% cada uno).
- `formula-con-combinaciones` (ya había: comité de personas): nuevos en urna con bolitas (6 rojas/4 azules, extracción de 3), equipo de estudiantes (12 con 5 de primer año, equipo de 4), mazo español (extracción de 3 cartas, palo de copa). Sin repetición de contexto entre los 3 nuevos.
- `formula-con-complemento` (ya había: dado repetido 3 tiradas): nuevos en moneda repetida (4 tiradas, al menos una cruz), mazo español (extracción de 3 cartas sin reposición, al menos un rey vía combinatoria + complemento), caja de piezas (20 piezas/5 defectuosas, al menos una defectuosa vía combinatoria + complemento). Sin repetición de contexto entre los 3 nuevos.
- `reconocer-no-equiprobable` (ya había: urna con bolitas de distinto tamaño): nuevo en dado cargado (sesgo hacia el 6), contexto distinto al ya existente.

## Decisiones de contenido

- Para `formula-con-complemento` se usaron dos variantes: complemento aplicado a ensayos repetidos independientes (moneda, ya había dado) y complemento aplicado sobre un conteo con combinaciones (mazo, caja de piezas), para cubrir ambas mecánicas que puede pedir la sub-familia según el `topic-context.md` ("Reconocer que Laplace no aplica" no se solapa; esta es la familia de complemento, distinta).
- En los dos ejercicios de complemento con combinatoria (rey en 3 cartas, pieza defectuosa en 4), la `explanation` calcula el valor numérico de cada $\binom{n}{k}$ (ej. $\binom{36}{3}=7140$) en vez de dejar la fracción binomial repetida tejida inline y en el bloque display, para no violar la regla 35 de `authoring-context.md` (no repetir la misma fórmula abstracta tejida y en display). La `option` correcta se mantiene simbólica ($1-\binom{36}{3}/\binom{40}{3}$), coherente con que FORM pide la expresión, no el valor.
- En `formula-conteo-simple` y `formula-con-combinaciones` los rótulos `\text{}` dentro de los bloques display se acortaron a 1-2 palabras (ej. `\text{todas rojas}` en vez de `\text{las 3 rojas}`, `\text{primer año}` en vez de `\text{los 4 de primer año}`) para cumplir la regla 26 de `authoring-context.md` (nada de cláusulas largas dentro de `\text{}` en un bloque `$$`).
- El nuevo ejercicio de `reconocer-no-equiprobable` (dado cargado) usa un distractor de peso real ("el dado cargado deja de tener 6 caras posibles") en vez de una opción trivialmente absurda, siguiendo la regla del topic-context sobre distractores con peso real.
- Sin desvíos adicionales del plan.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic blue/probabilidad/laplace` corre con 0 ERRORS y 0 WARNINGS tras las correcciones (se corrigieron en el camino: reglas 9/10 de corte de oración alrededor de bloques `$$`, regla 26 de `\text{}` largo, regla 35 de fórmula repetida inline+display, y balance de `correct_index`).
