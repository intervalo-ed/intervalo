# Decisiones, ESTR.json (topic: white/conteo/reglas)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `reconocer-producto` | 5 | 1 | 4 | 5 |
| `reconocer-suma` | 4 | 1 | 3 | 4 |
| `reconocer-combinada` | 4 | 1 | 3 | 4 |
| `reconocer-fuera-de-alcance` | 2 | 1 | 1 | 2 |
| **Total** | **15** | **4** | **11** | **15** |

## Contextos usados

- `reconocer-producto`: menú combinado (ya existía), clave/contraseña (letra+dígito), placa alfanumérica (letra+número), señal con banderas (2 banderas), diagrama de árbol de decisiones (2 caminos secuenciales). 5 contextos distintos, ninguno repetido.
- `reconocer-suma`: clave/contraseña (ya existía, letra o dígito), menú (hamburguesa o vegetariano), caminos entre ciudades (colectivo o subte), placa (letra o dígito único). 4 contextos distintos, ninguno repetido.
- `reconocer-combinada`: caminos entre ciudades A-B-C + vuelo directo (ya existía), menú (combo + platos únicos), clave/contraseña (letra+dígito o código de 2 dígitos), señal con banderas (2 banderas + luces intermitentes). 4 contextos distintos, ninguno repetido.
- `reconocer-fuera-de-alcance`: carrera de atletas (ya existía, primer/segundo puesto), concurso de fotografía (primer/segundo premio). 2 contextos distintos, ambos del tipo "elegir y ordenar un subconjunto sin nombrar la técnica", igual que exige la fila de la tabla.

## Decisiones de contenido

- Para las sub-familias `reconocer-producto` y `reconocer-suma`, el conjunto de 3 opciones ("Regla de la suma...", "Regla del producto...", "Combinaciones...") se mantuvo textualmente igual al ejercicio preexistente de cada sub-familia, variando el orden de aparición (y por lo tanto `correct_index` y el array `feedback_incorrect` en paralelo) para no dejar `correct_index` constante. Se mantuvo el texto de las 3 opciones porque son las 3 alternativas conceptuales que la sub-familia evalúa; variar solo la redacción no aportaría nada y arriesgaría introducir asimetrías de registro entre opciones.
- Mismo criterio para `reconocer-combinada` (3 opciones "Solo la suma"/"Solo el producto"/"Producto y suma combinados") y para `reconocer-fuera-de-alcance` (2 opciones binarias ya establecidas por el ejercicio preexistente).
- La sub-familia `reconocer-fuera-de-alcance` pide un escenario de "elegir y ordenar un subconjunto sin reponer" sin nombrar permutación/variación/combinación. El contexto elegido para el ejercicio nuevo (concurso de fotografía, primer y segundo premio) es estructuralmente equivalente al ejemplo preexistente (carrera, primer y segundo puesto); no se usaron las palabras "podio"/"comité"/"anagrama" que el topic reserva para topics posteriores, pero el escenario en sí (asignar 2 posiciones distintas a un subconjunto de un grupo) es intrínseco a lo que esta sub-familia necesita representar.
- Los párrafos de contexto de varios enunciados nuevos superaban inicialmente el límite de ~130 caracteres de la regla 36; se corrigieron partiendo el contexto en dos oraciones separadas por `\n\n` (una declara el objeto, la otra da el detalle numérico) en vez de recortar información.
- Sin otros desvíos del plan original.

## Warnings que quedaron

Ninguno para este archivo (`ESTR.json` corre limpio: 0 ERROR, 0 WARNING tras las correcciones).
