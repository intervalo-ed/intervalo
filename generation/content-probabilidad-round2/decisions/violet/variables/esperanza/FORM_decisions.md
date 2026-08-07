# Decisiones, FORM.json (topic: violet/variables/esperanza)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| formula-discreta | 6 | 1 | 5 | 6 |
| propiedad-linealidad | 5 | 1 | 4 | 5 |
| formula-continua | 4 | 1 | 3 | 4 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

**formula-discreta** (contextos de la tabla: fallas/defectos por lote, clientes que llegan a una caja en un minuto, piezas defectuosas en una muestra):
1. Fallas por lote, fábrica (ya existía).
2. Clientes que llegan a una caja, supermercado (nuevo).
3. Piezas defectuosas en una muestra, control de calidad (nuevo).
4. Fallas por lote, línea de producción (nuevo, 2ª vez del contexto "fallas por lote").
5. Clientes que llegan a una caja, farmacia (nuevo, 2ª vez de "clientes en caja").
6. Piezas defectuosas en una muestra, tornillos (nuevo, 2ª vez de "piezas defectuosas").

**propiedad-linealidad** (sin lista propia en la tabla del topic; se usaron los 5 contextos discreto/continuo documentados, uno cada uno, sin repetir ninguno):
1. Tiempo de espera en un banco → costo de un cajero (ya existía).
2. Piezas defectuosas en un lote → costo de reproceso de un taller (nuevo).
3. Clientes atendidos en una caja por hora → comisión de un empleado (nuevo).
4. Posición de un punto al azar en un segmento → cambio de escala (nuevo).
5. Fallas por lote en una fábrica → costo de garantía (nuevo).

**formula-continua** (contextos de la tabla: tiempo de espera en fila/cajero, posición de un punto al azar en un segmento):
1. Tiempo de espera en un cajero automático (ya existía).
2. Tiempo de espera en la fila de un banco (nuevo).
3. Posición de un punto al azar en un segmento (nuevo).
4. Tiempo de espera en la fila de un supermercado (nuevo, 2ª vez de "tiempo de espera").

## Decisiones de contenido

- **`formula-discreta`, distribución de contextos por encima del ~30% documentado.** La tabla de "Contextos variados" del topic solo lista 3 escenarios discretos (fallas por lote, clientes en caja, piezas defectuosas). Con 6 ejercicios y 3 contextos, la distribución más pareja posible es 2/2/2, es decir 33% cada uno, apenas por encima del ~30% de la regla. Se priorizó no repetir un mismo contexto 3+ veces (que sí sería un problema real de variedad) sobre cumplir el 30% al milímetro, ya que solo hay 3 contextos documentados para 6 slots. Cada repetición usa un escenario concreto distinto dentro del mismo contexto (fábrica vs. línea de producción; supermercado vs. farmacia; control de calidad vs. tornillos) para variar la superficie del enunciado.
- **`formula-continua`, mismo problema con solo 2 contextos documentados para 4 slots.** Distribución 2/2 (50%), inevitable con solo "tiempo de espera" y "posición de un punto" como categorías. Dentro de "tiempo de espera" se varió el escenario concreto (cajero automático, fila de banco, fila de supermercado) para no ser literalmente el mismo ejercicio.
- **`propiedad-linealidad` no tiene contextos propios en la tabla del topic.** Se interpretó que, al ser la propiedad transversal a variables discretas y continuas ya definidas, podía tomar prestados los 5 contextos generales de la sección "Contextos variados" (discreto: fallas, clientes, piezas; continuo: tiempo de espera, posición de punto). Con 5 slots y 5 contextos distintos, no hubo ninguna repetición, mejor variedad que las otras dos sub-familias.
- Los 3 ejercicios ya existentes no se tocaron; no se detectó ningún problema real en ellos durante la planificación (solo se usaron como referencia de formato/tono).
- Se corrigió un warning transitorio propio (no de los ejercicios preexistentes): el primer borrador de la explicación del ejercicio de linealidad "clientes atendidos → comisión" citaba `$Y=aX+b$` y `$E[Y]$` inline además de `$X$`/`$E[X]$` (3 fragmentos LaTeX inline en el mismo tramo de prosa, regla 21). Se reescribió la apertura para no repetir `Y=aX+b` inline (esa fórmula ya está en el `question`), dejando 2 fragmentos, igual que el resto de los ejercicios de la sub-familia.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic violet/variables/esperanza` corre con 0 ERRORS y 0 WARNINGS después de la corrección de la regla 21 documentada arriba.
