# Decisiones, ESTR.json (topic: blue/probabilidad/axiomas)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `elegir-suma-excluyentes` | 4 | 1 | 3 | 4 |
| `elegir-regla-general-union` | 3 | 1 | 2 | 3 |
| `elegir-complemento` | 4 | 1 | 3 | 4 |
| `elegir-acotacion` | 4 | 1 | 3 | 4 |
| **Total** | **15** | **4** | **11** | **15** |

## Contextos usados

- `elegir-suma-excluyentes`: sin contexto nombrado, abstracto (ya había) → mazo de truco, urna, estudio previo (categorías de diagnóstico). 4 ítems, ningún contexto concreto repetido (el ítem "ya había" no usa ninguno de los 5 contextos del topic, así que no cuenta contra el tope).
- `elegir-regla-general-union`: control de calidad (ya había) → encuesta, urna. 3 contextos distintos.
- `elegir-complemento`: encuesta (ya había) → control de calidad, mazo de truco, urna. 4 contextos distintos.
- `elegir-acotacion`: estudio (abstracto, ya había) → encuesta, mazo de truco, urna. 4 contextos, ninguno repetido.

## Decisiones de contenido

- El ejercicio preexistente de `elegir-suma-excluyentes` (#0) no ancla la escena en ninguno de los 5 contextos del topic (arranca directo en "Se sabe que $P(A)=0{,}3$..."), igual que el preexistente de `elegir-acotacion` (#3, "Un estudio calcula la probabilidad de un evento..."). No se tocaron por ser estilo, no un problema real; los 3-4 ejercicios nuevos de cada sub-familia sí anclan en un contexto concreto de la tabla del topic.
- En `elegir-complemento`, el segundo ejercicio nuevo (mazo de truco) usaba originalmente $P(A)=0{,}5$, lo que producía un complemento también $0{,}5$ (resultado coincidente, poco ilustrativo). Se cambió a $P(A)=0{,}55$ antes de la entrega final para evitar ese caso trivial.
- En `elegir-acotacion`, el segundo ejercicio nuevo (mazo de truco) sumaba originalmente $0{,}7+0{,}5=1{,}2$, idéntico al par de valores del ejercicio preexistente de `definicion-rango-probabilidad` en `LEXI.json` (mismo ítem del topic, archivo distinto). Se cambió a $0{,}72+0{,}5=1{,}22$ para no repetir el mismo par de números dentro del topic.
- Sin otros desvíos del plan.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic blue/probabilidad/axiomas` corre con 0 ERRORS y 0 WARNINGS sobre los 3 ítems del topic (incluido este archivo).
