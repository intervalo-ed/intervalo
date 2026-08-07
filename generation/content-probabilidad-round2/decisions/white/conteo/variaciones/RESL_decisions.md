# Decisiones, RESL.json (topic: white/conteo/variaciones)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| resl-directo | 8 | 1 | 7 | 8 |
| resl-comparacion-combinacion | 4 | 1 | 3 | 4 |
| resl-desde-contexto | 3 | 1 | 2 | 3 |
| **Total** | **15** | 3 | 12 | **15** |

Todos los pares $(n,k)$ usados en el archivo (existentes + nuevos) son distintos entre sí: `resl-directo` usa $(6,2)$ existente y $(5,2),(4,2),(8,2),(5,3),(6,3),(7,3),(8,3)$ nuevos (todos con $n\leq9$, cumpliendo la regla del topic); `resl-comparacion-combinacion` usa $(7,2)$ existente y $(9,3),(6,4),(7,4)$ nuevos; `resl-desde-contexto` usa $(9,2)$ existente y $(5,4),(9,4)$ nuevos.

## Contextos usados

- `resl-directo` (7 nuevos): cargo distinto (club de 5, presidente/tesorero), podio parcial (carrera de 4, oro/plata), franja de bandera (8 colores, 2 franjas), código (clave de 3 dígitos entre 5), podio parcial (6 atletas, oro/plata/bronce), cargo distinto (comité de 7, presidente/secretario/tesorero), código (clave de 3 símbolos entre 8). Con el existente (cargo, curso de 6) las 4 categorías del topic quedan cubiertas de forma pareja (cargo 3/8, podio 2/8, franja 1/8, código 2/8).
- `resl-comparacion-combinacion` (3 nuevos): mismo formato abstracto que el existente ($n,k$ dados directamente, sin escenario narrativo), variando solo los valores de $n,k$ para cubrir factores $k!=6,24,24$ y así distintas magnitudes de la relación $V_{n,k}/\binom{n}{k}=k!$.
- `resl-desde-contexto` (2 nuevos): ranking de posiciones (concurso de canciones, 5 finalistas, ranking de 4) y cargo distinto (hospital, 9 médicos, 4 guardias). Ninguno usa la notación $V_{n,k}$ en el enunciado, solo en la `explanation`, siguiendo la regla dura del topic para esta sub-familia.

## Decisiones de contenido

- Corrección de errores de estructura tras la primera pasada de validación:
  - **Error `correct_index` (11/15 en índice 2, tope 50%)**: se reordenaron las opciones (y el `feedback_incorrect` paralelo) de 4 ejercicios de `resl-directo` (club de 5 amigos, bandera de 8 colores, 6 atletas, clave de 8 símbolos), moviendo la respuesta correcta a los índices 0, 1, 0 y 3 respectivamente. El valor numérico correcto y los distractores no cambiaron, solo su posición dentro del array. Distribución final: índice 0 = 4, índice 1 = 2, índice 2 = 7, índice 3 = 2.
  - **Warning "fórmulas anchas" en `feedback_correct` (3+ igualdades)**: los 3 ejercicios de `resl-comparacion-combinacion` tenían un `feedback_correct` con 3 igualdades encadenadas (ej. "$V_{9,3}=504$ y $\binom{9}{3}=84$: la variación cuenta cada grupo elegido $3!=6$ veces..."). Se recortó a solo 2 igualdades ("$V_{9,3}=504$ y $\binom{9}{3}=84$."), moviendo la razón del factor $k!$ a la `explanation`, que ya la desarrollaba en detalle.
  - **Warning párrafo de `explanation` > 200 caracteres**: los 2 ejercicios de `resl-desde-contexto` nuevos tenían el párrafo de cierre en 201 y 198 caracteres reales (por encima del límite tras medir el render exacto). Se acortó la redacción ("No reconocer la variación sin su notación explícita subestima el conteo; conviene notar palabras clave como [...], que señalan que el orden importa.") sin perder el contenido.
- Al elegir los pares $(n,k)$ nuevos se evitó deliberadamente repetir exactamente el mismo par que ya usaba otro ejercicio del archivo (existente o nuevo), para que ningún par de ejercicios comparta el mismo resultado numérico final.

## Warnings que quedaron

Ninguno. El topic completo (`CLSF`, `FORM`, `RESL`) corre en 0 ERRORS y 0 WARNINGS tras las correcciones.
