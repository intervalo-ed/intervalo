# Decisiones, RESL.json (topic: white/conteo/reglas)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `producto-puro` | 5 | 1 | 4 | 5 |
| `suma-pura` | 3 | 1 | 2 | 3 |
| `producto-y-suma` | 4 | 1 | 3 | 4 |
| `producto-con-restriccion` | 3 | 1 | 2 | 3 |
| **Total** | **15** | **4** | **11** | **15** |

## Contextos usados

- `producto-puro`: formulario con vocal + 2 dígitos (ya existía), clave (consonante + 2 dígitos), placa (letra + número de 2 cifras), señal naval (2 banderas), viaje con dos tramos consecutivos (rutas). 5 contextos distintos, ninguno repetido.
- `suma-pura`: zapatillas u ojotas (ya existía), puesto de comida (pastas o parrilla), clave de acceso (letra o símbolo especial). 3 contextos distintos.
- `producto-y-suma`: combo de entrada+bebida más platos únicos (ya existía), viaje en auto (ruta×horario) + vuelos, señal (bandera×patrón) + luces fijas, clave (letra×dígito) + código de 2 dígitos. 4 contextos distintos.
- `producto-con-restriccion`: contraseña de 3 dígitos sin cero inicial (ya existía), placa de 3 letras con restricción entre la primera y la segunda posición, clave de 3 dígitos sin cero final. 3 contextos distintos (dígito inicial, letras adyacentes, dígito final), cada uno con la restricción en una posición distinta para no repetir el mismo mecanismo.

## Decisiones de contenido

- Los valores numéricos de cada ejercicio nuevo se eligieron para no repetir exactamente los mismos factores/sumandos que los ejercicios preexistentes de la misma sub-familia (ej. `producto-puro` usa 6×10×10, 5×100, 4×3, 3×5 en vez de reusar 5×10×10 del ejercicio original).
- **Ajuste de `correct_index` tras validar**: la primera generación dejó 10/15 ejercicios con `correct_index=1` (el validador marca ERROR por encima del 50%). Se reordenaron las `options` (y el array paralelo `feedback_incorrect`) de 3 ejercicios de `producto-puro` (clave de 3 decisiones, patente/señal 4×3, viaje 3×5) para mover la respuesta correcta a otro índice sin cambiar ni el valor correcto ni el contenido de los distractores, solo su posición. Tras el ajuste, `correct_index=1` queda en 7/15 (46,7%), dentro del límite.
- Los párrafos de contexto de varios enunciados nuevos superaban inicialmente ~130 caracteres (regla 36); se corrigieron partiendo el contexto en dos oraciones cortas separadas por `\n\n`, sin recortar información del enunciado.
- Sin otros desvíos del plan original.

## Warnings que quedaron

- `structure (regla tags)` para los 4 slugs compartidos con `FORM.json` (`producto-puro`, `suma-pura`, `producto-y-suma`, `producto-con-restriccion`): mismo artefacto del validador documentado en `FORM_decisions.md` de este topic. El validador suma los targets de ambas tablas del `topic-context.md` porque comparten los mismos nombres de slug, así que el target combinado que compara contra cada archivo individual (10, 6, 8, 5) nunca puede coincidir con el conteo real de un solo archivo (5, 3, 4, 3 en `RESL.json`), aunque el archivo esté exactamente en el target real de su propia tabla (15/15, distribución 5/3/4/3 = target de la tabla RESL de `topic-context.md`). No es un error de contenido ni de conteo; es una limitación de `parse_distribution()` en `content/validate_content.py` al no distinguir a qué skill/tabla pertenece cada slug cuando dos skills del mismo topic reutilizan los mismos nombres. No se corrige acá porque implicaría tocar el validador (fuera de alcance) o los slugs de `topic-context.md` (prohibido por las reglas de conducta de esta ronda).
