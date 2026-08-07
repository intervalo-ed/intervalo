# Decisiones, ESTR.json (topic: blue/probabilidad/bayes)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| estr-direccion-condicional-bayes | 8 | 1 | 7 | 8 |
| estr-identificar-dato-faltante | 7 | 1 | 6 | 7 |
| **Total** | **15** | **2** | **13** | **15** |

`bayes` era el ítem con menos ejercicios de partida de todo `blue/probabilidad` (solo 2), así que esta ronda generó el mayor volumen de contenido nuevo del lote.

## Contextos usados

- **estr-direccion-condicional-bayes** (8, incluye 1 preexistente): test diagnóstico x2 (enfermedad/test ya existente + infección/análisis de laboratorio), control de calidad x2 (máquina calibrada/descalibrada + proveedor de piezas), urnas/cajas x2 (caja $A$/$B$ con bolitas rojas + caja $X$/$Y$ con fichas negras), filtros de spam x2 (correo con palabra clave + correo con enlace acortado). 2/8 = 25% por contexto, ninguno supera el ~30%.
- **estr-identificar-dato-faltante** (7, incluye 1 preexistente): test diagnóstico x2 (enfermedad ya existente + análisis de sangre/deficiencia), control de calidad x2 (líneas de ensamblaje $M$/$N$ + máquina calibrada/descalibrada), urnas/cajas x2 (urna $C$/$D$ + tres cajas 1/2/3), filtros de spam x1 (mayúsculas excesivas en el asunto). 2/7 ≈ 28,6%, dentro del tope.

## Decisiones de contenido

- Se varió qué rol (a priori, verosimilitud, a posteriori) es la respuesta correcta a lo largo de los 8 ejercicios de `estr-direccion-condicional-bayes` (no siempre verosimilitud, como en el ejercicio preexistente), para que la sub-familia no se reduzca a un solo patrón de respuesta.
- En `estr-identificar-dato-faltante` la respuesta correcta es siempre "falta la probabilidad a priori", que es la confusión específica documentada en el `topic-context.md` para esta sub-familia; se varió el contexto y la posición de la opción correcta entre los 3 índices para no dejarla fija.
- Ajustes de balance tras la primera pasada del validador: se acortó una opción demasiado larga ("La verosimilitud del enlace acortado." → "La verosimilitud del enlace.") y se alargó una demasiado corta ("La probabilidad a priori." → "La probabilidad a priori del proveedor.") para resolver dos warnings de paridad de longitud (reglas 4/15); se partieron 4 párrafos de `question` que superaban los 130 caracteres (regla 36) en dos oraciones con `\n\n`, sin sacar información.
- No se tocó ningún ejercicio preexistente (los 2 primeros elementos del array original).
- Sin desvíos del plan de sub-familias/slugs del `topic-context.md`.

## Warnings que quedaron

Ninguno. Tras las correcciones, `validate_content.py --topic blue/probabilidad/bayes` reporta 0 ERRORS y 0 WARNINGS para `ESTR.json`.
