# Decisiones, LEXI.json (topic: blue/probabilidad/espacios)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| definicion-espacio-muestral | 3 | 1 | 2 | 3 |
| definicion-evento | 3 | 1 | 2 | 3 |
| definicion-suceso-elemental | 3 | 1 | 2 | 3 |
| definicion-complemento | 3 | 1 | 2 | 3 |
| definicion-mutuamente-excluyentes | 3 | 1 | 2 | 3 |
| **Total** | **15** | **5** | **10** | **15** |

## Contextos usados

- **definicion-espacio-muestral**: dado (ya existía) → moneda (2 lanzamientos, C/X) → urna (4 bolitas, 2 rojas/2 azules, espacio por color).
- **definicion-evento**: 2 monedas (ya existía) → dado (par entre 1-6) → encuesta (aprobó/no aprobó examen).
- **definicion-suceso-elemental**: urna 5 bolitas (ya existía) → mazo de cartas (as de espada) → moneda (1 lanzamiento, cara).
- **definicion-complemento**: mazo de cartas, oro (ya existía) → dado (mayor a 4) → urna 8 bolitas (par/impar).
- **definicion-mutuamente-excluyentes**: encuesta de pago (ya existía) → 2 monedas (coincidir vs. diferir) → mazo de cartas (espada vs. basto).

Cada sub-familia rota 3 contextos distintos entre sus 3 ejercicios (0% de repetición dentro de la sub-familia, por debajo del tope ~30%).

## Decisiones de contenido

- En `definicion-suceso-elemental` con moneda, usé un único lanzamiento (Ω de 2 elementos) para variar el tamaño del experimento respecto a las urnas/dados de 5-8 elementos ya usados en el resto del ítem; sigue siendo un suceso elemental válido porque lo que define la clasificación es el tamaño del evento, no el de Ω (aclarado explícitamente en la `explanation` para evitar la confusión de que "Ω chico" implique "todo evento es elemental").
- Rebalanceé `correct_index` de los 10 ejercicios nuevos en ciclo 2,1,0,2,1,0,2,1,0,2 para que, sumado a los 5 existentes (0,1,2,0,1), el archivo completo quede exactamente 5/5/5 entre los índices 0,1,2 (regla de no dejar `correct_index` constante, y balance parejo).
- Sin desvíos del plan más allá de lo anotado arriba.

## Warnings que quedaron

- `#5 | options (regla 4): la correcta es la única notablemente más larga` en el ejercicio de espacio muestral con 2 monedas (`$\{CC,CX,XC,XX\}$` de 4 elementos contra distractores de 1-2 elementos). Es inherente al diseño de la sub-familia: el ejercicio pide nombrar el espacio muestral completo, así que la opción correcta necesariamente enumera más elementos que un distractor que muestra solo una parte o un subconjunto trivial. El mismo patrón ya existe sin corregir en el ejercicio original de esta sub-familia (`$\{1,2,3,4,5,6\}$` vs. `$\{par,impar\}$`/`$\{6\}$`), que pasó la validación de rondas anteriores, así que se mantiene el criterio ya aceptado en el archivo.
