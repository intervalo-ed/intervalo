# Decisiones, CLSF.json (topic: brown/distribuciones/binomial)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| reconocer-binomial | 6 | 1 | 5 | 6 |
| distractor-vecino | 5 | 1 | 4 | 5 |
| supuesto-violado | 4 | 1 | 3 | 4 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- **reconocer-binomial** (6): call center (ya existía), control de calidad (20 piezas, $p=0{,}05$), encuestas (15 personas, $p=0{,}5$), tiros libres (12 tiros, $p=0{,}75$), ruleta (8 tiradas, $p=0{,}45$), vacunación (18 pacientes, $p=0{,}02$). Los 6 contextos de la tabla usados una sola vez cada uno (más el call center preexistente, que no está en la lista oficial pero ya estaba seedeado y no se tocó).
- **distractor-vecino** (5): mazo de cartas (ya existía, hipergeométrica), envíos de correo (geométrica: "cuántos paquetes hasta el primero que llega tarde"), control de calidad (hipergeométrica: lote de 12 piezas con 4 defectuosas, 5 extraídas sin reposición), tiros libres (geométrica: tiros hasta el primer acierto), vacunación (hipergeométrica: grupo de 10 pacientes ya vacunados, 4 elegidos sin reposición). Alterna geométrica/hipergeométrica como pide el checklist del topic (2 geométrica, 2 hipergeométrica nuevas + 1 hipergeométrica preexistente = 3 hipergeométrica, 2 geométrica).
- **supuesto-violado** (4): arquero de penales (ya existía, $p$ depende del resultado anterior), vendedor de telemarketing (mismo mecanismo: $p$ depende de si la llamada anterior terminó en venta), jugador de básquet que se cansa ($p$ baja de forma determinística con el número de tiro, no depende del resultado anterior), máquina que se desgasta (mismo mecanismo que el jugador cansado, aplicado a control de calidad). Se varió el mecanismo de violación entre "depende del resultado anterior" (arquero, vendedor) y "se degrada con el índice del ensayo, sin importar el resultado" (jugador cansado, máquina desgastada) para no repetir siempre la misma historia de fondo.

## Decisiones de contenido

- El contexto "call center" del ejercicio preexistente no figura textual en la tabla de "Contextos variados" del `topic-context.md` (que lista control de calidad, encuestas, tiros libres, ruleta, vacunación, envíos de correo). Se dejó intacto por instrucción explícita de no tocar ejercicios ya existentes, y se completó la sub-familia con los 6 contextos oficiales de la tabla para los ejercicios nuevos.
- En `distractor-vecino`, los números de la hipergeométrica ($N$, $K$, $n$) y de la binomial/geométrica que aparecen como distractor en el mismo ejercicio se mantuvieron chicos (poblaciones de 8 a 12) para que $\binom{n}{k}$ no generara valores que se puedan descartar a ojo por magnitud, siguiendo la regla de $n$ acotado del topic.
- Todos los `correct_index` se redistribuyeron (incluidos los 3 ejercicios preexistentes, que originalmente tenían los 3 en índice 0) reordenando `options` y `feedback_incorrect` en paralelo, para cumplir la regla de balance de `correct_index` (máx. 50% en un mismo índice). Quedó: índice 0 en 7/15, índice 1 en 4/15, índice 2 en 4/15.
- Sin otros desvíos del plan.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/binomial` corre en 0 ERRORS / 0 WARNINGS sobre ambos archivos del topic tras las correcciones de párrafo y de balance de `correct_index`.
