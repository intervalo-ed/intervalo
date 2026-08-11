# Decisiones, GRAF.json (topic: brown/distribuciones/uniforme)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| reconocer-forma | 5 | 1 | 4 | 5 |
| efecto-parametro | 5 | 1 | 4 | 5 |
| probabilidad-como-area | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

## Diseño de gráficos reales

- `reconocer-forma` y `efecto-parametro`: sin imagen (`graph_fn`/`graph_view`/`graph_shade`/`graph_free_aspect` en `null`), tal como fija el `topic-context.md`.
- `probabilidad-como-area`: los 5 ejercicios (1 preexistente + 4 nuevos) llevan imagen real con `graph_shade` sobre el subintervalo preguntado, y `graph_free_aspect: true` en los 5. El `question` nunca repite en texto los límites del sombreado; el alumno los lee del gráfico.
- Alturas usadas en los 4 nuevos con imagen: $1/6\approx0{,}17$, $1/5=0{,}2$, $1/3\approx0{,}33$, $1/5=0{,}2$ (más la preexistente $1/4=0{,}25$), todas dentro del rango prolijo 0,15-0,5 pedido por el topic-context. Intervalos de longitud 6, 5, 3 y 5 (más el preexistente de longitud 4), todos dentro de 2-8.

## Contextos usados

**reconocer-forma** (4 nuevos): fila de banco (0-7 min), puntero en escala corta (0-5 cm), dardo en franja (0-6 mm), dispensador de líquido (0-5 L). El preexistente usaba colectivo (0-20 min). Los 5 contextos de la tabla quedan representados sin repetir ninguno dentro de la sub-familia.

**efecto-parametro** (4 nuevos): dos sucursales bancarias comparando fila (0-5 vs. 0-8), un termómetro que duplica su rango (0-4 → 0-8, conceptual), dos detectores de partícula en canal (0-3 vs. 0-6), un dispensador que reduce su rango a la mitad (0-8 → 0-4, numérico). El preexistente usaba dos sensores de tiempo de respuesta (0-4 vs. 0-10, este último por fuera del rango 2-8 permitido, ver Decisiones de contenido).

**probabilidad-como-area** (4 nuevos, todos con imagen): fila de banco (0-6 min, sombreado 2-5), puntero en escala (0-5 cm, sombreado 0-2), dispensador de líquido (0-3 L, sombreado 1-2), descarga de archivo (2-7 seg, sombreado 3-6). El preexistente usaba partícula en canal (0-4 mm, sombreado 1-3).

## Decisiones de contenido

- El ejercicio preexistente de `efecto-parametro` (sensor B con intervalo 0-10) tiene longitud 10, fuera del rango "2 a 8" que documenta el `topic-context.md`. No se tocó (regla de la ronda: los ejercicios existentes no se editan salvo problema real, y este es solo un desvío menor de estilo, no un error matemático). Los 4 ejercicios nuevos de esa sub-familia respetan longitud 2-8 en ambos lados de cada comparación.
- En `efecto-parametro` se varió el formato de pregunta dentro de la sub-familia: 3 ejercicios conceptuales de 3 opciones (comparar cuál densidad es más alta, o qué pasa al duplicar el intervalo) y 1 ejercicio numérico de 4 opciones (calcular la nueva altura tras achicar el intervalo a la mitad), siguiendo la guía general de cardinalidad de `authoring-context.md` sin que el `topic-context.md` lo prohíba.
- `correct_index` se distribuyó deliberadamente entre las 4 posiciones/3 posiciones válidas en los 12 ejercicios nuevos (ver el array completo), para no perpetuar el sesgo de los 3 ejercicios preexistentes, que estaban los 3 en índice 0.
- Se corrigieron en una segunda pasada 2 issues detectados por el validador: (1) en el ejercicio de "termómetro que duplica su rango" las 3 opciones tenían longitud dispareja (`"Se reduce a la mitad."` mucho más larga que las otras dos), se reescribieron a `["Aumenta al doble.", "Baja a la mitad.", "Permanece igual."]` con longitudes parejas; (2) en el ejercicio de descarga de archivo la `explanation` tenía un paréntesis aclaratorio ("(de 2 a 7)"), se integró en prosa como cláusula propia.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/uniforme` corre en 0 ERRORS y 0 WARNINGS tras las 2 correcciones de la sección anterior.
