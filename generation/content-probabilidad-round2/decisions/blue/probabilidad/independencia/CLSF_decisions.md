# Decisiones, CLSF.json (topic: blue/probabilidad/independencia)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `reconocer-independencia` | 6 | 1 | 5 | 6 |
| `reconocer-dependencia` | 5 | 1 | 4 | 5 |
| `distractor-mutuamente-excluyentes` | 4 | 1 | 3 | 4 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

`reconocer-independencia` (existente: dos dados lanzados juntos):
1. Dos monedas de colores distintos (roja/azul) lanzadas a la vez.
2. Extracción con reposición de una urna (bolas verdes/blancas).
3. Dos líneas de producción separadas de una misma fábrica.
4. Dos clientes comprando en locales distintos de una cadena, sin contacto.
5. Un dado y una moneda lanzados juntos.

`reconocer-dependencia` (existente: extracción sin reposición de urna):
1. Extracción sin reposición de un mazo de cartas (espadas).
2. Inspección de control de calidad sin reposición sobre un lote de piezas.
3. Extracción sin reposición de una bolsa de caramelos.
4. Sorteo de números sin reposición en una rifa.

`distractor-mutuamente-excluyentes` (existente: dos dados par/impar):
1. Dos monedas de colores distintos, cara en una y seca en la otra.
2. Dos estudiantes rindiendo el mismo examen en aulas separadas, aprobar/desaprobar.
3. Encuesta a dos personas en ciudades distintas, respuesta sí/no.

Ningún contexto se repitió más del 30% dentro de su sub-familia (máximo 1
repetición del contexto de dados/monedas entre 6, cumpliendo el tope).

## Decisiones de contenido

- Los 3 ejercicios ya existentes en el archivo no se tocaron; no se encontró
  ningún problema real en ellos durante la planificación.
- Para `distractor-mutuamente-excluyentes` se mantuvo el patrón de opciones ya
  fijado por el ejercicio existente (3 opciones: "mutuamente excluyentes" /
  "no pueden ser independientes por describir opuestos" / "independientes,
  aunque no mutuamente excluyentes" correcta), variando el contexto y el par
  de eventos "opuestos" en cada uno (cara/seca, aprobar/desaprobar, sí/no).
- En la corrección de warnings de la primera pasada del validador se
  reescribieron algunas opciones (regla 4, paridad de longitud) y se dividió
  algún párrafo largo de `question`/`explanation` (regla 36 y párrafos ≤200),
  sin cambiar el contenido matemático ni la respuesta correcta de ningún
  ejercicio.
- Sin desvíos del plan original más allá de esos ajustes de redacción.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic
blue/probabilidad/independencia` corre con 0 ERRORS y 0 WARNINGS sobre los 3
ítems del topic (incluido este).
