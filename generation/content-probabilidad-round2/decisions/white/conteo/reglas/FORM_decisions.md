# Decisiones, FORM.json (topic: white/conteo/reglas)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `producto-puro` | 5 | 1 | 4 | 5 |
| `suma-pura` | 3 | 1 | 2 | 3 |
| `producto-y-suma` | 4 | 1 | 3 | 4 |
| `producto-con-restriccion` | 2 | 1 | 1 | 2 |
| `desde-arbol` | 1 | 1 | 0 | 1 |
| **Total** | **15** | **5** | **10** | **15** |

## Contextos usados

- `producto-puro`: menú de cafetería (ya existía), clave/contraseña (letra+dígito), placa alfanumérica (letra+número de 2 cifras), señal naval con banderas (2 banderas), viaje con dos tramos consecutivos (rutas). 5 contextos distintos, ninguno repetido.
- `suma-pura`: micro o vuelo directo (ya existía), puesto de comida (pastas o parrilla), clave de acceso (letra o símbolo especial). 3 contextos distintos.
- `producto-y-suma`: restaurante con combo + platos únicos (ya existía), viaje en auto (ruta×horario) + vuelos, señal (bandera×patrón) + luces fijas, clave (letra×dígito) + código de varios dígitos. 4 contextos distintos.
- `producto-con-restriccion`: contraseña de 3 dígitos que no puede empezar con 0 (ya existía), placa de 3 letras donde la primera no puede repetirse en la segunda posición. 2 contextos distintos (dígitos vs. letras, restricción en primera posición vs. restricción entre dos posiciones).
- `desde-arbol`: ya estaba completa en 1/1 con el ejercicio preexistente (mapa de rutas con dos caminos principales que se abren en sub-rutas); no se generó ninguno nuevo.

## Decisiones de contenido

- El ejercicio nuevo de `producto-con-restriccion` (placa de 3 letras, la primera no puede repetirse en la segunda posición) usa una restricción distinta a la del ejercicio preexistente (dígito inicial no puede ser 0), para no duplicar el mismo tipo de restricción dentro de la sub-familia, cumpliendo igual la regla del topic de que la restricción sea "explícita y verificable".
- Todas las opciones de expresión (`options`) de los ejercicios nuevos siguen el patrón ya establecido por los ejercicios preexistentes del archivo: 4 expresiones LaTeX cortas que representan la operación correcta y 3 variantes de mala aplicación de la regla (suma en vez de producto, potencia en vez de producto para modelar repetición, o binomial aplicado fuera de contexto).
- **Hallazgo, no corregido**: el ejercicio preexistente de `desde-arbol` (mapa de rutas, índice 4 del array, 0-based) dispara el WARNING del validador `options (regla 15)`: la opción correcta `$4+3$` mide un render de 3 caracteres contra una mediana de 8 en las otras 3 opciones (`$4\times 3$`, `$2\times(4+3)$`, `$4\times 2\times 3$`), es decir la correcta es notablemente más corta. Es un ejercicio preexistente (no generado en esta ronda) y la regla de conducta pide no tocarlo salvo autorización explícita; se deja anotado acá para que se decida si corregirlo en esta ronda o en una posterior.
- Los párrafos de contexto de varios enunciados nuevos superaban inicialmente ~130 caracteres (regla 36); se corrigieron partiendo el contexto en dos oraciones cortas separadas por `\n\n`, sin recortar información del enunciado.
- Sin otros desvíos del plan original.

## Warnings que quedaron

- `options (regla 15)` en el ejercicio preexistente de `desde-arbol` (ver "Hallazgo, no corregido" arriba). No se corrigió porque el ejercicio ya existía antes de esta ronda y la regla de conducta pide no editar ejercicios preexistentes salvo autorización.
- `structure (regla tags)` para los 4 slugs compartidos con `RESL.json` (`producto-puro`, `suma-pura`, `producto-y-suma`, `producto-con-restriccion`): el validador (`content/validate_content.py`, función `parse_distribution`) suma las cantidades de **todas** las tablas markdown del mismo `topic-context.md` que usan el mismo slug, y como `FORM` y `RESL` reutilizan literalmente los mismos 4 slugs con sus propios targets (ej. `producto-puro` = 5 en la tabla de FORM y 5 en la de RESL), el target combinado que ve el validador es la suma de ambos (10, 6, 8, 5) mientras que cada archivo individual solo puede aportar su propia mitad (5, 3, 4, 2 en FORM). Esto no es un problema de conteo real: `FORM.json` está en 5/3/4/2/1 = 15, exactamente el target de su propia tabla en `topic-context.md`. Es una limitación del validador al comparar por slug entre archivos que no comparten target, no un error de contenido; no se puede corregir sin tocar `topic-context.md` (prohibido, los slugs están fijados) ni el validador (fuera de alcance de esta tarea de contenido).
