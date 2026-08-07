# Decisiones, RESL.json (topic: violet/variables/esperanza)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| resl-discreta | 5 | 1 | 4 | 5 |
| resl-linealidad | 4 | 1 | 3 | 4 |
| resl-continua-uniforme | 3 | 1 | 2 | 3 |
| resl-interpretacion | 3 | 1 | 2 | 3 |
| **Total** | **15** | **4** | **11** | **15** |

## Contextos usados

**resl-discreta** (contextos: fallas/defectos por lote, clientes que llegan a una caja en un minuto, piezas defectuosas en una muestra):
1. Clientes que llegan a una caja, supermercado, $p(0,1,2)=(0{,}2;0{,}5;0{,}3)$, $E[X]=1{,}1$ (ya existía).
2. Piezas defectuosas en una muestra, control de calidad, $E[X]=0{,}7$ (nuevo).
3. Fallas por lote, línea de producción, $E[X]=1{,}0$ (nuevo).
4. Clientes que llegan a una caja, farmacia, $E[X]=1{,}2$ (nuevo, 2ª vez de "clientes en caja").
5. Piezas defectuosas en una muestra, tornillos, $E[X]=0{,}5$ (nuevo, 2ª vez de "piezas defectuosas").

**resl-linealidad** (sin lista propia; contextos generales discreto/continuo):
1. Tiempo de espera en un banco, $E[X]=4$ → costo $2X+1=9$ (ya existía).
2. Piezas defectuosas en un lote, $E[X]=2$ → costo de reproceso $5X+8=18$ (nuevo).
3. Clientes atendidos por hora, $E[X]=6$ → comisión $3X+5=23$ (nuevo).
4. Posición de un punto en un segmento, $E[X]=3$ → $2X+1=7$ (nuevo).

**resl-continua-uniforme** (contextos: tiempo de espera en fila/cajero, posición de un punto en un segmento):
1. Tiempo de espera en un cajero automático, $[0,5]$, $E[X]=2{,}5$ (ya existía).
2. Posición de un punto al azar en un segmento, $[2,8]$, $E[X]=5{,}0$ (nuevo).
3. Tiempo de espera en la fila de un banco, $[0,8]$, $E[X]=4{,}0$ (nuevo, 2ª vez de "tiempo de espera").

**resl-interpretacion** (contexto libre, sigue regla 43 estándar con número concreto):
1. Tiempo de espera en la fila de un supermercado, $E[X]=3$: distingue promedio a largo plazo de observación única, moda y máximo (ya existía).
2. Fallas por lote en una fábrica, $E[X]=2{,}4$: distingue promedio a largo plazo de "resultado exacto del próximo lote" y de la idea de que un valor no entero es "un error" (nuevo, foco distinto: esperanza no tiene por qué coincidir con un valor que la variable pueda tomar).
3. Tiempo de espera en un cajero automático, $E[X]=6$: distingue promedio a largo plazo de moda y de máximo (nuevo).

## Decisiones de contenido

- **`resl-discreta`, distribución de contextos por encima del ~30%.** Igual que en FORM, la tabla solo documenta 3 contextos discretos para 5 slots; la distribución más pareja posible es 2/2/1 (40% en los dos contextos repetidos). Se varió el escenario concreto en cada repetición (supermercado vs. farmacia; control de calidad vs. tornillos) para no duplicar el ejercicio.
- **`resl-continua-uniforme`, mismo problema con solo 2 contextos para 3 slots** (2/1, 67%/33%). Inevitable con la lista documentada; se priorizó variar los límites del intervalo y el escenario concreto.
- **`resl-linealidad` sin contextos propios**: se tomaron 4 de los 5 contextos generales (discreto: piezas, clientes; continuo: tiempo de espera ya usado en el ejercicio existente, posición de punto), sin repetir ninguno entre los 4 ejercicios del ítem.
- **Distractores numéricos de `resl-linealidad` rediseñados con la misma lógica que el ejercicio ya existente** (omitir $b$; sumar $b$ dos veces; usar solo $b$), en vez de "multiplicar $b$ por $a$" como en el ejercicio original de muestra, para mantener el ratio de magnitud de los distractores dentro de ~3-5x de la respuesta correcta en los 3 casos nuevos.
- **`resl-interpretacion`, el ejercicio nuevo de "fallas por lote" usa una esperanza no entera ($2{,}4$) a propósito**: refuerza que $E[X]$ no tiene por qué ser un valor que la variable pueda tomar en una sola observación, una confusión distinta (aunque relacionada) a la de moda/máximo que ya cubre el ejercicio existente y el otro nuevo.
- Los 4 ejercicios ya existentes no se tocaron; no se detectó ningún problema real en ellos durante la planificación.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic violet/variables/esperanza` corre con 0 ERRORS y 0 WARNINGS (incluye ambos ítems del topic, FORM y RESL).
