# Decisiones, ESTR.json (topic: blue/probabilidad/condicional)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `reconocer-condicional` | 6 | 1 | 5 | 6 |
| `distractor-probabilidad-simple` | 4 | 1 | 3 | 4 |
| `reconocer-direccion-condicional` | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- `reconocer-condicional`: encuesta transporte público (ya había) → encuesta streaming/reseñas, dado (par/mayor a 4), moneda (dos tiradas, al menos una cara), cartas (mazo reducido, figura/espadas), tabla de contingencia (clientas/versión premium). 5 nuevos, cubriendo los 5 contextos base del topic; "encuesta" aparece 2/6 (33%, dentro del ~30% aproximado que marca la regla).
- `distractor-probabilidad-simple`: curso/aprobación (ya había, contexto general no listado en la tabla del topic) → dado, cartas (mazo reducido, ases), tabla de contingencia (empleados/producción). 3 nuevos, todos distintos entre sí.
- `reconocer-direccion-condicional`: empresa/turno mañana-comedor (ya había, contexto general no listado en la tabla del topic) → cartas (rojas/figuras), dado (par/mayor a 4), encuesta (deporte/dieta), tabla de contingencia (fumadores/tos crónica). 4 nuevos, todos distintos entre sí.

## Decisiones de contenido

- Los 3 ejercicios preexistentes (`reconocer-condicional` #0, `distractor-probabilidad-simple` #1, `reconocer-direccion-condicional` #2) usan contextos generales (encuesta de transporte, curso, empresa) que no están textualmente en la lista de "dados, monedas, cartas, encuestas y tablas de contingencia 2x2" del `topic-context.md`, pero son válidos (encuesta y "empresa" caen dentro del espíritu de la lista). No se tocaron por ser ya contenido validado, no un problema real.
- En `reconocer-condicional`, con solo 5 contextos base disponibles para 6 ejercicios en la sub-familia, "encuesta" se repitió una vez (2/6, ligeramente por encima del ~30% literal pero dentro de la tolerancia "~30%" que marca la regla 43 de `authoring-context.md`); las otras 4 sub-familias del ítem no llegan a ese límite.
- El ejercicio de moneda (`reconocer-condicional`, "se lanzan dos monedas... al menos una salió cara") se diseñó como intersección/complemento explícitos (no como independencia): el evento condicionante "al menos una cara" y el evento de interés "las dos caras" se presentan como datos del enunciado, sin invocar ni mencionar independencia entre tiradas, respetando la regla dura del topic.
- Se corrigieron 2 warnings detectados por el validador tras la primera pasada, antes de la entrega final: (1) en el ejercicio de la tabla de clientas/premium, la opción correcta era notablemente más larga que las distractoras (regla 4), se acortó a "el subgrupo de referencia ya son las clientas mujeres"; (2) en el ejercicio del dado con "mayor a 4", el LaTeX usaba `\text{mayor a 4}` (3 palabras dentro de `\text{}`, regla 26), se reemplazó por notación matemática `X>4` en `options` y `explanation`; (3) dos enunciados (`streaming`/`reseñas` y `encuesta`/`deporte`) superaban el límite de 130 caracteres de prosa por párrafo (regla 36), se partieron en dos párrafos con `\n\n`.
- Sin otros desvíos del plan.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic blue/probabilidad/condicional` corre con 0 ERRORS y 0 WARNINGS sobre los 3 ítems del topic (incluido este archivo).
