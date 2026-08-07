# Decisiones, CLSF.json (topic: white/conteo/variaciones)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| reconocer-variacion | 6 | 1 | 5 | 6 |
| distractor-combinacion | 5 | 1 | 4 | 5 |
| distractor-permutacion | 2 | 1 | 1 | 2 |
| distractor-regla-producto | 2 | 1 | 1 | 2 |
| **Total** | **15** | 4 | 11 | **15** |

## Contextos usados

- `reconocer-variacion` (5 nuevos): cargo distinto (club de fotografía, presidente/vicepresidente), podio parcial (carrera de 10, medallas oro/plata/bronce a 3), franja de bandera (9 colores, 4 franjas), código con posiciones distintas (clave de 3 dígitos entre 10), cargo distinto (equipo de debate, capitán/vicecapitán). Con el ejercicio ya existente (cargo, empresa director/subdirector) queda: cargo 3/6 (50%, algo por encima del ~30% recomendado, ver *Decisiones de contenido*), podio 1/6, franja 1/6, código 1/6.
- `distractor-combinacion` (4 nuevos): comité sin roles (12 profesores, 3 integrantes), pote mixto sin orden (heladería, 2 sabores de 6), donación sin orden (biblioteca, 4 libros de 10), representación sin roles (clase de 14, 3 estudiantes). Con el existente (curso, 2 representantes) todos describen situaciones "sin roles/sin orden" variando el objeto concreto, sin repetir el mismo escenario.
- `distractor-permutacion` (1 nuevo): reparto de tareas del hogar entre una familia de 6 (usa todos los elementos, $k=n$), distinto del existente (carrera con 5 corredores asignando los 5 puestos).
- `distractor-regla-producto` (1 nuevo): clave de 4 dígitos con repetición libre, distinto del existente (examen de opción múltiple con 4 opciones repetibles).

## Decisiones de contenido

- El topic-context.md no lista una tabla genérica de "Contextos variados" para `variaciones` (a diferencia de otros topics); en su lugar define una sección "Contextos válidos" con 4 categorías cerradas (cargos distintos, podios parciales, franjas de bandera, códigos con posiciones distintas). Se usaron esas 4 categorías como base de rotación. Con solo 6 ejercicios en `reconocer-variacion` y 4 categorías disponibles, la categoría "cargo distinto" terminó en 3/6 (50%) en vez de rondar el ~30% recomendado por la regla 43 de `authoring-context.md`; se aceptó porque cada instancia usa un objeto/rol concreto distinto (empresa director/subdirector, club de fotografía presidente/vicepresidente, equipo de debate capitán/vicecapitán) y las otras 3 categorías (podio, franja, código) sí aparecen exactamente 1 vez cada una, cubriendo toda la variedad de contextos válidos del topic.
- Dos ejercicios nuevos de `distractor-combinacion` (comité de 12 profesores y clase de 14 estudiantes) tenían inicialmente la opción "No, porque..." notablemente más larga que la opción "Sí, porque..." (regla crítica 4/15, warning de paridad de longitud). Se acortó el texto de la opción "No" quitando la coda redundante "entre ellos" (ya implícita en "no tienen roles distintos"), sin cambiar el significado.
- Para cerrar el error de estructura `correct_index` (más del 50% de los 15 ítems en `correct_index=0`), se reordenaron las 2 opciones de los ejercicios binarios "clase de 14 estudiantes" (`distractor-combinacion`) y "código de 4 dígitos" (`distractor-regla-producto`), moviendo la opción correcta de índice 0 a índice 1 (mismo contenido, solo cambia el orden de presentación y el índice paralelo de `feedback_incorrect`).
- Sin desvíos adicionales del plan: los 4 ejercicios existentes no se tocaron (solo el acortamiento de longitud y el reordenamiento de opciones ya descriptos, que no cambian su contenido matemático ni redacción sustantiva).

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic white/conteo/variaciones` corre en 0 ERRORS y 0 WARNINGS para los 3 ítems del topic tras las correcciones.
