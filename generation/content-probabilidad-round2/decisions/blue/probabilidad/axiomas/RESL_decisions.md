# Decisiones, RESL.json (topic: blue/probabilidad/axiomas)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `resl-union-excluyentes` | 3 | 1 | 2 | 3 |
| `resl-union-general` | 4 | 1 | 3 | 4 |
| `resl-complemento` | 4 | 1 | 3 | 4 |
| `resl-despeje-union` | 4 | 1 | 3 | 4 |
| **Total** | **15** | **4** | **11** | **15** |

## Contextos usados

- `resl-union-excluyentes`: sin contexto nombrado, abstracto (ya había) → urna, mazo de truco. 2 contextos concretos distintos.
- `resl-union-general`: control de calidad (ya había) → encuesta, urna, mazo de truco. 4 contextos distintos.
- `resl-complemento`: encuesta (ya había, red social) → control de calidad, urna, mazo de truco. 4 contextos distintos.
- `resl-despeje-union`: estudio de mercado (ya había) → encuesta, control de calidad, urna. 4 contextos distintos.

## Decisiones de contenido

- El ejercicio preexistente de `resl-union-excluyentes` (#0) no ancla la escena en ninguno de los 5 contextos del topic, igual que el preexistente de `elegir-suma-excluyentes` en `ESTR.json` del mismo topic. No se tocó por ser estilo, no un problema real; los 2 ejercicios nuevos sí anclan en urna y mazo de truco.
- En `resl-despeje-union`, la primera generación dejaba 3 de los 4 ejercicios (el preexistente y 2 nuevos) con la misma intersección final $P(A\cap B)=0{,}15$ pese a partir de tripletas $(P(A), P(B), P(A\cup B))$ distintas; aunque no es un error de formato, es una repetición numérica real que un alumno podría memorizar como "la respuesta siempre es 0,15". Se ajustaron los dos ejercicios nuevos de encuesta y urna (antes de la entrega final) para que las intersecciones despejadas sean $0{,}25$ y $0{,}3$ respectivamente, dejando las 4 sub-familias con 4 resultados finales distintos ($0{,}15$, $0{,}1$, $0{,}25$, $0{,}3$).
- Sin otros desvíos del plan.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic blue/probabilidad/axiomas` corre con 0 ERRORS y 0 WARNINGS sobre los 3 ítems del topic (incluido este archivo).
