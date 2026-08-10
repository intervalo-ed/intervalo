# Decisiones, CLSF.json (topic: brown/distribuciones/negativa)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `reconocer-negativa` | 6 | 1 | 5 | 6 |
| `distractor-vecino` | 5 | 1 | 4 | 5 |
| `supuesto-violado` | 4 | 1 | 3 | 4 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

`reconocer-negativa` (1 existente + 5 nuevos, uno por cada contexto de la tabla): arquero/goles (existente), currículums/respuestas positivas, sorteo/número repetido, inspección/piezas defectuosas, redes/interacciones, vendedor/pólizas. Cubre los 6 contextos de la tabla exactamente una vez cada uno.

`distractor-vecino` (1 existente + 4 nuevos): inspección/piezas defectuosas (existente, caso genuino de BN). Los 4 nuevos alternan entre trampa-hacia-geométrica (vendedor: busca la primera venta, r=1; sorteo: busca la primera aparición de un número, r=1) y trampa-hacia-binomial (arquero: 8 penales fijos, se pregunta por la cantidad de goles; redes: 6 posts fijos, se pregunta por la cantidad exitosos), 2 y 2.

`supuesto-violado` (1 existente + 3 nuevos): vendedor que gana confianza (existente). Nuevos: arquero que se cansa, máquina de inspección que se recalibra, influencer cuyo engagement crece con cada post exitoso.

## Decisiones de contenido

**Reinterpretación de `distractor-vecino` respecto al texto literal del `topic-context.md`.** La fila de la tabla dice "la historia parece binomial negativa pero en realidad es geométrica ($r=1$) o binomial ($n$ fijo)", lo que se lee literalmente como que la respuesta correcta de esta sub-familia debería ser Geométrica o Binomial (no BN). Sin embargo, el único ejercicio ya existente tageado `distractor-vecino` (inspección de piezas, r=2) tiene como respuesta correcta BinNeg: es un caso genuino de binomial negativa redactado para tentar hacia sus vecinas, no un caso que realmente sea geométrica o binomial. Frente a esta ambigüedad, y siguiendo la regla de "seguir con el mejor criterio propio" cuando el target es ambiguo, se optó por la lectura literal de la tabla para los 4 ejercicios nuevos: 2 de ellos son genuinamente geométricos ($r=1$ pese a sonar a BN) y 2 son genuinamente binomiales ($n$ fijo pese a describirse con "hasta"), reforzando así el objetivo declarado de "distinguir de las vecinas" con casos donde la vecina es la respuesta real. Esto deja la sub-familia con una mezcla de 1 ejercicio "BN genuina resistiendo la tentación" (el preexistente) y 4 "vecina genuina resistiendo la tentación de decir BN", ambas variantes cubiertas por el nombre `distractor-vecino`. No se tocó el ejercicio preexistente.

Los ejercicios de `supuesto-violado` no llevan siempre el mismo valor de $p$ explícito porque el punto central es que $p$ *cambia*, no un valor puntual; se mantiene esa convención del ejercicio preexistente (vendedor) en los 3 nuevos.

Fuera de esa reinterpretación documentada, sin más desvíos del plan.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/negativa` corre en 0 ERRORS, 0 WARNINGS tras las correcciones (se dividió un bloque `$$...$$` en dos exercises con 3+ fragmentos LaTeX inline en el mismo tramo de prosa, y se ajustó la longitud de una opción y de un párrafo de `explanation`).
