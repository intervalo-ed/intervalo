# Decisiones, FORM.json (topic: brown/distribuciones/exponencial)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| formula-densidad | 5 | 1 | 4 | 5 |
| esperanza-y-perdida-memoria | 5 | 1 | 4 | 5 |
| probabilidad-acumulada-cerrada | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- **formula-densidad**: sismos leves (ya existía, $\lambda=0{,}1$), llegadas de clientes ($\lambda=0{,}3$), vida útil de componente ($\lambda=2$), fallas de máquina ($\lambda=0{,}75$), llamada de atención ($\lambda=1{,}5$). Rotación completa de los 5 contextos, sin repetir ninguno.
- **esperanza-y-perdida-memoria**: llegadas de clientes (ya existía, $E[X]$ numérico), vida útil de componente ($\lambda=0{,}25$, $E[X]$ numérico), mensaje de soporte ($\lambda=4$, $E[X]$ numérico), fallas de máquina (interpretación de pérdida de memoria, sin cálculo numérico) y sismos leves (interpretación de pérdida de memoria). Se armaron 2 ejercicios de cálculo de $E[X]$ y 2 interpretativos sobre la propiedad de pérdida de memoria, cubriendo ambas mitades de la sub-familia según documenta el `topic-context.md`.
- **probabilidad-acumulada-cerrada**: llamada de atención (ya existía, $P(X\leq x)$), vida útil de componente ($P(X\leq x)$), fallas de máquina ($P(X\geq x)$, variante de complemento), mensaje de soporte ($P(X\leq x)$), sismos leves ($P(X\leq x)$). Se varió una de las 4 preguntas nuevas a pedir $P(X\geq x)$ directo (en vez de siempre $P(X\leq x)$) para no repetir mecánicamente la misma pregunta, dando la exponencial de la cola directamente como forma cerrada.

## Decisiones de contenido

- Los 2 ejercicios interpretativos de pérdida de memoria en `esperanza-y-perdida-memoria` usan la notación $P(X>s+t\mid X>s)=P(X>t)$ como fórmula central reintroducida (regla crítica 31), sin pedir ningún cálculo numérico, ya que el foco de esos dos ejercicios es la interpretación conceptual, no la cuenta de $E[X]$ (ya cubierta por los otros 2 numéricos de la misma sub-familia).
- En `probabilidad-acumulada-cerrada`, cada ejercicio nuevo usa un valor distinto de $\lambda x$ (2, 1,5, 3 y 0,5) para no repetir el mismo resultado de $e^{-\lambda x}$ del ejercicio ya existente ($\lambda x=1$), evitando que dos ejercicios compartan la misma cuenta final.
- Para balancear `correct_index` (regla de estructura del validador, máx. 50% de ítems con índice 0 por archivo), se reordenaron las `options` (y el `feedback_incorrect` en paralelo) de varios ejercicios nuevos: 1 de `formula-densidad`, 2 de `esperanza-y-perdida-memoria` numéricos, los 2 interpretativos de esa misma sub-familia, y 3 de `probabilidad-acumulada-cerrada`. El contenido matemático de cada opción no cambió, solo el orden y el índice de la correcta.
- Sin desvíos del plan del `topic-context.md` más allá de lo indicado arriba. Ningún ejercicio pide resolver una integral, todas las fórmulas de probabilidad acumulada vienen cerradas.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/exponencial` corre en 0 ERRORS y 0 WARNINGS para este ítem (y para GRAF.json, corrido en conjunto).
