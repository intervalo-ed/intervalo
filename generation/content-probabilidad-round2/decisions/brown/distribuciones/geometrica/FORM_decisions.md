# Decisiones, FORM.json (topic: brown/distribuciones/geometrica)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| identificar-parametros | 4 | 1 | 3 | 4 |
| formula-directa | 6 | 1 | 5 | 6 |
| esperanza-y-perdida-memoria | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- **identificar-parametros** (3 nuevos): arranque de auto en día frío ($p=0{,}6$), tiros al aro ($p=0{,}4$), dado hasta el primer $6$ ($p=1/6$). El preexistente usaba llamadas de un vendedor de seguros ($p=0{,}15$); los 4 quedan con 4 contextos distintos.
- **formula-directa** (5 nuevos): auto arrancado ($p=0{,}6$, $P(X=2)$), tiros al aro ($p=0{,}4$, $P(X=3)$), llamadas a un cliente ($p=0{,}3$, $P(X=2)$), contraseña con reposición ($p=0{,}2$, $P(X=2)$), postulaciones a un puesto ($p=0{,}1$, $P(X=2)$). El preexistente usaba un router wifi ($p=0{,}5$, $P(X=3)$); los 6 quedan con 6 valores de $p$ distintos, sin duplicar ninguno.
- **esperanza-y-perdida-memoria** (4 nuevos): auto arrancado ($p=0{,}25$, $E[X]=4$), dado ($p=1/6$, $E[X]=6$), contraseña ($p=0{,}05$, $E[X]=20$), postulaciones ($p=0{,}4$, $E[X]=2{,}5$). El preexistente usaba un cajero de banco ($p=0{,}2$, $E[X]=5$); los 5 quedan con 5 valores de $p$ distintos.

## Decisiones de contenido

- Todos los ejercicios de `formula-directa` y `esperanza-y-perdida-memoria` siguen el mismo esqueleto de distractores que ya usaban los ejercicios preexistentes del ítem (para `formula-directa`: $(1-p)^{k-1}$ solo, $(1-p)^k$ con un fallo de más, y $p$ solo; para `esperanza-y-perdida-memoria`: $p$, $1-p$, y $1/(1-p)$), manteniendo consistencia de confusión dentro de cada sub-familia.
- Los valores de $p$ dentro de cada sub-familia se eligieron para no duplicar ningún valor ya usado en el mismo bloque (ver contextos usados arriba).
- Sin otros desvíos del plan original.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/geometrica` corre en 0 ERRORS y 0 WARNINGS para `FORM.json` tras reescribir una frase de `esperanza-y-perdida-memoria` (ítem del dado) que acumulaba 3 fragmentos LaTeX inline en el mismo tramo de prosa (regla 21), y rebalancear `correct_index` para que ningún índice supere el 50% de los 15 ejercicios.
