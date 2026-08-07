# Decisiones, CLSF.json (topic: blue/probabilidad/espacios)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| validar-subconjunto | 3 | 1 | 2 | 3 |
| clasificar-tipo-evento | 4 | 1 | 3 | 4 |
| reconocer-mutuamente-excluyentes | 4 | 1 | 3 | 4 |
| operar-entre-eventos | 4 | 1 | 3 | 4 |
| **Total** | **15** | **4** | **11** | **15** |

## Contextos usados

- **validar-subconjunto**: urna 6 bolitas (ya existía) → dado (validar $\{2,4,6\}$ vs. $\{2,4,7\}$/colores) → mazo de cartas por palo (validar $\{oro,copa\}$ vs. trébol/números).
- **clasificar-tipo-evento**: 2 monedas compuesto (ya existía) → dado elemental ($A=\{4\}$) → urna 7 bolitas compuesto ($C=\{2,5,7\}$) → encuesta elemental ($D=\{transferencia\}$).
- **reconocer-mutuamente-excluyentes**: cartas oro/7 no excluyentes (ya existía) → dado par/mayor-a-4 no excluyentes → urna de colores roja/azul excluyentes → encuesta aprobó/no aprobó excluyentes.
- **operar-entre-eventos**: abstracto (Ω={1,2,3,4}, intersección, ya existía) → dado (unión) → urna 5 bolitas (complemento) → encuesta de métodos de pago (intersección).

Cada sub-familia rota contextos distintos entre sus ejercicios (0% de repetición dentro de la sub-familia, por debajo del tope ~30%). En `operar-entre-eventos` el ejercicio preexistente es abstracto (sin escenario cotidiano, solo conjuntos numéricos con Ω explícito); los 3 nuevos sí llevan contexto cotidiano (dado/urna/encuesta) para variar, sin tocar el original.

## Decisiones de contenido

- En el ejercicio de intersección con encuesta de métodos de pago (`operar-entre-eventos`), diseñé las 3 opciones como los tres elementos "de un solo conjunto" ($\{efectivo\}$, $\{tarjeta\}$, $\{transferencia\}$) en vez de combinaciones de 1-3 elementos como en el resto del ítem: esto evitó la advertencia de paridad de longitud (regla 15, la correcta de 1 elemento quedaba desproporcionadamente corta contra distractores de 2-3 elementos) y de paso hizo el distractor más fino, cada opción incorrecta es justo el elemento que pertenece a un solo evento de los dos, no a ambos.
- Rebalanceé `correct_index` de los 11 ejercicios nuevos en ciclo 0,1,2,0,1,2,0,1,2,0,1 para que, sumado a los 4 existentes (2,0,1,2), el archivo completo quede exactamente 5/5/5 entre los índices 0,1,2.
- Sin desvíos del plan más allá de lo anotado arriba. No se detectó ningún ejercicio preexistente con un problema real (solo se reescribieron `explanation`/`question`/`options` de ejercicios nuevos propios para resolver warnings del validador, nunca de los 4 ejercicios ya existentes).

## Warnings que quedaron

Ninguno. Los 5 warnings iniciales del validador (regla 35 ecuaciones tejidas inline, regla 21 exceso de fragmentos LaTeX inline, regla 15 paridad de longitud) se corrigieron todos moviendo ecuaciones a bloques `$$...$$` y rebalanceando longitudes de opciones. `validate_content.py --topic blue/probabilidad/espacios` corre en 0 ERRORS para este archivo.
