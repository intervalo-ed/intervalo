# Decisiones, CLSF.json (topic: brown/distribuciones/geometrica)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| reconocer-geometrica | 6 | 1 | 5 | 6 |
| distractor-vecino | 5 | 1 | 4 | 5 |
| supuesto-violado | 4 | 1 | 3 | 4 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- **reconocer-geometrica** (5 nuevos): arranque de auto en día frío ($p=0{,}6$), llamadas a un cliente hasta que atiende ($p=0{,}3$), contraseña de un dígito con reposición ($p=0{,}1$), dado hasta el primer $6$ ($p=1/6$), postulaciones a un puesto hasta la primera respuesta positiva ($p=0{,}2$). El ejercicio preexistente usaba tiros al aro, así que los 6 quedan con 6 contextos distintos, sin repetir ninguno.
- **distractor-vecino** (4 nuevos): 2 confunden con binomial (auto arrancado 5 veces fijas, tiros al aro 8 veces fijas) y 2 confunden con binomial negativa (llamadas hasta la tercera venta $r=3$, contraseña hasta el segundo acierto $r=2$). Sumado al preexistente (currículums, binomial negativa $r=2$), la sub-familia queda 2 binomial / 3 binomial negativa, cumpliendo la variación pedida por el topic-context.
- **supuesto-violado** (3 nuevos): llamadas con vendedor que se pone nervioso y empeora tras cada rechazo, auto con batería que se descarga y empeora con cada intento fallido, postulaciones con candidato que mejora su desempeño con la práctica. El preexistente usaba un tirador que mejora con la práctica (tiros al aro), así que la sub-familia mezcla casos que empeoran y que mejoran, como pide el topic-context.

## Decisiones de contenido

- En `distractor-vecino`, los 2 ejercicios nuevos de confusión con binomial (auto, tiros al aro) reutilizan el mismo patrón de 3 opciones que ya usaba el ejercicio de confusión con binomial negativa preexistente (currículums), para mantener el mismo formato conceptual dentro de la sub-familia.
- Los valores de $p$ dentro de cada sub-familia se eligieron para no duplicar ningún valor ya usado en el mismo bloque de 6/5/4 ejercicios (ver contextos usados arriba).
- Sin otros desvíos del plan original.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/geometrica` corre en 0 ERRORS y 0 WARNINGS para `CLSF.json` tras ajustar 2 párrafos de enunciado que superaban el límite de 130 caracteres (regla 36) y rebalancear `correct_index` para que ningún índice supere el 50% de los 15 ejercicios.
