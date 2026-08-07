# Decisiones, RESL.json (topic: blue/probabilidad/laplace)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `resl-conteo-simple` | 5 | 1 | 4 | 5 |
| `resl-con-combinaciones` | 4 | 1 | 3 | 4 |
| `resl-con-complemento` | 4 | 1 | 3 | 4 |
| `resl-suma-valores` | 2 | 1 | 1 | 2 |
| **Total** | **15** | 4 | 11 | **15** |

## Contextos usados

- `resl-conteo-simple` (ya había: mazo español, as de cualquier palo): nuevos en dos dados (dobles, mismo número), ruleta de 8 sectores (mayor a 5), urna con 3 colores (bolita roja), rifa numérica (múltiplo de 25). Sin repetición de contexto entre los 4 nuevos.
- `resl-con-combinaciones` (ya había: urna 4 rojas/6 azules, extracción de 2): nuevos en mazo español (extracción de 2 cartas, palo de basto), comité de estudiantes (10 con 4 mujeres, comité de 3), caja de lamparitas (15 con 4 defectuosas, extracción de 3, ninguna defectuosa). Sin repetición de contexto entre los 3 nuevos.
- `resl-con-complemento` (ya había: caja de 12 piezas/3 defectuosas, extracción de 2): nuevos en moneda repetida (5 tiradas, al menos una cara), mazo español (extracción de 2 cartas, al menos un rey vía combinatoria + complemento), dado repetido (4 tiradas, al menos un 6). Sin repetición de contexto entre los 3 nuevos.
- `resl-suma-valores` (ya había: dos dados, suma 8): nuevo con dos dados, suma 10. El contexto "dos dados" es intrínseco a la definición de esta sub-familia según el `topic-context.md` ("evento compuesto por suma de valores, ej. suma de dos dados"), no una repetición evitable.

## Decisiones de contenido

- Para mantener números manejables en `resl-con-combinaciones` y en las variantes de `resl-con-complemento` que usan combinatoria (mazo con rey), se usaron extracciones de 2 cartas en vez de 3-4 para que los conteos $\binom{n}{k}$ resultantes fueran de magnitud similar a los ya existentes en el archivo (ej. $\binom{10}{2}=45$ sobre $\binom{40}{2}=780$, comparable a $\binom{4}{2}=6$ sobre $\binom{10}{2}=45$ del ejercicio ya existente).
- Los rótulos `\text{}` de los nuevos ejercicios de complemento se acortaron a formas tipo `\text{≥1 cara}`, `\text{≥1 rey}`, `\text{≥1 seis}` (en vez de `\text{al menos una cara}`, etc.) para cumplir la regla 26 de `authoring-context.md`.
- **Corrección de balance de `correct_index`:** los primeros 11 ejercicios nuevos redactados tenían por defecto la respuesta correcta en el índice 0 en casi todos los casos, lo que el validador marcó como error (`12/15 con correct_index=0`, tope 50%). Se reordenaron las `options` (y su `feedback_incorrect` en paralelo, manteniendo cada texto pegado a su valor específico) de 9 de los 11 ejercicios nuevos para distribuir la posición de la correcta entre los índices 0-3. Conteo final: índice 0 → 3 ítems, índice 1 → 4, índice 2 → 4, índice 3 → 4 (máximo 27%).
- Sin otros desvíos del plan.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic blue/probabilidad/laplace` corre con 0 ERRORS y 0 WARNINGS tras las correcciones (se corrigieron en el camino: reglas 9/10 de corte de oración alrededor de bloques `$$`, regla 26 de `\text{}` largo, y el error de estructura `correct_index` concentrado en el índice 0).
