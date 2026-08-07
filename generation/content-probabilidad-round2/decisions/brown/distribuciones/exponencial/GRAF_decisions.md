# Decisiones, GRAF.json (topic: brown/distribuciones/exponencial)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| reconocer-forma | 5 | 1 | 4 | 5 |
| efecto-parametro | 5 | 1 | 4 | 5 |
| probabilidad-como-area | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- **reconocer-forma**: componente electrónico (ya existía), sismos leves ($\lambda=0{,}2$), fallas de máquina ($\lambda=2$), mensaje de soporte ($\lambda=1$), llamada de atención ($\lambda=0{,}25$). Los 5 escenarios de "Contextos variados" usados una sola vez cada uno (salvo el ya existente), rotación completa.
- **efecto-parametro**: llegadas de clientes (ya existía, $\lambda_A=0{,}2,\lambda_B=1$), componentes electrónicos ($\lambda_A=0{,}3,\lambda_B=1{,}5$), máquinas de fábrica ($\lambda_A=0{,}75,\lambda_B=0{,}25$), canales de soporte ($\lambda_A=2,\lambda_B=0{,}5$), sismógrafos ($\lambda_A=0{,}2,\lambda_B=0{,}8$). Cada ejercicio pregunta desde un ángulo distinto del mismo efecto (altura en $x=0$, tiempo promedio, velocidad de decaimiento en ambos sentidos, tasa mayor).
- **probabilidad-como-area** (con imagen real): fallas de máquina (ya existía, $\lambda=0{,}5$), llegadas de clientes ($\lambda=0{,}4$), vida útil de componente ($\lambda=0{,}6$), mensaje de soporte ($\lambda=0{,}8$), sismos leves ($\lambda=1$). Los 5 valores de $\lambda$ quedan en el rango "prolijo" 0,4-1 pedido por el `topic-context.md`, con picos de curva legibles.

## Decisiones de contenido

- Para `probabilidad-como-area`, todos los `graph_free_aspect` son `true` y los `graph_view` se calcularon con margen ~10-15% sobre el pico real ($\lambda \times 1{,}15$ aprox.) y un dominio horizontal recortado a donde la cola deja de aportar (entre 5 y 10 unidades según $\lambda$), siguiendo la regla de alturas prolijas del `topic-context.md`.
- El `question` de los 4 ejercicios nuevos de `probabilidad-como-area` nunca menciona los límites del sombreado (`graph_shade`) en texto ni en las opciones como números sueltos; el alumno tiene que leerlos del gráfico. Las opciones distractoras usan `P(X\leq b)` y `P(X\geq a)`, obligando a mirar dónde arranca y dónde termina el área sombreada.
- Para balancear `correct_index` (regla de estructura del validador, máx. 50% de ítems con índice 0 por archivo), se reordenaron las `options` de dos ejercicios nuevos de `probabilidad-como-area` (los de "vida útil de componente" y "mensaje de soporte") para que la opción correcta caiga en índice 1 y 2 respectivamente, en vez de repetir siempre el índice 0 del patrón original.
- Los 4 ejercicios nuevos de `reconocer-forma` reutilizan el mismo trío de opciones (decae monótona / campana simétrica / rectángulo constante) que ya define la sub-familia, variando el orden y el `correct_index` para no concentrar la respuesta siempre en la misma posición, y variando la redacción de la pregunta final para no repetir literalmente "¿Qué forma tiene esa densidad?" en los 5 ejercicios.
- Sin desvíos del plan del `topic-context.md` más allá de lo indicado arriba.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/exponencial` corre en 0 ERRORS y 0 WARNINGS para este ítem (y para FORM.json, corrido en conjunto).
